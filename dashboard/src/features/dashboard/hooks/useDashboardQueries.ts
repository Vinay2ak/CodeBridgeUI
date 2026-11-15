import { useQuery } from '@tanstack/react-query';
import { projectApi } from '../../../services/project/api';
import { paymentApi } from '../../../services/payment/api';
import { workspaceApi } from '../../../services/workspace/api';
import { notificationApi } from '../../../services/notification/api';
import { eventStore } from '../../../realtime/store';
import { useSession } from '../../session/session';
import { useEffect } from 'react';

export const queryKeys = {
  projects: ['projects'] as const,
  paymentsSummary: ['payments', 'summary'] as const,
  tasksMine: ['tasks', 'mine'] as const,
  notifications: ['notifications'] as const,
};

export function useProjectsQuery() {
  const { status } = useSession();
  return useQuery({
    queryKey: queryKeys.projects,
    queryFn: () => projectApi.getProjects(),
    enabled: status === 'authenticated',
    staleTime: 60_000,
    retry: 1,
  });
}

export function usePaymentsSummaryQuery() {
  const { status } = useSession();
  return useQuery({
    queryKey: queryKeys.paymentsSummary,
    queryFn: async () => {
      try {
        return await paymentApi.getSummary();
      } catch {
        return {
          currency: 'USD',
          authorized: 0,
          held: 0,
          pendingRelease: 0,
          released: 0,
          releasedThisMonth: 0,
          items: [],
        };
      }
    },
    enabled: status === 'authenticated',
    staleTime: 60_000,
    retry: 0,
  });
}

export function useTasksMineQuery() {
  const { status } = useSession();
  return useQuery({
    queryKey: queryKeys.tasksMine,
    queryFn: async () => {
      try {
        return await workspaceApi.getTasksMine();
      } catch {
        return { items: [] };
      }
    },
    enabled: status === 'authenticated',
    staleTime: 60_000,
    retry: 0,
  });
}

export function useNotificationsQuery() {
  const { status } = useSession();
  const query = useQuery({
    queryKey: queryKeys.notifications,
    queryFn: async () => {
      try {
        return await notificationApi.getNotifications();
      } catch {
        return { items: [] };
      }
    },
    enabled: status === 'authenticated',
    staleTime: 60_000,
    retry: 0,
  });

  useEffect(() => {
    if (query.data?.items) {
      eventStore.initNotifications(query.data.items);
    }
  }, [query.data]);

  return query;
}
