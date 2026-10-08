import { useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { toast } from 'sonner';
import { Button, ButtonLink } from '@/components/ui/shadcn/button';
import { cardClass } from '@/components/ui/shadcn/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/shadcn/alert-dialog';
import { cn } from '@/lib/utils';
import { MotionRoot } from './MotionRoot';
import { MorphGlyph } from './MorphGlyph';
import { announceChange, request } from './api';
import { SPRING, enterTransition, statusTransition } from './motion';

export type ProjectSummary = {
  id: string;
  titleEs: string;
  descriptionEs: string;
  featured: boolean;
  hidden: boolean;
};

export default function ProjectsList({
  projects: initial,
}: {
  projects: ProjectSummary[];
}) {
  const [projects, setProjects] = useState(initial);
  const [pending, setPending] = useState('');

  const fail = (message?: string) => toast.error(message ?? 'No se pudo guardar');

  const change = async (id: string, changes: Partial<ProjectSummary>) => {
    setPending(id);
    const result = await request(`/api/admin/projects/${id}`, 'PATCH', changes);
    setPending('');
    if (!result.ok) return fail(result.error);
    setProjects((current) =>
      current.map((p) => (p.id === id ? { ...p, ...changes } : p))
    );
    announceChange(result);
  };

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= projects.length) return;
    const next = [...projects];
    [next[index], next[target]] = [next[target], next[index]];
    setProjects(next);
    const result = await request('/api/admin/projects/reorder', 'POST', {
      ids: next.map((p) => p.id),
    });
    if (!result.ok) {
      setProjects(projects);
      return fail(result.error);
    }
    announceChange(result);
  };

  const remove = async (id: string) => {
    setPending(id);
    const result = await request(`/api/admin/projects/${id}`, 'DELETE');
    setPending('');
    if (!result.ok) return fail(result.error);
    setProjects((current) => current.filter((p) => p.id !== id));
    toast.success('Proyecto borrado');
    announceChange(result);
  };

  return (
    <MotionRoot>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-300">
          {projects.length === 1 ? '1 proyecto' : `${projects.length} proyectos`}
        </p>
        <ButtonLink href="/admin/projects/new">
          <MorphGlyph name="plus" />
          Nuevo proyecto
        </ButtonLink>
      </div>

      <AnimatePresence initial={false}>
        {projects.length === 0 && (
          <m.p
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={statusTransition}
            className="rounded-xl border border-dashed border-white/15 p-8 text-center text-gray-300"
          >
            Todavía no agregaste ningún proyecto.
          </m.p>
        )}
      </AnimatePresence>

      <ul className="m-0 grid grid-cols-1 gap-4 p-0 sm:grid-cols-2">
        <AnimatePresence initial={false}>
          {projects.map((project, index) => (
            <m.li
              key={project.id}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{
                ...enterTransition,
                delay: Math.min(index, 6) * 0.06,
                layout: SPRING,
              }}
              className={cn(
                cardClass,
                'flex list-none flex-col gap-3 p-4',
                project.hidden && 'opacity-60'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-medium text-white">{project.titleEs}</h2>
                <span className="flex shrink-0 gap-1.5">
                  {project.featured && (
                    <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-xs text-cyan-200">
                      Destacado
                    </span>
                  )}
                  {project.hidden && (
                    <span className="rounded-full bg-amber-200/10 px-2 py-0.5 text-xs text-amber-200">
                      Oculto
                    </span>
                  )}
                </span>
              </div>
              <p className="line-clamp-2 text-sm text-gray-300">
                {project.descriptionEs}
              </p>
              <div className="mt-auto flex flex-wrap gap-2 pt-2">
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Subir"
                  aria-disabled={index === 0}
                  className="aria-disabled:cursor-not-allowed aria-disabled:opacity-40"
                  onClick={() => void move(index, -1)}
                >
                  <MorphGlyph name="up" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Bajar"
                  aria-disabled={index === projects.length - 1}
                  className="aria-disabled:cursor-not-allowed aria-disabled:opacity-40"
                  onClick={() => void move(index, 1)}
                >
                  <MorphGlyph name="down" />
                </Button>
                <ButtonLink
                  href={`/admin/projects/edit/${project.id}`}
                  variant="outline"
                  size="sm"
                >
                  Editar
                </ButtonLink>
                <Button
                  variant="outline"
                  size="sm"
                  aria-pressed={project.featured}
                  disabled={pending === project.id}
                  onClick={() =>
                    void change(project.id, { featured: !project.featured })
                  }
                >
                  {project.featured ? 'Quitar destacado' : 'Destacar'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  aria-pressed={project.hidden}
                  disabled={pending === project.id}
                  onClick={() =>
                    void change(project.id, { hidden: !project.hidden })
                  }
                >
                  {project.hidden ? 'Mostrar' : 'Ocultar'}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="icon"
                      aria-label={`Borrar ${project.titleEs}`}
                      disabled={pending === project.id}
                    >
                      <MorphGlyph name="trash" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Borrar proyecto</AlertDialogTitle>
                      <AlertDialogDescription>
                        ¿Borrar “{project.titleEs}”? No se puede deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => void remove(project.id)}>
                        Borrar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </m.li>
          ))}
        </AnimatePresence>
      </ul>
    </MotionRoot>
  );
}
