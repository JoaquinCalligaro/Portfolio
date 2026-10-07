import {
  createTechCategory,
  listTechCategoriesWithTechs,
} from '../../../../db/queries';
import { collectionRoutes, requireText, text } from '../../../../lib/admin-api';
import { translateFields } from '../../../../lib/translate';

export const { GET, POST } = collectionRoutes({
  list: listTechCategoriesWithTechs,
  create: createTechCategory,
  prepare: async (body) => {
    const nameEs = requireText(text(body, 'nameEs'), 'Poné el nombre de la categoría');
    const { data, warning } = await translateFields({ nameEs }, ['nameEs']);
    return { data: { nameEs, ...data }, warning };
  },
});

export const prerender = false;
