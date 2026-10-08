import type { APIRoute } from 'astro';
import { fail, json } from '../../../../lib/admin-api';
import {
  currentTrustedDeviceId,
  listTrustedDevices,
} from '../../../../lib/admin-auth/trusted-device';
import {
  countRecoveryCodesLeft,
  isTwoFactorEnabled,
} from '../../../../lib/admin-auth/twofa-store';

export const GET: APIRoute = async ({ cookies }) => {
  try {
    const enabled = await isTwoFactorEnabled();
    if (!enabled) {
      return json({ ok: true, enabled: false, recoveryLeft: 0, devices: [] });
    }
    const currentId = await currentTrustedDeviceId(cookies);
    const devices = (await listTrustedDevices()).map((device) => ({
      ...device,
      current: device.id === currentId,
    }));
    return json({
      ok: true,
      enabled: true,
      recoveryLeft: await countRecoveryCodesLeft(),
      devices,
    });
  } catch (err) {
    return fail(err);
  }
};

export const prerender = false;
