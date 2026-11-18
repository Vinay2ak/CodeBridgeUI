import { describe, it, expect } from 'vitest';
import { arrangePanels } from './layout';
import type { PanelSpec } from './panels.config';

describe('layout module - arrangePanels', () => {
  it('1. returns empty array when given empty specs', () => {
    expect(arrangePanels([], { showStat: false })).toEqual([]);
  });

  it('2. filters out hidden panels', () => {
    const specs: PanelSpec[] = [
      { id: 1, title: 'Panel 1', kind: 'chart', span: 6, height: 280, hidden: true },
      { id: 2, title: 'Panel 2', kind: 'chart', span: 6, height: 280 },
    ];
    const rows = arrangePanels(specs, { showStat: true });
    expect(rows.length).toBe(1);
    expect(rows[0].length).toBe(1);
    expect(rows[0][0].id).toBe(2);
  });

  it('3. filters out stat panels when showStat is false', () => {
    const specs: PanelSpec[] = [
      { id: 1, title: 'KPI 1', kind: 'stat', span: 4, height: 120 },
      { id: 2, title: 'Chart 1', kind: 'chart', span: 8, height: 280 },
      { id: 3, title: 'Chart 2', kind: 'chart', span: 4, height: 280 },
    ];
    const rows = arrangePanels(specs, { showStat: false });
    expect(rows.length).toBe(1);
    expect(rows[0].map((p) => p.id)).toEqual([2, 3]);
  });

  it('4. groups panels into 12-column rows', () => {
    const specs: PanelSpec[] = [
      { id: 1, title: 'Timeline', kind: 'chart', span: 8, height: 280 },
      { id: 2, title: 'Status', kind: 'chart', span: 4, height: 280 },
      { id: 3, title: 'Budget', kind: 'chart', span: 4, height: 280 },
      { id: 4, title: 'Users', kind: 'chart', span: 4, height: 280 },
      { id: 5, title: 'Skills', kind: 'chart', span: 4, height: 280 },
      { id: 6, title: 'Ledger', kind: 'table', span: 12, height: 360 },
    ];
    const rows = arrangePanels(specs, { showStat: false });
    expect(rows.length).toBe(3);
    // Row 1: 8 + 4 = 12
    expect(rows[0].map((p) => p.id)).toEqual([1, 2]);
    // Row 2: 4 + 4 + 4 = 12
    expect(rows[1].map((p) => p.id)).toEqual([3, 4, 5]);
    // Row 3: 12 = 12
    expect(rows[2].map((p) => p.id)).toEqual([6]);
  });
});
