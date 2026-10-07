import { reorderProjects } from '../../../../db/queries';
import { reorderRoute } from '../../../../lib/admin-api';

export const { POST } = reorderRoute(reorderProjects);
export const prerender = false;
