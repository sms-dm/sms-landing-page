import React from 'react';
import { FiCalendar, FiMapPin, FiCpu } from 'react-icons/fi';
import { mapCriticalityLabel, getCriticalityBadgeClass } from '../utils/criticality';

interface EquipmentCardProps {
  equipment: {
    id: number;
    qr_code: string;
    name: string;
    manufacturer?: string;
    model?: string;
    serial_number?: string;
    location: string;
    equipment_type: string;
    status: string;
    criticality?: 'CRITICAL' | 'IMPORTANT' | 'STANDARD';
    classification?: 'PERMANENT' | 'TEMPORARY' | 'RENTAL';
    last_maintenance_date?: string;
    next_maintenance_date?: string;
  };
  onClick?: () => void;
}

export const EquipmentCard: React.FC<EquipmentCardProps> = ({ equipment, onClick }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-green-100 text-green-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'fault':
        return 'bg-red-100 text-red-800';
      case 'decommissioned':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getClassificationIcon = (classification?: string) => {
    switch (classification) {
      case 'TEMPORARY':
        return '⏱️'; // Clock for temporary equipment
      case 'RENTAL':
        return '📋'; // Clipboard for rental
      default:
        return '📍'; // Pin for permanent
    }
  };

  return (
    <div
      className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer border border-gray-200"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{equipment.name}</h3>
          <p className="text-sm text-gray-500">{equipment.qr_code}</p>
        </div>
        <div className="flex gap-2">
          {equipment.criticality && (
            <span className={getCriticalityBadgeClass(equipment.criticality)}>
              {mapCriticalityLabel(equipment.criticality)}
            </span>
          )}
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(equipment.status)}`}>
            {equipment.status.charAt(0).toUpperCase() + equipment.status.slice(1)}
          </span>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        {equipment.manufacturer && equipment.model && (
          <div className="flex items-center gap-2 text-gray-600">
            <FiCpu className="text-gray-400" size={14} />
            <span>{equipment.manufacturer} {equipment.model}</span>
          </div>
        )}
        
        <div className="flex items-center gap-2 text-gray-600">
          <FiMapPin className="text-gray-400" size={14} />
          <span>{equipment.location}</span>
          {equipment.classification && (
            <span className="ml-auto text-xs" title={equipment.classification.toLowerCase()}>
              {getClassificationIcon(equipment.classification)}
            </span>
          )}
        </div>

        {equipment.next_maintenance_date && (
          <div className="flex items-center gap-2 text-gray-600">
            <FiCalendar className="text-gray-400" size={14} />
            <span>Next maintenance: {new Date(equipment.next_maintenance_date).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span className="capitalize">{equipment.equipment_type}</span>
          {equipment.serial_number && (
            <span>S/N: {equipment.serial_number}</span>
          )}
        </div>
      </div>
    </div>
  );
};