import React from 'react';
import {
  FilePen,
  Play,
  Eye,
  CheckCircle,
  ShieldCheck,
  Lock,
  Hourglass,
  BadgeCheck,
  CircleDot,
  TriangleAlert,
  CircleX,
} from 'lucide-react';
import { Chip, ChipProps } from '../ui/Chip';

export type StatusCategory = 'project' | 'payment' | 'task' | 'health';

interface StatusChipProps {
  category: StatusCategory;
  status: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusChip: React.FC<StatusChipProps> = ({
  category,
  status,
  size = 'md',
  className = '',
}) => {
  let icon: React.ReactNode = null;
  let label = status;
  let tone: ChipProps['tone'] = 'neutral';

  if (category === 'project') {
    switch (status) {
      case 'open':
        icon = <CircleDot className="w-3.5 h-3.5" />;
        label = 'Open';
        tone = 'primary';
        break;
      case 'draft':
        icon = <FilePen className="w-3.5 h-3.5" />;
        label = 'Draft';
        tone = 'neutral';
        break;
      case 'in_progress':
        icon = <Play className="w-3.5 h-3.5" />;
        label = 'In progress';
        tone = 'primary';
        break;
      case 'in_review':
        icon = <Eye className="w-3.5 h-3.5" />;
        label = 'In review';
        tone = 'warning';
        break;
      case 'completed':
        icon = <CheckCircle className="w-3.5 h-3.5" />;
        label = 'Completed';
        tone = 'success';
        break;
    }
  } else if (category === 'payment') {
    // Amber (--money) ONLY for payment/escrow moments; never white text on amber
    switch (status) {
      case 'authorized':
        icon = <ShieldCheck className="w-3.5 h-3.5" />;
        label = 'Authorized';
        tone = 'neutral';
        break;
      case 'held':
        icon = <Lock className="w-3.5 h-3.5" />;
        label = 'Held in escrow';
        tone = 'money';
        break;
      case 'release_pending':
        icon = <Hourglass className="w-3.5 h-3.5" />;
        label = 'Release pending';
        tone = 'money';
        break;
      case 'released':
        icon = <BadgeCheck className="w-3.5 h-3.5" />;
        label = 'Released';
        tone = 'success';
        break;
    }
  } else if (category === 'task') {
    switch (status) {
      case 'open':
        icon = <CircleDot className="w-3.5 h-3.5" />;
        label = 'Open';
        tone = 'neutral';
        break;
      case 'in_progress':
        icon = <Play className="w-3.5 h-3.5" />;
        label = 'In progress';
        tone = 'primary';
        break;
      case 'in_review':
        icon = <Eye className="w-3.5 h-3.5" />;
        label = 'In review';
        tone = 'warning';
        break;
      case 'verified':
        icon = <BadgeCheck className="w-3.5 h-3.5" />;
        label = 'Verified';
        tone = 'success';
        break;
    }
  } else if (category === 'health') {
    switch (status) {
      case 'up':
        icon = <CheckCircle className="w-3.5 h-3.5" />;
        label = 'Up';
        tone = 'success';
        break;
      case 'degraded':
        icon = <TriangleAlert className="w-3.5 h-3.5" />;
        label = 'Degraded';
        tone = 'warning';
        break;
      case 'down':
        icon = <CircleX className="w-3.5 h-3.5" />;
        label = 'Down';
        tone = 'danger';
        break;
    }
  }

  return (
    <Chip
      icon={icon}
      label={label}
      tone={tone}
      size={size}
      className={className}
    />
  );
};

