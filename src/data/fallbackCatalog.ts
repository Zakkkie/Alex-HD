import { ContentItem, HomePayload, Collection } from '../types';

export const fallbackContent: ContentItem[] = [];

export const fallbackCollections: Collection[] = [];

export function getFallbackHomePayload(): HomePayload {
  return {
    hero: undefined as any,
    heroItems: [],
    continueWatching: [],
    trending24h: [],
    popular: [],
    newReleases: [],
    timelessClassics: [],
    fourKCollection: [],
    collections: [],
    anime: [],
    topMovies: [],
    topSeries: []
  };
}
