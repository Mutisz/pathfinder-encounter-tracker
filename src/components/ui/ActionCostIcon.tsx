import type { ActionCost } from '@/types/statblock';

const glyph = (cost: ActionCost): string => {
  switch (cost) {
    case 'passive':
      return '';
    case 'free':
      return '◇';
    case 'reaction':
      return '⤾';
    case 1:
      return '◆';
    case 2:
      return '◆◆';
    case 3:
      return '◆◆◆';
    case '1-2':
      return '◆ to ◆◆';
    case '1-3':
      return '◆ to ◆◆◆';
    case '2-3':
      return '◆◆ to ◆◆◆';
  }
};

export const actionCostLabel = (cost: ActionCost): string => {
  switch (cost) {
    case 'passive':
      return 'Passive';
    case 'free':
      return 'Free action';
    case 'reaction':
      return 'Reaction';
    case 1:
      return 'One action';
    case 2:
      return 'Two actions';
    case 3:
      return 'Three actions';
    default:
      return `${cost} actions`;
  }
};

export function ActionCostIcon({ cost }: { cost: ActionCost }) {
  const g = glyph(cost);
  if (!g) return null;
  return (
    <span className="mx-1 text-accent" title={actionCostLabel(cost)} aria-label={actionCostLabel(cost)}>
      {g}
    </span>
  );
}
