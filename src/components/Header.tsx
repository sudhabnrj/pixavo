import { useEffect, useState } from 'react';
import { Menu, X, ArrowLeft, ChevronDown } from 'lucide-react';
import logoUrl from '../assets/logo.png';

interface HeaderProps {
  currentPage?: 'home' | 'converter' | 'video';
  activeToolId?: string;
  onNavigateHome?: () => void;
  onNavigateTool?: (toolId: string) => void;
}

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

export function Header({ currentPage = 'home', onNavigateHome }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 12);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        isScrolled || isMenuOpen
          ? 'border-b border-slate-200/60 bg-white/95 shadow-sm backdrop-blur-xl'
          : 'border-b border-transparent bg-white/80 backdrop-blur-md'
      }`}
    >
      <nav
        className="relative mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
        aria-label="Main navigation"
      >
        <div className="flex items-center gap-8">
          <PixavoLogo onClick={() => { closeMenu(); if (onNavigateHome) onNavigateHome(); }} />

          {/* Center Navigation matching Picflow header */}
          <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center gap-6 text-sm font-semibold text-slate-700">
            <div className="relative group cursor-pointer flex items-center gap-1 hover:text-slate-900">
              <span>Product</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </div>
            <a href="#pricing" className="hover:text-slate-900">
              Pricing
            </a>
            <div className="relative group cursor-pointer flex items-center gap-1 hover:text-slate-900">
              <span>Explore</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </div>
            <a href="#select-tools" className="hover:text-slate-900">
              Tools
            </a>
            <a href="#video" className="inline-flex items-center gap-1.5 hover:text-slate-900">
              Video
              <span className="rounded-full bg-brand-violet px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">New</span>
            </a>
          </div>
        </div>

        {/* Right Action buttons matching Picflow header */}
        <div className="hidden lg:flex items-center gap-5">
          {currentPage !== 'home' && (
            <button
              onClick={() => { closeMenu(); if (onNavigateHome) onNavigateHome(); }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </button>
          )}

          <a href="#contact" className="text-sm font-semibold text-slate-700 hover:text-slate-900">
            Log in
          </a>

          <a
            href="#select-tools"
            onClick={() => {
              if (currentPage !== 'home' && onNavigateHome) onNavigateHome();
            }}
            className="rounded-full bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 hover:scale-[1.02] transition-all cursor-pointer"
          >
            Try for Free
          </a>
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm"
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {isMenuOpen && (
        <div className="lg:hidden border-t border-slate-100 bg-white px-4 py-5 space-y-4">
          <a href="#select-tools" onClick={closeMenu} className="block text-sm font-semibold text-slate-800">
            Image Tools
          </a>
          <a href="#video" onClick={closeMenu} className="block text-sm font-semibold text-slate-800">
            Video Studio <span className="ml-1 rounded-full bg-brand-violet px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">New</span>
          </a>
          <a href="#features" onClick={closeMenu} className="block text-sm font-semibold text-slate-800">
            Product Features
          </a>
          <a href="#faq" onClick={closeMenu} className="block text-sm font-semibold text-slate-800">
            FAQ
          </a>
          <div className="pt-2 flex flex-col gap-2">
            <a
              href="#select-tools"
              onClick={closeMenu}
              className="w-full text-center rounded-full bg-blue-600 text-white font-semibold py-2.5 text-sm"
            >
              Try for Free
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
