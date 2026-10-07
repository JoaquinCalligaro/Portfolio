// Migración única: sube los proyectos fijos del código (projectsData.ts) a
// Neon, subiendo sus imágenes a Cloudinary en el proceso.
// Uso: pnpm run migrate-static-projects
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (
  !DATABASE_URL ||
  !CLOUDINARY_CLOUD_NAME ||
  !CLOUDINARY_API_KEY ||
  !CLOUDINARY_API_SECRET
) {
  console.error(
    'Faltan variables de entorno. Necesitás DATABASE_URL, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET en tu .env'
  );
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const ASSETS_DIR = path.resolve(import.meta.dirname, '../src/assets/images');

async function uploadImage(relativePath) {
  const absolutePath = path.join(ASSETS_DIR, relativePath);
  const buffer = await readFile(absolutePath);
  const file = new File([buffer], path.basename(relativePath), {
    type: 'image/webp',
  });

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = 'portfolio-projects';
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
  const signature = createHash('sha1').update(paramsToSign).digest('hex');

  const form = new FormData();
  form.append('file', file);
  form.append('api_key', CLOUDINARY_API_KEY);
  form.append('timestamp', String(timestamp));
  form.append('signature', signature);
  form.append('folder', folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: form }
  );
  if (!res.ok) {
    throw new Error(`Error subiendo ${relativePath}: ${await res.text()}`);
  }
  const data = await res.json();
  return data.secure_url;
}

