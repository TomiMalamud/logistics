import { mockSupabase } from '../utils'

jest.mock('@/lib/supabase', () => ({
  supabase: mockSupabase
}))

import handler from '@/pages/api/carriers'
import { mockRequestResponse } from '../utils'

describe('Carriers API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabase.reset()
  })

  it('returns 405 for non-GET requests', async () => {
    const { req, res } = mockRequestResponse('POST')
    await handler(req, res)
    expect(res._getStatusCode()).toBe(405)
  })

  it('successfully fetches carriers', async () => {
    const mockCarriers = [
      { id: 1, name: 'Carrier 1' },
      { id: 2, name: 'Carrier 2' }
    ]

    mockSupabase.from.mockImplementation(() => mockSupabase)
    mockSupabase.select.mockImplementation(() => mockSupabase)
    mockSupabase.order.mockImplementation(() => ({
      data: mockCarriers,
      error: null
    }))

    const { req, res } = mockRequestResponse('GET')
    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    expect(JSON.parse(res._getData())).toEqual(mockCarriers)
  })

  it('handles database errors', async () => {
    mockSupabase.from.mockImplementation(() => mockSupabase)
    mockSupabase.select.mockImplementation(() => mockSupabase)
    mockSupabase.order.mockImplementation(() => ({
      data: null,
      error: new Error('Database error')
    }))

    const { req, res } = mockRequestResponse('GET')
    await handler(req, res)

    expect(res._getStatusCode()).toBe(500)
  })
}) 