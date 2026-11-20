import mongoose from 'mongoose';
import {env} from './env.ts';

export interface DbStatus {
  state: 'connected' | 'connecting' | 'disconnected' | 'missing_uri' | 'error';
  configured: boolean;
  databaseName: string | null;
  lastError: string | null;
}

let lastError: string | null = null;
let listenersBound = false;

export function getDbStatus(): DbStatus {
  if (!env.mongoUri) {
    return {
      state: 'missing_uri',
      configured: false,
      databaseName: null,
      lastError: 'MONGODB_URI is not set in .env',
    };
  }

  const readyState = mongoose.connection.readyState;
  const stateMap: Record<number, DbStatus['state']> = {
    0: lastError ? 'error' : 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnected',
  };

  return {
    state: stateMap[readyState] || 'disconnected',
    configured: true,
    databaseName: mongoose.connection.name || null,
    lastError,
  };
}

export async function connectDatabase(): Promise<boolean> {
  if (!env.mongoUri) {
    lastError = 'MONGODB_URI is not set in .env';
    console.warn('[DignityLink DB] MONGODB_URI is missing in .env. Database features await configuration.');
    return false;
  }

  if (!listenersBound) {
    mongoose.connection.on('connected', () => {
      lastError = null;
      console.log(`[DignityLink DB] Connected to MongoDB (${mongoose.connection.name})`);
    });

    mongoose.connection.on('error', (err: Error) => {
      lastError = err.message;
      console.error('[DignityLink DB] MongoDB error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[DignityLink DB] MongoDB disconnected');
    });

    listenersBound = true;
  }

  if (mongoose.connection.readyState === 1) {
    return true;
  }

  try {
    await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 8000,
    });
    lastError = null;
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown MongoDB connection error';
    lastError = message;
    console.error('[DignityLink DB] Connection failed:', message);
    return false;
  }
}
