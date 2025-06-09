import { runContentSyncAgent } from './ContentSyncAgent';

async function main() {
  const contextKey = process.argv[2] || '1';
  console.log(`[Test] Running ContentSyncAgent for contextKey: ${contextKey}`);
  try {
    const result = await runContentSyncAgent(contextKey);
    console.log('[Test] Sync result:', result);
  } catch (err) {
    console.error('[Test] Sync error:', err);
    process.exit(1);
  }
  process.exit(0);
}

main();