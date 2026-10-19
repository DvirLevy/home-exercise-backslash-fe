import { parseEnv } from '@/env'

describe('parseEnv', () => {
  it('reads the API base URL and strips trailing slashes', () => {
    expect(parseEnv({ VITE_API_BASE_URL: 'http://localhost:3000/' })).toEqual({
      apiBaseUrl: 'http://localhost:3000',
    })
  })

  it('fails with a clear message when the variable is missing', () => {
    expect(() => parseEnv({})).toThrow(/Invalid environment configuration.*VITE_API_BASE_URL/s)
  })

  it('rejects a value that is not a URL', () => {
    expect(() => parseEnv({ VITE_API_BASE_URL: 'localhost' })).toThrow(/VITE_API_BASE_URL/)
  })
})
