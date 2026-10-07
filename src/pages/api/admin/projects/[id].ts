// Endpoint para editar y borrar un proyecto puntual
import { deleteProject, updateProject } from '../../../../db/queries';
import {
  defined,
  flag,
  itemRoutes,
  requireText,
  strings,
  text,
} from '../../../../lib/admin-api';
import { translateFields } from '../../../../lib/translate';

export const { PATCH, DELETE } = itemRoutes({
  key: 'project',
  update: updateProject,
  remove: deleteProject,
  prepare: async (body) => {
    const titleEs = text(body, 'titleEs');
    const descriptionEs = text(body, 'descriptionEs');
    if (titleEs !== undefined)
      requireText(titleEs, 'El título no puede estar vacío');
    if (descriptionEs !== undefined) {
      requireText(descriptionEs, 'La descripción no puede estar vacía');
    }

    // Solo se traduce lo que cambió en este pedido; el inglés nunca viene del cliente.
    const { data, warning } = await translateFields(
      defined({ titleEs, descriptionEs }),
      ['titleEs', 'descriptionEs']
    );
    return {
      data: defined({
        titleEs,
        descriptionEs,
        ...data,
        repo: text(body, 'repo'),
        live: text(body, 'live'),
        technologies: strings(body, 'technologies'),
        images: strings(body, 'images'),
        featured: flag(body, 'featured'),
        hidden: flag(body, 'hidden'),
      }),
      warning,
    };
  },
});

export const prerender = false;
