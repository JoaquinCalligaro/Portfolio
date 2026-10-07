// Funciones de acceso a datos para los proyectos (solo se usan si hay DB configurada)
import { eq } from 'drizzle-orm';
import { db } from './client';
import { projects, type NewProjectRow } from './schema';

export async function listProjects() {
  if (!db) return [];
  return db.select().from(projects).orderBy(projects.position);
}

export async function getProjectById(id: string) {
  if (!db) return null;
  const rows = await db.select().from(projects).where(eq(projects.id, id));
  return rows[0] ?? null;
}

export async function createProject(data: Omit<NewProjectRow, 'id'>) {
  if (!db) throw new Error('La base de datos no está configurada');
  const rows = await db.insert(projects).values(data).returning();
  return rows[0];
}

export async function updateProject(
  id: string,
  data: Partial<Omit<NewProjectRow, 'id'>>
) {
  if (!db) throw new Error('La base de datos no está configurada');
  const rows = await db
    .update(projects)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(projects.id, id))
    .returning();
  return rows[0] ?? null;
}

export async function deleteProject(id: string) {
  if (!db) throw new Error('La base de datos no está configurada');
  await db.delete(projects).where(eq(projects.id, id));
}
