// Esquema de la base de datos (Neon/Postgres) para los proyectos del portfolio
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
