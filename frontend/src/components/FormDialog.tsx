import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import './form-dialog.css';

export default function FormDialog({ title, children, onClose, busy = false, wide = false, unsaved = false }: { title: string; children: ReactNode; onClose: () => void; busy?: boolean; wide?: boolean; unsaved?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const heading = useId();
  const dirty = useRef(false);
  useEffect(() => {
    const dialog = ref.current!;
    const previous = document.activeElement as HTMLElement | null;
    dialog.showModal();
    dialog.querySelector<HTMLElement>('input:not([type=hidden]),select,textarea')?.focus({ preventScroll: true });
    const change = () => { dirty.current = true; };
    dialog.addEventListener('input', change);
    return () => { dialog.removeEventListener('input', change); dialog.close(); if (previous?.isConnected) previous.focus({ preventScroll: true }); };
  }, []);
  const close = () => { if (!busy && (!(dirty.current || unsaved) || window.confirm('Bạn chưa lưu thay đổi. Đóng biểu mẫu này?'))) onClose(); };
  return createPortal(<dialog ref={ref} className={`form-dialog${wide ? ' form-dialog--wide' : ''}`} aria-labelledby={heading} onCancel={e => { e.preventDefault(); e.stopPropagation(); close(); }} onClick={e => { if (e.target === ref.current) { const r = ref.current.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) close(); } }}>
    <header className="form-dialog-heading"><h2 id={heading}>{title}</h2><button type="button" className="form-dialog-close" disabled={busy} onClick={close} aria-label="Đóng biểu mẫu"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg></button></header>
    <div className="form-dialog-content">{children}</div>
  </dialog>, document.body);
}
