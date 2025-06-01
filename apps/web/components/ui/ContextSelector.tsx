import React, { useState, useRef, useEffect } from "react";

interface ContextOption {
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
}

interface ContextSelectorProps {
  contexts: ContextOption[];
  value: string;
  onChange: (id: string) => void;
  collapsed?: boolean;
}

export default function ContextSelector({ contexts, value, onChange, collapsed }: ContextSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = contexts.find(c => c.id === value);
  const multi = contexts.length > 1;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Get icon image path
  const iconImg = current ? `/logos/${current.id}-icon.png` : undefined;

  return (
    <div ref={ref} className={`relative ${collapsed ? "px-2 pt-2 pb-2" : "px-4 pt-4 pb-2"}`}>
      <button
        className={
          collapsed
            ? "w-12 h-12 p-0 flex items-center justify-center rounded-2xl border border-[var(--bg-neutral)] bg-[var(--bg-light)] hover:bg-[var(--bg-neutral)] transition focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            : "w-full flex items-center gap-2 px-2 py-2 rounded-xl text-left border border-[var(--bg-neutral)] bg-[var(--bg-light)] hover:bg-[var(--bg-neutral)] transition focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        }
        onClick={() => multi && setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={!multi}
        style={{ minHeight: 48 }}
      >
        {iconImg && (
          <img src={iconImg} alt={current?.title} className={collapsed ? "w-6 h-6" : "w-8 h-8 rounded-md object-contain"} />
        )}
        {!collapsed && (
          <div className="flex flex-col flex-1 min-w-0">
            <span className="font-bold text-[var(--primary)] text-base truncate">{current?.title}</span>
            {current?.subtitle && (
              <span className="text-xs text-[var(--primary)] opacity-70 truncate">{current.subtitle}</span>
            )}
          </div>
        )}
        {multi && !collapsed && (
          <svg className="ml-2 w-4 h-4 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        )}
      </button>
      {multi && open && !collapsed && (
        <ul className="absolute left-0 mt-1 w-full z-20 bg-[var(--bg-light)] border border-[var(--bg-neutral)] rounded-xl shadow-lg py-1">
          {contexts.map(ctx => {
            const iconImgOpt = `/logos/${ctx.id}-icon.png`;
            return (
              <li key={ctx.id}>
                <button
                  className={`w-full flex items-center gap-2 px-2 py-2 rounded-xl text-left transition ${ctx.id === value ? "bg-[var(--bg-neutral)] font-semibold" : "hover:bg-[var(--bg-neutral)]"}`}
                  onClick={() => { setOpen(false); onChange(ctx.id); }}
                >
                  <img src={iconImgOpt} alt={ctx.title} className="w-8 h-8 rounded-md object-contain" />
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-bold text-[var(--primary)] text-base truncate">{ctx.title}</span>
                    {ctx.subtitle && (
                      <span className="text-xs text-[var(--primary)] opacity-70 truncate">{ctx.subtitle}</span>
                    )}
                  </div>
                  {ctx.id === value && <span className="ml-auto text-[var(--accent)]">✓</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}