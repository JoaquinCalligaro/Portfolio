// Cliente de base de datos (Neon). Si no hay DATABASE_URL configurada,
// `db` queda en null y el sitio público usa los datos estáticos de respaldo.
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const DATABASE_URL = process.env.DATABASE_URL;

export const db = DATABASE_URL
  ? drizzle(neon(DATABASE_URL), { schema })
  : null;

export const isDbConfigured = Boolean(DATABASE_URL);
