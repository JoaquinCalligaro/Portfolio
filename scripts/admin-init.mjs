// Crea (o resetea) el usuario y la contraseña del admin directo en la base.
// Uso: pnpm admin:init --user <usuario> --password "<contraseña>" [--email <mail>] [--force] [--reset-2fa]
import { randomBytes, scryptSync } from 'node:crypto';
import { parseArgs } from 'node:util';
import { neon } from '@neondatabase/serverless';

const { values } = parseArgs({
  options: {
    user: { type: 'string' },
    password: { type: 'string' },
    email: { type: 'string' },
    force: { type: 'boolean', default: false },
    'reset-2fa': { type: 'boolean', default: false },
  },
});

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) fail('Falta DATABASE_URL en tu .env');

const { user, password, email, force } = values;
if (!user || !/^[a-zA-Z0-9._ -]{3,32}$/.test(user.trim())) {
  fail(
    'Usuario inválido: 3 a 32 caracteres (letras, números, espacios, punto, guion o guion bajo)'
  );
}
if (!password || password.length < 12) {
  fail('La contraseña tiene que tener al menos 12 caracteres');
}
if (email && !/^[^\s@<>,;"']+@[^\s@<>,;"']+\.[^\s@<>,;"']{2,}$/.test(email)) {
  fail('El mail no es válido');
}

// Mismo formato que hashPassword de src/lib/auth.ts: "salt:hash" en hex (scrypt)
const salt = randomBytes(16).toString('hex');
const passwordHash = `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
const username = user.trim().replace(/ {2,}/g, ' ');

const sql = neon(DATABASE_URL);

const existing = await sql`SELECT id FROM admin_credentials WHERE id = 'admin'`;
if (existing.length > 0 && !force) {
  fail('Ya hay un admin. Usá --force para resetear usuario y contraseña');
}

await sql`
  INSERT INTO admin_credentials (id, username, password_hash, updated_at)
  VALUES ('admin', ${username}, ${passwordHash}, now())
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    password_hash = EXCLUDED.password_hash,
    updated_at = now()
`;
console.log(`Admin guardado: usuario "${username}".`);

if (force) {
  await sql`DELETE FROM admin_sessions`;
  await sql`DELETE FROM admin_trusted_devices`;
  console.log('Se cerraron todas las sesiones y dispositivos de confianza.');
}

// Recuperación si se perdió el celular del 2FA
if (values['reset-2fa']) {
  await sql`DELETE FROM admin_totp`;
  await sql`DELETE FROM admin_recovery_codes`;
  await sql`DELETE FROM admin_trusted_devices`;
  await sql`DELETE FROM admin_2fa_pending`;
  console.log('2FA reseteado.');
}

if (email) {
  await sql`
    INSERT INTO site_profile (id, contact_to_email, contact_to_email_verified) VALUES (1, ${email.trim().toLowerCase()}, false)
    ON CONFLICT (id) DO UPDATE SET contact_to_email = EXCLUDED.contact_to_email, contact_to_email_verified = false
  `;
  console.log('Mail de contacto guardado (sin verificar: confirmalo desde Seguridad → Cuenta).');
}
