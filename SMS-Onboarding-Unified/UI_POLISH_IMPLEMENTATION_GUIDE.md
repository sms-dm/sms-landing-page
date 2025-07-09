# UI Polish & User Feedback Implementation Guide

This guide explains how to use the new UI polish and feedback components throughout the SMS Onboarding application.

## 🎯 Overview

The UI polish system includes:
- Loading skeletons for all data fetching
- Success animations and enhanced toast messages
- Progress indicators for long operations
- Smooth transitions between screens
- Enhanced error boundaries with helpful messages
- Onboarding tooltips for new features

## 📦 Component Library

### 1. Loading Skeletons

Use skeletons to show loading states while fetching data:

```tsx
import { Skeleton, SkeletonCard, SkeletonTable, SkeletonList } from '@/components/ui';

// Basic skeleton
<Skeleton variant="text" width="60%" />

// Card skeleton
{isLoading ? <SkeletonCard /> : <ActualCard />}

// Table skeleton
{isLoading ? <SkeletonTable rows={5} /> : <ActualTable />}

// List skeleton
{isLoading ? <SkeletonList items={3} /> : <ActualList />}
```

### 2. Success Animations

Show success feedback after actions:

```tsx
import { SuccessAnimation, InlineSuccess } from '@/components/ui';

// Full-screen success animation
<SuccessAnimation 
  show={showSuccess} 
  message="Equipment saved successfully!"
  onComplete={() => setShowSuccess(false)}
/>

// Inline success indicator
<InlineSuccess message="Changes saved" />
```

### 3. Enhanced Toast System

Use the animated toast system for notifications:

```tsx
import { useAppDispatch } from '@/hooks/redux';
import { addToast } from '@/store/slices/uiSlice';

const dispatch = useAppDispatch();

// Success toast
dispatch(addToast({
  type: 'success',
  title: 'Success!',
  description: 'Your equipment has been added.',
}));

// Error toast
dispatch(addToast({
  type: 'error',
  title: 'Error',
  description: 'Failed to save equipment.',
}));
```

### 4. Progress Indicators

Show progress for long operations:

```tsx
import { ProgressIndicator, StepProgress, UploadProgress } from '@/components/ui';

// Linear progress
<ProgressIndicator 
  value={progress} 
  label="Processing..." 
  color="primary"
/>

// Circular progress
<ProgressIndicator 
  value={progress} 
  variant="circular" 
  size="lg"
/>

// Step progress for multi-step forms
<StepProgress 
  steps={['Details', 'Equipment', 'Review', 'Complete']}
  currentStep={currentStep}
/>

// File upload progress
<UploadProgress 
  fileName="manual.pdf"
  progress={uploadProgress}
  status="uploading"
/>
```

### 5. Page Transitions

Add smooth transitions between pages:

```tsx
import { PageTransition, AnimatedRoute, StaggerChildren } from '@/components/ui';

// Wrap page content
<AnimatedRoute>
  <YourPageContent />
</AnimatedRoute>

// Stagger children animations
<StaggerChildren delay={100}>
  <Card />
  <Card />
  <Card />
</StaggerChildren>
```

### 6. Enhanced Error Boundaries

Replace standard error boundaries with enhanced ones:

```tsx
import { EnhancedErrorBoundary } from '@/components/ui';

// Page-level error boundary
<EnhancedErrorBoundary level="page">
  <YourPageComponent />
</EnhancedErrorBoundary>

// Component-level error boundary
<EnhancedErrorBoundary level="component" isolate>
  <YourComponent />
</EnhancedErrorBoundary>
```

### 7. Onboarding Tooltips

Guide new users through features:

```tsx
import { useOnboardingTour } from '@/components/ui';

const tourConfig = {
  id: 'equipment-tour',
  steps: [
    {
      target: '#add-equipment-btn',
      title: 'Add Equipment',
      content: 'Click here to add new equipment to your vessel.',
    },
    // more steps...
  ],
  showProgress: true,
  persistKey: 'equipment-tour-v1',
};

const { startTour, TooltipComponent } = useOnboardingTour(tourConfig);

// In your component
<button onClick={startTour}>Start Tour</button>
{TooltipComponent}
```

### 8. Form Feedback

Enhance forms with loading states and feedback:

