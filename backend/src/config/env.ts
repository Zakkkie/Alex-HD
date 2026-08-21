import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'super-secret-smart-tv-jwt-key-2026',
  databaseUrl: process.env.DATABASE_URL || 'postgres://tv_cluster_admin:pass@postgres:5432/tv_master_db',
  torrServerUrl: process.env.TORRSERVER_URL || 'http://178.236.240.100:8090',
  tmdbApiKey: process.env.TMDB_API_KEY || '4e44d9029b1270a757cddc766a1bcb63',
  tvdbApiKey: process.env.TVDB_API_KEY || '',
  prowlarrUrl: process.env.PROWLARR_URL || 'http://localhost:9696',
  prowlarrKey: process.env.PROWLARR_API_KEY || process.env.PROWLARR_KEY || '',
  jellyseerrUrl: process.env.JELLYSEERR_URL || process.env.OVERSEERR_URL || process.env.SEERR_URL || 'http://172.19.0.2:5055',
  jellyseerrApiKey: process.env.JELLYSEERR_API_KEY || process.env.OVERSEERR_API_KEY || '',
  jellyfinUrl: process.env.JELLYFIN_URL || 'http://127.0.0.1:8096',
  radarrUrl: process.env.RADARR_URL || 'http://127.0.0.1:7878',
  radarrApiKey: process.env.RADARR_API_KEY || '',
  sonarrUrl: process.env.SONARR_URL || 'http://127.0.0.1:8989',
  sonarrApiKey: process.env.SONARR_API_KEY || '',
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  maxDevicesPerUser: 3,
};
