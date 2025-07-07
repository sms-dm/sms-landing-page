import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HSEBoard from './HSEBoard';
import { AuthProvider } from '../contexts/AuthContext';

// Mock the auth context
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { 
      id: 1, 
      role: 'hse_manager',
      firstName: 'John',
      lastName: 'Doe'
    }
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

// Mock fetch
global.fetch = jest.fn();

describe('HSEBoard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('renders loading state initially', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <HSEBoard />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/Loading HSE data/i)).toBeInTheDocument();
  });

  test('renders HSE board with statistics', async () => {
    const mockUpdates = {
      updates: [
        {
          id: 1,
          title: 'Safety Alert: High Winds',
          content: 'High wind conditions expected',
          update_type: 'safety_alert',
          severity: 'high',
          scope: 'fleet',
          created_by: 1,
          creator_name: 'John Doe',
          creator_role: 'hse_manager',
          created_at: new Date().toISOString(),
          requires_acknowledgment: true,
          is_acknowledged: false,
          acknowledgment_count: 5,
          is_active: true
        }
      ]
    };

    const mockStats = {
      activeUpdates: 3,
      complianceStats: {
        total_requiring_ack: 10,
        fully_acknowledged: 7,
        avg_compliance_rate: 85
      }
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockUpdates
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockStats
      });

    render(
      <BrowserRouter>
        <AuthProvider>
          <HSEBoard />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('HSE Board')).toBeInTheDocument();
      expect(screen.getByText('Days Without Incident')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument(); // Active alerts
      expect(screen.getByText('85%')).toBeInTheDocument(); // Compliance rate
      expect(screen.getByText('Safety Alert: High Winds')).toBeInTheDocument();
    });
  });

  test('opens create modal when New Update button is clicked', async () => {
    const mockUpdates = { updates: [] };
    const mockStats = { activeUpdates: 0, complianceStats: {} };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockUpdates
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockStats
      });

    render(
      <BrowserRouter>
        <AuthProvider>
          <HSEBoard />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      const newUpdateButton = screen.getByText('New Update');
      fireEvent.click(newUpdateButton);
    });

    expect(screen.getByText('Create HSE Update')).toBeInTheDocument();
  });

  test('handles acknowledgment correctly', async () => {
    const mockUpdates = {
      updates: [
        {
          id: 1,
          title: 'Test Update',
          content: 'Test content',
          update_type: 'safety_alert',
          severity: 'medium',
          scope: 'fleet',
          created_by: 1,
          creator_name: 'John Doe',
          creator_role: 'hse_manager',
          created_at: new Date().toISOString(),
          requires_acknowledgment: true,
          is_acknowledged: false,
          is_active: true
        }
      ]
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockUpdates
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ activeUpdates: 1, complianceStats: {} })
      });

    render(
      <BrowserRouter>
        <AuthProvider>
          <HSEBoard />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      const acknowledgeButton = screen.getByText('Acknowledge');
      expect(acknowledgeButton).toBeInTheDocument();
    });

    // Mock successful acknowledgment
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ updates: [] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ activeUpdates: 0, complianceStats: {} })
      });

    fireEvent.click(screen.getByText('Acknowledge'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/hse/updates/1/acknowledge'),
        expect.objectContaining({
          method: 'POST'
        })
      );
    });
  });

  test('filters by severity correctly', async () => {
    const mockUpdates = { updates: [] };
    const mockStats = { activeUpdates: 0, complianceStats: {} };

    (global.fetch as jest.Mock)
      .mockResolvedValue({
        ok: true,
        json: async () => mockUpdates
      });

    render(
      <BrowserRouter>
        <AuthProvider>
          <HSEBoard />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      const severitySelect = screen.getByRole('combobox');
      fireEvent.change(severitySelect, { target: { value: 'critical' } });
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('severity=critical'),
        expect.any(Object)
      );
    });
  });
});