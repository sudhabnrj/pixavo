import { useEffect, useRef, useState } from 'react';
import { Menu, X, ArrowLeft, ChevronDown, ShieldCheck, ArrowRight } from 'lucide-react';
import logoUrl from '../assets/logo.png';
import { useSlug } from '../router';
import { Link } from './Link';
import { conversionTools, videoTools } from '../utils/conversionTools';
import { MEGA_MENUS } from '../utils/toolCatalog';
import type { MegaMenu, ToolColor } from '../utils/toolCatalog';

interface HeaderProps {
  currentPage?: 'home' | 'converter' | 'video' | 'notfound';
  onNavigateHome?: () => void;
}

type MenuId = MegaMenu['id'];

// Solid icon tiles for the mega menus (static strings so Tailwind picks them up).
const TILE: Record<ToolColor, string> = {
  violet: 'bg-violet-500',
  emerald: 'bg-emerald-500',
  rose: 'bg-rose-500',
  blue: 'bg-blue-500',
  amber: 'bg-amber-500',
  indigo: 'bg-indigo-500',
  teal: 'bg-teal-500',
  orange: 'bg-orange-500',
  cyan: 'bg-cyan-500',
  purple: 'bg-purple-500',
};

const TOOLS_BY_ID = new Map(
  [...conversionTools, ...videoTools].map((t) => [t.id, { slug: t.slug, title: t.title, icon: t.icon, color: t.color }]),
);

export function PixavoLogo({ onClick }: { onClick?: () => void }) {
  return (
    <span
      onClick={onClick}
      className="inline-flex items-center gap-2.5 text-slate-900 cursor-pointer group"
    >
      <span className="relative h-9 w-9 overflow-hidden flex items-center justify-center text-white font-black group-hover:scale-105 transition-transform duration-200">
        <img
          src={logoUrl}
          alt="Pixavo"
          className="absolute left-1/2 top-0 h-auto w-[3.5rem] max-w-none -translate-x-1/2"
        />
      </span>
      <span className="text-xl font-black tracking-tight text-slate-900">
        Pixavo
      </span>
    </span>
  );
}

