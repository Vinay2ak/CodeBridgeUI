import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2, AlertTriangle, Check } from 'lucide-react';
import { postProjectSchema, type PostProjectFormData } from './schema';
import {
  URGENCY,
  VERIFICATION_MODES,
} from './options';
import { loadDraft, saveDraft, clearDraft } from './draft';
import { prefillFromProfile } from './prefill';
import { getOwnerProfile } from '../../services/identity/api';
import { createProject } from '../../services/project/api';
import { OptionRadioGroup } from './components/OptionRadioGroup';
import { Button } from '../../components/ui/Button';
import { useQueryClient } from '@tanstack/react-query';

export const PostProjectPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<'saved' | 'saving' | null>(null);

  const defaultValues: PostProjectFormData = {
    title: '',
    description: '',
    blockerType: 'HARD_BUG',
    stacks: ['PYTHON_FASTAPI'],
    specialties: [],
    skills: [],
    budget: 5000,
    urgency: 'THIS_WEEK',
    repoUrl: '',
    verificationMode: 'AUTO_TESTS_AND_REVIEW',
  };

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PostProjectFormData>({
    resolver: zodResolver(postProjectSchema) as any,
    defaultValues,
    mode: 'onBlur',
  });

  const formValues = watch();

  // 1. Initial Load: Try draft first, then prefill from Owner Profile
  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      Object.entries(draft).forEach(([key, value]) => {
        setValue(key as any, value);
      });
      return;
    }

    // Prefill from Identity Service Owner Profile
    let active = true;
    getOwnerProfile()
      .then((profile) => {
        if (!active || !profile) return;
        const prefilled = prefillFromProfile(profile);
        Object.entries(prefilled).forEach(([key, value]) => {
          if (value !== undefined) {
            setValue(key as any, value);
          }
        });
      })
      .catch(() => {
        // Silent failure for prefill
      });

    return () => {
      active = false;
    };
  }, [setValue]);

  // 2. Autosave draft debounced by 1 second
  useEffect(() => {
    setDraftStatus('saving');
    const timer = setTimeout(() => {
      saveDraft(formValues);
      setDraftStatus('saved');
    }, 1000);

    return () => clearTimeout(timer);
  }, [formValues]);

  const onSubmit = async (values: PostProjectFormData) => {
    setSubmitError(null);
    try {
      const idempotencyKey = `proj-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const created = await createProject(
        {
          title: values.title,
          description: values.description,
          budget: values.budget,
          urgency: values.urgency,
          repoUrl: values.repoUrl || null,
          verificationMode: values.verificationMode,
          blockerType: values.blockerType || 'HARD_BUG',
          stacks: values.stacks && values.stacks.length > 0 ? values.stacks : ['PYTHON_FASTAPI'],
          specialties: values.specialties || [],
          skills: values.skills || [],
        },
        idempotencyKey
      );

      // Clear draft on successful creation
      clearDraft();

      // Invalidate projects cache immediately for real-time dashboard update
      queryClient.invalidateQueries({ queryKey: ['projects'] });

      // Automatically open the project page with matching developers
      navigate(`/owner/projects/${created.id}`);
    } catch (err: any) {
      if (err.fieldErrors) {
        Object.entries(err.fieldErrors).forEach(([field, msg]) => {
          if (typeof msg === 'string') {
            setError(field as any, { type: 'server', message: msg });
          }
        });
      } else {
        setSubmitError(err.detail || err.message || 'Failed to post project. Please retry.');
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Top Bar / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <button
            type="button"
            onClick={() => navigate('/owner')}
            className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text font-medium mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-text">Post a new project</h1>
          <p className="text-sm text-text-muted mt-0.5">
            Submit a broken module, bug, or feature to match with specialized developers.
          </p>
        </div>

        {/* Draft indicator */}
        <div className="flex items-center gap-2">
          {draftStatus === 'saved' && (
            <span className="inline-flex items-center gap-1.5 text-xs text-text-muted bg-surface-raised px-2.5 py-1 rounded-full border border-border">
              <Check className="w-3.5 h-3.5 text-success" />
              Draft saved
            </span>
          )}
          {draftStatus === 'saving' && (
            <span className="inline-flex items-center gap-1.5 text-xs text-text-muted bg-surface-raised px-2.5 py-1 rounded-full border border-border">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Saving draft...
            </span>
          )}
        </div>
      </div>

      {submitError && (
        <div
          role="alert"
          className="p-4 rounded-xl border border-danger/40 bg-danger/10 text-danger flex items-start justify-between gap-3"
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold">Error submitting project</h4>
              <p className="text-xs mt-0.5">{submitError}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSubmit(onSubmit)()}
            className="text-xs shrink-0"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Main Form */}
      <div className="max-w-4xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
          {/* Card 1: Problem & Scope */}
          <div className="p-6 rounded-xl border border-border bg-surface shadow-xs space-y-5">
            <div className="border-b border-border pb-3">
              <h2 className="text-base font-bold text-text">1. Problem & Scope</h2>
              <p className="text-xs text-text-muted mt-0.5">
                Clearly describe the bug or feature so our matching engine can assess complexity.
              </p>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="project-title" className="text-sm font-semibold text-text">
                  Project title
                </label>
                <span className="text-xs text-text-muted">
                  {(formValues.title || '').length}/80
                </span>
              </div>
              <input
                id="project-title"
                type="text"
                maxLength={80}
                placeholder="e.g. Fix FastAPI webhook HMAC verification failure on production"
                {...register('title')}
                className={`w-full px-3.5 py-2 text-sm rounded-lg border bg-surface text-text placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.title ? 'border-danger' : 'border-border'
                }`}
              />
              {errors.title && (
                <p className="text-xs text-danger font-medium">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="project-description" className="text-sm font-semibold text-text">
                  Describe your issue
                </label>
                <span className="text-xs text-text-muted">
                  {(formValues.description || '').length}/1500
                </span>
              </div>
              <textarea
                id="project-description"
                rows={4}
                maxLength={1500}
                placeholder="Explain what is failing, expected behaviour, relevant logs or traces, and any steps to reproduce..."
                {...register('description')}
                className={`w-full px-3.5 py-2 text-sm rounded-lg border bg-surface text-text placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.description ? 'border-danger' : 'border-border'
                }`}
              />
              {errors.description && (
                <p className="text-xs text-danger font-medium">{errors.description.message}</p>
              )}
            </div>
          </div>

          {/* Card 2: Budget, Timeline & Verification */}
          <div className="p-6 rounded-xl border border-border bg-surface shadow-xs space-y-5">
            <div className="border-b border-border pb-3">
              <h2 className="text-base font-bold text-text">2. Budget, Timeline & Verification</h2>
              <p className="text-xs text-text-muted mt-0.5">
                Escrow budget is held securely and only released when tests pass and you approve.
              </p>
            </div>

            {/* Budget */}
            <div className="space-y-2">
              <label htmlFor="project-budget" className="text-sm font-semibold text-text">
                Project budget (INR)
              </label>
              <div className="relative max-w-xs">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-on-money">
                  ₹
                </span>
                <input
                  id="project-budget"
                  type="number"
                  min={500}
                  max={100000}
                  step={100}
                  {...register('budget', { valueAsNumber: true })}
                  className={`w-full pl-8 pr-3.5 py-2 text-sm font-bold rounded-lg border bg-money text-on-money placeholder:text-on-money/60 focus:outline-none focus:ring-2 focus:ring-primary ${
                    errors.budget ? 'border-danger' : 'border-border'
                  }`}
                />
              </div>
              <p className="text-xs text-text-muted">
                Standard range: ₹500 to ₹1,00,000. Funds held in milestone escrow.
              </p>
              {errors.budget && (
                <p className="text-xs text-danger font-medium">{errors.budget.message}</p>
              )}
            </div>

            {/* Urgency */}
            <Controller
              name="urgency"
              control={control}
              render={({ field }) => (
                <OptionRadioGroup
                  label="Target turnaround"
                  name="urgency"
                  options={URGENCY}
                  value={field.value}
                  onChange={field.onChange}
                  columns={3}
                  error={errors.urgency?.message}
                />
              )}
            />

            {/* Repo URL */}
            <div className="space-y-1.5">
              <label htmlFor="repo-url" className="text-sm font-semibold text-text">
                GitHub repository URL <span className="text-danger">*</span>
              </label>
              <input
                id="repo-url"
                type="url"
                placeholder="https://github.com/owner/repository"
                {...register('repoUrl')}
                className={`w-full px-3.5 py-2 text-sm rounded-lg border bg-surface text-text placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.repoUrl ? 'border-danger' : 'border-border'
                }`}
              />
              <p className="text-xs text-text-muted">
                Must be in the format: https://github.com/owner/repo
              </p>
              {errors.repoUrl && (
                <p className="text-xs text-danger font-medium">{errors.repoUrl.message}</p>
              )}
            </div>

            {/* Verification Mode */}
            <Controller
              name="verificationMode"
              control={control}
              render={({ field }) => (
                <OptionRadioGroup
                  label="Verification & acceptance mode"
                  name="verificationMode"
                  options={VERIFICATION_MODES}
                  value={field.value}
                  onChange={field.onChange}
                  columns={2}
                  error={errors.verificationMode?.message}
                />
              )}
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/owner')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="min-w-[190px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Posting project...
                </>
              ) : (
                'Submit & find developers'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostProjectPage;
