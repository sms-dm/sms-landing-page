// Certificates Section Component
import React, { useState } from 'react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { HSECertificate, CertificateType } from '../../../types';
import { hseService } from '../../../services/hse';
import { toast } from '../../../components/ui/toaster';

interface CertificatesSectionProps {
  vesselId: string;
  certificates: HSECertificate[];
  onUpdate: (certificates: HSECertificate[]) => void;
  canEdit: boolean;
}

export const CertificatesSection: React.FC<CertificatesSectionProps> = ({
  vesselId,
  certificates,
  onUpdate,
  canEdit
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const certificateTypes = [
    { value: CertificateType.SOLAS, label: 'SOLAS (Safety of Life at Sea)' },
    { value: CertificateType.MARPOL, label: 'MARPOL (Marine Pollution)' },
    { value: CertificateType.ISM, label: 'ISM (International Safety Management)' },
    { value: CertificateType.ISPS, label: 'ISPS (Ship and Port Facility Security)' },
    { value: CertificateType.MLC, label: 'MLC (Maritime Labour Convention)' },
    { value: CertificateType.OTHER, label: 'Other' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'pending_renewal': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAddCertificate = async (formData: FormData) => {
    try {
      setUploading(true);
      const certificateData = {
        type: formData.get('type') as CertificateType,
        certificateNumber: formData.get('certificateNumber') as string,
        issueDate: new Date(formData.get('issueDate') as string),
        expiryDate: new Date(formData.get('expiryDate') as string),
        issuingAuthority: formData.get('issuingAuthority') as string,
        notes: formData.get('notes') as string
      };
      
      const file = formData.get('document') as File | null;
      
      const newCertificate = await hseService.addCertificate(
        vesselId,
        certificateData,
        file || undefined
      );
      
      onUpdate([...certificates, newCertificate]);
      setShowAddForm(false);
      toast.success('Certificate added successfully');
    } catch (error) {
      toast.error('Failed to add certificate');
      console.error('Error adding certificate:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateCertificate = async (id: string, formData: FormData) => {
    try {
      setUploading(true);
      const updates = {
        type: formData.get('type') as CertificateType,
        certificateNumber: formData.get('certificateNumber') as string,
        issueDate: new Date(formData.get('issueDate') as string),
        expiryDate: new Date(formData.get('expiryDate') as string),
        issuingAuthority: formData.get('issuingAuthority') as string,
        notes: formData.get('notes') as string
      };
      
      const file = formData.get('document') as File | null;
      
      const updatedCertificate = await hseService.updateCertificate(
        id,
        updates,
        file || undefined
      );
      
      onUpdate(certificates.map(cert => 
        cert.id === id ? updatedCertificate : cert
      ));
      setEditingId(null);
      toast.success('Certificate updated successfully');
    } catch (error) {
      toast.error('Failed to update certificate');
      console.error('Error updating certificate:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteCertificate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this certificate?')) return;
    
    try {
      await hseService.deleteCertificate(id);
      onUpdate(certificates.filter(cert => cert.id !== id));
      toast.success('Certificate deleted successfully');
    } catch (error) {
      toast.error('Failed to delete certificate');
      console.error('Error deleting certificate:', error);
    }
  };

  const CertificateForm = ({ 
    certificate, 
    onSubmit, 
    onCancel 
  }: { 
    certificate?: HSECertificate;
    onSubmit: (formData: FormData) => void;
    onCancel: () => void;
  }) => {
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      onSubmit(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="type">Certificate Type</Label>
            <select
              id="type"
              name="type"
              defaultValue={certificate?.type || ''}
              required
              className="mt-1 w-full px-3 py-2 border rounded-md bg-white"
            >
              <option value="">Select type</option>
              {certificateTypes.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <Label htmlFor="certificateNumber">Certificate Number</Label>
            <Input
              id="certificateNumber"
              name="certificateNumber"
              defaultValue={certificate?.certificateNumber}
              required
              className="mt-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="issueDate">Issue Date</Label>
            <Input
              id="issueDate"
              name="issueDate"
              type="date"
              defaultValue={certificate?.issueDate 
                ? new Date(certificate.issueDate).toISOString().split('T')[0]
                : ''
              }
              required
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="expiryDate">Expiry Date</Label>
            <Input
              id="expiryDate"
              name="expiryDate"
              type="date"
              defaultValue={certificate?.expiryDate 
                ? new Date(certificate.expiryDate).toISOString().split('T')[0]
                : ''
              }
              required
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="issuingAuthority">Issuing Authority</Label>
          <Input
            id="issuingAuthority"
            name="issuingAuthority"
            defaultValue={certificate?.issuingAuthority}
            required
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="document">Certificate Document (PDF)</Label>
          <Input
            id="document"
            name="document"
            type="file"
            accept=".pdf"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="notes">Notes</Label>
          <textarea
            id="notes"
            name="notes"
            defaultValue={certificate?.notes}
            rows={2}
            className="mt-1 w-full px-3 py-2 border rounded-md resize-none"
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={uploading}>
            {uploading ? 'Saving...' : certificate ? 'Update' : 'Add'} Certificate
          </Button>
        </div>
      </form>
    );
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Vessel Certificates</h2>
        {canEdit && !showAddForm && (
          <Button onClick={() => setShowAddForm(true)}>
            Add Certificate
          </Button>
        )}
      </div>

      {showAddForm && (
        <Card className="p-4 mb-4">
          <h3 className="font-medium mb-4">Add New Certificate</h3>
          <CertificateForm
            onSubmit={handleAddCertificate}
            onCancel={() => setShowAddForm(false)}
          />
        </Card>
      )}

      <div className="space-y-4">
        {certificates.length === 0 ? (
          <Card className="p-6 text-center text-gray-500">
            No certificates added yet
          </Card>
        ) : (
          certificates.map((certificate) => (
            <Card key={certificate.id} className="p-4">
              {editingId === certificate.id ? (
                <CertificateForm
                  certificate={certificate}
                  onSubmit={(formData) => handleUpdateCertificate(certificate.id, formData)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium">{certificate.type}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(certificate.status)}`}>
                        {certificate.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Number:</span> {certificate.certificateNumber}
                      </div>
                      <div>
                        <span className="font-medium">Issued:</span> {new Date(certificate.issueDate).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">Expires:</span> {new Date(certificate.expiryDate).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">Authority:</span> {certificate.issuingAuthority}
                      </div>
                    </div>
                    
                    {certificate.notes && (
                      <p className="mt-2 text-sm text-gray-500">{certificate.notes}</p>
                    )}
                    
                    {certificate.documentUrl && (
                      <a
                        href={certificate.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                      >
                        View Document →
                      </a>
                    )}
                  </div>
                  
                  {canEdit && (
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingId(certificate.id)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteCertificate(certificate.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
};