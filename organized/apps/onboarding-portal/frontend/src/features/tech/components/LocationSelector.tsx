import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VesselLocation, OnboardingFlowState } from '../types';
import { technicianApi } from '../services/technicianApi';
import { PhotoCapture } from './PhotoCapture';
import { offlineService } from '../services/offlineService';
import { v4 as uuidv4 } from 'uuid';

interface LocationSelectorProps {
  vesselId: string;
  onSelect: (location: VesselLocation) => void;
  flowState: OnboardingFlowState;
  setFlowState: React.Dispatch<React.SetStateAction<OnboardingFlowState>>;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  vesselId,
  onSelect,
  flowState,
  setFlowState,
}) => {
  const [locations, setLocations] = useState<VesselLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newLocation, setNewLocation] = useState({
    name: '',
    deck: '',
    zone: '',
    description: '',
  });

  useEffect(() => {
    loadLocations();
  }, [vesselId]);

  const loadLocations = async () => {
    try {
      setLoading(true);
      // Try to get from cache first
      const cached = await offlineService.getCachedData('vessel-locations', vesselId);
      if (cached) {
        setLocations(cached);
        setLoading(false);
      }

      // Then fetch fresh data
      const data = await technicianApi.getVesselLocations(vesselId);
      setLocations(data);
      // Cache for offline use
      await offlineService.cacheData('vessel-locations', vesselId, data);
    } catch (err) {
      console.error('Failed to load locations:', err);
      // If online fetch fails, rely on cache
      const cached = await offlineService.getCachedData('vessel-locations', vesselId);
      if (cached) {
        setLocations(cached);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddLocation = async () => {
    try {
      const locationData: VesselLocation = {
        id: uuidv4(),
        vesselId,
        ...newLocation,
        equipmentCount: 0,
        completedCount: 0,
        photos: [],
      };

      if (navigator.onLine) {
        const created = await technicianApi.createLocation(vesselId, locationData);
        setLocations([...locations, created]);
      } else {
        // Save offline
        await offlineService.saveOfflineData({
          id: locationData.id,
          type: 'location',
          action: 'create',
          data: locationData,
          timestamp: new Date(),
          synced: false,
        });
        setLocations([...locations, locationData]);
      }

      setShowAddForm(false);
      setNewLocation({ name: '', deck: '', zone: '', description: '' });
    } catch (err) {
      console.error('Failed to add location:', err);
    }
  };

  const handlePhotoAdded = async (locationId: string, photoUrl: string) => {
    setLocations(prev =>
      prev.map(loc =>
        loc.id === locationId
          ? {
              ...loc,
              photos: [
                ...loc.photos,
                {
                  id: uuidv4(),
                  url: photoUrl,
                  thumbnailUrl: photoUrl,
                  uploadedAt: new Date(),
                  metadata: { width: 0, height: 0, size: 0 },
                },
              ],
            }
          : loc
      )
    );
  };

  const filteredLocations = locations.filter(
    loc =>
      loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loc.deck.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loc.zone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Select or Add Location</h2>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Cancel' : 'Add New Location'}
        </Button>
      </div>

      {showAddForm && (
        <Card className="p-4 mb-4">
          <h3 className="font-medium mb-4">Add New Location</h3>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="name">Location Name *</Label>
              <Input
                id="name"
                value={newLocation.name}
                onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                placeholder="e.g., Engine Room"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="deck">Deck *</Label>
                <Input
                  id="deck"
                  value={newLocation.deck}
                  onChange={(e) => setNewLocation({ ...newLocation, deck: e.target.value })}
                  placeholder="e.g., Main Deck"
                />
              </div>
              <div>
                <Label htmlFor="zone">Zone *</Label>
                <Input
                  id="zone"
                  value={newLocation.zone}
                  onChange={(e) => setNewLocation({ ...newLocation, zone: e.target.value })}
                  placeholder="e.g., Port Side"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={newLocation.description}
                onChange={(e) => setNewLocation({ ...newLocation, description: e.target.value })}
                placeholder="Additional details..."
              />
            </div>
            <Button
              onClick={handleAddLocation}
              disabled={!newLocation.name || !newLocation.deck || !newLocation.zone}
            >
              Add Location
            </Button>
          </div>
        </Card>
      )}

      <div className="mb-4">
        <Input
          type="search"
          placeholder="Search locations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filteredLocations.map((location) => (
          <Card
            key={location.id}
            className="p-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onSelect(location)}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-lg">{location.name}</h3>
              <div className="text-sm text-gray-600">
                {location.completedCount}/{location.equipmentCount} Equipment
              </div>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Deck: {location.deck}</p>
              <p>Zone: {location.zone}</p>
              {location.description && <p className="text-gray-500">{location.description}</p>}
            </div>
            
            {location.photos.length > 0 && (
              <div className="mt-3 flex gap-2">
                {location.photos.slice(0, 3).map((photo) => (
                  <img
                    key={photo.id}
                    src={photo.thumbnailUrl}
                    alt=""
                    className="w-16 h-16 object-cover rounded"
                  />
                ))}
                {location.photos.length > 3 && (
                  <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-sm text-gray-600">
                    +{location.photos.length - 3}
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 flex justify-between items-center">
              <PhotoCapture
                entityType="location"
                entityId={location.id}
                onPhotoAdded={(url) => handlePhotoAdded(location.id, url)}
                flowState={flowState}
                setFlowState={setFlowState}
              />
              <Button size="sm">Select</Button>
            </div>
          </Card>
        ))}
      </div>

      {filteredLocations.length === 0 && !showAddForm && (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No locations found</p>
          <Button onClick={() => setShowAddForm(true)}>Add First Location</Button>
        </div>
      )}
    </div>
  );
};