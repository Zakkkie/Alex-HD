export type ContentType = 'movie' | 'series' | 'cartoon' | 'show';
export type PlatformType = 'tizen' | 'webos' | 'android_tv';
export type SubscriptionPlanId = 'standard' | 'hd' | '4k';
export type UserRole = 'user' | 'admin' | 'moderator';

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  priceRub: number;
  period: string;
  maxResolution: '720p' | '1080p' | '4k';
  maxResolutionLabel: string;
  maxDevices: number;
  features: string[];
  isPopular?: boolean;
  color: string;
  badge?: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  role: UserRole;
  is_blocked: boolean;
  plan?: SubscriptionPlanId;
  subscription_expires_at?: string | null;
  created_at: string;
  last_login_at?: string;
  connected_devices_count?: number;
  devices?: Device[];
  ip_address?: string;
  avatar_color?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  displayName?: string;
  email?: string;
  role?: UserRole;
  is_blocked?: boolean;
  plan?: SubscriptionPlanId;
  subscription_expires_at?: string | null;
  connected_devices_count?: number;
  isSubscribed?: boolean;
}

export interface ServerNode {
  id: string;
  name: string;
  type: 'torrserver' | 'edge_cdn' | 'transcoder' | 'balancer' | 'database';
  ip: string;
  location: string;
  countryCode: string;
  status: 'online' | 'warning' | 'offline';
  cpuUsage: number | null;
  ramUsage: number | null;
  diskUsage: number | null;
  bandwidthGbps: number | null;
  activeStreams: number;
  pingMs: number | null;
  uptimeHours: number;
  errorCount24h: number;
  version: string;
  lastHealthCheck: string;
  lastError?: string;
}

export interface SystemLogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'critical';
  service: string;
  nodeId: string;
  message: string;
  details?: string;
}

export interface PaymentTransaction {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  planId: SubscriptionPlanId;
  planName: string;
  amountRub: number;
  method: 'sbp' | 'mir' | 'card' | 'crypto' | 'tpay';
  methodLabel: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  timestamp: string;
  paymentGatewayRef: string;
  periodMonths: number;
}

export interface FinancialStats {
  totalRevenueRub: number;
  monthRevenueRub: number;
  todayRevenueRub: number;
  averageCheckRub: number;
  payingUsersCount: number;
  totalUsersCount: number;
  conversionRate: number;
  revenueByDay: { date: string; amount: number; count: number }[];
  revenueByPlan: { planId: SubscriptionPlanId; planName: string; count: number; totalRub: number }[];
  paymentMethodDistribution: { method: string; label: string; count: number; totalRub: number }[];
}

export interface Device {
  id: string;
  user_id: string;
  device_id: string;
  device_name: string;
  platform: PlatformType;
  last_active_at: string;
}

export interface CastMember {
  id?: number | string;
  name: string;
  character?: string;
  profile_path?: string | null;
  order?: number;
}

export interface CrewMember {
  id?: number | string;
  name: string;
  job: string;
  department?: string;
  profile_path?: string | null;
}

export interface PersonCredit {
  id: string;
  tmdb_id: number;
  type: ContentType;
  title: string;
  original_title: string;
  release_year: number;
  rating_imdb: number;
  poster_url: string;
  backdrop_url: string;
  character?: string;
  job?: string;
  overview?: string;
  genres?: string[];
  is_4k?: boolean;
}

export interface PersonDetails {
  id: number;
  name: string;
  original_name?: string;
  biography?: string;
  birthday?: string;
  deathday?: string | null;
  place_of_birth?: string;
  profile_url: string;
  known_for_department?: string;
  popularity?: number;
  credits: PersonCredit[];
}

export interface ContentItem {
  id: string;
  tmdb_id: number;
  type: ContentType;
  title: string;
  original_title: string;
  release_year: number;
  age_rating: string;
  rating_imdb: number;
  rating_tmdb: number;
  runtime_minutes: number;
  overview: string;
  poster_url: string;
  backdrop_url: string;
  is_4k: boolean;
  is_published: boolean;
  is_hero?: boolean;
  play_count: number;
  genres?: string[];
  country?: string;
  countries?: string[];
  director?: string;
  directorPhoto?: string;
  directorId?: number | string;
  cast?: string[];
  cast_members?: CastMember[];
  crew_members?: CrewMember[];
  stills?: string[];
  trailer_url?: string;
  similar?: ContentItem[];
  stream_url?: string;
  seasons?: Season[];
  subtitles?: SubtitleTrack[];
}

