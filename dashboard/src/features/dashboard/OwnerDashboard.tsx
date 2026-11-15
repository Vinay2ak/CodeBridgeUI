import React, { useState } from 'react';
import {
  FolderGit2,
  Lock,
  Eye,
  BadgeCheck,
  Plus,
  Users,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import {
  useProjectsQuery,
  usePaymentsSummaryQuery,
  useNotificationsQuery,
} from './hooks';
import { KpiCard } from '../../components/dashboard/KpiCard';
import { Panel } from '../../components/dashboard/Panel';
import { DataTable, Column } from '../../components/dashboard/DataTable';
import { PipelineBar } from '../../components/dashboard/PipelineBar';
import { StatusChip } from '../../components/dashboard/StatusChip';
import { ActivityFeed } from '../../components/dashboard/ActivityFeed';
import { Button } from '../../components/ui/Button';
import { formatMoney, formatRelativeTime } from '../../lib/format';
import { Project, Payment } from '../../mocks/data';
import { PostProjectModal } from '../project/PostProjectModal';
import { SettingsPanel } from './components/SettingsPanel';
import { TalentDirectory } from '../talent/TalentDirectory';
import { DeveloperProfile } from '../talent/types';

export const OwnerDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'talent' | 'projects'>('talent');
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [selectedDeveloper, setSelectedDeveloper] = useState<DeveloperProfile | null>(null);

  const projectsQuery = useProjectsQuery();
  const paymentsQuery = usePaymentsSummaryQuery();
  useNotificationsQuery();

  const projects = projectsQuery.data?.items || [];
  const paymentsSummary = paymentsQuery.data;

  // KPI Calculations
  const activeProjectsCount = projects.filter(
    (p: Project) => p.status === 'in_progress' || p.status === 'in_review'
  ).length;

  const awaitingReviewCount = projects.filter(
    (p: Project) => p.status === 'in_review'
  ).length;

  const escrowHeldAmount = paymentsSummary?.held ?? 0;
  const releasedThisMonth = paymentsSummary?.releasedThisMonth ?? 0;

  // Project Table Columns
  const projectColumns: Column<Project>[] = [
    {
      header: 'Title',
      accessor: (p) => (
        <span className="font-medium text-text">{p.title}</span>
      ),
      isRowHeader: true,
    },
    {
      header: 'Repository',
      accessor: (p) => (
        <span className="font-mono text-xs text-primary">{p.repo}</span>
      ),
    },
    {
      header: 'Freelancer',
      accessor: (p) => (
        <span className={p.freelancerName ? 'text-text font-semibold flex items-center gap-1.5' : 'italic text-text-muted'}>
          {p.freelancerName ? (
            <>
              <span className="w-2 h-2 rounded-full bg-success" />
              {p.freelancerName}
            </>
          ) : (
            'Open Bounty'
          )}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (p) => <StatusChip category="project" status={p.status} size="sm" />,
    },
    {
      header: 'Budget',
      accessor: (p) => formatMoney(p.budget),
    },
    {
      header: 'Updated',
      accessor: (p) => (
        <span className="text-xs text-text-muted">
          {formatRelativeTime(p.updatedAt)}
        </span>
      ),
    },
  ];

  const handleSelectDeveloperForProject = (dev: DeveloperProfile) => {
    setSelectedDeveloper(dev);
    setIsPostModalOpen(true);
  };

  const handlePostOpenProject = () => {
    setSelectedDeveloper(null);
    setIsPostModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Top Navigation Tabs: Talent Directory vs Active Projects / Escrow */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-2 p-1 rounded-xl bg-surface border border-border self-start">
          <button
            type="button"
            onClick={() => setActiveTab('talent')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'talent'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-text-muted hover:text-text hover:bg-surface-raised'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Talent Directory & Commissioning</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('projects')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'projects'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-text-muted hover:text-text hover:bg-surface-raised'
            }`}
          >
            <FolderGit2 className="w-4 h-4" />
            <span>Active Projects & Escrow Pipeline</span>
            {projects.length > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === 'projects'
                    ? 'bg-on-primary/20 text-on-primary'
                    : 'bg-surface-raised text-text'
                }`}
              >
                {projects.length}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={handlePostOpenProject}
            className="font-semibold shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Post a Project
          </Button>
        </div>
      </div>

      {/* Tab 1: Vetted Developers & Freelancers Directory */}
      {activeTab === 'talent' && (
        <TalentDirectory
          onSelectDeveloperForProject={handleSelectDeveloperForProject}
          onPostOpenProject={handlePostOpenProject}
        />
      )}

      {/* Tab 2: Active Projects & Escrow Overview */}
      {activeTab === 'projects' && (
        <div className="flex flex-col gap-8">
          {/* Quick Notice CTA to Commission Vetted Talent */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-surface-raised/50 border border-primary/20 text-xs text-text-muted">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>
                Want to commission verified developers directly with automated test harnesses?
              </span>
            </div>
            <button
              onClick={() => setActiveTab('talent')}
              className="text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              Browse Talent Directory
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Overview Section with 4 KPI Cards */}
          <section id="overview" aria-labelledby="overview-title" className="flex flex-col gap-4">
            <h3 id="overview-title" className="text-base font-bold text-text sr-only">
              Owner Metrics
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                label="Active projects"
                value={activeProjectsCount}
                hint="In progress or in review"
                icon={<FolderGit2 className="w-5 h-5" />}
                isLoading={projectsQuery.isLoading}
                error={projectsQuery.error as Error}
                onRetry={() => projectsQuery.refetch()}
              />
              <KpiCard
                label="Escrow held"
                value={formatMoney(escrowHeldAmount)}
                hint="Funds secured in escrow"
                icon={<Lock className="w-5 h-5" />}
                tone="money"
                isLoading={paymentsQuery.isLoading}
                error={paymentsQuery.error as Error}
                onRetry={() => paymentsQuery.refetch()}
              />
              <KpiCard
                label="Awaiting review"
                value={awaitingReviewCount}
                hint="Requires code inspection"
                icon={<Eye className="w-5 h-5" />}
                isLoading={projectsQuery.isLoading}
                error={projectsQuery.error as Error}
                onRetry={() => projectsQuery.refetch()}
              />
              <KpiCard
                label="Released this month"
                value={formatMoney(releasedThisMonth)}
                hint="Disbursed to talent"
                icon={<BadgeCheck className="w-5 h-5" />}
                tone="money"
                isLoading={paymentsQuery.isLoading}
                error={paymentsQuery.error as Error}
                onRetry={() => paymentsQuery.refetch()}
              />
            </div>
          </section>

          {/* Projects Panel */}
          <Panel
            id="projects"
            title="Projects"
            serviceName="project service"
            updatedAt={projectsQuery.dataUpdatedAt ? new Date(projectsQuery.dataUpdatedAt) : null}
            onRefresh={() => projectsQuery.refetch()}
            isRefreshing={projectsQuery.isFetching}
            isLoading={projectsQuery.isLoading}
            error={projectsQuery.error as Error}
            isEmpty={projects.length === 0}
            emptyMessage="No projects currently registered"
            actions={
              <Button
                variant="primary"
                size="sm"
                onClick={handlePostOpenProject}
                className="text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Post Project
              </Button>
            }
          >
            <DataTable
              caption="List of CodeBridge projects"
              columns={projectColumns}
              data={projects}
              keyExtractor={(p) => p.id}
            />
          </Panel>

          {/* Payments Panel */}
          <Panel
            id="payments"
            title="Payments"
            serviceName="payment service"
            updatedAt={paymentsQuery.dataUpdatedAt ? new Date(paymentsQuery.dataUpdatedAt) : null}
            onRefresh={() => paymentsQuery.refetch()}
            isRefreshing={paymentsQuery.isFetching}
            isLoading={paymentsQuery.isLoading}
            error={paymentsQuery.error as Error}
            isEmpty={!paymentsSummary || paymentsSummary.items.length === 0}
            emptyMessage="No payment transactions recorded"
          >
            <div className="flex flex-col gap-6">
              <PipelineBar
                authorized={paymentsSummary?.authorized ?? 0}
                held={paymentsSummary?.held ?? 0}
                pendingRelease={paymentsSummary?.pendingRelease ?? 0}
                released={paymentsSummary?.released ?? 0}
              />

              <div className="mt-2">
                <h3 className="text-sm font-semibold text-text mb-3">Recent Transactions</h3>
                <div className="divide-y divide-border rounded-md border border-border">
                  {paymentsSummary?.items.map((pay: Payment) => (
                    <div
                      key={pay.id}
                      className="flex items-center justify-between p-3.5 hover:bg-surface-raised/40 transition-colors"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-text">
                          {pay.projectTitle}
                        </span>
                        <div className="flex items-center gap-2">
                          <StatusChip category="payment" status={pay.state} size="sm" />
                        </div>
                      </div>
                      <span className="text-sm font-bold text-money">
                        {formatMoney(pay.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Panel>

          {/* Activity Panel */}
          <Panel
            id="activity"
            title="Activity"
            serviceName="notification service"
            onRefresh={() => {}}
          >
            <ActivityFeed />
          </Panel>

          {/* Settings Panel */}
          <SettingsPanel />
        </div>
      )}

      {/* Post Project Modal */}
      <PostProjectModal
        isOpen={isPostModalOpen}
        onClose={() => {
          setIsPostModalOpen(false);
          setSelectedDeveloper(null);
        }}
        onProjectCreated={() => {
          projectsQuery.refetch();
          setActiveTab('projects');
        }}
        selectedDeveloper={selectedDeveloper}
        onClearDeveloper={() => setSelectedDeveloper(null)}
      />
    </div>
  );
};

export default OwnerDashboard;
