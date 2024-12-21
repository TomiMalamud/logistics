import { renderHook, act } from '@testing-library/react';
import { useDeliveryLogic } from '@/lib/hooks/useDeliveryLogic';

// Mock SWR's mutate function
jest.mock('swr', () => ({
  mutate: jest.fn()
}));

// Mock fetch
global.fetch = jest.fn();
global.window.open = jest.fn();

describe('useDeliveryLogic', () => {
  // Mock data
  const mockDelivery = {
    id: 1,
    state: 'pending',
    scheduled_date: '2024-01-15',
    notes: [],
    customers: {
      address: '123 Test St'
    }
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
      const deliveryWithoutDate = { ...mockDelivery, scheduled_date: null };
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

    beforeEach(() => {
      (global.fetch as jest.Mock).mockClear();
    });

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
    });

    it('should handle errors when updating delivery details', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => 
        useDeliveryLogic({ delivery: mockDelivery, fetchURL: mockFetchURL })
      );

      await act(async () => {
        await result.current.handleUpdateDeliveryDetails(mockUpdateData);
      });

      expect(result.current.error).toBe('Error al actualizar los detalles de envío');
    });
  });

  describe('handleConfirmStateChange', () => {
    const mockCarrierData = {
      delivery_type: 'carrier' as const,
      delivery_cost: 1000,
      carrier_id: 1
    };

    it('should update state from pending to delivered with carrier', async () => {
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
  });

  describe('handleAddNote', () => {
    it('should successfully add a new note', async () => {
      const newNote = { id: 1, text: 'Test note', created_at: '2024-01-15' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [newNote] })
      });

      const { result } = renderHook(() => 
        useDeliveryLogic({ delivery: mockDelivery, fetchURL: mockFetchURL })
      );

      act(() => {
        result.current.setNewNote('Test note');
      });

      await act(async () => {
        await result.current.handleAddNote();
      });

      expect(result.current.newNotas).toEqual([newNote]);
      expect(result.current.newNote).toBe('');
    });

    it('should handle error when adding note fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Failed to add note'));

      const { result } = renderHook(() => 
        useDeliveryLogic({ delivery: mockDelivery, fetchURL: mockFetchURL })
      );

      act(() => {
        result.current.setNewNote('Test note');
      });

      await act(async () => {
        await result.current.handleAddNote();
      });

      expect(result.current.error).toBe('Unable to add note.');
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

    it('should open Google Maps with correct address', () => {
      const { result } = renderHook(() => 
        useDeliveryLogic({ delivery: mockDelivery, fetchURL: mockFetchURL })
      );

      result.current.openInGoogleMaps();

      expect(window.open).toHaveBeenCalledWith(
        'https://www.google.com/maps/search/?api=1&query=123%20Test%20St',
        '_blank'
      );
    });
  });
});