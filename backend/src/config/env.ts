import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'super-secret-smart-tv-jwt-key-2026',
  databaseUrl: process.env.DATABASE_URL || 'postgres://tv_cluster_admin:pass@postgres:5432/tv_master_db',
  prowlarrUrl: process.env.PROWLARR_URL || 'http://localhost:9696',
  prowlarrKey: process.env.PROWLARR_KEY || 'prowlarr_api_key_placeholder',
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  maxDevicesPerUser: 3,
};
