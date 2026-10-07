// Carga todo el contenido público desde la base. Si la base no está configurada
// (o una consulta falla, por ejemplo porque todavía no se hizo db:push), esa
// parte queda vacía en vez de romper la página.
import {
  getProfile,
  listEducation,
  listProjects,
  listSocialLinks,
  listTechCategoriesWithTechs,
} from '../db/queries';

async function safe<T>(
  label: string,
  run: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await run();
  } catch (err) {
    console.error(`[site-data] no se pudo leer ${label}:`, err);
    return fallback;
  }
}

export async function loadSiteData() {
  const [profile, socialLinks, techCategories, education, projects] =
    await Promise.all([
      safe('el perfil', getProfile, null),
      safe('las redes', listSocialLinks, []),
      safe('el tech stack', listTechCategoriesWithTechs, []),
      safe('la educación', listEducation, []),
      safe('los proyectos', listProjects, []),
    ]);

  return {
    profile,
    socialLinks: socialLinks.filter((link) => !link.hidden),
    techCategories: techCategories
      .map((category) => ({
        ...category,
        techs: category.techs.filter((tech) => !tech.hidden),
      }))
      .filter((category) => category.techs.length > 0),
    education: education.filter((item) => !item.hidden),
    projects,
  };
}

export type SiteData = Awaited<ReturnType<typeof loadSiteData>>;
