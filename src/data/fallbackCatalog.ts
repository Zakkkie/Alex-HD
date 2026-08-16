import { ContentItem, HomePayload, Collection } from '../types';

export const fallbackContent: ContentItem[] = [
  {
    id: 'c101-dune-2',
    tmdb_id: 693134,
    type: 'movie',
    title: 'Дюна: Часть вторая',
    original_title: 'Dune: Part Two',
    release_year: 2024,
    age_rating: '16+',
    rating_imdb: 8.6,
    rating_tmdb: 8.5,
    runtime_minutes: 166,
    overview: 'Пол Атрейдес объединяется с Чани и фременами, возглавляя месть против заговорщиков, уничтоживших его семью. Стоя перед выбором между любовью всей своей жизни и судьбой известной Вселенной, он пытается предотвратить ужасное будущее, которое только он может предвидеть.',
    poster_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    backdrop_url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1600&auto=format&fit=crop&q=80',
    is_4k: true,
    is_published: true,
    play_count: 14250,
    genres: ['Фантастика', 'Приключения', 'Драма'],
    country: 'США / Канада',
    director: 'Дени Вильнёв',
    cast: ['Тимоти Шаламе', 'Зендея', 'Ребекка Фергюсон', 'Хавьер Бардем']
  },
  {
    id: 'c102-interstellar',
    tmdb_id: 157336,
    type: 'movie',
    title: 'Интерстеллар',
    original_title: 'Interstellar',
    release_year: 2014,
    age_rating: '12+',
    rating_imdb: 8.7,
    rating_tmdb: 8.4,
    runtime_minutes: 169,
    overview: 'Засуха, пылевые бури и вымирание растений приводят человечество к продовольственному кризису. Коллектив исследователей и учёных отправляется сквозь червоточину в путешествие, чтобы превзойти прежние ограничения человеческих космических путешествий и найти планету с подходящими для человека условиями.',
    poster_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
    backdrop_url: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1600&auto=format&fit=crop&q=80',
    is_4k: true,
    is_published: true,
    play_count: 28900,
    genres: ['Фантастика', 'Драма', 'Приключения'],
    country: 'США / Великобритания',
    director: 'Кристофер Нолан',
    cast: ['Мэттью Макконахи', 'Энн Хэтэуэй', 'Джессика Честейн', 'Майкл Кейн']
  },
  {
    id: 'c103-cyberpunk-edgerunners',
    tmdb_id: 105248,
    type: 'series',
    title: 'Киберпанк: Бегущие по краю',
    original_title: 'Cyberpunk: Edgerunners',
    release_year: 2022,
    age_rating: '18+',
    rating_imdb: 8.3,
    rating_tmdb: 8.6,
    runtime_minutes: 24,
    overview: 'История уличного подростка, пытающегося выжить в городе будущего, одержимом технологиями и модификациями тела. Потеряв всё, он решает стать наемником — киберпалком.',
    poster_url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
    backdrop_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1600&auto=format&fit=crop&q=80',
    is_4k: true,
    is_published: true,
    play_count: 18400,
    genres: ['Аниме', 'Киберпанк', 'Боевик'],
    country: 'Япония / Польша',
    director: 'Хироюки Имаиси',
    cast: ['КЭНН', 'Аои Юки', 'Хироку Юки']
  },
  {
    id: 'c104-oppenheimer',
    tmdb_id: 872585,
    type: 'movie',
    title: 'Оппенгеймер',
    original_title: 'Oppenheimer',
    release_year: 2023,
    age_rating: '18+',
    rating_imdb: 8.9,
    rating_tmdb: 8.1,
    runtime_minutes: 180,
    overview: 'История жизни американского физика Роберта Оппенгеймера, который стоял во главе Манхэттенского проекта — секретной разработки ядерного оружия.',
    poster_url: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=600&auto=format&fit=crop&q=80',
    backdrop_url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1600&auto=format&fit=crop&q=80',
    is_4k: true,
    is_published: true,
    play_count: 22100,
    genres: ['Биография', 'Драма', 'История'],
    country: 'США / Великобритания',
    director: 'Кристофер Нолан',
    cast: ['Киллиан Мёрфи', 'Эмили Блант', 'Мэтт Дэймон', 'Роберт Дауни мл.']
  },
  {
    id: 'c105-blade-runner-2049',
    tmdb_id: 335984,
    type: 'movie',
    title: 'Бегущий по лезвию 2049',
    original_title: 'Blade Runner 2049',
    release_year: 2017,
    age_rating: '18+',
    rating_imdb: 8.0,
    rating_tmdb: 7.9,
    runtime_minutes: 164,
    overview: 'В будущем мир населен людьми и репликантами, созданными для выполнения тяжелой работы. Офицер полиции Лос-Анджелеса Кей раскрывает давно погребенную тайну.',
    poster_url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80',
    backdrop_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80',
    is_4k: true,
    is_published: true,
    play_count: 15300,
    genres: ['Фантастика', 'Детектив', 'Драма'],
    country: 'США / Великобритания / Канада',
    director: 'Дени Вильнёв',
    cast: ['Райан Гослинг', 'Харрисон Форд', 'Ана де Армас']
  },
  {
    id: 'c106-arcane',
    tmdb_id: 94605,
    type: 'series',
    title: 'Аркейн',
    original_title: 'Arcane',
    release_year: 2021,
    age_rating: '16+',
    rating_imdb: 9.0,
    rating_tmdb: 8.7,
    runtime_minutes: 40,
    overview: 'Вай и Джинкс — две сестры, разделенные войной между богатым утопическим городом Пилтовером и его захудалым подземным соседом Зауном.',
    poster_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
    backdrop_url: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=1600&auto=format&fit=crop&q=80',
    is_4k: true,
    is_published: true,
    play_count: 31200,
    genres: ['Мультфильм', 'Фэнтези', 'Боевик'],
    country: 'США / Франция',
    director: 'Паскаль Шаррю',
    cast: ['Хейли Стайнфелд', 'Элла Пернелл']
  },
  {
    id: 'c107-dark-knight',
    tmdb_id: 155,
    type: 'movie',
    title: 'Темный рыцарь',
    original_title: 'The Dark Knight',
    release_year: 2008,
    age_rating: '16+',
    rating_imdb: 9.0,
    rating_tmdb: 8.5,
    runtime_minutes: 152,
    overview: 'Бэтмен поднимает ставки в войне с криминалом. С помощью лейтенанта Джима Гордона и прокурора Харви Дента он намеревается очистить улицы Готэма от преступности.',
    poster_url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
    backdrop_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80',
    is_4k: true,
    is_published: true,
    play_count: 42000,
    genres: ['Боевик', 'Криминал', 'Драма'],
    director: 'Кристофер Нолан',
    cast: ['Кристиан Бэйл', 'Хит Леджер', 'Аарон Экхарт']
  },
  {
    id: 'c108-breaking-bad',
    tmdb_id: 1396,
    type: 'series',
    title: 'Во все тяжкие',
    original_title: 'Breaking Bad',
    release_year: 2008,
    age_rating: '18+',
    rating_imdb: 9.5,
    rating_tmdb: 8.9,
    runtime_minutes: 47,
    overview: 'Школьный учитель химии Уолтер Уайт узнает, что болен раком легких. Чтобы обеспечить финансовое будущее своей семьи, он начинает производство метамфетамина.',
    poster_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    backdrop_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&auto=format&fit=crop&q=80',
    is_4k: true,
    is_published: true,
    play_count: 51000,
    genres: ['Драма', 'Криминал', 'Триллер'],
    director: 'Винс Гиллиган',
    cast: ['Брайан Крэнстон', 'Аарон Пол', 'Анна Ганн']
  }
];

