import type { AnchorHTMLAttributes, MouseEvent } from 'react';
import { hrefFor, navigate } from '../router';

interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
  hash?: string;
}

/** In-app link: a real href (works with new tabs and crawlers), navigated without a reload. */
export function Link({ to, hash, onClick, ...rest }: LinkProps) {
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || hash || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigate(to);
  };
  return <a href={hrefFor(to, hash)} onClick={handleClick} {...rest} />;
}
