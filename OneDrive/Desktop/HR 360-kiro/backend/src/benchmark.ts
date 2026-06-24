import { createClient } from 'redis';

async function runBenchmark() {
  const client = createClient();
  await client.connect();

  // Seed data
  console.log('Seeding data...');
  for (let i = 0; i < 1000; i++) {
    await client.set(`session:bench:${i}`, JSON.stringify({ lastActivity: Date.now() - 25 * 60 * 60 * 1000 }));
  }

  // Baseline
  console.log('Running baseline...');
  const startBaseline = Date.now();
  const keys1 = await client.keys('session:bench:*');
  let deleted1 = 0;
  for (const key of keys1) {
    const data = await client.get(key);
    if (data) {
      deleted1++;
      await client.del(key);
    }
  }
  const endBaseline = Date.now();
  console.log(`Baseline time: ${endBaseline - startBaseline}ms for ${deleted1} keys`);

  // Seed data again
  for (let i = 0; i < 1000; i++) {
    await client.set(`session:bench:${i}`, JSON.stringify({ lastActivity: Date.now() - 25 * 60 * 60 * 1000 }));
  }

  // Optimized
  console.log('Running optimized...');
  const startOptimized = Date.now();
  const keys2 = await client.keys('session:bench:*');
  let deleted2 = 0;

  if (keys2.length > 0) {
    const BATCH_SIZE = 100;
    for (let i = 0; i < keys2.length; i += BATCH_SIZE) {
      const batchKeys = keys2.slice(i, i + BATCH_SIZE);
      const dataBatch = await client.mGet(batchKeys);

      const keysToDelete: string[] = [];
      for (let j = 0; j < batchKeys.length; j++) {
        if (dataBatch[j]) {
          deleted2++;
          keysToDelete.push(batchKeys[j]);
        }
      }
      if (keysToDelete.length > 0) {
        await client.del(keysToDelete);
      }
    }
  }

  const endOptimized = Date.now();
  console.log(`Optimized time: ${endOptimized - startOptimized}ms for ${deleted2} keys`);

  await client.disconnect();
}

runBenchmark().catch(console.error);
