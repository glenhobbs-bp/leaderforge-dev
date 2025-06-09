import { supabase } from '../../../apps/web/app/lib/supabaseClient';
import { TribeSocialContentTool } from '../tools/TribeSocialContentTool';
import type { GridSchema, ComponentSchema } from '../types/ComponentSchema';

/**
 * ContentSyncAgent: Syncs TribeSocial content into modules.content for a given context.
 * - Upserts all fetched content with is_active=true
 * - Marks any local content not present in the latest fetch as is_active=false
 */
export async function runContentSyncAgent(contextKey: string): Promise<{ synced: number, deactivated: number }> {
  const tribeTool = new TribeSocialContentTool();
  // 1. Fetch all content for the context from TribeSocial
  const tribeContent = await tribeTool.listContentAsComponentSchema(
    // You may need to map contextKey to a collectionId here
    // For now, assume contextKey is the collectionId (number)
    Number(contextKey)
  );
  let items: any[] = [];
  if (tribeContent && tribeContent.type === 'Grid' && Array.isArray((tribeContent as GridSchema).props.items)) {
    items = (tribeContent as GridSchema).props.items;
  } else {
    console.warn('[ContentSyncAgent] TribeSocial did not return a GridSchema with items. Got:', tribeContent);
  }
  console.log(`[ContentSyncAgent] Fetched ${items.length} items from TribeSocial.`);
  if (items.length > 0) {
    console.log('[ContentSyncAgent] First item:', JSON.stringify(items[0], null, 2));
  }
  const tribeIds = items.map((item: any) => item.props.id);

  // 2. Upsert all fetched content into modules.content (is_active=true)
  let synced = 0;
  for (const item of items) {
    const { id, title, subtitle, image, videoUrl, description, longDescription, publishedDate } = item.props;
    const { error } = await supabase
      .schema('modules')
      .from('content')
      .upsert([
        {
          source_id: id,
          source_type: 'tribesocial',
          title,
          type: subtitle,
          thumbnail_url: image,
          video_url: videoUrl,
          description,
          longDescription,
          published_at: publishedDate,
          available_contexts: [contextKey],
          is_active: true,
        },
      ], { onConflict: 'source_type,source_id' });
    if (error) {
      console.error(`[ContentSyncAgent] Supabase upsert error for source_id ${id}:`, error);
    } else {
      synced++;
    }
  }

  // 3. Mark any local content not present in the latest fetch as is_active=false
  const { data: localContent, error: fetchError } = await supabase
    .schema('modules')
    .from('content')
    .select('id')
    .contains('available_contexts', [contextKey])
    .eq('is_active', true);
  let deactivated = 0;
  if (!fetchError && localContent) {
    const localIds = localContent.map((c: any) => c.id);
    const toDeactivate = localIds.filter((id: string) => !tribeIds.includes(id));
    if (toDeactivate.length > 0) {
      const { error: deactivateError } = await supabase
        .schema('modules')
        .from('content')
        .update({ is_active: false })
        .in('id', toDeactivate);
      if (!deactivateError) deactivated = toDeactivate.length;
    }
  }

  return { synced, deactivated };
}