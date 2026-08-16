-- ====================================================================
-- PostgreSQL Database Initialization Schema (DDL)
-- Smart TV Media Platform (Tizen / webOS / Android TV)
-- ====================================================================

-- 1. Таблица учетных записей пользователей
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(64) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(32) DEFAULT 'user' NOT NULL,
  is_blocked BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. Аппаратные устройства, привязанные к учетной записи (максимум 3 устройства)
CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id VARCHAR(128) NOT NULL,
  device_name VARCHAR(128) NOT NULL,
  platform VARCHAR(32) NOT NULL, -- 'tizen', 'webos', 'android_tv'
  last_active_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT uq_user_device UNIQUE (user_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_devices_user ON devices(user_id);

-- 3. Каталог контента (Фильмы, Сериалы, Мультфильмы, Шоу)
CREATE TABLE IF NOT EXISTS content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tmdb_id INTEGER UNIQUE,
  type VARCHAR(32) NOT NULL, -- 'movie', 'series', 'cartoon', 'show'
  title VARCHAR(512) NOT NULL,
  original_title VARCHAR(512),
  release_year SMALLINT NOT NULL,
  age_rating VARCHAR(16),
  rating_imdb NUMERIC(3, 1),
  rating_tmdb NUMERIC(3, 1),
  runtime_minutes SMALLINT,
  overview TEXT,
  poster_url VARCHAR(1024),
  backdrop_url VARCHAR(1024),
  is_4k BOOLEAN DEFAULT FALSE NOT NULL,
  is_published BOOLEAN DEFAULT TRUE NOT NULL,
  play_count BIGINT DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_content_type_published ON content(type, is_published);
CREATE INDEX IF NOT EXISTS idx_content_year ON content(release_year DESC);
CREATE INDEX IF NOT EXISTS idx_content_rating_imdb ON content(rating_imdb DESC);
CREATE INDEX IF NOT EXISTS idx_content_search_title ON content USING gin(to_tsvector('russian', title));

-- 4. Сезоны для сериалов
CREATE TABLE IF NOT EXISTS seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  season_number SMALLINT NOT NULL,
  title VARCHAR(255),
  overview TEXT,
  poster_url VARCHAR(1024),
  CONSTRAINT uq_content_season UNIQUE (content_id, season_number)
);

CREATE INDEX IF NOT EXISTS idx_seasons_content ON seasons(content_id);

-- 5. Серии (эпизоды)
CREATE TABLE IF NOT EXISTS episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  episode_number SMALLINT NOT NULL,
  title VARCHAR(255),
  overview TEXT,
  runtime_minutes SMALLINT,
  still_url VARCHAR(1024),
  CONSTRAINT uq_season_episode UNIQUE (season_id, episode_number)
);

CREATE INDEX IF NOT EXISTS idx_episodes_season ON episodes(season_id);

-- 6. Тематические подборки
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  poster_url VARCHAR(1024),
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  sort_order INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS collection_items (
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0 NOT NULL,
  PRIMARY KEY (collection_id, content_id)
);

-- 7. Пользовательские списки (Избранное, Запланированное)
CREATE TABLE IF NOT EXISTS favorites (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (user_id, content_id)
);

CREATE TABLE IF NOT EXISTS watchlist (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (user_id, content_id)
);

-- 8. Пользовательские плейлисты
CREATE TABLE IF NOT EXISTS playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS playlist_items (
  playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0 NOT NULL,
  PRIMARY KEY (playlist_id, content_id)
);

-- 9. История просмотров и синхронизация прогресса (Resume Logic)
CREATE TABLE IF NOT EXISTS history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  season_id UUID REFERENCES seasons(id) ON DELETE SET NULL,
  episode_id UUID REFERENCES episodes(id) ON DELETE SET NULL,
  position_seconds INTEGER NOT NULL,
  duration_seconds INTEGER NOT NULL,
  is_finished BOOLEAN DEFAULT FALSE NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT uq_user_history_entry UNIQUE (user_id, content_id, episode_id)
);

CREATE INDEX IF NOT EXISTS idx_history_user_lookup ON history(user_id, updated_at DESC);

-- 10. Реестр распределенных Edge-нод стриминга
CREATE TABLE IF NOT EXISTS streaming_nodes (
  id VARCHAR(64) PRIMARY KEY, -- 'node-01-de', 'node-02-fi'
  hostname VARCHAR(255) NOT NULL,
  region VARCHAR(16) NOT NULL,
  max_capacity INTEGER DEFAULT 25 NOT NULL,
  active_streams INTEGER DEFAULT 0 NOT NULL,
  bandwidth_mbps INTEGER DEFAULT 0 NOT NULL,
  cpu_usage_percent INTEGER DEFAULT 15 NOT NULL,
  is_online BOOLEAN DEFAULT TRUE NOT NULL,
  last_heartbeat TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 11. Активные вещательные сессии
CREATE TABLE IF NOT EXISTS streaming_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  node_id VARCHAR(64) NOT NULL REFERENCES streaming_nodes(id) ON DELETE RESTRICT,
  content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  episode_id UUID REFERENCES episodes(id) ON DELETE SET NULL,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  quality VARCHAR(16) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_active ON streaming_sessions(node_id, is_active);
