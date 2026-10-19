import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { UploadDialog, type UploadTarget } from '@/features/graph/components/UploadDialog'
import { API, apiError, graphFile } from '../msw/fixtures'
import { readMultipart } from '../msw/multipart'
import { server } from '../msw/server'
import { renderComponent } from '../test-utils/render'

function setup(target: UploadTarget = { kind: 'create' }) {
  const onOpenChange = vi.fn()
  const user = userEvent.setup({ applyAccept: false })
  renderComponent(<UploadDialog open onOpenChange={onOpenChange} target={target} />)
  return { user, onOpenChange }
}

const chooseFile = (user: ReturnType<typeof userEvent.setup>, file = graphFile()) =>
  user.upload(screen.getByLabelText('JSON file'), file)

describe('UploadDialog (create)', () => {
  it('prefills the name from the file and reports placeholders on success', async () => {
    const { user, onOpenChange } = setup()
    await chooseFile(user)
    expect(await screen.findByLabelText('Name')).toHaveValue('train-ticket')

    await user.click(screen.getByRole('button', { name: 'Upload' }))

    expect(await screen.findByText('Graph "train-ticket" uploaded')).toBeInTheDocument()
    expect(screen.getByText(/1 placeholder created: ghost/)).toBeInTheDocument()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('keeps Upload disabled until a valid file and a name are present', async () => {
    const { user } = setup()
    const upload = screen.getByRole('button', { name: 'Upload' })
    expect(upload).toBeDisabled()
    await chooseFile(user)
    await waitFor(() => expect(upload).toBeEnabled())
    await user.clear(screen.getByLabelText('Name'))
    expect(upload).toBeDisabled()
  })

  it('gives instant feedback for a file that is not JSON, without calling the API', async () => {
    const { user } = setup()
    await chooseFile(user, new File(['hello'], 'notes.txt', { type: 'text/plain' }))
    expect(await screen.findByText('Only JSON files are accepted (.json).')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Upload' })).toBeDisabled()
  })

  it('lists the server validation details with their paths (400)', async () => {
    server.use(
      http.post(`${API}/api/v1/graphs`, () =>
        HttpResponse.json(
          apiError('VALIDATION_ERROR', 'The graph file is invalid', [
            { path: 'nodes.3.publicExposed', message: 'expected boolean' },
            { path: 'nodes.7.name', message: 'Duplicate node name "auth"' },
          ]),
          { status: 400 },
        ),
      ),
    )
    const { user } = setup()
    await chooseFile(user)
    await user.click(await screen.findByRole('button', { name: 'Upload' }))

    expect(await screen.findByText('The file is not valid')).toBeInTheDocument()
    expect(screen.getByText('nodes.3.publicExposed')).toBeInTheDocument()
    expect(screen.getByText(/expected boolean/)).toBeInTheDocument()
    expect(screen.getByText('nodes.7.name')).toBeInTheDocument()
  })

  it('explains the size limit on 413', async () => {
    server.use(
      http.post(`${API}/api/v1/graphs`, () =>
        HttpResponse.json(apiError('PAYLOAD_TOO_LARGE', 'File too big'), { status: 413 }),
      ),
    )
    const { user } = setup()
    await chooseFile(user)
    await user.click(await screen.findByRole('button', { name: 'Upload' }))
    expect(await screen.findByText('The file is too large')).toBeInTheDocument()
    expect(screen.getByText(/10 MB, 50,000 nodes and 500,000 edges/)).toBeInTheDocument()
  })

  it('asks for a JSON file on 415', async () => {
    server.use(
      http.post(`${API}/api/v1/graphs`, () =>
        HttpResponse.json(apiError('UNSUPPORTED_MEDIA_TYPE', 'Only JSON files'), { status: 415 }),
      ),
    )
    const { user } = setup()
    await chooseFile(user)
    await user.click(await screen.findByRole('button', { name: 'Upload' }))
    expect(await screen.findByText('Please choose a JSON file')).toBeInTheDocument()
  })

  it('disables the form and shows progress while uploading', async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => (release = resolve))
    server.use(
      http.post(`${API}/api/v1/graphs`, async () => {
        await gate
        return HttpResponse.json(
          {
            id: 'g9',
            name: 'n',
            version: 1,
            nodeCount: 1,
            edgeCount: 0,
            createdAt: 'x',
            updatedAt: 'x',
            placeholders: [],
          },
          { status: 201 },
        )
      }),
    )
    const { user } = setup()
    await chooseFile(user)
    await user.click(await screen.findByRole('button', { name: 'Upload' }))

    expect(await screen.findByRole('progressbar', { name: 'Upload progress' })).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Upload' })).toBeDisabled()
    release()
    await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument())
  })
})

describe('UploadDialog (replace)', () => {
  const target: UploadTarget = {
    kind: 'replace',
    graph: { id: 'g1', name: 'Train Ticket', version: 3 },
  }

  it('sends the loaded version as If-Match', async () => {
    let ifMatch: string | null = null
    server.use(
      http.put(`${API}/api/v1/graphs/g1`, ({ request }) => {
        ifMatch = request.headers.get('if-match')
        return HttpResponse.json({
          id: 'g1',
          name: 'Train Ticket',
          version: 4,
          nodeCount: 1,
          edgeCount: 0,
          createdAt: 'x',
          updatedAt: 'x',
          placeholders: [],
        })
      }),
    )
    const { user } = setup(target)
    await chooseFile(user)
    await user.click(await screen.findByRole('button', { name: 'Replace' }))
    expect(await screen.findByText('Graph "Train Ticket" replaced')).toBeInTheDocument()
    expect(ifMatch).toBe('"3"')
  })

  it('offers reload or overwrite on 409, and overwrite resends without If-Match', async () => {
    const seen: (string | null)[] = []
    server.use(
      http.put(`${API}/api/v1/graphs/g1`, async ({ request }) => {
        seen.push(request.headers.get('if-match'))
        await readMultipart(request)
        if (seen.length === 1) {
          return HttpResponse.json(apiError('VERSION_CONFLICT', 'changed'), { status: 409 })
        }
        return HttpResponse.json({
          id: 'g1',
          name: 'Train Ticket',
          version: 5,
          nodeCount: 1,
          edgeCount: 0,
          createdAt: 'x',
          updatedAt: 'x',
          placeholders: [],
        })
      }),
    )
    const { user, onOpenChange } = setup(target)
    await chooseFile(user)
    await user.click(await screen.findByRole('button', { name: 'Replace' }))

    expect(await screen.findByText('This graph changed since you opened it.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reload graph' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Overwrite anyway' }))
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    expect(seen).toEqual(['"3"', null])
  })

  it('closes the dialog when the user chooses to reload', async () => {
    server.use(
      http.put(`${API}/api/v1/graphs/g1`, () =>
        HttpResponse.json(apiError('VERSION_CONFLICT', 'changed'), { status: 409 }),
      ),
      http.get(`${API}/api/v1/graphs`, () => HttpResponse.json([])),
    )
    const { user, onOpenChange } = setup(target)
    await chooseFile(user)
    await user.click(await screen.findByRole('button', { name: 'Replace' }))
    await user.click(await screen.findByRole('button', { name: 'Reload graph' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
