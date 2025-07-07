import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Users, 
  Building, 
  Search,
  MoreVertical,
  ChevronDown
} from 'lucide-react';

interface Department {
  id: string;
  name: string;
  description: string;
  managerId?: string;
  managerName?: string;
  employeeCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export const DepartmentManagement: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    managerId: ''
  });
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Mock data
  useEffect(() => {
    const mockDepartments: Department[] = [
      {
        id: '1',
        name: 'Engineering',
        description: 'Ship engineering and maintenance department',
        managerId: 'mgr1',
        managerName: 'John Smith',
        employeeCount: 12,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-20')
      },
      {
        id: '2',
        name: 'Deck Operations',
        description: 'Deck operations and navigation',
        managerId: 'mgr2',
        managerName: 'Sarah Johnson',
        employeeCount: 8,
        createdAt: new Date('2024-01-16'),
        updatedAt: new Date('2024-01-16')
      },
      {
        id: '3',
        name: 'Safety & Compliance',
        description: 'Safety protocols and regulatory compliance',
        employeeCount: 5,
        createdAt: new Date('2024-01-17'),
        updatedAt: new Date('2024-01-17')
      }
    ];
    setDepartments(mockDepartments);
  }, []);

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dept.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingDepartment) {
      // Update department
      setDepartments(prev => prev.map(dept => 
        dept.id === editingDepartment.id 
          ? { ...dept, ...formData, updatedAt: new Date() }
          : dept
      ));
    } else {
      // Add new department
      const newDepartment: Department = {
        id: String(Date.now()),
        ...formData,
        employeeCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setDepartments(prev => [...prev, newDepartment]);
    }
    
    resetForm();
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      description: department.description,
      managerId: department.managerId || ''
    });
    setShowAddModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this department?')) {
      setDepartments(prev => prev.filter(dept => dept.id !== id));
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', managerId: '' });
    setEditingDepartment(null);
    setShowAddModal(false);
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Department Management</h1>
        <p className="mt-2 text-gray-600">Manage your organization's departments and structure</p>
      </div>

      {/* Search and Actions */}
      <div className="flex justify-between items-center mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="text"
            placeholder="Search departments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="ml-4 flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Department
        </Button>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDepartments.map((department) => (
          <Card key={department.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg mr-4">
                  <Building className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{department.name}</h3>
                  <p className="text-sm text-gray-500">{department.description}</p>
                </div>
              </div>
              <div className="relative">
                <button
                  onClick={() => setOpenDropdownId(openDropdownId === department.id ? null : department.id)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <MoreVertical className="h-5 w-5 text-gray-500" />
                </button>
                {openDropdownId === department.id && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                    <button
                      onClick={() => {
                        handleEdit(department);
                        setOpenDropdownId(null);
                      }}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit Department
                    </button>
                    <button
                      onClick={() => {
                        handleDelete(department.id);
                        setOpenDropdownId(null);
                      }}
                      className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Department
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <Users className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-gray-600">{department.employeeCount} employees</span>
              </div>
              
              {department.managerName && (
                <div className="flex items-center text-sm">
                  <div className="w-6 h-6 bg-gray-300 rounded-full mr-2" />
                  <span className="text-gray-600">Manager: {department.managerName}</span>
                </div>
              )}
              
              <div className="pt-3 border-t">
                <p className="text-xs text-gray-500">
                  Created {department.createdAt.toLocaleDateString()}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {editingDepartment ? 'Edit Department' : 'Add New Department'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Department Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter department name"
                  required
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter department description"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="manager">Department Manager (Optional)</Label>
                <select
                  id="manager"
                  value={formData.managerId}
                  onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a manager</option>
                  <option value="mgr1">John Smith</option>
                  <option value="mgr2">Sarah Johnson</option>
                  <option value="mgr3">Michael Brown</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingDepartment ? 'Update' : 'Add'} Department
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};