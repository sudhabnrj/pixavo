import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

import { FAQ_ITEMS } from '../utils/faqData';

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-3xl divide-y divide-slate-100 overflow-hidden rounded-3xl border border-slate-100 bg-white/80 shadow-sm backdrop-blur-md">
      {FAQ_ITEMS.map((item, index) => {
        const isOpen = openIndex === index;
        const panelId = `faq-panel-${index}`;
        const buttonId = `faq-button-${index}`;

        return (
          <div key={item.question}>
            <h3>
              <button
                id={buttonId}
                type="button"
                className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50/50 hover:text-slate-900 sm:px-6"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                aria-expanded={isOpen}
                aria-controls={panelId}
              >
                {item.question}
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-300 ${
                    isOpen ? 'rotate-180 text-brand-violet' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className={`grid transition-[grid-template-rows,opacity] duration-300 ${
                isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className="min-h-0">
                <p className="px-5 pb-5 text-sm leading-6 text-slate-500 sm:px-6">{item.answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
