import { reorderTechs } from '../../../../db/queries';
import { reorderRoute } from '../../../../lib/admin-api';

export const { POST } = reorderRoute(reorderTechs);
export const prerender = false;
