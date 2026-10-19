import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NodeDetails } from '@/features/visualization/components/NodeDetails'
import { node } from '../msw/fixtures'

const vulnerable = node('order-service', {
  path: 'train-ticket/ts-order-service',
  publicExposed: false,
  vulnerabilities: [
    {
      severity: 'high',
      message: 'File open from tainted variable',
      file: 'src/Order.java',
      metadata: { cwe: 'CWE-22' },
    },
    { severity: 'Medium', message: 'SQL built by concatenation' },
    { notes: 'no severity at all' },
  ],
  metadata: { cloud: 'AWS' },
  extra: { owner: 'team-a' },
})

describe('NodeDetails', () => {
  it('shows kind, language, path and whether the node is public', () => {
    render(<NodeDetails node={vulnerable} onClose={vi.fn()} />)
    expect(screen.getByRole('heading', { name: 'order-service' })).toBeInTheDocument()
    const facts = screen.getByText('Kind').closest('dl')!
    expect(within(facts).getByText('service')).toBeInTheDocument()
    expect(within(facts).getByText('java')).toBeInTheDocument()
    expect(within(facts).getByText('train-ticket/ts-order-service')).toBeInTheDocument()
    expect(within(facts).getByText('No')).toBeInTheDocument()
  })

  it('lists every vulnerability with severity, message, file and CWE', () => {
    render(<NodeDetails node={vulnerable} onClose={vi.fn()} />)
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(3)
    expect(items[0]).toHaveTextContent('high')
    expect(items[0]).toHaveTextContent('File open from tainted variable')
    expect(items[0]).toHaveTextContent('src/Order.java · CWE-22')
    expect(within(items[0]!).getByText('high').style.background).toBe('var(--sev-high)')
    expect(within(items[1]!).getByText('Medium').style.background).toBe('var(--sev-medium)')
  })

  it('copes with a vulnerability that has no severity, message or file', () => {
    render(<NodeDetails node={vulnerable} onClose={vi.fn()} />)
    const last = screen.getAllByRole('listitem')[2]!
    expect(last).toHaveTextContent('unknown')
    expect(last).toHaveTextContent('No message')
  })

  it('shows metadata and extra as read-only JSON', () => {
    render(<NodeDetails node={vulnerable} onClose={vi.fn()} />)
    expect(screen.getByText(/"cloud": "AWS"/)).toBeInTheDocument()
    expect(screen.getByText(/"owner": "team-a"/)).toBeInTheDocument()
  })

  it('shows null for missing extra and metadata, and "None reported" without vulnerabilities', () => {
    render(<NodeDetails node={node('plain')} onClose={vi.fn()} />)
    expect(screen.getAllByText('null')).toHaveLength(2)
    expect(screen.getByText('None reported.')).toBeInTheDocument()
  })

  it('explains placeholders and shows unknown values as dashes', () => {
    render(
      <NodeDetails
        node={node('ghost', {
          placeholder: true,
          kind: null,
          language: null,
          path: null,
          publicExposed: null,
        })}
        onClose={vi.fn()}
      />,
    )
    expect(screen.getByText(/does not define it/)).toBeInTheDocument()
    expect(screen.getByText('Unknown')).toBeInTheDocument()
    expect(screen.getAllByText('–')).toHaveLength(3)
  })

  it('shows matched roles and filters when a route query is applied', () => {
    render(
      <NodeDetails
        node={vulnerable}
        matched={{ roles: ['through'], filters: ['vulnerable', 'high-severity'] }}
        onClose={vi.fn()}
      />,
    )
    expect(screen.getByText('THROUGH')).toBeInTheDocument()
    expect(screen.getByText('vulnerable')).toBeInTheDocument()
    expect(screen.getByText('high-severity')).toBeInTheDocument()
  })

  it('closes from the close button', async () => {
    const onClose = vi.fn()
    render(<NodeDetails node={vulnerable} onClose={onClose} />)
    await userEvent.click(screen.getByRole('button', { name: 'Close details' }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
