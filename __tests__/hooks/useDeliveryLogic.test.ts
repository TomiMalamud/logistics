import { renderHook, act } from '@testing-library/react';
import { useDeliveryLogic } from '@/lib/hooks/useDeliveryLogic';
import { Delivery } from 'types/types';

// Mock SWR's mutate function
jest.mock('swr', () => ({
  mutate: jest.fn()
}));

// Mock fetch
global.fetch = jest.fn();
global.window.open = jest.fn();

describe('useDeliveryLogic', () => {
  // Mock data with complete Delivery type properties
  const mockDelivery: Delivery = {
    id: 1,
    order_date: '2024-01-15',
    customer_id: 123,
    state: 'pending',
    scheduled_date: '2024-01-15',
    created_at: '2024-01-14T10:00:00Z',
    created_by: {
      id: 'user123',
      email: 'user@example.com',
      name: 'Test User'
    },
    customers: {
      name: 'John Doe',
      address: '123 Test St',
      phone: '1123456789'
    },
    notes: [],
    invoice_number: 'INV-001',
    invoice_id: 456,
    delivery_cost: null,
    delivery_date: null,
    type: 'home_delivery',
    supplier_id: null,
    suppliers: null,
    origin_store: 'cd',
    dest_store: null,
    carrier_id: null,
    products: [
      {
        name: 'Premium Mattress',
        quantity: 1,
        sku: 'MAT-001'
      }
    ]
  };

  const mockFetchURL = '/api/deliveries';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with correct scheduled date', () => {
      const { result } = renderHook(() => 
        useDeliveryLogic({ delivery: mockDelivery, fetchURL: mockFetchURL })
      );

      expect(result.current.scheduledDate).toBe('2024-01-15');
    });

    it('should handle empty scheduled date', () => {
      const deliveryWithoutDate = { 
        ...mockDelivery, 
        scheduled_date: null 
      };
      const { result } = renderHook(() => 
        useDeliveryLogic({ delivery: deliveryWithoutDate, fetchURL: mockFetchURL })
      );

      expect(result.current.scheduledDate).toBe('');
    });
  });

  describe('handleUpdateDeliveryDetails', () => {
    const mockUpdateData = {
      delivery_cost: 1000,
      carrier_id: 1
    };

    it('should successfully update delivery details', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      const { result } = renderHook(() => 
        useDeliveryLogic({ delivery: mockDelivery, fetchURL: mockFetchURL })
      );

      await act(async () => {
        await result.current.handleUpdateDeliveryDetails(mockUpdateData);
      });

      expect(global.fetch).toHaveBeenCalledWith(
        `/api/delivery/${mockDelivery.id}`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(mockUpdateData)
        })
      );
      expect(result.current.error).toBeNull();
      expect(result.current.isUpdatingDeliveryDetails).toBe(false);
    });
  });

  describe('handleConfirmStateChange', () => {
    it('should update state from pending to delivered with carrier', async () => {
      const mockCarrierData = {
        delivery_type: 'carrier' as const,
        delivery_cost: 1000,
        carrier_id: 1
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      const { result } = renderHook(() => 
        useDeliveryLogic({ delivery: mockDelivery, fetchURL: mockFetchURL })
      );

      await act(async () => {
        await result.current.handleConfirmStateChange(mockCarrierData);
      });

      expect(global.fetch).toHaveBeenCalledWith(
        `/api/delivery/${mockDelivery.id}`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({
            state: 'delivered',
            delivery_cost: 1000,
            carrier_id: 1,
            pickup_store: null
          })
        })
      );
    });

    it('should update state from pending to delivered with pickup', async () => {
      const mockPickupData = {
        delivery_type: 'pickup' as const,
        pickup_store: 'cd' as const
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      const { result } = renderHook(() => 
        useDeliveryLogic({ delivery: mockDelivery, fetchURL: mockFetchURL })
      );

      await act(async () => {
        await result.current.handleConfirmStateChange(mockPickupData);
      });

      expect(global.fetch).toHaveBeenCalledWith(
        `/api/delivery/${mockDelivery.id}`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({
            state: 'delivered',
            pickup_store: 'cd',
            delivery_cost: null,
            carrier_id: null
          })
        })
      );
    });
  });

  describe('utility functions', () => {
    it('should correctly format Argentine phone number', () => {
      const { result } = renderHook(() => 
        useDeliveryLogic({ delivery: mockDelivery, fetchURL: mockFetchURL })
      );

      expect(result.current.formatArgentinePhoneNumber('1123456789')).toMatch(/\d{2} \d{4} \d{4}/);
      expect(result.current.formatArgentinePhoneNumber('')).toBe('Number not available');
    });

    it('should correctly format dates', () => {
      const { result } = renderHook(() => 
        useDeliveryLogic({ delivery: mockDelivery, fetchURL: mockFetchURL })
      );

      const date = '2024-01-15';
      expect(result.current.formatDate(date)).toMatch(/\w+, \d+ \w+/);
    });

    it('should handle isToday function correctly', () => {
      const { result } = renderHook(() => 
        useDeliveryLogic({ delivery: mockDelivery, fetchURL: mockFetchURL })
      );
      
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      expect(result.current.isToday(today)).toBe(true);
      expect(result.current.isToday(yesterday)).toBe(false);
    });    
  });
});