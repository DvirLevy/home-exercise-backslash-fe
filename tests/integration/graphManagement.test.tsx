import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { backend } from '../msw/backend'
import { API, graphFile } from '../msw/fixtures'
import { server } from '../msw/server'
import { renderApp } from '../test-utils/render'

const user = () => userEvent.setup({ applyAccept: false })

describe('first run', () => {
  it('invites the user to upload when there are no graphs', async () => {
    renderApp('/')
    expect(await screen.findByText('Upload your first graph')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Choose file' })).toBeInTheDocument()
  })

  it('asks to select a graph when some exist', async () => {
    backend.add({ id: 'a', name: 'One' })
    renderApp('/')
    expect(await screen.findByText('Select a graph')).toBeInTheDocument()
  })
})

describe('upload', () => {
  it('uploads from the sidebar, selects the new graph and tells about placeholders', async () => {
    const u = user()
    const { router } = renderApp('/')
    await screen.findByText('Upload your first graph')

    await u.click(screen.getByRole('button', { name: /Upload a graph/ }))
    await u.upload(await screen.findByLabelText('JSON file'), graphFile())
    await u.click(await screen.findByRole('button', { name: 'Upload' }))

    await waitFor(() => expect(router.state.location.pathname).toMatch(/^\/graphs\/g\d+$/))
    expect(await screen.findByRole('heading', { name: 'train-ticket' })).toBeInTheDocument()
    expect(screen.getByText(/1 placeholder created: ghost/)).toBeInTheDocument()
    // The sidebar list was refreshed.
    expect(within(screen.getByRole('complementary')).getByText('train-ticket')).toBeInTheDocument()
  })

  it('opens the dialog with a dropped file already checked and named', async () => {
    renderApp('/')
    await screen.findByText('Upload your first graph')
    const dropzone = screen.getByRole('button', { name: /Upload a graph/ })

    const file = graphFile()
    const dataTransfer = { files: [file], types: ['Files'] }
    dropzone.dispatchEvent(
      Object.assign(new Event('drop', { bubbles: true, cancelable: true }), { dataTransfer }),
    )

    expect(await screen.findByLabelText('Name')).toHaveValue('train-ticket')
    expect(screen.getByText(/train-ticket\.json/)).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Upload' })).toBeEnabled())
  })
})

describe('open, rename, replace and delete', () => {
  it('shows the graph in the top bar with its version and counts', async () => {
    backend.add({ id: 'a', name: 'Train Ticket', version: 3 })
    renderApp('/graphs/a')
    const header = await screen.findByRole('banner')
    expect(await within(header).findByText('Train Ticket')).toBeInTheDocument()
    expect(within(header).getByText('v3')).toBeInTheDocument()
    expect(within(header).getByText('3 nodes')).toBeInTheDocument()
    expect(within(header).getByText('2 edges')).toBeInTheDocument()
  })

  it('renames a graph and updates the list and the top bar', async () => {
    const u = user()
    backend.add({ id: 'a', name: 'Old name' })
    renderApp('/graphs/a')

    await u.click(await screen.findByRole('button', { name: 'Rename' }))
    const input = await screen.findByLabelText('Name')
    await u.clear(input)
    await u.type(input, 'New name')
    await u.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Renamed to "New name"')).toBeInTheDocument()
    await waitFor(() =>
      expect(within(screen.getByRole('complementary')).getByText('New name')).toBeInTheDocument(),
    )
    expect(within(screen.getByRole('banner')).getByText('New name')).toBeInTheDocument()
  })

  it('replaces the file, bumping the version shown in the top bar', async () => {
    const u = user()
    backend.add({ id: 'a', name: 'Train Ticket', version: 1 })
    renderApp('/graphs/a')

    await u.click(await screen.findByRole('button', { name: 'Replace file…' }))
    await u.upload(await screen.findByLabelText('JSON file'), graphFile())
    await u.click(await screen.findByRole('button', { name: 'Replace' }))

    expect(await screen.findByText('Graph "Train Ticket" replaced')).toBeInTheDocument()
    expect(await within(screen.getByRole('banner')).findByText('v2')).toBeInTheDocument()
  })

  it('handles a version conflict on replace with reload', async () => {
    const u = user()
    backend.add({ id: 'a', name: 'Train Ticket', version: 1 })
    renderApp('/graphs/a')
    await within(await screen.findByRole('banner')).findByText('v1')

    backend.graphs.get('a')!.version = 2 // someone else changed it meanwhile
    await u.click(screen.getByRole('button', { name: 'Replace file…' }))
    await u.upload(await screen.findByLabelText('JSON file'), graphFile())
    await u.click(await screen.findByRole('button', { name: 'Replace' }))
    await u.click(await screen.findByRole('button', { name: 'Reload graph' }))

    expect(await within(screen.getByRole('banner')).findByText('v2')).toBeInTheDocument()
  })

  it('asks for confirmation, then deletes and goes back to the list', async () => {
    const u = user()
    backend.add({ id: 'a', name: 'Doomed' })
    backend.add({ id: 'b', name: 'Survivor' })
    const { router } = renderApp('/graphs/a')

    await u.click(await screen.findByRole('button', { name: 'Delete' }))
    expect(await screen.findByText('Delete "Doomed"?')).toBeInTheDocument()
    expect(backend.graphs.has('a')).toBe(true) // nothing happens before confirming

    await u.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
    expect(await screen.findByText('Graph "Doomed" deleted')).toBeInTheDocument()
    await waitFor(() =>
      expect(
        within(screen.getByRole('complementary')).queryByText('Doomed'),
      ).not.toBeInTheDocument(),
    )
    expect(within(screen.getByRole('complementary')).getByText('Survivor')).toBeInTheDocument()
  })

  it('cancelling the delete confirmation keeps the graph', async () => {
    const u = user()
    backend.add({ id: 'a', name: 'Keep me' })
    renderApp('/graphs/a')
    await u.click(await screen.findByRole('button', { name: 'Delete' }))
    await u.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Cancel' }))
    expect(backend.graphs.has('a')).toBe(true)
  })
})

describe('error states', () => {
  it('sends the user back to the list when the graph does not exist (404)', async () => {
    backend.add({ id: 'a', name: 'Other' })
    renderApp('/graphs/missing')
    expect(await screen.findByText('Graph not found')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to the graphs' })).toHaveAttribute('href', '/')
  })

  it('shows the banner and keeps working views when the API goes down', async () => {
    server.use(http.get(`${API}/health`, () => HttpResponse.error()))
    backend.add({ id: 'a', name: 'Other' })
    renderApp('/')
    expect(await screen.findByText(/Can't reach the API/)).toBeInTheDocument()
  })
})
