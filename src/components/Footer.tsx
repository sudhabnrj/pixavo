import { ShieldCheck } from 'lucide-react';
import { PixavoLogo } from './Header';
import { Link } from './Link';

interface FooterLink {
  label: string;
  /** Route slug; defaults to the home page. */
  to?: string;
  /** Section anchor on that page. */
  hash?: string;
}

interface FooterGroup {
  title: string;
  links: FooterLink[];
}

const footerGroups: FooterGroup[] = [
  {
    title: 'Product',
    links: [
      { label: 'Features', hash: 'features' },
      { label: 'Video Studio', to: 'video-studio' },
      { label: 'Supported Formats', hash: 'supported-formats' },
      { label: 'FAQ', hash: 'faq' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Blog', hash: 'blog' },
      { label: 'Privacy Policy', hash: 'privacy-policy' },
      { label: 'Terms of Service', hash: 'terms-of-service' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Contact', hash: 'contact' },
      { label: 'About', hash: 'about' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-slate-50/50">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Link to="" aria-label="Pixavo home">
              <PixavoLogo />
            </Link>
            <p className="max-w-xs text-sm leading-6 text-slate-500 font-medium">
              Convert images and videos instantly in your browser — nothing is ever uploaded.
            </p>
          </div>

          {footerGroups.map((group) => (
            <div key={group.title}>
              <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                {group.title}
              </h2>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to ?? ''}
                      hash={link.hash}
                      className="text-sm font-semibold text-slate-500 transition-colors hover:text-slate-900"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-5 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-400 font-medium">© 2026 Pixavo. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-600 shadow-sm">
              <ShieldCheck className="h-3.5 w-3.5 text-brand-emerald" aria-hidden="true" />
              100% Browser-Based
            </span>
            <span className="rounded-full border border-brand-violet/10 bg-brand-violet/5 px-3 py-1.5 text-[11px] font-bold text-brand-violet shadow-sm">
              Privacy First
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
