import { deleteTechCategory, updateTechCategory } from '../../../../db/queries';
import { itemRoutes, requireText, text } from '../../../../lib/admin-api';
import { translateFields } from '../../../../lib/translate';

export const { PATCH, DELETE } = itemRoutes({
  update: updateTechCategory,
  remove: deleteTechCategory,
  prepare: async (body) => {
    const nameEs = requireText(text(body, 'nameEs'), 'Poné el nombre de la categoría');
    const { data, warning } = await translateFields({ nameEs }, ['nameEs']);
    return { data: { nameEs, ...data }, warning };
  },
});

export const prerender = false;
