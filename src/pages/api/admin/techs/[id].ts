import { deleteTech, updateTech } from '../../../../db/queries';
import {
  defined,
  flag,
  itemRoutes,
  requireText,
  text,
} from '../../../../lib/admin-api';
import { iconFields } from '../../../../lib/admin-icons';

export const { PATCH, DELETE } = itemRoutes({
  update: updateTech,
  remove: deleteTech,
  prepare: async (body) => {
    const name = text(body, 'name');
    if (name !== undefined) requireText(name, 'Poné el nombre de la tecnología');
    return {
      data: defined({
        name,
        categoryId: text(body, 'categoryId'),
        hidden: flag(body, 'hidden'),
        ...iconFields(body, { withColor: true }),
      }),
    };
  },
});

export const prerender = false;
