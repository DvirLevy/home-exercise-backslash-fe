import { describeUploadError } from '@/features/graph/utils/uploadError'
import { ApiError } from '@/services/errors'

const err = (status: number, code: string, details: { path: string; message: string }[] = []) =>
  new ApiError({ status, code, message: 'server says no', details })

describe('describeUploadError', () => {
  it('lists validation details with their paths on 400', () => {
    const v = describeUploadError(
      err(400, 'VALIDATION_ERROR', [
        { path: 'nodes.3.publicExposed', message: 'expected boolean' },
      ]),
    )
    expect(v.title).toBe('The file is not valid')
    expect(v.details).toEqual([{ path: 'nodes.3.publicExposed', message: 'expected boolean' }])
  })

  it('explains the size limit on 413', () => {
    expect(describeUploadError(err(413, 'PAYLOAD_TOO_LARGE')).message).toMatch(/10 MB/)
  })

  it('asks for a JSON file on 415', () => {
    expect(describeUploadError(err(415, 'UNSUPPORTED_MEDIA_TYPE')).title).toMatch(/JSON/)
  })

  it('falls back to the server message', () => {
    expect(describeUploadError(err(500, 'INTERNAL_ERROR'))).toMatchObject({
      title: 'Upload failed',
      message: 'server says no',
    })
  })
})
