// Cliente de base de datos (Neon). Si no hay DATABASE_URL configurada,
// `db` queda en null y las secciones públicas se muestran vacías.
import { env } from '../lib/env';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const DATABASE_URL = env('DATABASE_URL');

export const db = DATABASE_URL ? drizzle(neon(DATABASE_URL), { schema }) : null;

export const isDbConfigured = Boolean(DATABASE_URL);
