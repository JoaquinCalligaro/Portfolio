import {
  createSocialLink,
  listSocialLinks,
} from '../../../../db/queries';
import {
  collectionRoutes,
  flag,
  requireText,
  safeUrl,
  text,
} from '../../../../lib/admin-api';
import { iconFields } from '../../../../lib/admin-icons';

export const { GET, POST } = collectionRoutes({
  list: listSocialLinks,
  create: createSocialLink,
  prepare: async (body) => ({
    data: {
      label: requireText(text(body, 'label'), 'Poné el nombre de la red'),
      url: safeUrl(requireText(text(body, 'url'), 'Poné el link de la red')),
      hidden: flag(body, 'hidden') ?? false,
      ...iconFields(body),
    },
  }),
});

export const prerender = false;