export interface SubtitleTrack {
  id: string;
  language: string;
  label: string;
  url: string;
}

export interface AudioTrack {
  id: string;
  language: string;
  label: string;
}

export interface StreamInfo {
  content_id: string;
  title: string;
  stream_url: string;
  subtitles?: SubtitleTrack[];
  audio_tracks?: AudioTrack[];
}

export interface Season {
  id: string;
  content_id: string;
  season_number: number;
  title: string;
  overview: string;
  poster_url: string;
  episodes?: Episode[];
}

export interface Episode {
  id: string;
  season_id: string;
  episode_number: number;
  title: string;
  overview: string;
  runtime_minutes: number;
  still_url: string;
  air_date?: string;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string;
  poster_url: string;
  is_active: boolean;
  sort_order: number;
  items?: ContentItem[];
}

export interface WatchHistoryItem {
  id: string;
  user_id: string;
  content_id: string;
  season_id?: string | null;
  episode_id?: string | null;
  position_seconds: number;
  duration_seconds: number;
  is_finished: boolean;
  updated_at: string;
  content?: ContentItem;
  season?: Season;
  episode?: Episode;
}

export interface HistoryItem {
  id: string;
  content_id: string;
  position_seconds: number;
  duration_seconds: number;
  percentage: number;
  content: ContentItem;
  updated_at: string;
}

export interface ContentDescriptor {
  id: string;
  tmdbId: number;
  type: ContentType;
  title: string;
  originalTitle: string;
  year: number;
  seasonNumber?: number;
  episodeNumber?: number;
}

export interface StreamingProvider {
  searchSources(content: ContentDescriptor): Promise<StreamSource[]>;
  createSession(source: StreamSource, userId: string, targetNodeId?: string): Promise<PlaybackSession>;
  stopSession(sessionId: string): Promise<void>;
  getNodeHealth(nodeId: string): Promise<NodeHealthStatus>;
}

export interface StreamSource {
  id: string;
  title?: string;
  provider: 'torrserver' | 'licensed_cdn' | 'custom_http';
  qualityLabel: '720p' | '1080p' | '4k';
  resolution: string;
  codec: 'h264' | 'hevc';
  hdr: boolean;
  bitrateBps: number;
  sizeBytes: number;
  seeds: number;
  seeders?: number;
  sizeFormatted?: string;
  locator: string;
  indexerName?: string;
}

export interface PlaybackSession {
  sessionId: string;
  nodeId: string;
  streamUrl: string;
  quality: string;
  codec: string;
  audioChannels: number;
  expiresAt: string;
}

export interface NodeHealthStatus {
  nodeId: string;
  hostname: string;
  region: string;
  isOnline: boolean;
  cpuUsagePercent: number;
  ramUsagePercent: number;
  bandwidthMbps: number;
  activeStreams: number;
  maxCapacity: number;
  loadFactor: number;
  pingMs?: number;
  error?: string;
  version?: string;
}

export interface HomePayload {
  hero: ContentItem;
  heroItems?: ContentItem[];
  continueWatching: WatchHistoryItem[];
  trending24h: ContentItem[];
  popular: ContentItem[];
  newReleases: ContentItem[];
  timelessClassics: ContentItem[];
  fourKCollection: ContentItem[];
  collections: Collection[];
  anime?: ContentItem[];
  topMovies?: ContentItem[];
  topSeries?: ContentItem[];
  totalMoviesCount?: number;
  totalSeriesCount?: number;
  totalCatalogCount?: number;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  devicesCount: number;
}

export interface TorrServerStatus {
  online: boolean;
  version: string;
  url: string;
  latencyMs: number;
  activeTorrents: number;
  cacheSizeMb: number;
  bufferSizeMb: number;
  clientsConnected: number;
  readerWriteSpeedMbps: number;
}

export interface TorrServerTorrentInfo {
  hash: string;
  title: string;
  sizeBytes: number;
  downloadSpeedBps: number;
  uploadSpeedBps: number;
  activePeers: number;
  totalPeers: number;
  activeSeeds: number;
  totalSeeds: number;
  preloadedPercent: number;
  bufferedBytes: number;
  fileList: {
    id: number;
    name: string;
    sizeBytes: number;
    streamUrl: string;
    isVideo: boolean;
  }[];
}
