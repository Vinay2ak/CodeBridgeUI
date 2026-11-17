import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  FolderGit2,
  Lock,
  Eye,
  BadgeCheck,
  Plus,
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
import AnalyticsPage from '../admin-analytics/AnalyticsPage';

type DashboardTab = 'overview' | 'projects' | 'payments' | 'activity' | 'settings';

export const OwnerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  const getHashTab = (): DashboardTab => {
    const hash = (window.location.hash || location.hash).replace('#', '').toLowerCase();
    if (['projects', 'payments', 'activity', 'settings'].includes(hash)) {
      return hash as DashboardTab;
    }
    return 'overview';
  };

  const [activeTab, setActiveTab] = useState<DashboardTab>(getHashTab);

  useEffect(() => {
    const handleHash = () => {
      setActiveTab(getHashTab());
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  useEffect(() => {
    setActiveTab(getHashTab());
  }, [location.hash]);

  const projectsQuery = useProjectsQuery();
  const paymentsQuery = usePaymentsSummaryQuery();
  useNotificationsQuery();

  const projects = projectsQuery.data?.items || [];
  const paymentsSummary = paymentsQuery.data;

  // KPI Calculations
  const activeProjectsCount = projects.filter(
    (p: Project) => p.status === 'open' || p.status === 'in_progress' || p.status === 'in_review'
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
        <Link
          to={`/owner/projects/${p.id}`}
          className="font-medium text-text hover:text-primary transition-colors hover:underline"
        >
          {p.title}
        </Link>
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
        <span
          className={
            p.freelancerName
              ? 'text-text font-semibold flex items-center gap-1.5'
              : 'italic text-text-muted'
          }
        >
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

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Overview Section Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-text">
            {activeTab === 'overview' && 'Project Overview'}
            {activeTab === 'projects' && 'Projects'}
            {activeTab === 'payments' && 'Payments'}
            {activeTab === 'activity' && 'Activity'}
            {activeTab === 'settings' && 'Settings & Preferences'}
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            {activeTab === 'overview' &&
              'Monitor active work streams, escrow allocations, and milestone deliverables'}
            {activeTab === 'projects' &&
              'Track client repositories, deliverables, and assigned developers'}
            {activeTab === 'payments' &&
              'Monitor milestone escrow balances and transaction pipeline'}
            {activeTab === 'activity' &&
              'Real-time notifications and system event broadcasts'}
            {activeTab === 'settings' &&
              'Escrow release policies and webhook delivery configuration'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/owner/projects/new')}
            className="font-semibold shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Post a Project
          </Button>
        </div>
      </div>

      {/* Overview View: 4 small KPI boxes + Grafana Analytics directly underneath */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-6">
          {/* Overview Section with 4 KPI Cards */}
          <section id="overview" aria-labelledby="overview-title" className="flex flex-col gap-4">
            <h3 id="overview-title" className="text-base font-bold text-text sr-only">
              Owner Metrics
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                label="Active projects"
                value={activeProjectsCount}
                hint="Open, in progress or in review"
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

          {/* Platform Analytics Embed Section (Directly underneath 4 KPI boxes) */}
          <section aria-label="Platform Analytics" className="mt-2">
            <AnalyticsPage showHeader={false} />
          </section>
        </div>
      )}

      {/* Projects Panel */}
      {activeTab === 'projects' && (
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
              onClick={() => navigate('/owner/projects/new')}
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
      )}

      {/* Payments Panel */}
      {activeTab === 'payments' && (
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
      )}

      {/* Activity Panel */}
      {activeTab === 'activity' && (
        <Panel
          id="activity"
          title="Activity"
          serviceName="notification service"
          onRefresh={() => {}}
        >
          <ActivityFeed />
        </Panel>
      )}

      {/* Settings Panel */}
      {activeTab === 'settings' && (
        <SettingsPanel />
      )}

      {/* Post Project Modal */}
      <PostProjectModal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        onProjectCreated={() => {
          projectsQuery.refetch();
        }}
      />
    </div>
  );
};

export default OwnerDashboard;