```tsx
import { 
  SubmitButton, 
  FormFeedback, 
  InlineSaveIndicator,
  FormFieldFeedback,
  AutoSaveIndicator 
} from '@/components/ui';

// Submit button with loading state
<SubmitButton
  isLoading={isSubmitting}
  isSuccess={isSuccess}
  loadingText="Saving..."
  successText="Saved!"
>
  Save Equipment
</SubmitButton>

// Field validation feedback
<FormFieldFeedback 
  error={errors.email}
  touched={touched.email}
  success={!errors.email && touched.email}
/>

// Auto-save indicator
<AutoSaveIndicator 
  lastSaved={lastSavedDate}
  isSaving={isSaving}
/>
```

## 🚀 Implementation Examples

### Example 1: Equipment List with Loading States

```tsx
import { useState, useEffect } from 'react';
import { SkeletonCard } from '@/components/ui';
import { useAsync } from '@/hooks/useAsyncState';

function EquipmentList() {
  const { data, isLoading, execute } = useAsync(
    fetchEquipment,
    {
      successMessage: 'Equipment loaded successfully',
      errorMessage: 'Failed to load equipment',
      showToast: true,
    }
  );

  useEffect(() => {
    execute();
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {data?.map(equipment => (
        <EquipmentCard key={equipment.id} data={equipment} />
      ))}
    </div>
  );
}
```

### Example 2: Multi-Step Form with Progress

```tsx
import { useState } from 'react';
import { StepProgress, SubmitButton } from '@/components/ui';
import { useAsync } from '@/hooks/useAsyncState';

function OnboardingForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const { execute, isLoading, isSuccess } = useAsync(submitForm);

  const steps = [
    'Vessel Details',
    'Equipment Setup',
    'Safety Checks',
    'Review & Submit'
  ];

  return (
    <div>
      <StepProgress 
        steps={steps}
        currentStep={currentStep}
      />
      
      {/* Form content based on currentStep */}
      
      <SubmitButton
        isLoading={isLoading}
        isSuccess={isSuccess}
        onClick={() => execute(formData)}
      >
        {currentStep === steps.length - 1 ? 'Complete' : 'Next'}
      </SubmitButton>
    </div>
  );
}
```

### Example 3: File Upload with Progress

```tsx
import { useState } from 'react';
import { UploadProgress } from '@/components/ui';

function DocumentUpload() {
  const [uploads, setUploads] = useState([]);

  const handleUpload = async (file) => {
    const uploadId = Date.now();
    
    setUploads(prev => [...prev, {
      id: uploadId,
      fileName: file.name,
      progress: 0,
      status: 'uploading'
    }]);

    // Simulate upload progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setUploads(prev => prev.map(u => 
        u.id === uploadId 
          ? { ...u, progress: i, status: i === 100 ? 'completed' : 'uploading' }
          : u
      ));
    }
  };

  return (
    <div className="space-y-2">
      {uploads.map(upload => (
        <UploadProgress
          key={upload.id}
          fileName={upload.fileName}
          progress={upload.progress}
          status={upload.status}
        />
      ))}
    </div>
  );
}
```

## 🎨 Best Practices

1. **Loading States**: Always show loading skeletons for data fetching operations
2. **Success Feedback**: Provide clear success indicators after user actions
3. **Error Handling**: Use enhanced error boundaries at both page and component levels
4. **Progress Indication**: Show progress for operations longer than 2 seconds
5. **Transitions**: Use smooth transitions to make the UI feel responsive
6. **Onboarding**: Implement tooltips for complex or new features
7. **Form Feedback**: Provide real-time validation and save status

## 🔧 Configuration

### Toast Duration
```tsx
dispatch(addToast({
  type: 'info',
  title: 'Info',
  description: 'This will disappear in 10 seconds',
  duration: 10000, // milliseconds
}));
```

### Error Boundary Levels
- `page`: Full-page error display
- `section`: Section-level error display
- `component`: Inline component error display

### Skeleton Animations
- `pulse`: Default pulsing animation
- `wave`: Shimmer wave animation
- `none`: No animation

## 📝 Migration Guide

To update existing components:

1. Replace loading spinners with appropriate skeletons
2. Add success animations to form submissions
3. Wrap async operations with `useAsync` hook
4. Add page transitions to route changes
5. Implement onboarding tours for complex features

## 🚨 Troubleshooting

**Issue**: Skeletons not matching content layout
**Solution**: Create custom skeleton layouts that match your actual content structure

**Issue**: Toast notifications not appearing
**Solution**: Ensure `<AnimatedToaster />` is included in your App.tsx

**Issue**: Page transitions causing flicker
**Solution**: Use the `LayoutTransition` wrapper for layout changes

## 📚 Additional Resources

- Component Storybook: `/storybook` (if available)
- Design System Guidelines: `/docs/design-system.md`
- Animation Guidelines: `/docs/animations.md`