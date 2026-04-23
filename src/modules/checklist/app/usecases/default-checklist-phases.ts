import { ChecklistPhase } from '../../domain/entities/checklist-phase.entity';
import {
  ChecklistItem,
  ChecklistItemPriority,
} from '../../domain/entities/checklist-item.entity';

export type ChecklistLocale = 'ru' | 'en';

type DefaultChecklistItem = Pick<ChecklistItem, 'title' | 'note' | 'priority'>;

type DefaultChecklistPhase = Pick<
  ChecklistPhase,
  'name' | 'timeline' | 'icon' | 'sortOrder'
> & {
  items: DefaultChecklistItem[];
};

const defaultChecklistPhasesEn: DefaultChecklistPhase[] = [
  {
    name: null,
    timeline: '12–10 months before',
    icon: null,
    sortOrder: 0,
    items: [
      {
        title: 'Set wedding budget',
        note: null,
        priority: ChecklistItemPriority.High,
      },
      {
        title: 'Draft guest list',
        note: null,
        priority: ChecklistItemPriority.High,
      },
      {
        title: 'Choose wedding date',
        note: null,
        priority: ChecklistItemPriority.High,
      },
      { title: 'Book venue', note: null, priority: ChecklistItemPriority.High },
      {
        title: 'Hire planner if needed',
        note: null,
        priority: ChecklistItemPriority.Normal,
      },
    ],
  },
  {
    name: null,
    timeline: '9–7 months before',
    icon: null,
    sortOrder: 1,
    items: [
      {
        title: 'Find photographer',
        note: null,
        priority: ChecklistItemPriority.High,
      },
      {
        title: 'Book videographer',
        note: null,
        priority: ChecklistItemPriority.Normal,
      },
      {
        title: 'Choose caterer',
        note: null,
        priority: ChecklistItemPriority.High,
      },
      {
        title: 'Pick wedding style',
        note: null,
        priority: ChecklistItemPriority.Normal,
      },
      {
        title: 'Send save the dates',
        note: null,
        priority: ChecklistItemPriority.High,
      },
    ],
  },
  {
    name: null,
    timeline: '6–4 months before',
    icon: null,
    sortOrder: 2,
    items: [
      {
        title: 'Order wedding attire',
        note: null,
        priority: ChecklistItemPriority.High,
      },
      {
        title: 'Choose decor and florals',
        note: null,
        priority: ChecklistItemPriority.Normal,
      },
      {
        title: 'Book entertainment',
        note: null,
        priority: ChecklistItemPriority.Normal,
      },
      {
        title: 'Plan ceremony details',
        note: null,
        priority: ChecklistItemPriority.High,
      },
      {
        title: 'Arrange guest transport',
        note: null,
        priority: ChecklistItemPriority.Normal,
      },
    ],
  },
  {
    name: null,
    timeline: '3–1 months before',
    icon: null,
    sortOrder: 3,
    items: [
      {
        title: 'Send invitations',
        note: null,
        priority: ChecklistItemPriority.High,
      },
      {
        title: 'Confirm vendor timings',
        note: null,
        priority: ChecklistItemPriority.High,
      },
      {
        title: 'Create seating plan',
        note: null,
        priority: ChecklistItemPriority.Normal,
      },
      {
        title: 'Write vows or speeches',
        note: null,
        priority: ChecklistItemPriority.Normal,
      },
      {
        title: 'Prepare emergency kit',
        note: null,
        priority: ChecklistItemPriority.Normal,
      },
    ],
  },
  {
    name: null,
    timeline: 'Last 7 days',
    icon: null,
    sortOrder: 4,
    items: [
      {
        title: 'Confirm final guest count',
        note: null,
        priority: ChecklistItemPriority.High,
      },
      {
        title: 'Pack rings and documents',
        note: null,
        priority: ChecklistItemPriority.High,
      },
      {
        title: 'Finalize payment envelopes',
        note: null,
        priority: ChecklistItemPriority.Normal,
      },
      {
        title: 'Steam outfits',
        note: null,
        priority: ChecklistItemPriority.Normal,
      },
      {
        title: 'Get rest before the day',
        note: null,
        priority: ChecklistItemPriority.Normal,
      },
    ],
  },
];

