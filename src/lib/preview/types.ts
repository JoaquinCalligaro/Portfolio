// Borrador que manda el panel admin para previsualizar un cambio sin guardarlo.
export const DRAFT_SECTIONS = [
  'profile',
  'socialLinks',
  'techCategories',
  'techs',
  'education',
  'projects',
] as const;

export type DraftSection = (typeof DRAFT_SECTIONS)[number];

export interface Draft {
  section: DraftSection;
  // Sin id = elemento nuevo (todavía no existe en la base).
  id?: string;
  // Categoría a la que pertenece (solo para `techs`).
  parentId?: string;
  values: Record<string, unknown>;
  hidden?: boolean;
}

export class DraftError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}
