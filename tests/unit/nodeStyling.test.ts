import {
  highestSeverity,
  kindColor,
  kindGroup,
  parseVulnerability,
  primaryRole,
  severityColor,
  severityLevel,
  vulnerabilitySummary,
} from '@/features/visualization/utils/nodeStyling'

describe('kindGroup', () => {
  it.each([
    ['service', 'service'],
    ['rds', 'database'],
    ['sql', 'database'],
    ['sqs', 'queue'],
    ['SQS', 'queue'],
    ['kafka', 'other'],
    [null, 'other'],
  ] as const)('%s → %s', (kind, group) => {
    expect(kindGroup(kind)).toBe(group)
  })

  it('maps groups to the design tokens', () => {
    expect(kindColor('rds')).toBe('var(--kind-rds)')
    expect(kindColor('sqs')).toBe('var(--kind-sqs)')
    expect(kindColor('whatever')).toBe('var(--kind-other)')
  })
})

describe('severity', () => {
  it('matches case-insensitively and falls back to "other"', () => {
    expect(severityLevel('HIGH')).toBe('high')
    expect(severityLevel(' Critical ')).toBe('critical')
    expect(severityLevel('informational')).toBe('other')
    expect(severityLevel(null)).toBe('other')
    expect(severityColor('Medium')).toBe('var(--sev-medium)')
  })

  it('finds the highest severity and keeps its original spelling', () => {
    expect(
      highestSeverity([{ severity: 'low' }, { severity: 'HIGH' }, { severity: 'medium' }]),
    ).toBe('HIGH')
    expect(highestSeverity([{ severity: 'critical' }, { severity: 'high' }])).toBe('critical')
  })

  it('ranks unknown severities below low and tolerates missing ones', () => {
    expect(highestSeverity([{ severity: 'weird' }, { severity: 'low' }])).toBe('low')
    expect(highestSeverity([{}])).toBeNull()
    expect(highestSeverity([])).toBeNull()
  })

  it('summarizes a node, or returns null without vulnerabilities', () => {
    expect(vulnerabilitySummary({ vulnerabilities: [] })).toBeNull()
    expect(vulnerabilitySummary({ vulnerabilities: [{ severity: 'high' }, {}] })).toEqual({
      count: 2,
      highest: 'high',
    })
  })
})

describe('parseVulnerability', () => {
  it('reads severity, message, file and CWE', () => {
    const v = parseVulnerability({
      severity: 'high',
      message: 'Tainted path',
      file: 'a/B.java',
      metadata: { cwe: 'CWE-22' },
      extraField: 1,
    })
    expect(v).toMatchObject({
      severity: 'high',
      message: 'Tainted path',
      file: 'a/B.java',
      cwe: 'CWE-22',
    })
    expect(v.raw.extraField).toBe(1)
  })

  it('treats everything as optional and ignores wrong types', () => {
    expect(parseVulnerability({ severity: 5, metadata: 'x' })).toMatchObject({
      severity: null,
      message: null,
      file: null,
      cwe: null,
    })
  })
})

describe('primaryRole', () => {
  it('prefers end, then start, then through', () => {
    expect(primaryRole(['through', 'start'])).toBe('start')
    expect(primaryRole(['start', 'end', 'through'])).toBe('end')
    expect(primaryRole(['through'])).toBe('through')
    expect(primaryRole([])).toBeNull()
  })
})
