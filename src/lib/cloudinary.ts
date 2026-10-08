// Subida de imágenes y archivos a Cloudinary (firmada desde el servidor, sin exponer el secreto)
import { env } from './env';
import { createHash } from 'node:crypto';

export const isCloudinaryConfigured = Boolean(
  env('CLOUDINARY_CLOUD_NAME') &&
  env('CLOUDINARY_API_KEY') &&
  env('CLOUDINARY_API_SECRET')
);

export type UploadKind = 'image' | 'raw';

// Carpetas: las imágenes de proyectos van en portfolio-projects; fotos, íconos
// y el CV (archivos "raw", como PDF) van en portfolio-assets.
export const PROJECTS_FOLDER = 'portfolio-projects';
export const ASSETS_FOLDER = 'portfolio-assets';

export async function uploadToCloudinary(
  file: File,
  options: { kind?: UploadKind; folder?: string } = {}
): Promise<string> {
  const cloudName = env('CLOUDINARY_CLOUD_NAME');
  const apiKey = env('CLOUDINARY_API_KEY');
  const apiSecret = env('CLOUDINARY_API_SECRET');

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary no está configurado');
  }

  const kind = options.kind ?? 'image';
  const folder = options.folder ?? PROJECTS_FOLDER;
  const timestamp = Math.floor(Date.now() / 1000);

  // Los parámetros firmados van en orden alfabético. En los archivos raw se
  // conserva el nombre original (con extensión) para que el link termine en .pdf.
  const signed: Record<string, string> = {
    folder,
    timestamp: String(timestamp),
    ...(kind === 'raw'
      ? { unique_filename: 'true', use_filename: 'true' }
      : {}),
  };
  const paramsToSign = Object.keys(signed)
    .sort()
    .map((key) => `${key}=${signed[key]}`)
    .join('&');
  const signature = createHash('sha1')
    .update(paramsToSign + apiSecret)
    .digest('hex');

  const uploadForm = new FormData();
  uploadForm.append('file', file);
  uploadForm.append('api_key', apiKey);
  uploadForm.append('signature', signature);
  for (const [key, value] of Object.entries(signed)) {
    uploadForm.append(key, value);
  }

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${kind}/upload`,
    { method: 'POST', body: uploadForm }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Error subiendo archivo a Cloudinary: ${text}`);
  }

  const data = (await response.json()) as { secure_url: string };
  return data.secure_url;
}

export const uploadImageToCloudinary = (file: File) => uploadToCloudinary(file);
