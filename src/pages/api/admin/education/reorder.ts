import { reorderEducation } from '../../../../db/queries';
import { reorderRoute } from '../../../../lib/admin-api';

export const { POST } = reorderRoute(reorderEducation);
export const prerender = false;
