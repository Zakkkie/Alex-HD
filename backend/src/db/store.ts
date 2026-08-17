import {
  User,
  Device,
  ContentItem,
  Season,
  Episode,
  Collection,
  WatchHistoryItem,
  NodeHealthStatus,
  PlaybackSession,
} from '../../../src/types';
import { fallbackContent } from '../../../src/data/fallbackCatalog';

// Pre-seeded high quality content items (Movies & Series with posters & backdrops)
export const initialContent: ContentItem[] = [...fallbackContent];

export const initialSeasons: Season[] = [
  {
    id: 's-cp-1',
    content_id: 'c103-cyberpunk-edgerunners',
    season_number: 1,
    title: 'Сезон 1',
    overview: 'Становление Дэвида Мартинеса в Найт-Сити.',
    poster_url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 's-arc-1',
    content_id: 'c106-arcane',
    season_number: 1,
    title: 'Сезон 1',
    overview: 'Зарождение конфликта между Пилтовером и Зауном.',
    poster_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 's-got-1',
    content_id: 'c124-game-of-thrones',
    season_number: 1,
    title: 'Сезон 1',
    overview: 'Лорд Эддард Старк вызван своим королем Робертом Баратеоном в Королевскую Гавань, чтобы стать Десницей короля, в то время как древнее зло пробуждается за великой Стеной.',
    poster_url: 'https://images.unsplash.com/photo-1599837565318-67429bde7162?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 's-aot-1',
    content_id: 'c128-attack-on-titan',
    season_number: 1,
    title: 'Сезон 1',
    overview: 'Знакомство с миром стен и первыми атаками гигантских титанов.',
    poster_url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80'
  }
];

export const initialEpisodes: Episode[] = [
  {
    id: 'e-cp-101',
    season_id: 's-cp-1',
    episode_number: 1,
    title: 'Серия 1: Человек из стали',
    overview: 'Дэвид пытается справиться с трагедией и находит странный имплант.',
    runtime_minutes: 25,
    still_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
    air_date: '13.09.2022'
  },
  {
    id: 'e-cp-102',
    season_id: 's-cp-1',
    episode_number: 2,
    title: 'Серия 2: Люси',
    overview: 'Дэвид знакомится с Люси в метро Найт-Сити.',
    runtime_minutes: 24,
    still_url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
    air_date: '13.09.2022'
  },
  {
    id: 'e-arc-101',
    season_id: 's-arc-1',
    episode_number: 1,
    title: 'Серия 1: Нам нужен только ты',
    overview: 'Сироты из Зауна совершают дерзкую кражу в Верхнем городе.',
    runtime_minutes: 42,
    still_url: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=800&auto=format&fit=crop&q=80',
    air_date: '06.11.2021'
  },
  {
    id: 'e-got-101',
    season_id: 's-got-1',
    episode_number: 1,
    title: 'Серия 1: Зима близко',
    overview: 'Король Роберт Баратеон приезжает в Винтерфелл, чтобы предложить Эддарду Старку пост Десницы. За Стеной разведчики Ночного Дозора сталкиваются с Белыми Ходоками.',
    runtime_minutes: 62,
    still_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    air_date: '17.04.2011'
  },
  {
    id: 'e-got-102',
    season_id: 's-got-1',
    episode_number: 2,
    title: 'Серия 2: Королевский тракт',
    overview: 'Старки отправляются на юг, а Джон Сноу едет на север, чтобы присягнуть Ночному Дозору. Конфликт между Джоффри и Арьей приводит к трагическим последствиям.',
    runtime_minutes: 56,
    still_url: 'https://images.unsplash.com/photo-1599837565318-67429bde7162?w=800&auto=format&fit=crop&q=80',
    air_date: '24.04.2011'
  },
  {
    id: 'e-aot-101',
    season_id: 's-aot-1',
    episode_number: 1,
    title: 'Серия 1: К тебе через 2000 лет',
    overview: 'Внезапное появление Колоссального Титана разрушает стену Мария, разделяя привычную жизнь жителей Шиганши на "до" и "после".',
    runtime_minutes: 24,
    still_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
    air_date: '07.04.2013'
  }
];

export const initialCollections: Collection[] = [
  {
    id: 'col-4k-hdr',
    name: '4K Ultra HDR Шедевры',
    slug: '4k-hdr-masterpieces',
    description: 'Контент с максимальной детализацией и расширенным динамическим диапазоном.',
    poster_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
    is_active: true,
    sort_order: 1
  },
  {
    id: 'col-sci-fi',
    name: 'Научная Фантастика и Киберпанк',
    slug: 'sci-fi-cyberpunk',
    description: 'Лучшие миры будущего, ИИ, освоение космоса и кибернетика.',
    poster_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
    is_active: true,
    sort_order: 2
  }
];

export const initialNodes: NodeHealthStatus[] = [
  {
    nodeId: 'node-torr-primary',
    hostname: '178.236.240.100:8090',
    region: 'TorrServer MatriX (178.236.240.100:8090)',
    isOnline: true,
    cpuUsagePercent: 12,
    ramUsagePercent: 24,
    bandwidthMbps: 850,
    activeStreams: 1,
    maxCapacity: 150,
    loadFactor: 0.1
  }
];

// In-Memory Database Controller State
export class DatabaseStore {
  users: User[] = [
    {
      id: 'usr-admin-01',
      email: 'admin@smarttv.com',
      username: 'admin',
      role: 'admin',
      is_blocked: false,
      created_at: new Date().toISOString()
    },
    {
      id: 'usr-demo-01',
      email: 'demo@smarttv.com',
      username: 'tv_viewer',
      role: 'user',
      is_blocked: false,
      created_at: new Date().toISOString()
    }
  ];

  devices: Device[] = [];
  transactions: any[] = [];

  content: ContentItem[] = [...initialContent];
  seasons: Season[] = [...initialSeasons];
  episodes: Episode[] = [...initialEpisodes];
  collections: Collection[] = [...initialCollections];
  favorites: Map<string, Set<string>> = new Map();
  watchlist: Map<string, Set<string>> = new Map();
  history: WatchHistoryItem[] = [];
  nodes: NodeHealthStatus[] = [...initialNodes];
  sessions: PlaybackSession[] = [];
}

export const dbStore = new DatabaseStore();
