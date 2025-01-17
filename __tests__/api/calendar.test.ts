import handler from '@/pages/api/deliveries/calendar'
import { mockRequestResponse } from '../utils'

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
  }
}))

describe('Calendar API', () => {
  it('returns 405 for non-GET requests', async () => {
    const { req, res } = mockRequestResponse('POST')
    await handler(req, res)
    expect(res._getStatusCode()).toBe(405)
  })

  it('returns 400 if dates are missing', async () => {
    const { req, res } = mockRequestResponse('GET')
    await handler(req, res)
    expect(res._getStatusCode()).toBe(400)
  })

  it('fetches deliveries with valid date range', async () => {
    const { req, res } = mockRequestResponse('GET', {}, {
      startDate: '2024-01-01',
      endDate: '2024-01-31'
    })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(200)
  })
}) 