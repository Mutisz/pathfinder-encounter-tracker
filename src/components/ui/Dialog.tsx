import { useEffect, useRef, type ReactNode } from 'react';

interface Props {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Footer buttons. */
  actions?: ReactNode;
  wide?: boolean;
}

/** Thin wrapper over the native <dialog> element (modal, Escape closes). */
export function Dialog({ open, title, onClose, children, actions, wide }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={`m-auto rounded-lg bg-white p-0 text-ink shadow-xl ${wide ? 'w-[min(56rem,95vw)]' : 'w-[min(28rem,95vw)]'}`}
    >
      <div className="p-5" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-3 text-lg font-semibold">{title}</h2>
        <div className="space-y-3">{children}</div>
        {actions && <div className="mt-5 flex flex-wrap justify-end gap-2">{actions}</div>}
      </div>
    </dialog>
  );
}
