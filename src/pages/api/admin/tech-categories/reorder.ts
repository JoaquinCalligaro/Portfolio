import { reorderTechCategories } from '../../../../db/queries';
import { reorderRoute } from '../../../../lib/admin-api';

export const { POST } = reorderRoute(reorderTechCategories);
export const prerender = false;
