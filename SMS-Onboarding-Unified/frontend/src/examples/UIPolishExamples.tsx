import React, { useState } from 'react';
import { 
  Skeleton, 
  SkeletonCard, 
  SkeletonTable,
  SkeletonList,
  SkeletonForm,
  SuccessAnimation,
  InlineSuccess,
  ProgressIndicator,
  StepProgress,
  UploadProgress,
  PageTransition,
  AnimatedRoute,
  StaggerChildren,
  useOnboardingTour,
  FormFeedback,
  SubmitButton,
  InlineSaveIndicator,
  FormFieldFeedback,
  FormProgress,
  AutoSaveIndicator,
} from '@/components/ui';
import { useAsync, useDebouncedAsync } from '@/hooks/useAsyncState';
import { useAppDispatch } from '@/hooks/redux';
import { addToast } from '@/store/slices/uiSlice';

// Example: Loading States with Skeletons
export function LoadingStatesExample() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Loading States</h2>
      
      <button 
        onClick={() => setIsLoading(!isLoading)}
        className="px-4 py-2 bg-primary text-white rounded"
      >
        Toggle Loading
      </button>

      {isLoading ? (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Card Skeleton</h3>
            <div className="grid grid-cols-3 gap-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Table Skeleton</h3>
            <SkeletonTable rows={5} />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">List Skeleton</h3>
            <SkeletonList items={4} />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Form Skeleton</h3>
            <SkeletonForm />
          </div>
        </div>
      ) : (
        <div className="p-6 bg-gray-50 rounded-lg">
          <p>Content loaded successfully!</p>
        </div>
      )}
    </div>
  );
}

// Example: Success Animations
export function SuccessAnimationsExample() {
  const [showSuccess, setShowSuccess] = useState(false);
  const [showInlineSuccess, setShowInlineSuccess] = useState(false);
  const dispatch = useAppDispatch();

  const handleSuccess = () => {
    setShowSuccess(true);
    dispatch(addToast({
      type: 'success',
      title: 'Operation Successful',
      description: 'Your changes have been saved successfully.',
    }));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Success Animations</h2>
      
      <div className="space-y-4">
        <button 
          onClick={handleSuccess}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          Trigger Success Animation
        </button>

        <button 
          onClick={() => setShowInlineSuccess(!showInlineSuccess)}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Toggle Inline Success
        </button>

        {showInlineSuccess && (
          <InlineSuccess message="Your profile has been updated" />
        )}
      </div>

      <SuccessAnimation 
        show={showSuccess} 
        message="Operation completed!"
        onComplete={() => setShowSuccess(false)}
      />
    </div>
  );
}

// Example: Progress Indicators
export function ProgressIndicatorsExample() {
  const [progress, setProgress] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);

  // Simulate progress
  const simulateProgress = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Progress Indicators</h2>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Linear Progress</h3>
        <ProgressIndicator value={progress} label="Processing files" />
        <button 
          onClick={simulateProgress}
          className="px-4 py-2 bg-primary text-white rounded"
        >
          Start Progress
        </button>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Circular Progress</h3>
        <div className="flex gap-4">
          <ProgressIndicator value={25} variant="circular" size="sm" />
          <ProgressIndicator value={50} variant="circular" size="md" color="warning" />
          <ProgressIndicator value={75} variant="circular" size="lg" color="success" />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Step Progress</h3>
        <StepProgress 
          steps={['Details', 'Equipment', 'Review', 'Complete']}
          currentStep={currentStep}
        />
        <div className="flex gap-2">
          <button 
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            className="px-4 py-2 bg-gray-600 text-white rounded"
          >
            Previous
          </button>
          <button 
            onClick={() => setCurrentStep(Math.min(3, currentStep + 1))}
            className="px-4 py-2 bg-primary text-white rounded"
          >
            Next
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Upload Progress</h3>
        <UploadProgress 
          fileName="equipment-manual.pdf"
          progress={uploadProgress}
          status={uploadProgress === 100 ? 'completed' : 'uploading'}
        />
        <button 
          onClick={() => {
            setUploadProgress(0);
            const interval = setInterval(() => {
              setUploadProgress(prev => {
                if (prev >= 100) {
                  clearInterval(interval);
                  return 100;
                }
                return prev + 20;
              });
            }, 1000);
          }}
          className="px-4 py-2 bg-primary text-white rounded"
        >
          Start Upload
        </button>
      </div>
    </div>
  );
}

