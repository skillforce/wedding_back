import { ChecklistPhase } from '../../domain/entities/checklist-phase.entity';

type DefaultChecklistPhase = Pick<ChecklistPhase, 'name' | 'timeline' | 'icon' | 'sortOrder'>;

const defaultChecklistPhases: DefaultChecklistPhase[] = [
  {
    name: null,
    timeline: '12–10 months before',
    icon: null,
    sortOrder: 0,
  },
  {
    name: null,
    timeline: '9–7 months before',
    icon: null,
    sortOrder: 1,
  },
  {
    name: null,
    timeline: '6–4 months before',
    icon: null,
    sortOrder: 2,
  },
  {
    name: null,
    timeline: '3–1 months before',
    icon: null,
    sortOrder: 3,
  },
  {
    name: null,
    timeline: 'Last 7 days',
    icon: null,
    sortOrder: 4,
  },
];

export const buildDefaultChecklistPhases = (
  checklistId: string,
): Omit<ChecklistPhase, 'id' | 'checklist' | 'items' | 'createdAt' | 'updatedAt'>[] => {
  return defaultChecklistPhases.map((phase) => ({
    checklistId,
    name: phase.name,
    timeline: phase.timeline,
    icon: phase.icon,
    sortOrder: phase.sortOrder,
  }));
};
