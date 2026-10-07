import { createEducation, listEducation } from '../../../../db/queries';
import {
  collectionRoutes,
  flag,
  requireText,
  text,
} from '../../../../lib/admin-api';
import { educationData } from '../../../../lib/education-fields';

export const { GET, POST } = collectionRoutes({
  list: listEducation,
  create: createEducation,
  prepare: async (body) => {
    requireText(text(body, 'institution'), 'Poné la institución');
    const { data, warning } = await educationData(body);
    return { data: { hidden: flag(body, 'hidden') ?? false, ...data }, warning };
  },
});

export const prerender = false;
