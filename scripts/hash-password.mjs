// Genera el hash para ADMIN_PASSWORD_HASH a partir de una contraseña.
// Uso: node scripts/hash-password.mjs "tu-contraseña"
import { scryptSync, createHmac } from 'node:crypto';

const password = process.argv[2];
if (!password) {
  console.error('Uso: node scripts/hash-password.mjs "tu-contraseña"');
  process.exit(1);
}

const salt = createHmac('sha256', Math.random().toString())
  .update(Date.now().toString())
  .digest('hex')
  .slice(0, 32);

const derived = scryptSync(password, salt, 64).toString('hex');
console.log(`${salt}:${derived}`);
