import mongoose from 'mongoose';
import {connectDatabase} from '../config/db.ts';
import {seedDatabaseIfEmpty} from './seedData.ts';

async function runSeedCli() {
  const force = process.argv.includes('--force');
  const connected = await connectDatabase();
  if (!connected) {
    console.error('Unable to connect to MongoDB. Check MONGODB_URI in your .env file.');
    process.exit(1);
  }

  const result = await seedDatabaseIfEmpty(force);
  console.log(result.message);
  await mongoose.disconnect();
  process.exit(0);
}

runSeedCli().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
