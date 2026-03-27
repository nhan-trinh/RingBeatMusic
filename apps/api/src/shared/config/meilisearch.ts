import { MeiliSearch } from 'meilisearch';
import { env } from './env';

// Singleton Meilisearch Client
export const meilisearch = new MeiliSearch({
  host: env.MEILI_HOST,
  apiKey: env.MEILI_MASTER_KEY,
});

export const initMeiliSearch = async () => {
  try {
    // Schema configs, filterable etc.
    await meilisearch.index('songs').updateFilterableAttributes(['genre', 'language', 'status']);
    await meilisearch.index('songs').updateSortableAttributes(['playCount', 'releaseDate']);
    
    await meilisearch.index('artists').updateFilterableAttributes(['isVerified']);
    
    console.log('✅ Meilisearch Indexes configured');
  } catch (err) {
    console.error('❌ Lỗi cấu hình Meilisearch:', err);
  }
};
