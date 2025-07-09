// Emergency Contacts Section Component
import React, { useState } from 'react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Checkbox } from '../../../components/ui/checkbox';
import { EmergencyContact } from '../../../types';
import { hseService } from '../../../services/hse';
import { toast } from '../../../components/ui/toaster';

interface EmergencyContactsSectionProps {
  vesselId: string;
  contacts: EmergencyContact[];
  onUpdate: (contacts: EmergencyContact[]) => void;
  canEdit: boolean;
}

export const EmergencyContactsSection: React.FC<EmergencyContactsSectionProps> = ({
  vesselId,
  contacts,
  onUpdate,
  canEdit
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleAddContact = async (formData: FormData) => {
    try {
      setSaving(true);
      const contactData = {
        name: formData.get('name') as string,
        role: formData.get('role') as string,
        primaryPhone: formData.get('primaryPhone') as string,
        secondaryPhone: formData.get('secondaryPhone') as string || undefined,
        email: formData.get('email') as string || undefined,
        available24x7: formData.get('available24x7') === 'on',
        location: formData.get('location') as string || undefined,
        notes: formData.get('notes') as string || undefined
      };
      
      const newContact = await hseService.addEmergencyContact(vesselId, contactData);
      onUpdate([...contacts, newContact]);
      setShowAddForm(false);
      toast.success('Emergency contact added successfully');
    } catch (error) {
      toast.error('Failed to add emergency contact');
      console.error('Error adding contact:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateContact = async (id: string, formData: FormData) => {
    try {
      setSaving(true);
      const updates = {
        name: formData.get('name') as string,
        role: formData.get('role') as string,
        primaryPhone: formData.get('primaryPhone') as string,
        secondaryPhone: formData.get('secondaryPhone') as string || undefined,
        email: formData.get('email') as string || undefined,
        available24x7: formData.get('available24x7') === 'on',
        location: formData.get('location') as string || undefined,
        notes: formData.get('notes') as string || undefined
      };
      
      const updatedContact = await hseService.updateEmergencyContact(id, updates);
      onUpdate(contacts.map(contact => 
        contact.id === id ? updatedContact : contact
      ));
      setEditingId(null);
      toast.success('Emergency contact updated successfully');
    } catch (error) {
      toast.error('Failed to update emergency contact');
      console.error('Error updating contact:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm('Are you sure you want to delete this emergency contact?')) return;
    
    try {
      await hseService.deleteEmergencyContact(id);
      onUpdate(contacts.filter(contact => contact.id !== id));
      toast.success('Emergency contact deleted successfully');
    } catch (error) {
      toast.error('Failed to delete emergency contact');
      console.error('Error deleting contact:', error);
    }
  };

  const ContactForm = ({ 
    contact, 
    onSubmit, 
    onCancel 
  }: { 
    contact?: EmergencyContact;
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
            <Label htmlFor="name">Contact Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={contact?.name}
              required
              className="mt-1"
              placeholder="Full name"
            />
          </div>
          
          <div>
            <Label htmlFor="role">Role/Position</Label>
            <Input
              id="role"
              name="role"
              defaultValue={contact?.role}
              required
              className="mt-1"
              placeholder="e.g., Port Agent, Medical Officer"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="primaryPhone">Primary Phone</Label>
            <Input
              id="primaryPhone"
              name="primaryPhone"
              type="tel"
              defaultValue={contact?.primaryPhone}
              required
              className="mt-1"
              placeholder="+1 234 567 8900"
            />
          </div>
          
          <div>
            <Label htmlFor="secondaryPhone">Secondary Phone</Label>
            <Input
              id="secondaryPhone"
              name="secondaryPhone"
              type="tel"
              defaultValue={contact?.secondaryPhone}
              className="mt-1"
              placeholder="Optional"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={contact?.email}
              className="mt-1"
              placeholder="contact@example.com"
            />
          </div>
          
          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              name="location"
              defaultValue={contact?.location}
              className="mt-1"
              placeholder="City, Country"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="available24x7"
            name="available24x7"
            defaultChecked={contact?.available24x7}
          />
          <Label htmlFor="available24x7" className="font-normal">
            Available 24/7 for emergencies
          </Label>
        </div>

        <div>
          <Label htmlFor="notes">Additional Notes</Label>
          <textarea
            id="notes"
            name="notes"
            defaultValue={contact?.notes}
            rows={2}
            className="mt-1 w-full px-3 py-2 border rounded-md resize-none"
            placeholder="Any special instructions or additional information..."
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : contact ? 'Update' : 'Add'} Contact
          </Button>
        </div>
      </form>
    );
  };

  const getRoleIcon = (role: string) => {
    const lowerRole = role.toLowerCase();
    if (lowerRole.includes('medical') || lowerRole.includes('doctor')) return '🏥';
    if (lowerRole.includes('agent')) return '🤝';
    if (lowerRole.includes('coast guard')) return '⚓';
    if (lowerRole.includes('fire')) return '🚒';
    if (lowerRole.includes('police')) return '👮';
    if (lowerRole.includes('captain') || lowerRole.includes('master')) return '👨‍✈️';
    return '📞';
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Emergency Contacts</h2>
        {canEdit && !showAddForm && (
          <Button onClick={() => setShowAddForm(true)}>
            Add Contact
          </Button>
        )}
      </div>

      {showAddForm && (
        <Card className="p-4 mb-4">
          <h3 className="font-medium mb-4">Add New Emergency Contact</h3>
          <ContactForm
            onSubmit={handleAddContact}
            onCancel={() => setShowAddForm(false)}
          />
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {contacts.length === 0 ? (
          <Card className="p-6 text-center text-gray-500 md:col-span-2">
            No emergency contacts added yet
          </Card>
        ) : (
          contacts.map((contact) => (
            <Card key={contact.id} className="p-4">
              {editingId === contact.id ? (
                <ContactForm
                  contact={contact}
                  onSubmit={(formData) => handleUpdateContact(contact.id, formData)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getRoleIcon(contact.role)}</span>
                      <div>
                        <h4 className="font-medium">{contact.name}</h4>
                        <p className="text-sm text-gray-600">{contact.role}</p>
                      </div>
                    </div>
                    {contact.available24x7 && (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                        24/7
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Primary:</span>
                      <a href={`tel:${contact.primaryPhone}`} className="text-blue-600 hover:text-blue-800">
                        {contact.primaryPhone}
                      </a>
                    </div>
                    
                    {contact.secondaryPhone && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Secondary:</span>
                        <a href={`tel:${contact.secondaryPhone}`} className="text-blue-600 hover:text-blue-800">
                          {contact.secondaryPhone}
                        </a>
                      </div>
                    )}
                    
                    {contact.email && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Email:</span>
                        <a href={`mailto:${contact.email}`} className="text-blue-600 hover:text-blue-800">
                          {contact.email}
                        </a>
                      </div>
                    )}
                    
                    {contact.location && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Location:</span>
                        <span>{contact.location}</span>
                      </div>
                    )}
                  </div>
                  
                  {contact.notes && (
                    <p className="mt-3 text-sm text-gray-500 italic">{contact.notes}</p>
                  )}
                  
                  {canEdit && (
                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingId(contact.id)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteContact(contact.id)}
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