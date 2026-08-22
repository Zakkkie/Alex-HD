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

// Seed initial curated catalog to ensure instant offline & local availability
export const initialContent: ContentItem[] = [...fallbackContent];
export const initialSeasons: Season[] = [];
export const initialEpisodes: Episode[] = [];
export const initialCollections: Collection[] = [];


export const initialNodes: NodeHealthStatus[] = [
  {
    nodeId: 'node-torr-primary',
    hostname: '178.236.240.100:8090',
    region: 'TorrServer MatriX (178.236.240.100:8090)',
    isOnline: false,
    cpuUsagePercent: 0,
    ramUsagePercent: 0,
    bandwidthMbps: 0,
    activeStreams: 0,
    maxCapacity: 150,
    loadFactor: 0
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
      id: 'usr-user-01',
      email: 'user@alexhd.app',
      username: 'alex_viewer',
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