// Example: Onboarding Tour
export function OnboardingTourExample() {
  const tourConfig = {
    id: 'dashboard-tour',
    steps: [
      {
        target: '#tour-step-1',
        title: 'Welcome to SMS Dashboard',
        content: 'This is your main dashboard where you can see all your equipment and tasks.',
      },
      {
        target: '#tour-step-2',
        title: 'Quick Actions',
        content: 'Use these buttons to quickly add new equipment or start an onboarding process.',
      },
      {
        target: '#tour-step-3',
        title: 'Notifications',
        content: 'Stay updated with real-time notifications about your equipment status.',
      },
    ],
    showProgress: true,
    allowKeyboardNavigation: true,
    persistKey: 'dashboard-tour-v1',
  };

  const { startTour, TooltipComponent } = useOnboardingTour(tourConfig);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Onboarding Tour</h2>
      
      <button 
        onClick={startTour}
        className="px-4 py-2 bg-purple-600 text-white rounded"
      >
        Start Tour
      </button>

      <div className="grid grid-cols-3 gap-4">
        <div id="tour-step-1" className="p-4 bg-gray-100 rounded">
          <h3 className="font-semibold">Dashboard Overview</h3>
          <p className="text-sm text-gray-600">Your equipment at a glance</p>
        </div>
        
        <div id="tour-step-2" className="p-4 bg-gray-100 rounded">
          <h3 className="font-semibold">Quick Actions</h3>
          <div className="flex gap-2 mt-2">
            <button className="px-3 py-1 bg-blue-500 text-white rounded text-sm">
              Add Equipment
            </button>
            <button className="px-3 py-1 bg-green-500 text-white rounded text-sm">
              Start Onboarding
            </button>
          </div>
        </div>
        
        <div id="tour-step-3" className="p-4 bg-gray-100 rounded">
          <h3 className="font-semibold">Notifications</h3>
          <p className="text-sm text-gray-600">3 new updates</p>
        </div>
      </div>

      {TooltipComponent}
    </div>
  );
}

// Example: Form with Feedback
export function FormFeedbackExample() {
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  const saveForm = async () => {
    setSaveStatus('saving');
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setSaveStatus('saved');
    setLastSaved(new Date());
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  const { execute: debouncedSave } = useDebouncedAsync(saveForm, 1000);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    debouncedSave();
  };

  const formSteps = [
    { id: 'basic', title: 'Basic Info', description: 'Name and email' },
    { id: 'details', title: 'Details', description: 'Additional information' },
    { id: 'review', title: 'Review', description: 'Confirm your data' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Form Feedback Components</h2>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Multi-step Form Progress</h3>
        <FormProgress steps={formSteps} currentStep={0} />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Form with Auto-save</h3>
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded"
            />
            <FormFieldFeedback 
              error={formData.email && !formData.email.includes('@') ? 'Invalid email' : undefined}
              touched={formData.email.length > 0}
              success={formData.email.includes('@')}
            />
          </div>

          <div className="flex items-center justify-between">
            <InlineSaveIndicator status={saveStatus} />
            <AutoSaveIndicator lastSaved={lastSaved} isSaving={saveStatus === 'saving'} />
          </div>

          <SubmitButton
            isLoading={saveStatus === 'saving'}
            isSuccess={saveStatus === 'saved'}
            onClick={(e) => {
              e.preventDefault();
              saveForm();
            }}
          >
            Save Changes
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}

// Main Examples Component
export function UIPolishExamples() {
  return (
    <div className="container mx-auto p-6 space-y-12">
      <h1 className="text-3xl font-bold mb-8">UI Polish & Feedback Components</h1>
      
      <StaggerChildren delay={100} className="space-y-12">
        <LoadingStatesExample />
        <SuccessAnimationsExample />
        <ProgressIndicatorsExample />
        <OnboardingTourExample />
        <FormFeedbackExample />
      </StaggerChildren>
    </div>
  );
}