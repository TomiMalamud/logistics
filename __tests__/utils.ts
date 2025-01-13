import { createMocks } from 'node-mocks-http'
import type { NextApiRequest, NextApiResponse } from 'next'
import { jest } from '@jest/globals'

export function mockRequestResponse(method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS', body = {}, query = {}) {
  const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
    method,
    body, 
    query,
  })
  return { req, res }
}

type MockReturnValue = {
  data: any;
  error: null | Error;
}

export const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn<() => MockReturnValue>(),
  maybeSingle: jest.fn<() => MockReturnValue>(),
  order: jest.fn().mockReturnThis(),
  data: null as any,
  error: null as null | Error,
  reset() {
    this.from.mockReset();
    this.select.mockReset();
    this.insert.mockReset();
    this.update.mockReset();
    this.delete.mockReset();
    this.eq.mockReset();
    this.single.mockReset();
    this.maybeSingle.mockReset();
    this.order.mockReset();
    this.data = null;
    this.error = null;
  }
}
