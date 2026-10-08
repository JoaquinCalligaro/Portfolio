// Funciones de acceso a datos del portfolio (solo funcionan si hay DB configurada).
// Las lecturas devuelven vacío/null sin DB; las escrituras lanzan un error claro.
import { asc, eq, getTableColumns, sql } from 'drizzle-orm';
import type { PgTable, PgColumn } from 'drizzle-orm/pg-core';
import { db } from './client';
import {
  projects,
  siteProfile,
  socialLinks,
  techCategories,
  techs,
  education,
  type NewProjectRow,
  type ProfileRow,
} from './schema';

const NO_DB = 'La base de datos no está configurada';

function requireDb() {
  if (!db) throw new Error(NO_DB);
  return db;
}

// Tablas que tienen una columna `position` y se pueden reordenar.
type OrderedTable = PgTable & {
  id: PgColumn;
  position: PgColumn;
  updatedAt: PgColumn;
};

// Asigna `position` según el orden de los ids recibidos (botones subir/bajar).
export async function reorder(table: OrderedTable, ids: string[]) {
  const database = requireDb();
  await Promise.all(
    ids.map((id, index) =>
      database
        .update(table)
        .set({ position: index, updatedAt: new Date() })
        .where(eq(table.id, id))
    )
  );
}

// Posición para un elemento nuevo: al final de la lista.
async function nextPosition(
  table: OrderedTable,
  where?: ReturnType<typeof eq>
) {
  const database = requireDb();
  const query = database
    .select({ max: sql<number | null>`max(${table.position})` })
    .from(table);
  const rows = await (where ? query.where(where) : query);
  const max = rows[0]?.max;
  return typeof max === 'number' ? max + 1 : 0;
}

// ---------------------------------------------------------------- Proyectos

export async function listProjects() {
  if (!db) return [];
  return db.select().from(projects).orderBy(asc(projects.position));
}

export async function getProjectById(id: string) {
  if (!db) return null;
  const rows = await db.select().from(projects).where(eq(projects.id, id));
  return rows[0] ?? null;
}

export async function createProject(data: Omit<NewProjectRow, 'id'>) {
  const database = requireDb();
  const position = await nextPosition(projects);
  const rows = await database
    .insert(projects)
    .values({ ...data, position })
    .returning();
  return rows[0];
}

export async function updateProject(
  id: string,
  data: Partial<Omit<NewProjectRow, 'id'>>
) {
  const database = requireDb();
  const rows = await database
    .update(projects)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(projects.id, id))
    .returning();
  return rows[0] ?? null;
}

export async function deleteProject(id: string) {
  await requireDb().delete(projects).where(eq(projects.id, id));
}

export const reorderProjects = (ids: string[]) => reorder(projects, ids);

// ------------------------------------------------------------------- Perfil

export async function getProfile(): Promise<ProfileRow | null> {
  if (!db) return null;
  const rows = await db.select().from(siteProfile).where(eq(siteProfile.id, 1));
  return rows[0] ?? null;
}

export async function upsertProfile(
  data: Partial<Omit<ProfileRow, 'id' | 'updatedAt'>>
) {
  const database = requireDb();
  const values = { ...data, updatedAt: new Date() };
  const rows = await database
    .insert(siteProfile)
    .values({ id: 1, ...values })
    .onConflictDoUpdate({ target: siteProfile.id, set: values })
    .returning();
  return rows[0];
}

// ------------------------------------------------------ Redes sociales

export async function listSocialLinks() {
  if (!db) return [];
  return db.select().from(socialLinks).orderBy(asc(socialLinks.position));
}

export async function createSocialLink(
  data: Omit<typeof socialLinks.$inferInsert, 'id' | 'position'>
) {
  const database = requireDb();
  const position = await nextPosition(socialLinks);
  const rows = await database
    .insert(socialLinks)
    .values({ ...data, position })
    .returning();
  return rows[0];
}

export async function updateSocialLink(
  id: string,
  data: Partial<Omit<typeof socialLinks.$inferInsert, 'id'>>
) {
  const rows = await requireDb()
    .update(socialLinks)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(socialLinks.id, id))
    .returning();
  return rows[0] ?? null;
}

