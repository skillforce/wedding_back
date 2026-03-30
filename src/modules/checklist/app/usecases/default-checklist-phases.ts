import { ChecklistPhase } from '../../domain/entities/checklist-phase.entity';

export type ChecklistLocale = 'ru' | 'en';

type DefaultChecklistPhase = Pick<ChecklistPhase, 'name' | 'timeline' | 'icon' | 'sortOrder'>;

const defaultChecklistPhasesEn: DefaultChecklistPhase[] = [
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

const defaultChecklistPhasesRu: DefaultChecklistPhase[] = [
  {
    name: null,
    timeline: '12–10 месяцев до свадьбы',
    icon: null,
    sortOrder: 0,
  },
  {
    name: null,
    timeline: '9–7 месяцев до свадьбы',
    icon: null,
    sortOrder: 1,
  },
  {
    name: null,
    timeline: '6–4 месяцев до свадьбы',
    icon: null,
    sortOrder: 2,
  },
  {
    name: null,
    timeline: '3–1 месяцев до свадьбы',
    icon: null,
    sortOrder: 3,
  },
  {
    name: null,
    timeline: 'Последние 7 дней',
    icon: null,
    sortOrder: 4,
  },
];

const defaultChecklistPhasesByLocale: Record<ChecklistLocale, DefaultChecklistPhase[]> = {
  en: defaultChecklistPhasesEn,
  ru: defaultChecklistPhasesRu,
};

export const buildDefaultChecklistPhases = (
  checklistId: string,
  locale: ChecklistLocale = 'ru',
): Omit<ChecklistPhase, 'id' | 'checklist' | 'items' | 'createdAt' | 'updatedAt'>[] => {
  return defaultChecklistPhasesByLocale[locale].map((phase) => ({
    checklistId,
    name: phase.name,
    timeline: phase.timeline,
    icon: phase.icon,
    sortOrder: phase.sortOrder,
  }));
};