// __tests__/api/deliveries.test.ts
import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/deliveries'

// Create a mock function for the Supabase client
const mockSupabaseClient = jest.fn()

// Mock Supabase client with a default implementation
jest.mock('@/utils/supabase/api', () => ({
  __esModule: true,
  default: (...args: any[]) => mockSupabaseClient(...args)
}))

describe('/api/deliveries', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        
        // Set up default mock implementation
        mockSupabaseClient.mockImplementation(() => ({
          from: (table: string) => {
            const defaultMethods = {
              select: jest.fn().mockReturnThis(),
              eq: jest.fn().mockReturnThis(),
              or: jest.fn().mockReturnThis(),
              order: jest.fn().mockReturnThis(),
              range: jest.fn().mockReturnThis(),
              not: jest.fn().mockReturnThis(),
              is: jest.fn().mockReturnThis(),
              in: jest.fn().mockReturnThis()
            }
      
            // Mock customers table queries
            if (table === 'customers') {
              return {
                ...defaultMethods,
                or: jest.fn().mockResolvedValue({ 
                  data: [{ id: 1 }], 
                  error: null 
                })
              }
            }
            
            // Mock deliveries table queries
            return {
              ...defaultMethods,
              range: jest.fn().mockResolvedValue({
                data: [{
                  id: 1,
                  state: 'pending',
                  customers: { 
                    name: 'John Doe', 
                    address: '123 Main St', 
                    phone: '1234567890' 
                  },
                  notes: [],
                  created_by: { 
                    email: 'user@example.com', 
                    name: 'Test User' 
                  }
                }],
                error: null,
                count: 1
              })
            }
          }
        }))
      })
      
  it('returns 405 for non-GET requests', async () => {
    const { req, res } = createMocks({
      method: 'POST'
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(405)
    expect(JSON.parse(res._getData())).toEqual({ 
      error: 'Method not allowed' 
    })
  })

  it('validates query parameters', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { 
        state: 'invalid_state',
        scheduledDate: 'invalid_date' 
      }
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(400)
    expect(JSON.parse(res._getData())).toEqual({ 
      error: 'Invalid state parameter' 
    })
  })

  it('fetches deliveries successfully', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: {
        state: 'pending',
        page: '1',
        pageSize: '10'
      }
    })

    await handler(req, res)

    const data = JSON.parse(res._getData())
    expect(res._getStatusCode()).toBe(200)
    expect(data).toMatchObject({
      feed: expect.any(Array),
      page: 1,
      totalPages: expect.any(Number),
      totalItems: expect.any(Number)
    })
    expect(data.feed[0]).toHaveProperty('customers')
    expect(data.feed[0]).toHaveProperty('notes')
  })

  it('handles search functionality', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: {
        state: 'pending',
        search: 'John',
        page: '1'
      }
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.feed).toBeInstanceOf(Array)
  })

  it('handles database errors gracefully', async () => {
    // Override mock implementation for this test
    mockSupabaseClient.mockImplementation(() => ({
      from: () => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Database error'),
          count: null
        })
      })
    }))
  
    const { req, res } = createMocks({
      method: 'GET',
      query: { state: 'pending' }
    })
  
    await handler(req, res)
  
    expect(res._getStatusCode()).toBe(500)
    expect(JSON.parse(res._getData())).toEqual({
      error: 'Failed to fetch deliveries.'
    })
  })
})