export async function deleteSocialLink(id: string) {
  await requireDb().delete(socialLinks).where(eq(socialLinks.id, id));
}

export const reorderSocialLinks = (ids: string[]) => reorder(socialLinks, ids);

// -------------------------------------------------- Tech stack (categorías)

export async function listTechCategories() {
  if (!db) return [];
  return db.select().from(techCategories).orderBy(asc(techCategories.position));
}

export async function listTechCategoriesWithTechs() {
  if (!db) return [];
  const [categories, allTechs] = await Promise.all([
    db.select().from(techCategories).orderBy(asc(techCategories.position)),
    db.select().from(techs).orderBy(asc(techs.position)),
  ]);
  return categories.map((category) => ({
    ...category,
    techs: allTechs.filter((tech) => tech.categoryId === category.id),
  }));
}

export async function createTechCategory(
  data: Omit<typeof techCategories.$inferInsert, 'id' | 'position'>
) {
  const database = requireDb();
  const position = await nextPosition(techCategories);
  const rows = await database
    .insert(techCategories)
    .values({ ...data, position })
    .returning();
  return rows[0];
}

export async function updateTechCategory(
  id: string,
  data: Partial<Omit<typeof techCategories.$inferInsert, 'id'>>
) {
  const rows = await requireDb()
    .update(techCategories)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(techCategories.id, id))
    .returning();
  return rows[0] ?? null;
}

export async function deleteTechCategory(id: string) {
  // Las tecnologías de la categoría se borran solas (ON DELETE CASCADE).
  await requireDb().delete(techCategories).where(eq(techCategories.id, id));
}

export const reorderTechCategories = (ids: string[]) =>
  reorder(techCategories, ids);

// ------------------------------------------------------ Tech stack (techs)

export async function createTech(
  data: Omit<typeof techs.$inferInsert, 'id' | 'position'>
) {
  const database = requireDb();
  const position = await nextPosition(
    techs,
    eq(techs.categoryId, data.categoryId)
  );
  const rows = await database
    .insert(techs)
    .values({ ...data, position })
    .returning();
  return rows[0];
}

export async function updateTech(
  id: string,
  data: Partial<Omit<typeof techs.$inferInsert, 'id'>>
) {
  const rows = await requireDb()
    .update(techs)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(techs.id, id))
    .returning();
  return rows[0] ?? null;
}

export async function deleteTech(id: string) {
  await requireDb().delete(techs).where(eq(techs.id, id));
}

export const reorderTechs = (ids: string[]) => reorder(techs, ids);

// ---------------------------------------------------------------- Educación

// Columnas de Educación sin el archivo del certificado (pesado).
function educationColumns() {
  const { certificateData: _data, ...columns } = getTableColumns(education);
  return columns;
}

// Lista sin el archivo del certificado (pesado); se sirve aparte.
export async function listEducation() {
  if (!db) return [];
  return db.select(educationColumns()).from(education).orderBy(asc(education.position));
}

export async function getEducationCertificate(id: string) {
  if (!db) return null;
  const rows = await db
    .select({
      mime: education.certificateMime,
      data: education.certificateData,
      hidden: education.hidden,
    })
    .from(education)
    .where(eq(education.id, id));
  return rows[0] ?? null;
}

export async function createEducation(
  data: Omit<typeof education.$inferInsert, 'id' | 'position'>
) {
  const database = requireDb();
  const position = await nextPosition(education);
  const rows = await database
    .insert(education)
    .values({ ...data, position })
    .returning({
      ...educationColumns(),
      // Limpia el borrador del archivo en el editor después de guardar.
      certificate: sql<string>`''`,
    });
  return rows[0];
}

export async function updateEducation(
  id: string,
  data: Partial<Omit<typeof education.$inferInsert, 'id'>>
) {
  const rows = await requireDb()
    .update(education)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(education.id, id))
    .returning({
      ...educationColumns(),
      // Limpia el borrador del archivo en el editor después de guardar.
      certificate: sql<string>`''`,
    });
  return rows[0] ?? null;
}

export async function deleteEducation(id: string) {
  await requireDb().delete(education).where(eq(education.id, id));
}

export const reorderEducation = (ids: string[]) => reorder(education, ids);
