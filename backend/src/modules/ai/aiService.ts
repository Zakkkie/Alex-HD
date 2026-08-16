import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import { dbStore } from '../../db/store';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

export class AIService {
  static async searchContent(query: string) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const allContent = dbStore.content.filter(c => c.is_published).map(c => ({
      id: c.id,
      title: c.title,
      original_title: c.original_title,
      overview: c.overview,
      genres: c.genres,
      director: c.director,
      cast: c.cast,
      release_year: c.release_year
    }));

    const prompt = `You are a cinematic AI search engine. The user asked: "${query}"
Please analyze the user's query and the available content catalog. 
Select the content items that best match the user's intent. Pay attention to semantic meaning, genre, themes, and actors.
Return a list of IDs of the best matching content items, ordered by relevance.

Available catalog:
${JSON.stringify(allContent)}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "List of matched content IDs"
        }
      }
    });

    try {
      const ids: string[] = JSON.parse(response.text || '[]');
      // return full items from dbStore
      return ids.map(id => dbStore.content.find(c => c.id === id)).filter(Boolean);
    } catch (e) {
      console.error('Error parsing AI search response', e);
      return [];
    }
  }
}
