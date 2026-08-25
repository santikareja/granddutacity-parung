import * as migration_20260414_204941_init from './20260414_204941_init';
import * as migration_20260417_133623_add_categories_media_meta from './20260417_133623_add_categories_media_meta';
import * as migration_20260419_101500_add_article_10_ciri_agen from './20260419_101500_add_article_10_ciri_agen';

import * as migration_20260419_101501_fix_article_10_ciri_agen from './20260419_101501_fix_article_10_ciri_agen';
import * as migration_20260825_040000_add_ai_studio_fields from './20260825_040000_add_ai_studio_fields';
import * as migration_20260825_050000_add_ai_providers from './20260825_050000_add_ai_providers';

export const migrations = [
  {
    up: migration_20260414_204941_init.up,
    down: migration_20260414_204941_init.down,
    name: '20260414_204941_init',
  },
  {
    up: migration_20260417_133623_add_categories_media_meta.up,
    down: migration_20260417_133623_add_categories_media_meta.down,
    name: '20260417_133623_add_categories_media_meta'
  },
  {
    up: migration_20260419_101500_add_article_10_ciri_agen.up,
    down: migration_20260419_101500_add_article_10_ciri_agen.down,
    name: '20260419_101500_add_article_10_ciri_agen'
  },
  {
    up: migration_20260419_101501_fix_article_10_ciri_agen.up,
    down: migration_20260419_101501_fix_article_10_ciri_agen.down,
    name: '20260419_101501_fix_article_10_ciri_agen'
  },
  {
    up: migration_20260825_040000_add_ai_studio_fields.up,
    down: migration_20260825_040000_add_ai_studio_fields.down,
    name: '20260825_040000_add_ai_studio_fields'
  },
  {
    up: migration_20260825_050000_add_ai_providers.up,
    down: migration_20260825_050000_add_ai_providers.down,
    name: '20260825_050000_add_ai_providers'
  },
];