export const fallbackCollections: Collection[] = [
  {
    id: 'col-4k-masterpieces',
    name: 'Коллекция 4K Ultra HD HDR',
    slug: '4k-masterpieces',
    description: 'Фильмы с максимальным качеством картинки и многоканальным звуком Dolby Atmos',
    poster_url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1600&auto=format&fit=crop&q=80',
    is_active: true,
    sort_order: 1,
    items: fallbackContent.filter(c => c.is_4k)
  },
  {
    id: 'col-sci-fi',
    name: 'Киберпанк и Космос',
    slug: 'sci-fi',
    description: 'Лучшие научно-фантастические картины и путешествия сквозь миры',
    poster_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&auto=format&fit=crop&q=80',
    is_active: true,
    sort_order: 2,
    items: fallbackContent.filter(c => c.genres?.some(g => g.includes('Фантастика') || g.includes('Киберпанк')))
  }
];

export function getFallbackHomePayload(): HomePayload {
  const hero = fallbackContent[0];
  const trending24h = [...fallbackContent].sort((a, b) => b.play_count - a.play_count);
  const popular = [...fallbackContent].sort((a, b) => b.rating_imdb - a.rating_imdb);
  const newReleases = [...fallbackContent].sort((a, b) => b.release_year - a.release_year);
  const timelessClassics = fallbackContent.filter(c => c.rating_imdb >= 8.5);
  const fourKCollection = fallbackContent.filter(c => c.is_4k);
  const topMovies = fallbackContent.filter(c => c.type === 'movie');
  const topSeries = fallbackContent.filter(c => c.type === 'series');
  const anime = fallbackContent.filter(c => c.genres.some(g => g === 'Аниме' || g === 'Мультфильм'));

  return {
    hero,
    continueWatching: [],
    trending24h,
    popular,
    newReleases,
    timelessClassics,
    fourKCollection,
    collections: fallbackCollections,
    anime,
    topMovies,
    topSeries
  };
}