const defaultChecklistPhasesRu: DefaultChecklistPhase[] = [
  {
    name: null,
    timeline: '12–10 месяцев до свадьбы',
    icon: null,
    sortOrder: 0,
    items: [
      {
        title: 'Определить бюджет',
        note: null,
        priority: ChecklistItemPriority.High,
      },
      {
        title: 'Составить список гостей',
        note: null,
        priority: ChecklistItemPriority.High,
      },
      {
        title: 'Выбрать дату свадьбы',
        note: null,
        priority: ChecklistItemPriority.High,
      },
      {
        title: 'Забронировать площадку',
        note: null,
        priority: ChecklistItemPriority.High,
      },
      {
        title: 'Найти организатора',
        note: null,
        priority: ChecklistItemPriority.Normal,
      },
    ],
  },
  {
    name: null,
    timeline: '9–7 месяцев до свадьбы',
    icon: null,
    sortOrder: 1,
    items: [
      {
        title: 'Найти фотографа',
        note: null,
        priority: ChecklistItemPriority.High,
      },
      {
        title: 'Забронировать видеографа',
        note: null,
        priority: ChecklistItemPriority.Normal,
      },
      {
        title: 'Выбрать кейтеринг',
        note: null,
        priority: ChecklistItemPriority.High,
      },
      {
        title: 'Определить стиль свадьбы',
        note: null,
        priority: ChecklistItemPriority.Normal,
      },
      {
        title: 'Разослать save the date',
        note: null,
        priority: ChecklistItemPriority.High,
      },
    ],
  },
  {
    name: null,
    timeline: '6–4 месяцев до свадьбы',
    icon: null,
    sortOrder: 2,
    items: [
      {
        title: 'Заказать свадебные образы',
        note: null,
        priority: ChecklistItemPriority.High,
      },
      {
        title: 'Выбрать декор и цветы',
        note: null,
        priority: ChecklistItemPriority.Normal,
      },
      {
        title: 'Забронировать ведущего',
        note: null,
        priority: ChecklistItemPriority.Normal,
      },
      {
        title: 'Продумать церемонию',
        note: null,
        priority: ChecklistItemPriority.High,
      },
      {
        title: 'Организовать трансфер',
        note: null,
        priority: ChecklistItemPriority.Normal,
      },
    ],
  },
  {
    name: null,
    timeline: '3–1 месяцев до свадьбы',
    icon: null,
    sortOrder: 3,
    items: [
      {
        title: 'Разослать приглашения',
        note: null,
        priority: ChecklistItemPriority.High,
      },
      {
        title: 'Подтвердить тайминг с подрядчиками',
        note: null,
        priority: ChecklistItemPriority.High,
      },
      {
        title: 'Составить план рассадки',
        note: null,
        priority: ChecklistItemPriority.Normal,
      },
      {
        title: 'Подготовить клятвы или речь',
        note: null,
        priority: ChecklistItemPriority.Normal,
      },
      {
        title: 'Собрать emergency kit',
        note: null,
        priority: ChecklistItemPriority.Normal,
      },
    ],
  },
  {
    name: null,
    timeline: 'Последние 7 дней',
    icon: null,
    sortOrder: 4,
    items: [
      {
        title: 'Подтвердить финальное число гостей',
        note: null,
        priority: ChecklistItemPriority.High,
      },
      {
        title: 'Подготовить кольца и документы',
        note: null,
        priority: ChecklistItemPriority.High,
      },
      {
        title: 'Подготовить конверты оплат',
        note: null,
        priority: ChecklistItemPriority.Normal,
      },
      {
        title: 'Отпарить наряды',
        note: null,
        priority: ChecklistItemPriority.Normal,
      },
      {
        title: 'Выспаться перед днем свадьбы',
        note: null,
        priority: ChecklistItemPriority.Normal,
      },
    ],
  },
];

const defaultChecklistPhasesByLocale: Record<
  ChecklistLocale,
  DefaultChecklistPhase[]
> = {
  en: defaultChecklistPhasesEn,
  ru: defaultChecklistPhasesRu,
};

export const buildDefaultChecklistPhases = (
  checklistId: string,
  locale: ChecklistLocale = 'ru',
): Omit<
  ChecklistPhase,
  'id' | 'checklist' | 'items' | 'createdAt' | 'updatedAt'
>[] => {
  return defaultChecklistPhasesByLocale[locale].map((phase) => ({
    checklistId,
    name: phase.name,
    timeline: phase.timeline,
    icon: phase.icon,
    sortOrder: phase.sortOrder,
  }));
};

export const buildDefaultChecklistItems = (
  phases: Pick<ChecklistPhase, 'id' | 'sortOrder'>[],
  locale: ChecklistLocale = 'ru',
): Omit<ChecklistItem, 'id' | 'phase' | 'createdAt' | 'updatedAt'>[] => {
  const phaseIdBySortOrder = new Map(
    phases.map((phase) => [phase.sortOrder, phase.id]),
  );

  return defaultChecklistPhasesByLocale[locale].flatMap((phase) => {
    const phaseId = phaseIdBySortOrder.get(phase.sortOrder);

    if (!phaseId) {
      return [];
    }

    return phase.items.map((item, index) => ({
      phaseId,
      title: item.title,
      note: item.note,
      comment: null,
      completed: false,
      priority: item.priority,
      sortOrder: index,
    }));
  });
};
