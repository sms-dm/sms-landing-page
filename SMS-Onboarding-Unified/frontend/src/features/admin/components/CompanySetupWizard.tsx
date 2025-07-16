import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Company, SubscriptionTier } from '@/types';
import { ChevronLeft, ChevronRight, Check, Building2, Globe, Phone, Mail } from 'lucide-react';

interface CompanySetupStep {
  title: string;
  description: string;
}

const SETUP_STEPS: CompanySetupStep[] = [
  {
    title: 'Company Information',
    description: 'Enter your company details'
  },
  {
    title: 'Contact Information',
    description: 'Add primary contact details'
  },
  {
    title: 'Branding',
    description: 'Customize your company branding'
  },
  {
    title: 'Review & Confirm',
    description: 'Review your setup'
  }
];

export const CompanySetupWizard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    imoNumber: '',
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: ''
    },
    contactEmail: '',
    contactPhone: '',
    subscriptionTier: SubscriptionTier.PROFESSIONAL,
    branding: {
      primaryColor: '#1e40af',
      logo: null as File | null
    }
  });

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleNext = () => {
    if (currentStep < SETUP_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      // API call to create company
      console.log('Submitting company data:', formData);
      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Error creating company:', error);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter company name"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="imoNumber">IMO Number (Optional)</Label>
              <Input
                id="imoNumber"
                value={formData.imoNumber}
                onChange={(e) => handleInputChange('imoNumber', e.target.value)}
                placeholder="Enter IMO number"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  value={formData.address.street}
                  onChange={(e) => handleInputChange('address.street', e.target.value)}
                  placeholder="123 Main St"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.address.city}
                  onChange={(e) => handleInputChange('address.city', e.target.value)}
                  placeholder="New York"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  value={formData.address.postalCode}
                  onChange={(e) => handleInputChange('address.postalCode', e.target.value)}
                  placeholder="10001"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.address.country}
                  onChange={(e) => handleInputChange('address.country', e.target.value)}
                  placeholder="United States"
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="contactEmail">Contact Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                  placeholder="contact@company.com"
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="contactPhone"
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="subscriptionTier">Subscription Tier</Label>
              <select
                id="subscriptionTier"
                value={formData.subscriptionTier}
                onChange={(e) => handleInputChange('subscriptionTier', e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={SubscriptionTier.BASIC}>Basic</option>
                <option value={SubscriptionTier.PROFESSIONAL}>Professional</option>
                <option value={SubscriptionTier.ENTERPRISE}>Enterprise</option>
              </select>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="primaryColor">Primary Brand Color</Label>
              <div className="mt-1 flex items-center space-x-3">
                <Input
                  id="primaryColor"
                  type="color"
                  value={formData.branding.primaryColor}
                  onChange={(e) => handleInputChange('branding.primaryColor', e.target.value)}
                  className="h-10 w-20"
                />
                <span className="text-sm text-gray-600">{formData.branding.primaryColor}</span>
              </div>
            </div>
            <div>
              <Label htmlFor="logo">Company Logo</Label>
              <div className="mt-1">
                <input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleInputChange('branding.logo', file);
                    }
                  }}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              {formData.branding.logo && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600">Selected: {formData.branding.logo.name}</p>
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Company Information</h3>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Company Name:</dt>
                  <dd className="font-medium">{formData.name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">IMO Number:</dt>
                  <dd className="font-medium">{formData.imoNumber || 'Not provided'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Address:</dt>
                  <dd className="font-medium text-right">
                    {formData.address.street}, {formData.address.city}<br />
                    {formData.address.postalCode}, {formData.address.country}
                  </dd>
                </div>
              </dl>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Email:</dt>
                  <dd className="font-medium">{formData.contactEmail}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Phone:</dt>
                  <dd className="font-medium">{formData.contactPhone}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Subscription:</dt>
                  <dd className="font-medium capitalize">{formData.subscriptionTier}</dd>
                </div>
              </dl>
            </div>
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Branding</h3>
              <dl className="space-y-2">
                <div className="flex justify-between items-center">
                  <dt className="text-gray-600">Primary Color:</dt>
                  <dd className="flex items-center space-x-2">
                    <div 
                      className="w-6 h-6 rounded border border-gray-300"
                      style={{ backgroundColor: formData.branding.primaryColor }}
                    />
                    <span className="font-medium">{formData.branding.primaryColor}</span>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Logo:</dt>
                  <dd className="font-medium">
                    {formData.branding.logo ? formData.branding.logo.name : 'No logo uploaded'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Company Setup</h1>
        <p className="mt-2 text-gray-600">Complete the setup process to get started</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {SETUP_STEPS.map((step, index) => (
            <div key={index} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                index < currentStep ? 'bg-green-500 text-white' :
                index === currentStep ? 'bg-blue-500 text-white' :
                'bg-gray-200 text-gray-600'
              }`}>
                {index < currentStep ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              {index < SETUP_STEPS.length - 1 && (
                <div className={`w-full h-1 mx-2 ${
                  index < currentStep ? 'bg-green-500' : 'bg-gray-200'
                }`} style={{ width: '100px' }} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-4">
          {SETUP_STEPS.map((step, index) => (
            <div key={index} className="text-center" style={{ width: '150px' }}>
              <p className={`text-sm font-medium ${
                index === currentStep ? 'text-blue-600' : 'text-gray-600'
              }`}>
                {step.title}
              </p>
              <p className="text-xs text-gray-500 mt-1">{step.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card className="p-8">
        <h2 className="text-xl font-semibold mb-6">{SETUP_STEPS[currentStep].title}</h2>
        {renderStepContent()}
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className="flex items-center"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        
        {currentStep === SETUP_STEPS.length - 1 ? (
          <Button onClick={handleSubmit} className="flex items-center">
            Complete Setup
            <Check className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleNext} className="flex items-center">
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
};