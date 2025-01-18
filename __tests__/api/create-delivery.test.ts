import { mockSupabase } from '../utils'

jest.mock('@/lib/supabase', () => ({
  supabase: mockSupabase
}))

jest.mock('title-case', () => ({
  titleCase: (str: string) => str
}))

import handler from '@/pages/api/deliveries/create/delivery'
import { mockRequestResponse } from '../utils'

jest.mock('@/lib/perfit', () => ({
  createOrUpdateContact: jest.fn(),
  formatPerfitContact: jest.fn()
}))

describe('Create Delivery API', () => {
  const validDeliveryData = {
    order_date: '2024-01-01',
    products: 'Test Product',
    name: 'John Doe',
    address: '123 Test St',
    phone: '1234567890',
    email: 'test@example.com',
    created_by: 'user123',
    invoice_number: '123',
    invoice_id: '123'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabase.reset()
  })

  it('returns 405 for non-POST requests', async () => {
    const { req, res } = mockRequestResponse('GET')
    await handler(req, res)
    expect(res._getStatusCode()).toBe(405)
  })

  it('validates required fields', async () => {
    const { req, res } = mockRequestResponse('POST', {
      order_date: '2024-01-01'
    })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(400)
  })

  it('successfully creates a delivery', async () => {
    mockSupabase.from.mockImplementation(() => mockSupabase)
    mockSupabase.select.mockImplementation(() => mockSupabase)
    mockSupabase.insert.mockImplementation(() => mockSupabase)
    mockSupabase.update.mockImplementation(() => mockSupabase)
    mockSupabase.eq.mockImplementation(() => mockSupabase)
    
    mockSupabase.maybeSingle.mockImplementation(() => ({
      data: { id: 1 },
      error: null
    }))
    
    mockSupabase.single.mockImplementation(() => ({
      data: { id: 1 },
      error: null
    }))

    const { req, res } = mockRequestResponse('POST', validDeliveryData)
    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    expect(JSON.parse(res._getData())).toEqual({
      message: 'Delivery created successfully'
    })
  })

  it('handles database errors', async () => {
    mockSupabase.from.mockImplementation(() => mockSupabase)
    mockSupabase.select.mockImplementation(() => mockSupabase)
    mockSupabase.maybeSingle.mockImplementation(() => ({
      data: null,
      error: new Error('Database error')
    }))

    const { req, res } = mockRequestResponse('POST', validDeliveryData)
    await handler(req, res)

    expect(res._getStatusCode()).toBe(400)
  })
}) 