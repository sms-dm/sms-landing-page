// Test script to verify UI/UX consistency and integration
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3005';

interface TestResult {
  test: string;
  status: 'pass' | 'fail';
  message?: string;
}

export const runIntegrationTests = async (): Promise<TestResult[]> => {
  const results: TestResult[] = [];
  const token = localStorage.getItem('token');

  // Test 1: Check if API is responsive
  try {
    await axios.get(`${API_URL}/health`);
    results.push({ test: 'API Health Check', status: 'pass' });
  } catch (error) {
    results.push({ test: 'API Health Check', status: 'fail', message: 'API not responding' });
  }

  // Test 2: Check authentication
  if (token) {
    try {
      await axios.get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      results.push({ test: 'Authentication', status: 'pass' });
    } catch (error) {
      results.push({ test: 'Authentication', status: 'fail', message: 'Authentication failed' });
    }
  } else {
    results.push({ test: 'Authentication', status: 'fail', message: 'No token found' });
  }

  // Test 3: Check dashboard data endpoints
  const endpoints = [
    '/api/analytics/dashboard/stats',
    '/api/faults',
    '/api/inventory/alerts',
    '/api/vessels',
    '/api/analytics/fleet'
  ];

  for (const endpoint of endpoints) {
    try {
      await axios.get(`${API_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      results.push({ test: `Endpoint: ${endpoint}`, status: 'pass' });
    } catch (error) {
      results.push({ 
        test: `Endpoint: ${endpoint}`, 
        status: 'fail', 
        message: `Failed to fetch from ${endpoint}` 
      });
    }
  }

  // Test 4: Check WebSocket connection
  try {
    const ws = new WebSocket(`ws://localhost:3005`);
    await new Promise((resolve, reject) => {
      ws.onopen = () => {
        ws.close();
        resolve(true);
      };
      ws.onerror = () => reject(new Error('WebSocket connection failed'));
      setTimeout(() => reject(new Error('WebSocket timeout')), 5000);
    });
    results.push({ test: 'WebSocket Connection', status: 'pass' });
  } catch (error) {
    results.push({ test: 'WebSocket Connection', status: 'fail', message: 'WebSocket not available' });
  }

  return results;
};

export const checkUIConsistency = (): TestResult[] => {
  const results: TestResult[] = [];

  // Check if color scheme is loaded
  const rootStyles = getComputedStyle(document.documentElement);
  const statusColors = {
    critical: rootStyles.getPropertyValue('--color-status-critical'),
    warning: rootStyles.getPropertyValue('--color-status-warning'),
    good: rootStyles.getPropertyValue('--color-status-good'),
    info: rootStyles.getPropertyValue('--color-status-info')
  };

  const hasColors = Object.values(statusColors).every(color => color !== '');
  results.push({
    test: 'Color Scheme Loaded',
    status: hasColors ? 'pass' : 'fail',
    message: hasColors ? undefined : 'Status colors not found in CSS'
  });

  // Check if skeleton loaders are available
  const skeletonLoader = document.querySelector('[class*="skeleton"]');
  results.push({
    test: 'Skeleton Loaders',
    status: skeletonLoader ? 'pass' : 'fail',
    message: 'Skeleton loader components available'
  });

  // Check if toast container exists
  const toastContainer = document.querySelector('[class*="toaster"]');
  results.push({
    test: 'Toast Notifications',
    status: toastContainer ? 'pass' : 'fail',
    message: 'Toast notification system initialized'
  });

  return results;
};

export const generateTestReport = (results: TestResult[]): string => {
  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  
  let report = `\n🧪 Integration Test Results\n`;
  report += `${'='.repeat(50)}\n`;
  report += `✅ Passed: ${passed}\n`;
  report += `❌ Failed: ${failed}\n`;
  report += `${'='.repeat(50)}\n\n`;

  results.forEach(result => {
    const icon = result.status === 'pass' ? '✅' : '❌';
    report += `${icon} ${result.test}`;
    if (result.message) {
      report += ` - ${result.message}`;
    }
    report += '\n';
  });

  return report;
};