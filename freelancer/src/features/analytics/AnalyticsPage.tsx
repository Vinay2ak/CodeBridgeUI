import React from 'react';
import { AnalyticsSection } from './AnalyticsSection';
import type { User } from '../../session/session';

export interface AnalyticsPageProps {
  showHeader?: boolean;
  hideToolbar?: boolean;
  realtime?: boolean;
  user?: User | null;
  ownerId?: string;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({
  user,
  ownerId,
}) => {
  return <AnalyticsSection user={user} ownerId={ownerId} />;
};

export default AnalyticsPage;
