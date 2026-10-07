import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/shadcn/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/shadcn/dropdown-menu';
import { cn } from '@/lib/utils';
import { MotionRoot } from './MotionRoot';
import { MorphGlyph } from './MorphGlyph';
import type { IconName } from './icons';
import { request } from './api';

type NavItem = { href: string; label: string; icon: IconName };

const ITEMS: NavItem[] = [
  { href: '/admin', label: 'Inicio', icon: 'home' },
  { href: '/admin/profile', label: 'Perfil', icon: 'user' },
  { href: '/admin/tech-stack', label: 'Tech Stack', icon: 'layers' },
  { href: '/admin/education', label: 'Educación', icon: 'book' },
  { href: '/admin/projects', label: 'Proyectos', icon: 'folder' },
  { href: '/admin/contact', label: 'Contacto', icon: 'mail' },
  { href: '/admin/security', label: 'Seguridad', icon: 'shield' },
];

const isActive = (path: string, href: string) =>
  href === '/admin' ? path === '/admin' : path.startsWith(href);

async function logout() {
  await request('/api/admin/logout', 'POST', {});
  window.location.href = '/admin/login';
}

function NavLinks({ path }: { path: string }) {
  return (
    <nav aria-label="Secciones del panel" className="flex flex-col gap-1">
      {ITEMS.map((item) => {
        const active = isActive(path, item.href);
        return (
          <a
            key={item.href}
            href={item.href}
            title={item.label}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-500 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none',
              active
                ? 'bg-cyan-500/15 text-cyan-300'
                : 'text-gray-300 hover:bg-white/5 hover:text-cyan-300'
            )}
          >
            <MorphGlyph name={item.icon} />
            <span className="admin-nav-label">{item.label}</span>
          </a>
        );
      })}
    </nav>
  );
}

function AccountMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-200 transition-colors duration-500 hover:border-cyan-400/50 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none">
        <MorphGlyph name="user" />
        <span className="admin-nav-label">Cuenta</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top">
        <DropdownMenuLabel>Administrador</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => (window.location.href = '/admin/security')}>
          <MorphGlyph name="shield" />
          Seguridad
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void logout()}>
          <MorphGlyph name="logout" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Brand() {
  return (
    <a
      href="/admin"
      className="admin-brand text-base font-semibold text-white focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
    >
      <span className="admin-nav-label">Panel del portfolio</span>
    </a>
  );
}

export default function AdminNav({ path }: { path: string }) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(document.documentElement.hasAttribute('data-nav-collapsed'));
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    document.documentElement.toggleAttribute('data-nav-collapsed', next);
    try {
      localStorage.setItem('admin-nav-collapsed', next ? '1' : '0');
    } catch {}
  };

  return (
    <MotionRoot>
      <header className="header-backdrop-blur fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-white/10 bg-gray-900/70 px-4 md:hidden">
        <Brand />
        <button
          type="button"
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex size-11 cursor-pointer items-center justify-center rounded-lg text-gray-200 transition-colors duration-500 hover:bg-white/5 hover:text-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
        >
          <MorphGlyph name={open ? 'x' : 'menu'} size={24} />
        </button>
      </header>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent side="left" className="flex flex-col gap-4">
          <DialogTitle className="sr-only">Menú</DialogTitle>
          <DialogDescription className="sr-only">
            Secciones del panel de administración
          </DialogDescription>
          <Brand />
          <NavLinks path={path} />
          <div className="mt-auto">
            <AccountMenu />
          </div>
        </DialogContent>
      </Dialog>

      <aside className="admin-aside admin-enter fixed inset-y-0 left-0 z-30 hidden flex-col gap-6 border-r border-white/10 bg-gray-900/60 p-4 md:flex">
        <div className="admin-aside-head flex items-center justify-between gap-2 px-3 pt-2">
          <Brand />
          <button
            type="button"
            aria-label={collapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
            aria-expanded={!collapsed}
            title={collapsed ? 'Expandir' : 'Colapsar'}
            onClick={toggleCollapsed}
            className="admin-collapse-toggle flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-gray-300 transition-colors duration-500 hover:bg-white/5 hover:text-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
          >
            <MorphGlyph name="chevron" />
          </button>
        </div>
        <NavLinks path={path} />
        <div className="mt-auto">
          <AccountMenu />
        </div>
      </aside>
    </MotionRoot>
  );
}
