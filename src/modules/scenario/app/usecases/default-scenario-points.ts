import {
  ScenarioPoint,
  ScenarioPointIcon,
} from '../../domain/entities/scenario-point.entity';

export type ScenarioLocale = 'ru' | 'en';

type DefaultScenarioPoint = Pick<ScenarioPoint, 'time' | 'title' | 'icon' | 'duration'>;

const defaultScenarioPointsEn: DefaultScenarioPoint[] = [
  { time: '08:00', title: 'Wake Up, Shower', icon: ScenarioPointIcon.SunRise, duration: 30 },
  { time: '08:30', title: 'Photo Session', icon: ScenarioPointIcon.Session, duration: 40 },
  { time: '09:10', title: 'Hair and makeup', icon: ScenarioPointIcon.Breakfast, duration: 120 },
  { time: '11:10', title: 'Everyone gets dressed', icon: ScenarioPointIcon.Dress, duration: 30 },
  { time: '11:40', title: 'Lunch or Snack', icon: ScenarioPointIcon.Lunch, duration: 95 },
  { time: '13:15', title: 'Photographer Arrives', icon: ScenarioPointIcon.Photo, duration: 75 },
  { time: '14:30', title: 'Photos with family', icon: ScenarioPointIcon.Photo, duration: 15 },
  { time: '14:45', title: 'Photos with guests', icon: ScenarioPointIcon.Photo, duration: 15 },
  { time: '15:00', title: 'Limo Arrives', icon: ScenarioPointIcon.Limo, duration: 30 },
  { time: '15:30', title: 'Arrive to Ceremony', icon: ScenarioPointIcon.Ceremony, duration: 30 },
  { time: '16:00', title: 'I Do!', icon: ScenarioPointIcon.Ido, duration: 15 },
  { time: '16:15', title: 'Cocktails and Photos', icon: ScenarioPointIcon.Cocktail, duration: 20 },
  { time: '16:35', title: 'All travel to reception', icon: ScenarioPointIcon.Limo, duration: 40 },
  { time: '17:15', title: 'Grand Entrance', icon: ScenarioPointIcon.Entrance, duration: 20 },
  { time: '17:35', title: 'First Dance', icon: ScenarioPointIcon.First, duration: 25 },
  { time: '18:00', title: 'Dinner', icon: ScenarioPointIcon.Dinner, duration: 40 },
  { time: '18:40', title: 'Toasts & Prayers', icon: ScenarioPointIcon.Toast, duration: 40 },
  { time: '19:20', title: 'Party Time!', icon: ScenarioPointIcon.Party, duration: 80 },
  { time: '20:40', title: 'Breakfast', icon: ScenarioPointIcon.Breakfast, duration: 20 },
  { time: '21:00', title: 'Cut Cake', icon: ScenarioPointIcon.Cake, duration: 60 },
  { time: '22:00', title: 'Firework & Send Off', icon: ScenarioPointIcon.Firework, duration: 30 },
  { time: '22:30', title: 'Grand Exit', icon: ScenarioPointIcon.Exit, duration: 30 },
];

const defaultScenarioPointsRu: DefaultScenarioPoint[] = [
  { time: '08:00', title: 'Подъём, душ', icon: ScenarioPointIcon.SunRise, duration: 30 },
  { time: '08:30', title: 'Фотосессия', icon: ScenarioPointIcon.Session, duration: 40 },
  { time: '09:10', title: 'Причёска и макияж', icon: ScenarioPointIcon.Breakfast, duration: 120 },
  { time: '11:10', title: 'Все одеваются', icon: ScenarioPointIcon.Dress, duration: 30 },
  { time: '11:40', title: 'Обед или перекус', icon: ScenarioPointIcon.Lunch, duration: 95 },
  { time: '13:15', title: 'Прибытие фотографа', icon: ScenarioPointIcon.Photo, duration: 75 },
  { time: '14:30', title: 'Фото с семьёй', icon: ScenarioPointIcon.Photo, duration: 15 },
  { time: '14:45', title: 'Фото с гостями', icon: ScenarioPointIcon.Photo, duration: 15 },
  { time: '15:00', title: 'Прибытие лимузина', icon: ScenarioPointIcon.Limo, duration: 30 },
  { time: '15:30', title: 'Прибытие на церемонию', icon: ScenarioPointIcon.Ceremony, duration: 30 },
  { time: '16:00', title: 'Клятвы!', icon: ScenarioPointIcon.Ido, duration: 15 },
  { time: '16:15', title: 'Коктейли и фото', icon: ScenarioPointIcon.Cocktail, duration: 20 },
  { time: '16:35', title: 'Все едут на банкет', icon: ScenarioPointIcon.Limo, duration: 40 },
  { time: '17:15', title: 'Торжественный вход', icon: ScenarioPointIcon.Entrance, duration: 20 },
  { time: '17:35', title: 'Первый танец', icon: ScenarioPointIcon.First, duration: 25 },
  { time: '18:00', title: 'Ужин', icon: ScenarioPointIcon.Dinner, duration: 40 },
  { time: '18:40', title: 'Тосты и пожелания', icon: ScenarioPointIcon.Toast, duration: 40 },
  { time: '19:20', title: 'Время праздника!', icon: ScenarioPointIcon.Party, duration: 80 },
  { time: '20:40', title: 'Завтрак', icon: ScenarioPointIcon.Breakfast, duration: 20 },
  { time: '21:00', title: 'Разрезание торта', icon: ScenarioPointIcon.Cake, duration: 60 },
  { time: '22:00', title: 'Фейерверк и проводы', icon: ScenarioPointIcon.Firework, duration: 30 },
  { time: '22:30', title: 'Торжественный выход', icon: ScenarioPointIcon.Exit, duration: 30 },
];

const defaultScenarioPointsByLocale: Record<
  ScenarioLocale,
  DefaultScenarioPoint[]
> = {
  en: defaultScenarioPointsEn,
  ru: defaultScenarioPointsRu,
};

export const buildDefaultScenarioPoints = (
  scenarioId: string,
  locale: ScenarioLocale = 'ru',
): Omit<ScenarioPoint, 'id' | 'scenario' | 'createdAt' | 'updatedAt'>[] => {
  return defaultScenarioPointsByLocale[locale].map((point) => ({
    scenarioId,
    time: point.time,
    title: point.title,
    icon: point.icon,
    note: '',
    duration: point.duration,
  }));
};
