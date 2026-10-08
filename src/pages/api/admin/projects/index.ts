// Endpoint para listar y crear proyectos
import { createProject, listProjects } from '../../../../db/queries';
import {
  collectionRoutes,
  flag,
  requireText,
  strings,
  text,
} from '../../../../lib/admin-api';
import { translateFields } from '../../../../lib/translate';

export const { GET, POST } = collectionRoutes({
  list: listProjects,
  create: createProject,
  prepare: async (body) => {
    const titleEs = requireText(
      text(body, 'titleEs'),
      'Faltan campos obligatorios'
    );
    const descriptionEs = requireText(
      text(body, 'descriptionEs'),
      'Faltan campos obligatorios'
    );
    // El inglés siempre se genera desde el español; nunca viene del cliente.
    const { data, warning } = await translateFields(
      { titleEs, descriptionEs },
      ['titleEs', 'descriptionEs']
    );
    return {
      data: {
        titleEs,
        descriptionEs,
        ...data,
        repo: text(body, 'repo') ?? '',
        live: text(body, 'live') ?? '',
        technologies: strings(body, 'technologies') ?? [],
        images: strings(body, 'images') ?? [],
        featured: flag(body, 'featured') ?? false,
        hidden: flag(body, 'hidden') ?? false,
      },
      warning,
    };
  },
});

export const prerender = false;
