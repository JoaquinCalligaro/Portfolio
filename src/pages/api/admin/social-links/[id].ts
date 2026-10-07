import { deleteSocialLink, updateSocialLink } from '../../../../db/queries';
import {
  defined,
  flag,
  itemRoutes,
  requireText,
  safeUrl,
  text,
} from '../../../../lib/admin-api';
import { iconFields } from '../../../../lib/admin-icons';

export const { PATCH, DELETE } = itemRoutes({
  update: updateSocialLink,
  remove: deleteSocialLink,
  prepare: async (body) => {
    const label = text(body, 'label');
    const url = text(body, 'url');
    if (label !== undefined) requireText(label, 'Poné el nombre de la red');
    if (url !== undefined) requireText(url, 'Poné el link de la red');
    return {
      data: defined({
        label,
        url: url ? safeUrl(url) : undefined,
        hidden: flag(body, 'hidden'),
        ...iconFields(body),
      }),
    };
  },
});

export const prerender = false;
