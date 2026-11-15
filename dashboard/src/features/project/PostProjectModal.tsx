import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, FolderGit2, DollarSign, GitBranch, Layers, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { projectApi } from '../../services/project/api';
import { CreateProjectPayload, ProjectStatus } from '../../services/project/types';
import { useToast } from '../../components/ui/Toast';

interface PostProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: () => void;
}

export const PostProjectModal: React.FC<PostProjectModalProps> = ({
  isOpen,
  onClose,
  onProjectCreated,
}) => {
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [repo, setRepo] = useState('');
  const [budget, setBudget] = useState('1000');
  const [status, setStatus] = useState<ProjectStatus>('draft');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('TypeScript, React');

  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Esc key closes modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Project title is required');
      return;
    }
    if (!repo.trim()) {
      setError('Repository name is required');
      return;
    }
    const numBudget = Number(budget);
    if (isNaN(numBudget) || numBudget <= 0) {
      setError('Please provide a valid budget amount');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const payload: CreateProjectPayload = {
        title: title.trim(),
        repo: repo.trim(),
        budget: numBudget,
        status,
        description: description.trim() || undefined,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      };

      await projectApi.createProject(payload);

      addToast({
        title: 'Project Posted',
        description: `"${payload.title}" is now active in your dashboard.`,
        type: 'success',
      });

      // Reset form
      setTitle('');
      setRepo('');
      setBudget('1000');
      setDescription('');
      setTags('TypeScript, React');

      onProjectCreated();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to post project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="post-project-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl bg-surface border border-border rounded-lg shadow-2xl z-10 flex flex-col max-h-[90vh] overflow-hidden text-text animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-raised/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-primary/15 text-primary flex items-center justify-center">
              <FolderGit2 className="w-4 h-4" />
            </div>
            <div>
              <h2 id="post-project-title" className="text-base font-bold text-text">
                Post New Project
              </h2>
              <p className="text-xs text-text-muted">
                Commission vetted freelance developers for verified deliveries
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-md text-text-muted hover:text-text hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-primary cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-danger/10 border border-danger/30 text-danger text-xs font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1.5">
              Project Title *
            </label>
            <input
              ref={titleInputRef}
              type="text"
              required
              placeholder="e.g. Implement OAuth 2.0 Auth Service"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-surface-raised border border-border text-sm text-text placeholder:text-text-muted/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5">
                <span className="flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5" />
                  GitHub Repository *
                </span>
              </label>
              <input
                type="text"
                required
                placeholder="org/repo-name"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                className="w-full font-mono px-3 py-2 rounded-md bg-surface-raised border border-border text-sm text-text placeholder:text-text-muted/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5">
                <span className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-money" />
                  Escrow Budget (USD) *
                </span>
              </label>
              <input
                type="number"
                min="50"
                step="50"
                required
                placeholder="1000"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-surface-raised border border-border text-sm text-text placeholder:text-text-muted/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  Required Skills / Tags
                </span>
              </label>
              <input
                type="text"
                placeholder="TypeScript, Python, Docker"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-surface-raised border border-border text-sm text-text placeholder:text-text-muted/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5">
                Initial Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full px-3 py-2 rounded-md bg-surface-raised border border-border text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="draft">Draft (Private)</option>
                <option value="in_progress">Ready for Assignment</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1.5">
              Deliverables & Scope
            </label>
            <textarea
              rows={3}
              placeholder="Outline specific PR deliverables, milestones, and testing expectations..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-surface-raised border border-border text-sm text-text placeholder:text-text-muted/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          {/* Escrow Guarantee Note */}
          <div className="p-3 rounded-md bg-surface-raised/40 border border-border text-xs text-text-muted flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
            <span>
              Funds are safely held in CodeBridge Escrow until work is delivered, reviewed, and verified.
            </span>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSubmitting}
              className="font-semibold"
            >
              {isSubmitting ? (
                'Posting...'
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-1.5" />
                  Post Project
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

