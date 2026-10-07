import { createTech } from '../../../../db/queries';
import {
  collectionRoutes,
  flag,
  requireText,
  text,
} from '../../../../lib/admin-api';
import { iconFields } from '../../../../lib/admin-icons';

export const { POST } = collectionRoutes({
  list: async () => [],
  create: createTech,
  prepare: async (body) => ({
    data: {
      categoryId: requireText(text(body, 'categoryId'), 'Falta la categoría'),
      name: requireText(text(body, 'name'), 'Poné el nombre de la tecnología'),
      hidden: flag(body, 'hidden') ?? false,
      ...iconFields(body, { withColor: true }),
    },
  }),
});

export const prerender = false;
