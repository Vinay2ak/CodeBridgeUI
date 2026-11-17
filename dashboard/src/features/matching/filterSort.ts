import { Match } from '../../services/talent/types';

export interface FilterOptions {
  fitsBudget?: boolean;
  availableNow?: boolean;
  githubVerified?: boolean;
  shortlistedOnly?: boolean;
}

export type FilterState = FilterOptions;

export type SortCriterion = 'best' | 'price' | 'availability';
export type SortOption = SortCriterion;

const AVAILABILITY_ORDER: Record<string, number> = {
  IMMEDIATE: 0,
  HOURS_10_20: 1,
  WEEKEND_SPRINTS: 2,
  BOOKED: 3,
};

export function applyFilters(items: Match[], filters: FilterOptions): Match[] {
  return items.filter((item) => {
    if (filters.fitsBudget) {
      const hasBudgetWarning = item.warnings.some((w) =>
        w.toLowerCase().includes('above your budget')
      );
      if (hasBudgetWarning) return false;
    }

    if (filters.availableNow) {
      if (item.freelancer.availability !== 'IMMEDIATE') return false;
    }

    if (filters.githubVerified) {
      if (!item.freelancer.githubVerified) return false;
    }

    if (filters.shortlistedOnly) {
      if (!item.shortlisted) return false;
    }

    return true;
  });
}

export function sortMatches(items: Match[], criterion: SortCriterion): Match[] {
  const result = [...items];

  if (criterion === 'price') {
    return result.sort((a, b) => a.freelancer.minBudget - b.freelancer.minBudget);
  }

  if (criterion === 'availability') {
    return result.sort((a, b) => {
      const orderA = AVAILABILITY_ORDER[a.freelancer.availability] ?? 99;
      const orderB = AVAILABILITY_ORDER[b.freelancer.availability] ?? 99;
      return orderA - orderB;
    });
  }

  // 'best' = preserve server order
  return result;
}
