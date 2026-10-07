// Esquema de la base de datos (Neon/Postgres): todo el contenido del portfolio
import {
  pgTable,
  text,
  boolean,
  integer,
  timestamp,
  uuid,
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
  hidden: boolean('hidden').notNull().default(false),
  position: integer('position').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type ProfileRow = typeof siteProfile.$inferSelect;
export type SocialLinkRow = typeof socialLinks.$inferSelect;
export type TechCategoryRow = typeof techCategories.$inferSelect;
export type TechRow = typeof techs.$inferSelect;
export type EducationRow = typeof education.$inferSelect;
