// Esquema de la base de datos (Neon/Postgres): todo el contenido del portfolio
import {
  pgTable,
  text,
  boolean,
  integer,
  timestamp,
  uuid,
  bigint,
} from 'drizzle-orm/pg-core';

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  titleEs: text('title_es').notNull(),
  titleEn: text('title_en').notNull(),
  descriptionEs: text('description_es').notNull(),
  descriptionEn: text('description_en').notNull(),
  repo: text('repo').notNull().default(''),
  live: text('live').notNull().default(''),
  technologies: text('technologies').array().notNull().default([]),
  images: text('images').array().notNull().default([]),
  featured: boolean('featured').notNull().default(false),
  hidden: boolean('hidden').notNull().default(false),
  position: integer('position').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type ProjectRow = typeof projects.$inferSelect;
export type NewProjectRow = typeof projects.$inferInsert;

// Fila única (id fijo = 1) con los datos personales de la presentación.
export const siteProfile = pgTable('site_profile', {
  id: integer('id').primaryKey().default(1),
  name: text('name').notNull().default(''),
  headlineEs: text('headline_es').notNull().default(''),
  headlineEn: text('headline_en').notNull().default(''),
  photoUrl: text('photo_url').notNull().default(''),
  cvUrl: text('cv_url').notNull().default(''),
  // Formulario de contacto: a dónde llegan los mensajes y desde qué remitente
  contactToEmail: text('contact_to_email').notNull().default(''),
  // true solo si se confirmó con el código enviado por mail
  contactToEmailVerified: boolean('contact_to_email_verified').notNull().default(false),
  contactFromEmail: text('contact_from_email').notNull().default(''),
  bioEs: text('bio_es').array().notNull().default([]),
  bioEn: text('bio_en').array().notNull().default([]),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Redes sociales (GitHub, LinkedIn, X, email...). El ícono es un slug de
// Simple Icons o una imagen subida (iconUrl gana si existe).
export const socialLinks = pgTable('social_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  label: text('label').notNull(),
  url: text('url').notNull(),
  iconSlug: text('icon_slug').notNull().default(''),
  iconUrl: text('icon_url').notNull().default(''),
  hidden: boolean('hidden').notNull().default(false),
  position: integer('position').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const techCategories = pgTable('tech_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  nameEs: text('name_es').notNull(),
  nameEn: text('name_en').notNull(),
  position: integer('position').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const techs = pgTable('techs', {
  id: uuid('id').primaryKey().defaultRandom(),
  categoryId: uuid('category_id')
    .notNull()
    .references(() => techCategories.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  iconSlug: text('icon_slug').notNull().default(''),
  iconUrl: text('icon_url').notNull().default(''),
  color: text('color').notNull().default('#06B6D4'),
  hidden: boolean('hidden').notNull().default(false),
  position: integer('position').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Línea de tiempo de "Educación". La institución no se traduce.
export const education = pgTable('education', {
  id: uuid('id').primaryKey().defaultRandom(),
  institution: text('institution').notNull(),
  datesEs: text('dates_es').notNull().default(''),
  datesEn: text('dates_en').notNull().default(''),
  descriptionEs: text('description_es').notNull().default(''),
  descriptionEn: text('description_en').notNull().default(''),
  iconKey: text('icon_key').notNull().default('university'),
  // Certificado (imagen o PDF) guardado como base64; vacío si no hay.
  certificateMime: text('certificate_mime').notNull().default(''),
  certificateData: text('certificate_data').notNull().default(''),
  hidden: boolean('hidden').notNull().default(false),
  position: integer('position').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type ProfileRow = typeof siteProfile.$inferSelect;
export type SocialLinkRow = typeof socialLinks.$inferSelect;
export type TechCategoryRow = typeof techCategories.$inferSelect;
export type TechRow = typeof techs.$inferSelect;
export type EducationRow = Omit<typeof education.$inferSelect, 'certificateData'>;

export const adminPasskeys = pgTable('admin_passkeys', {
  id: uuid('id').primaryKey().defaultRandom(),
  credentialId: text('credential_id').notNull().unique(),
  publicKey: text('public_key').notNull(),
  counter: bigint('counter', { mode: 'number' }).notNull().default(0),
  deviceType: text('device_type').notNull(),
  backedUp: boolean('backed_up').notNull().default(false),
  transports: text('transports').array().notNull().default([]),
  label: text('label').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
});

export const adminWebauthnChallenges = pgTable('admin_webauthn_challenges', {
  id: uuid('id').primaryKey().defaultRandom(),
  flow: text('flow').notNull(),
  challenge: text('challenge').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
});

export const adminAuthAttempts = pgTable('admin_auth_attempts', {
  key: text('key').primaryKey(),
  failCount: integer('fail_count').notNull().default(0),
  windowStart: timestamp('window_start', { withTimezone: true }).notNull(),
  lockedUntil: timestamp('locked_until', { withTimezone: true }),
  lockLevel: integer('lock_level').notNull().default(0),
  version: integer('version').notNull().default(0),
});

export const adminSessions = pgTable('admin_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tokenHash: text('token_hash').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
  userAgent: text('user_agent').notNull().default(''),
});

// Usuario y contraseña del admin (una sola fila). Se crea con `pnpm admin:init`.
export const adminCredentials = pgTable('admin_credentials', {
  id: text('id').primaryKey().default('admin'),
  username: text('username').notNull().default(''),
  passwordHash: text('password_hash').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// 2FA (TOTP) del admin: una sola fila. El secreto se guarda cifrado (AES-GCM).
// lastUsedStep evita reutilizar el mismo código dentro de su ventana.
export const adminTotp = pgTable('admin_totp', {
  id: text('id').primaryKey().default('admin'),
  secretEnc: text('secret_enc').notNull(),
  enabled: boolean('enabled').notNull().default(false),
  lastUsedStep: bigint('last_used_step', { mode: 'number' }).notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Códigos de recuperación de un solo uso (solo se guarda el hash).
export const adminRecoveryCodes = pgTable('admin_recovery_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  codeHash: text('code_hash').notNull().unique(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Dispositivos que ya pasaron el 2FA: no vuelven a pedirlo hasta que expiren.
export const adminTrustedDevices = pgTable('admin_trusted_devices', {
  id: uuid('id').primaryKey().defaultRandom(),
  tokenHash: text('token_hash').notNull().unique(),
  userAgent: text('user_agent').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
});

// Login a medias: contraseña correcta pero falta el código 2FA (vive 5 min).
export const admin2faPending = pgTable('admin_2fa_pending', {
  id: uuid('id').primaryKey().defaultRandom(),
  tokenHash: text('token_hash').notNull().unique(),
  failCount: integer('fail_count').notNull().default(0),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
});

export type AdminPasskeyRow = typeof adminPasskeys.$inferSelect;
export type AdminTrustedDeviceRow = typeof adminTrustedDevices.$inferSelect;

// Cambio de mail de contacto pendiente de confirmar (una sola fila).
export const adminEmailChange = pgTable('admin_email_change', {
  id: text('id').primaryKey().default('admin'),
  newEmail: text('new_email').notNull(),
  codeHash: text('code_hash').notNull(),
  failCount: integer('fail_count').notNull().default(0),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Últimos ingresos al panel (se guardan los 10 más recientes).
export const adminLoginLog = pgTable('admin_login_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  ip: text('ip').notNull().default(''),
  city: text('city').notNull().default(''),
  region: text('region').notNull().default(''),
  country: text('country').notNull().default(''),
  method: text('method').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
