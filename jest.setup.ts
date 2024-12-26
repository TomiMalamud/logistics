// jest.setup.ts
import '@testing-library/jest-dom'

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'

// Mock fetch globally
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
) as jest.Mock

// Only set up browser-specific mocks if we're in a jsdom environment
if (typeof window !== 'undefined') {
  // Mock window.open
  window.open = jest.fn()

  // Mock local storage
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    clear: jest.fn(),
    removeItem: jest.fn(),
    length: 0,
    key: jest.fn(),
  }

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  })
}

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks()
})