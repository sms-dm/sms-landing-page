import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TechnicianDashboard from './TechnicianDashboard';
import toast from 'react-hot-toast';

// Mock dependencies
jest.mock('react-hot-toast');
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock useAuth hook
const mockLogout = jest.fn();
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 12345,
      firstName: 'John',
      lastName: 'Doe',
      company: { slug: 'oceanic' },
    },
    logout: mockLogout,
  }),
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as any;

const mockRotation = {
  endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('TechnicianDashboard - Rotation Extension', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'sms_rotation') return JSON.stringify(mockRotation);
      if (key === 'sms_handover_completed') return 'false';
      if (key === 'sms_theme') return 'dark';
      return null;
    });
  });

  test('displays extend rotation button in countdown section', () => {
    renderWithProviders(<TechnicianDashboard />);
    
    const extendButton = screen.getByTitle('Extend rotation');
    expect(extendButton).toBeInTheDocument();
  });

  test('shows extension modal when extend button is clicked', async () => {
    renderWithProviders(<TechnicianDashboard />);
    
    const extendButton = screen.getByTitle('Extend rotation');
    fireEvent.click(extendButton);
    
    await waitFor(() => {
      expect(screen.getByText('Extend Rotation')).toBeInTheDocument();
      expect(screen.getByText('Extension Duration (days)')).toBeInTheDocument();
    });
  });

  test('validates extension days between 1 and 30', async () => {
    renderWithProviders(<TechnicianDashboard />);
    
    const extendButton = screen.getByTitle('Extend rotation');
    fireEvent.click(extendButton);
    
    const input = screen.getByRole('spinbutton');
    
    // Test invalid value (0)
    fireEvent.change(input, { target: { value: '0' } });
    const confirmButton = screen.getByText('Extend Rotation');
    fireEvent.click(confirmButton);
    
    expect(toast.error).toHaveBeenCalledWith('Extension must be between 1 and 30 days');
    
    // Test invalid value (31)
    fireEvent.change(input, { target: { value: '31' } });
    fireEvent.click(confirmButton);
    
    expect(toast.error).toHaveBeenCalledWith('Extension must be between 1 and 30 days');
  });

  test('saves extension to localStorage when confirmed', async () => {
    renderWithProviders(<TechnicianDashboard />);
    
    const extendButton = screen.getByTitle('Extend rotation');
    fireEvent.click(extendButton);
    
    const confirmButton = screen.getByText('Extend Rotation');
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'sms_rotation_extension',
        expect.stringContaining('"days":7')
      );
      expect(toast.success).toHaveBeenCalledWith('Rotation extended by 7 days', { duration: 3000 });
    });
  });

  test('displays extension indicator when rotation is extended', () => {
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'sms_rotation') return JSON.stringify(mockRotation);
      if (key === 'sms_rotation_extension') return JSON.stringify({ days: 7 });
      if (key === 'sms_handover_completed') return 'false';
      if (key === 'sms_theme') return 'dark';
      return null;
    });
    
    renderWithProviders(<TechnicianDashboard />);
    
    expect(screen.getByText('Extended +7d')).toBeInTheDocument();
  });
});

describe('TechnicianDashboard - Early Departure', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'sms_rotation') return JSON.stringify(mockRotation);
      if (key === 'sms_handover_completed') return 'true';
      if (key === 'sms_handover_items') {
        return JSON.stringify([
          { id: 'equipment', label: 'Equipment status updates', completed: true, notes: '' },
          { id: 'ongoing', label: 'Ongoing work documentation', completed: true, notes: '' },
          { id: 'critical', label: 'Critical information transfer', completed: true, notes: '' },
          { id: 'parts', label: 'Parts/inventory notes', completed: true, notes: '' },
          { id: 'safety', label: 'Safety briefings completed', completed: true, notes: '' }
        ]);
      }
      if (key === 'sms_theme') return 'dark';
      return null;
    });
  });

  test('shows early departure button when handover is complete', () => {
    renderWithProviders(<TechnicianDashboard />);
    
    expect(screen.getByText('Early Departure')).toBeInTheDocument();
  });

  test('displays early departure available message', () => {
    renderWithProviders(<TechnicianDashboard />);
    
    expect(screen.getByText('Early departure available')).toBeInTheDocument();
  });

  test('shows early departure modal when button is clicked', async () => {
    renderWithProviders(<TechnicianDashboard />);
    
    const earlyDepartureButton = screen.getByText('Early Departure');
    fireEvent.click(earlyDepartureButton);
    
    await waitFor(() => {
      expect(screen.getByText('Handover Complete')).toBeInTheDocument();
      expect(screen.getByText('Reason for Early Departure')).toBeInTheDocument();
    });
  });

  test('requires reason for early departure', async () => {
    renderWithProviders(<TechnicianDashboard />);
    
    const earlyDepartureButton = screen.getByText('Early Departure');
    fireEvent.click(earlyDepartureButton);
    
    const confirmButton = screen.getByText('Confirm Early Departure');
    fireEvent.click(confirmButton);
    
    expect(toast.error).toHaveBeenCalledWith('Please provide a reason for early departure');
  });

  test('logs early departure and navigates to vessels', async () => {
    renderWithProviders(<TechnicianDashboard />);
    
    const earlyDepartureButton = screen.getByText('Early Departure');
    fireEvent.click(earlyDepartureButton);
    
    const textarea = screen.getByPlaceholderText(/Please provide a reason/);
    fireEvent.change(textarea, { target: { value: 'Family emergency' } });
    
    const confirmButton = screen.getByText('Confirm Early Departure');
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'sms_early_departure',
        expect.stringContaining('"reason":"Family emergency"')
      );
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('sms_rotation');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('sms_selected_vessel');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('sms_handover_completed');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('sms_rotation_extension');
      expect(mockNavigate).toHaveBeenCalledWith('/vessels');
      expect(toast.success).toHaveBeenCalledWith('Early departure completed. Safe travels!', { duration: 3000 });
    });
  });
});