function ToolLink({ id, active, onNavigate, compact = false }: { id: string; active: boolean; onNavigate: () => void; compact?: boolean }) {
  const tool = TOOLS_BY_ID.get(id);
  if (!tool) return null;
  const Icon = tool.icon;
  return (
    <Link
      to={tool.slug}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={`group/item flex items-center gap-3 rounded-lg py-1.5 text-sm font-semibold transition-colors ${
        compact ? 'px-0' : '-mx-2 px-2'
      } ${active ? 'bg-slate-100 text-slate-950' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-950'}`}
    >
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white shadow-sm transition-transform group-hover/item:scale-110 ${TILE[tool.color]}`}>
        <Icon className="h-4 w-4" />
      </span>
      {tool.title}
    </Link>
  );
}

function NewBadge() {
  return (
    <span className="rounded-full bg-brand-violet px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">New</span>
  );
}

export function Header({ currentPage = 'home', onNavigateHome }: HeaderProps) {
  const slug = useSlug();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openMega, setOpenMega] = useState<MenuId | null>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  const triggersRef = useRef<HTMLDivElement>(null);
  const panelsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 12);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close the open mega menu on Escape or a click outside it.
  useEffect(() => {
    if (!openMega) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpenMega(null); };
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!triggersRef.current?.contains(target) && !panelsRef.current?.contains(target)) setOpenMega(null);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onClick);
    };
  }, [openMega]);

  const switchTimer = useRef<number | undefined>(undefined);

  const showMega = (id: MenuId) => {
    window.clearTimeout(closeTimer.current);
    window.clearTimeout(switchTimer.current);
    if (!openMega) {
      setOpenMega(id);
      return;
    }
    // While a menu is open, only switch after a short hover, so a diagonal move from one
    // trigger down into its panel doesn't flip to the menu whose trigger it passes over.
    switchTimer.current = window.setTimeout(() => setOpenMega(id), 180);
  };
  const keepMega = () => {
    window.clearTimeout(closeTimer.current);
    window.clearTimeout(switchTimer.current);
  };
  const closeMegaSoon = () => {
    window.clearTimeout(closeTimer.current);
    window.clearTimeout(switchTimer.current);
    closeTimer.current = window.setTimeout(() => setOpenMega(null), 150);
  };

  const closeMenus = () => {
    setIsMenuOpen(false);
    setOpenMega(null);
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        isScrolled || isMenuOpen || openMega
          ? 'border-b border-slate-200/60 bg-white/95 shadow-sm backdrop-blur-xl'
          : 'border-b border-transparent bg-white/80 backdrop-blur-md'
      }`}
    >
      <nav
        className="relative mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
        aria-label="Main navigation"
      >
        <Link to="" onClick={closeMenus} aria-label="Pixavo home">
          <PixavoLogo />
        </Link>

        {/* Center navigation: one trigger per mega menu */}
        <div
          ref={triggersRef}
          className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center gap-7 text-sm font-semibold text-slate-700"
        >
          {MEGA_MENUS.map((menu) => {
            const isOpen = openMega === menu.id;
            return (
              <button
                key={menu.id}
                type="button"
                onMouseEnter={() => showMega(menu.id)}
                onMouseLeave={closeMegaSoon}
                onClick={() => setOpenMega(isOpen ? null : menu.id)}
                aria-expanded={isOpen}
                aria-controls={`${menu.id}-menu`}
                className={`flex items-center gap-1.5 py-7 transition-colors cursor-pointer ${isOpen ? 'text-slate-950' : 'hover:text-slate-900'}`}
              >
                {menu.label}
                {menu.isNew && <NewBadge />}
                <ChevronDown className={`h-3.5 w-3.5 opacity-60 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
              </button>
            );
          })}
        </div>

        {/* Right action buttons */}
        <div className="hidden lg:flex items-center gap-5">
          {currentPage !== 'home' && (
            <button
              onClick={() => { closeMenus(); if (onNavigateHome) onNavigateHome(); }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </button>
          )}

          <Link
            to=""
            hash="select-tools"
            className="rounded-full bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 hover:scale-[1.02] transition-all cursor-pointer"
          >
            Try for Free
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            type="button"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm"
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mega menu panels (desktop) */}
      <div ref={panelsRef} className="hidden lg:block">
        {MEGA_MENUS.map((menu) => {
          const isOpen = openMega === menu.id;
          const featured = TOOLS_BY_ID.get(menu.featured.tool);
          const FeaturedIcon = featured?.icon;
          return (
            <div
              key={menu.id}
              id={`${menu.id}-menu`}
              onMouseEnter={keepMega}
              onMouseLeave={closeMegaSoon}
              className={`absolute inset-x-0 top-full px-4 pt-2 transition-all duration-200 sm:px-6 lg:px-8 ${
                isOpen ? 'visible translate-y-0 opacity-100' : 'invisible pointer-events-none -translate-y-2 opacity-0'
              }`}
            >
              <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_30px_80px_-20px_rgba(15,23,42,0.25)]">
                <div
                  className="grid gap-x-8 gap-y-6 px-8 py-8"
                  style={{ gridTemplateColumns: `repeat(${menu.columns.length}, minmax(0, 1fr)) 18rem` }}
                >
                  {menu.columns.map((column, i) => (
                    <div key={i} className="space-y-7">
                      {column.map((section) => (
                        <div key={section.title}>
                          <p className="mb-3 text-[13px] font-bold uppercase tracking-wide text-slate-500">{section.title}</p>
                          <div className="space-y-1">
                            {section.tools.map((id) => (
                              <ToolLink key={id} id={id} active={TOOLS_BY_ID.get(id)?.slug === slug} onNavigate={closeMenus} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}

                  {/* Featured tool card */}
                  {featured && FeaturedIcon && (
                    <Link
                      to={featured.slug}
                      onClick={closeMenus}
                      className="group/feat relative flex flex-col justify-between overflow-hidden rounded-2xl bg-slate-950 p-6 text-white"
                    >
                      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-violet-600/50 blur-3xl transition-transform duration-500 group-hover/feat:scale-125" />
                      <div className="relative">
                        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-300">{menu.featured.eyebrow}</span>
                        <div className="mt-4 flex items-center gap-3">
                          <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${TILE[featured.color]}`}>
                            <FeaturedIcon className="h-5 w-5" />
                          </span>
                          <span className="text-lg font-extrabold">{featured.title}</span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-400">{menu.featured.text}</p>
                      </div>
                      <span className="relative mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-white">
                        Open {featured.title}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover/feat:translate-x-1" />
                      </span>
                    </Link>
                  )}
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-8 py-4">
                  <span className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <ShieldCheck className="h-4 w-4 text-brand-emerald" />
                    Every tool runs 100% in your browser — files are never uploaded.
                  </span>
                  <Link to="" hash="select-tools" onClick={closeMenus} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 hover:text-brand-violet">
                    Browse all tools <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile drawer */}
      {isMenuOpen && (
        <div className="lg:hidden max-h-[calc(100vh-5rem)] overflow-y-auto border-t border-slate-100 bg-white px-4 py-5">
          {MEGA_MENUS.map((menu) => (
            <div key={menu.id} className="mb-6 border-b border-slate-100 pb-6 last:border-0">
              <p className="mb-4 flex items-center gap-2 text-base font-extrabold text-slate-950">
                {menu.label} tools {menu.isNew && <NewBadge />}
              </p>
              <div className="grid gap-6 sm:grid-cols-2">
                {menu.columns.flat().map((section) => (
                  <div key={section.title}>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">{section.title}</p>
                    <div className="space-y-1">
                      {section.tools.map((id) => (
                        <ToolLink key={id} id={id} compact active={TOOLS_BY_ID.get(id)?.slug === slug} onNavigate={closeMenus} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <Link
            to=""
            hash="select-tools"
            onClick={closeMenus}
            className="block w-full rounded-full bg-blue-600 py-2.5 text-center text-sm font-semibold text-white"
          >
            Try for Free
          </Link>
        </div>
      )}
    </header>
  );
}
