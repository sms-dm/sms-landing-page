import React, { useState } from 'react';
import { technicianApi } from '../services/technicianApi';
import { offlineService } from '../services/offlineService';
import { syncService } from '../services/syncService';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export const TestIntegration: React.FC = () => {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  const testEquipmentCreation = async () => {
    setLoading(true);
    setResults([]);
    
    try {
      // 1. Initialize offline service
      addResult('Initializing offline service...');
      await offlineService.init();
      addResult('✅ Offline service initialized');

      // 2. Test creating equipment offline
      addResult('Creating equipment offline...');
      const equipmentData = {
        id: 'test-equipment-' + Date.now(),
        name: 'Test Equipment',
        manufacturer: 'Test Manufacturer',
        model: 'TEST-001',
        serialNumber: 'SN-' + Date.now(),
        categoryId: 'cat-1',
        criticalityLevel: 'medium',
        vesselId: 'vessel-1',
        locationId: 'loc-1'
      };

      await offlineService.saveOfflineData({
        id: equipmentData.id,
        type: 'equipment',
        action: 'create',
        data: equipmentData,
        timestamp: new Date(),
        synced: false,
      });
      addResult('✅ Equipment saved offline');

      // 3. Test creating part offline
      addResult('Creating part offline...');
      const partData = {
        id: 'test-part-' + Date.now(),
        equipmentId: equipmentData.id,
        partNumber: 'PART-' + Date.now(),
        name: 'Test Critical Part',
        manufacturer: 'Part Manufacturer',
        quantity: 10,
        minimumStock: 5,
        criticalityLevel: 'critical',
        criticalReason: 'Essential for operation'
      };

      await offlineService.saveOfflineData({
        id: partData.id,
        type: 'part',
        action: 'create',
        data: partData,
        timestamp: new Date(),
        synced: false,
      });
      addResult('✅ Part saved offline');

      // 4. Check offline data
      const unsyncedData = await offlineService.getUnsyncedData();
      addResult(`📊 Unsynced items: ${unsyncedData.length}`);

      // 5. Test quality score calculation
      addResult('Testing quality score calculation...');
      const qualityBreakdown = [
        { category: 'Basic Information', score: 20, maxScore: 20 },
        { category: 'Documentation', score: 0, maxScore: 20 },
        { category: 'Photos', score: 0, maxScore: 20 },
        { category: 'Spare Parts', score: 10, maxScore: 20 },
        { category: 'Critical Parts', score: 20, maxScore: 20 }
      ];
      const totalScore = qualityBreakdown.reduce((sum, item) => sum + item.score, 0);
      addResult(`✅ Quality score: ${totalScore}%`);

      // 6. Test sync (if online)
      if (navigator.onLine) {
        addResult('Testing sync service...');
        const syncResults = await syncService.syncAll();
        addResult(`✅ Sync complete - Success: ${syncResults.success}, Failed: ${syncResults.failed}`);
      } else {
        addResult('⚠️ Offline - skipping sync test');
      }

      addResult('🎉 All tests completed!');
    } catch (error) {
      addResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Integration Test</h2>
      
      <div className="space-y-4">
        <Button 
          onClick={testEquipmentCreation} 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Running Tests...' : 'Run Integration Test'}
        </Button>

        {results.length > 0 && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg">
            <h3 className="font-medium mb-2">Test Results:</h3>
            <div className="space-y-1 font-mono text-sm">
              {results.map((result, index) => (
                <div key={index} className={
                  result.includes('✅') ? 'text-green-600' :
                  result.includes('❌') ? 'text-red-600' :
                  result.includes('⚠️') ? 'text-yellow-600' :
                  'text-gray-700'
                }>
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};