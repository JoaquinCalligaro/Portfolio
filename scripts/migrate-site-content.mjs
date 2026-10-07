// Migración única: sube a Neon (y Cloudinary) el contenido que antes estaba
// fijo en el código: perfil, bio, redes, Tech Stack y Educación.
// Es idempotente: si una sección ya tiene datos en la base, se saltea.
// Los archivos que necesita (foto, CV, íconos) están en scripts/seed-assets/.
//
// Antes: pnpm run db:push   (crea las tablas nuevas)
// Uso:   pnpm run migrate-site-content
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
const SEED_DIR = path.resolve(import.meta.dirname, 'seed-assets');
const ASSETS_FOLDER = 'portfolio-assets';

const CONTENT_TYPES = {
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
};

// Sube un archivo de scripts/seed-assets a Cloudinary (firma SHA1, igual que
// el endpoint /api/admin/upload). kind: 'image' o 'raw' (PDF).
async function uploadAsset(relativePath, kind = 'image') {
  const absolutePath = path.join(SEED_DIR, relativePath);
  const buffer = await readFile(absolutePath);
  const ext = path.extname(relativePath).toLowerCase();
  const file = new File([buffer], path.basename(relativePath), {
    type: CONTENT_TYPES[ext] ?? 'application/octet-stream',
  });

  const timestamp = Math.floor(Date.now() / 1000);
  const signed = {
    folder: ASSETS_FOLDER,
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
    .update(paramsToSign + CLOUDINARY_API_SECRET)
    .digest('hex');

  const form = new FormData();
  form.append('file', file);
  form.append('api_key', CLOUDINARY_API_KEY);
  form.append('signature', signature);
  for (const [key, value] of Object.entries(signed)) form.append(key, value);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${kind}/upload`,
    { method: 'POST', body: form }
  );
  if (!res.ok) {
    throw new Error(`Error subiendo ${relativePath}: ${await res.text()}`);
  }
  return (await res.json()).secure_url;
}

// ---------------------------------------------------------------- Contenido
// Textos copiados tal cual de src/data/translations/{es,en}.ts y src/data/techs.ts

const PROFILE = {
  name: 'Joaquin Calligaro',
  headlineEs:
    'Hola, soy un desarrollador front-end que disfruta transformar ideas en interfaces claras y funcionales. ' +
    'Actualmente exploro proyectos web y móviles con un estilo moderno y enfocado en la experiencia del usuario. ' +
    'Te invito a ver mi trabajo.',
  headlineEn:
    'Hello, I am a front-end developer who enjoys turning ideas into clear and functional interfaces. ' +
    'Currently, I am exploring web and mobile projects with a modern style focused on user experience. ' +
    'I invite you to check out my work.',
  bioEs: [
    'Soy de La Rioja, Argentina, tengo 24 años y comencé a incursionar en el desarrollo web en 2022, aunque desde chico siempre me atrajo la tecnología. Me anoté en una carrera de Técnicatura Universitaria en Programación en la Universidad Tecnológica Nacional en Argentina.',
    'En mis tiempos libres me gusta diseñar, estructurar y aprender constantemente, creando cosas nuevas que me desafíen.',
    'Busco aportar mis conocimientos en proyectos colaborativos, recibir feedback de otros desarrolladores y así mejorar mis habilidades.',
    'Mi meta actual es crecer como front-end developer, pero también ampliar mi experiencia hacia fullstack, mobile e integraciones de IA para servicios web.',
    'Actualmente estudio inglés además cuento con un certificado de nivel A2, con la meta de seguir avanzando.',
  ],
  bioEn: [
    'I am from La Rioja, Argentina, I am 24 years old and I started venturing into web development in 2022, although technology has always attracted me since I was a child. I enrolled in a University Technical Program in Programming at the National Technological University in Argentina.',
    'In my free time I like to design, structure, and constantly learn, creating new things that challenge me.',
    'I seek to contribute my knowledge in collaborative projects, receive feedback from other developers, and thus improve my skills.',
    'My current goal is to grow as a front-end developer, but also expand my experience towards backend and mobile.',
    'I am currently studying English and have an A2 level certificate, with the goal of continuing to advance.',
  ],
};

// LinkedIn no está en Simple Icons: se sube el SVG (scripts/seed-assets/linkedin.svg).
const SOCIAL_LINKS = [
  {
    label: 'GitHub',
    url: 'https://github.com/JoaquinCalligaro',
    iconSlug: 'github',
    iconFile: null,
  },
  {
    label: 'LinkedIn',
    url: 'https://www.linkedin.com/in/joaquincalligaro/',
    iconSlug: '',
    iconFile: 'linkedin.svg',
  },
];

// Cada tecnología sube su SVG actual (algunos, como Photoshop o VS Code, no
// existen en Simple Icons), así el sitio se ve idéntico.
const TECH_CATEGORIES = [
  {
    nameEs: 'Front-end',
    nameEn: 'Front-end',
    techs: [
      { name: 'HTML5', hex: '#E34F26', icon: 'html.svg' },
      { name: 'CSS3', hex: '#1572B6', icon: 'css.svg' },
      { name: 'Sass', hex: '#CC6699', icon: 'sass.svg' },
      { name: 'Tailwind CSS', hex: '#06B6D4', icon: 'tailwindcss.svg' },
      { name: 'JavaScript', hex: '#F7DF1E', icon: 'javascript.svg' },
      { name: 'TypeScript', hex: '#3178C6', icon: 'typescript.svg' },
      { name: 'React', hex: '#61DAFB', icon: 'react.svg' },
      { name: 'Astro', hex: '#FF5E00', icon: 'astro-logo.svg' },
    ],
  },
  {
    nameEs: 'Bases de datos',
    nameEn: 'Database',
    techs: [{ name: 'SQL', hex: '#4479A1', icon: 'mysql.svg' }],
  },
  {
    nameEs: 'Herramientas',
    nameEn: 'Tools',
    techs: [
      { name: 'Git', hex: '#F1502F', icon: 'github.svg' },
      { name: 'VSCode', hex: '#007ACC', icon: 'vscode.svg' },
      { name: 'Postman', hex: '#FF6C37', icon: 'postman.svg' },
    ],
  },
  {
    nameEs: 'Herramientas de diseño',
    nameEn: 'Design Tools',
    techs: [
      { name: 'Figma', hex: '#F24E1E', icon: 'figma.svg' },
      { name: 'Adobe Photoshop', hex: '#31A8FF', icon: 'photohop.svg' },
      { name: 'Canva', hex: '#00C4CC', icon: 'canva.svg' },
    ],
  },
];

// La institución no se traduce: se usa el nombre en español.
const EDUCATION = [
  {
    institution: 'British Institute La Rioja',
    datesEs: 'Enero 2024 - Diciembre 2024 (FINALIZADO)',
    datesEn: 'January 2024 - December 2024 (COMPLETED)',
    descriptionEs:
      'Finalicé mis estudios de nivel A2 de inglés, mejorando mis habilidades de comunicación y comprensión en el idioma.',
    descriptionEn:
      'Completed my A2 level English studies, improving my communication and comprehension skills in the language.',
    iconKey: 'university',
  },
  {
    institution: 'Universidad Técnologica Nacional (UTN)',
    datesEs: 'Febrero 2022 - Septiembre 2024 (FINALIZADO)',
    datesEn: 'February 2022 - September 2024 (COMPLETED)',
    descriptionEs:
      'Finalicé la carrera de Técnico Universitario en Programación, adquiriendo conocimientos sólidos en desarrollo de software, algoritmos y estructuras de datos.',
    descriptionEn:
      'Completed the University Technical Program in Programming, acquiring solid knowledge in software development, algorithms and data structures.',
    iconKey: 'university',
  },
  {
    institution: 'Brigadier Gral. Juan Facundo Quiroga (EPET N°2)',
    datesEs: 'Febrero 2013 - Diciembre 2019 (FINALIZADO)',
    datesEn: 'February 2013 - December 2019 (COMPLETED)',
    descriptionEs:
      'Completé mis estudios secundarios con conocimientos en tecnologias de control (robotica) y programación básica.',
    descriptionEn:
      'Completed my secondary studies with knowledge in control technologies (robotics) and basic programming.',
    iconKey: 'university',
  },
];

// ------------------------------------------------------------------ Secciones

async function countRows(table) {
  const rows = await sql.query(`SELECT count(*)::int AS n FROM ${table}`);
  return rows[0].n;
}

async function migrateProfile() {
  if ((await countRows('site_profile')) > 0) {
    console.log('- Perfil: ya existe, se saltea.');
    return;
  }
  console.log('Subiendo foto y CV...');
  const photoUrl = await uploadAsset('me.webp');
  const cvUrl = await uploadAsset('cv.pdf', 'raw');

  await sql`
    INSERT INTO site_profile (id, name, headline_es, headline_en, photo_url, cv_url, bio_es, bio_en)
    VALUES (1, ${PROFILE.name}, ${PROFILE.headlineEs}, ${PROFILE.headlineEn},
            ${photoUrl}, ${cvUrl}, ${PROFILE.bioEs}, ${PROFILE.bioEn})
  `;
  console.log('✔ Perfil migrado (nombre, presentación, foto, CV y bio).');
}

async function migrateSocialLinks() {
  if ((await countRows('social_links')) > 0) {
    console.log('- Redes: ya hay datos, se saltea.');
    return;
  }
  const prepared = [];
  for (const link of SOCIAL_LINKS) {
    const iconUrl = link.iconFile ? await uploadAsset(link.iconFile) : '';
    prepared.push({ ...link, iconUrl });
  }
  for (const [index, link] of prepared.entries()) {
    await sql`
      INSERT INTO social_links (label, url, icon_slug, icon_url, position)
      VALUES (${link.label}, ${link.url}, ${link.iconSlug}, ${link.iconUrl}, ${index})
    `;
  }
  console.log(`✔ Redes migradas (${prepared.length}).`);
}

async function migrateTechStack() {
  if ((await countRows('tech_categories')) > 0) {
    console.log('- Tech Stack: ya hay datos, se saltea.');
    return;
  }
  // Primero se suben todos los íconos y recién después se escribe en la base.
  const prepared = [];
  for (const category of TECH_CATEGORIES) {
    const techs = [];
    for (const tech of category.techs) {
      console.log(`Subiendo ícono de ${tech.name}...`);
      techs.push({ ...tech, iconUrl: await uploadAsset(`tech/${tech.icon}`) });
    }
    prepared.push({ ...category, techs });
  }

  let techCount = 0;
  for (const [catIndex, category] of prepared.entries()) {
    const inserted = await sql`
      INSERT INTO tech_categories (name_es, name_en, position)
      VALUES (${category.nameEs}, ${category.nameEn}, ${catIndex})
      RETURNING id
    `;
    const categoryId = inserted[0].id;
    for (const [techIndex, tech] of category.techs.entries()) {
      await sql`
        INSERT INTO techs (category_id, name, icon_slug, icon_url, color, position)
        VALUES (${categoryId}, ${tech.name}, ${''}, ${tech.iconUrl}, ${tech.hex}, ${techIndex})
      `;
      techCount++;
    }
  }
  console.log(
    `✔ Tech Stack migrado (${prepared.length} categorías, ${techCount} tecnologías).`
  );
}

async function migrateEducation() {
  if ((await countRows('education')) > 0) {
    console.log('- Educación: ya hay datos, se saltea.');
    return;
  }
  for (const [index, item] of EDUCATION.entries()) {
    await sql`
      INSERT INTO education (institution, dates_es, dates_en, description_es, description_en, icon_key, position)
      VALUES (${item.institution}, ${item.datesEs}, ${item.datesEn},
              ${item.descriptionEs}, ${item.descriptionEn}, ${item.iconKey}, ${index})
    `;
  }
  console.log(`✔ Educación migrada (${EDUCATION.length} entradas).`);
}

async function main() {
  const missing = [];
  for (const table of [
    'site_profile',
    'social_links',
    'tech_categories',
    'techs',
    'education',
  ]) {
    const rows = await sql`SELECT to_regclass(${`public.${table}`}) AS found`;
    if (!rows[0].found) missing.push(table);
  }
  if (missing.length > 0) {
    console.error(
      `Faltan tablas en la base (${missing.join(', ')}). Corré primero: pnpm run db:push`
    );
    process.exit(1);
  }

  await migrateProfile();
  await migrateSocialLinks();
  await migrateTechStack();
  await migrateEducation();
  console.log('\nListo. Ya podés editar todo desde /admin.');
}

main().catch((err) => {
  console.error('Error en la migración:', err);
  process.exit(1);
});
