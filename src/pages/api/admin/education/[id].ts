import { deleteEducation, updateEducation } from '../../../../db/queries';
import { defined, flag, itemRoutes, requireText, text } from '../../../../lib/admin-api';
import { educationData } from '../../../../lib/education-fields';

export const { PATCH, DELETE } = itemRoutes({
  update: updateEducation,
  remove: deleteEducation,
  prepare: async (body) => {
    const institution = text(body, 'institution');
    if (institution !== undefined) requireText(institution, 'Poné la institución');
    const { data, warning } = await educationData(body);
    return { data: defined({ ...data, hidden: flag(body, 'hidden') }), warning };
  },
});

export const prerender = false;
