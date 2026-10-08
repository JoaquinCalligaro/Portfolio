Portfolio 

## Contenido editable

Todo el contenido personal (perfil, bio, redes, Tech Stack, Educación, proyectos) vive en la base de datos y se edita desde `/admin`. El inglés se traduce solo al guardar.

```bash
pnpm install
pnpm run db:push                # crea/actualiza las tablas
pnpm run migrate-site-content   # carga una sola vez el contenido inicial (idempotente)
pnpm dev
```
