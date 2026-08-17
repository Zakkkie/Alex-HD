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
  prowlarrKey: process.env.PROWLARR_KEY || 'prowlarr_api_key_placeholder',
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  maxDevicesPerUser: 3,
};