// Mismos datos que src/components/my-projects/projectsData.ts y las traducciones es/en
const projects = [
  {
    id: 'background-generator',
    titleEs: 'Background Generator',
    titleEn: 'Background Generator',
    descriptionEs:
      'Generador de fondos animados con múltiples diseños predefinidos y más de 26 animaciones personalizables en tiempo real.',
    descriptionEn:
      'Animated background generator with multiple presets and 26+ customizable animations.',
    repo: 'https://github.com/JoaquinCalligaro/Background-Generator',
    live: 'https://background-generator-final.netlify.app/',
    technologies: ['html', 'css', 'tailwind', 'javascript', 'typescript', 'react'],
    images: [
      'BackgroundGenerator/Bg-Generator.webp',
      'BackgroundGenerator/Bg-Generator-2.webp',
      'BackgroundGenerator/Bg-Generator-3.webp',
    ],
    hidden: false,
  },
  {
    id: 'organic-store',
    titleEs: 'Organic Store',
    titleEn: 'Organic Store',
    descriptionEs:
      'Tienda en línea de productos orgánicos y saludables, con catálogo claro y ordenado. Diseñada para una navegación simple y una experiencia de compra agradable.',
    descriptionEn:
      'Simple online store for organic products with a clean catalog and easy navigation.',
    repo: 'https://github.com/JoaquinCalligaro/Organic-Store',
    live: 'https://joaquincalligaro.github.io/Organic-Store/index.html',
    technologies: ['html', 'css'],
    images: [
      'OrganicStore/organic-store-1.webp',
      'OrganicStore/organic-store-2.webp',
      'OrganicStore/organic-store-3.webp',
      'OrganicStore/organic-store-4.webp',
      'OrganicStore/organic-store-5.webp',
    ],
    hidden: false,
  },
  {
    id: 'password-generator',
    titleEs: 'Generador de contraseñas',
    titleEn: 'Password Generator',
    descriptionEs:
      'Generador de contraseñas seguras con interfaz moderna.Incluye sistema de fortaleza visual, modo oscuro/claro automático y animaciones fluidas.',
    descriptionEn:
      'Secure password generator with a modern interface. Includes a visual strength indicator, automatic dark/light mode, and smooth animations.',
    repo: 'https://github.com/JoaquinCalligaro/Password-Generator',
    live: 'https://password-generatorjc.netlify.app/',
    technologies: ['html', 'css', 'tailwind', 'javascript', 'typescript'],
    images: [
      'password-generator/password-generator-1.webp',
      'password-generator/password-generator-2.webp',
      'password-generator/password-generator-3.webp',
    ],
    hidden: false,
  },
  {
    id: 'gif-app',
    titleEs: 'Gif App',
    titleEn: 'Gif App',
    descriptionEs:
      'Aplicación Gif-App es una aplicación web que permite a los usuarios buscar, ver y compartir GIFs fácilmente. Utiliza la API de GIPHY para obtener GIFs en tendencia y populares',
    descriptionEn:
      'Gif-App is a web application that allows users to search, view, and share GIFs easily. It uses the GIPHY API to fetch trending and popular GIFs',
    repo: 'https://github.com/JoaquinCalligaro/Gif-App',
    live: 'https://gif-app-beta.netlify.app/',
    technologies: ['html', 'css', 'tailwind', 'javascript', 'typescript', 'react'],
    images: [
      'gif-app/gif-app-1.webp',
      'gif-app/gif-app-2.webp',
      'gif-app/gif-app-3.webp',
    ],
    hidden: false,
  },
  {
    id: 'todolist',
    titleEs: 'To do list App',
    titleEn: 'To do list App',
    descriptionEs:
      'Permite agregar, marcar como completadas y eliminar tareas. Los datos se guardan en localStorage y cuenta con modo claro/oscuro para una mejor experiencia.',
    descriptionEn:
      'Allows users to add, mark as completed, and delete tasks. Data is saved in localStorage and it includes a light/dark mode for a better experience.',
    repo: 'https://github.com/JoaquinCalligaro/To-Do-List',
    live: 'https://joaquincalligaro.github.io/To-Do-List/',
    technologies: ['html', 'css', 'tailwind', 'javascript'],
    images: [
      'to-do-list/to-do-list-1.webp',
      'to-do-list/to-do-list-2.webp',
      'to-do-list/to-do-list-3.webp',
      'to-do-list/to-do-list-4.webp',
      'to-do-list/to-do-list-5.webp',
    ],
    hidden: true,
  },
  {
    id: 'calculator',
    titleEs: 'Calculadora',
    titleEn: 'Calculator',
    descriptionEs:
      'Una calculadora sencilla desarrollada con HTML, CSS, Tailwind y JS. Permite realizar operaciones básicas en una interfaz moderna, responsiva y minimalista.',
    descriptionEn:
      'A simple calculator built with HTML, CSS, Tailwind, and JavaScript. It allows performing basic operations within a modern, responsive, and minimalistic interface.',
    repo: 'https://github.com/JoaquinCalligaro/Javascript-Calculator',
    live: 'https://javascript6-calculator.netlify.app/',
    technologies: ['html', 'css', 'tailwind', 'javascript'],
    images: [
      'js-calculator/js-calculator-1.webp',
      'js-calculator/js-calculator-2.webp',
    ],
    hidden: true,
  },
];

async function main() {
  const existing = await sql`SELECT title_es FROM projects`;
  if (existing.length > 0) {
    console.log(
      `Ya hay ${existing.length} proyecto(s) en la base de datos. Para evitar duplicados, este script no corre de nuevo. Si igual querés correrlo, borrá los proyectos desde el panel /admin primero.`
    );
    process.exit(0);
  }

  for (const [index, project] of projects.entries()) {
    console.log(`Subiendo imágenes de "${project.titleEs}"...`);
    const uploadedUrls = [];
    for (const img of project.images) {
      uploadedUrls.push(await uploadImage(img));
    }

    await sql`
      INSERT INTO projects (
        title_es, title_en, description_es, description_en,
        repo, live, technologies, images, featured, hidden, position
      ) VALUES (
        ${project.titleEs}, ${project.titleEn}, ${project.descriptionEs}, ${project.descriptionEn},
        ${project.repo}, ${project.live}, ${project.technologies}, ${uploadedUrls}, ${false}, ${project.hidden}, ${index}
      )
    `;
    console.log(`✔ "${project.titleEs}" migrado (${uploadedUrls.length} imágenes)`);
  }

  console.log('\nListo. Tus 6 proyectos ya están en la base de datos.');
}

main().catch((err) => {
  console.error('Error en la migración:', err);
  process.exit(1);
});
