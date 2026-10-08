import { reorderSocialLinks } from '../../../../db/queries';
import { reorderRoute } from '../../../../lib/admin-api';

export const { POST } = reorderRoute(reorderSocialLinks);
export const prerender = false;
