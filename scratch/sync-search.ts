import { SearchService } from '../apps/api/src/modules/search/search.service';
import { initMeiliSearch } from '../apps/api/src/shared/config/meilisearch';

async function sync() {
  console.log('🔄 Starting Meilisearch sync...');
  await initMeiliSearch();
  const result = await SearchService.syncIndexes();
  console.log('✅ Sync result:', result);
  process.exit(0);
}

sync().catch(err => {
  console.error('❌ Sync failed:', err);
  process.exit(1);
});
