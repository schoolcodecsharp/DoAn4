import { useEffect, useId, useImperativeHandle, useRef, useState, type FormHTMLAttributes, type SubmitEvent, type Ref } from 'react';
import { createPortal } from 'react-dom';
import { controls, keyOf, type FieldErrors as Errors, type FormControl as Control } from './form-validation';

export default function ValidatedForm({ onSubmit, validate, formRef, ...props }: FormHTMLAttributes<HTMLFormElement> & { validate?: (form: HTMLFormElement) => Errors; formRef?: Ref<HTMLFormElement> }) {
  const ref = useRef<HTMLFormElement>(null);
  useImperativeHandle(formRef, () => ref.current!, []);
  const instanceId = useId();
  const [errors, setErrors] = useState<Errors>({});
  const [targets, setTargets] = useState<{ key: string; label: Element }[]>([]);
  function showErrors(next: Errors, form: HTMLFormElement) {
    const fields = controls(form), seen = new Set<string>();
    setTargets(fields.flatMap((c, i) => {
      const key = keyOf(c, i), label = c.type === 'radio' ? c.closest('fieldset') : c.labels?.[0] || c.parentElement;
      if (!label || seen.has(key)) return [];
      seen.add(key); return [{ key, label }];
    }));
    setErrors(next);
    const first = fields.find((c, i) => next[keyOf(c, i)]);
    if (first) requestAnimationFrame(() => { if (first.isConnected) { first.focus(); first.scrollIntoView({ block: 'nearest' }); } });
  }
  useEffect(() => {
    const form = ref.current!;
    const report = (e: Event) => { showErrors((e as CustomEvent<Errors>).detail, form); };
    form.addEventListener('form-field-errors', report);
    return () => form.removeEventListener('form-field-errors', report);
  }, []);
  useEffect(() => {
    const fields = controls(ref.current!);
    fields.forEach((c, i) => {
      const key = keyOf(c, i), id = `${instanceId}-${key}-error`;
      if (c.dataset.originalDescription === undefined) c.dataset.originalDescription = c.getAttribute('aria-describedby') || '';
      if (errors[key]) { c.setAttribute('aria-invalid', 'true'); c.setAttribute('aria-describedby', [c.dataset.originalDescription, id].filter(Boolean).join(' ')); }
      else { c.removeAttribute('aria-invalid'); if (c.dataset.originalDescription) c.setAttribute('aria-describedby', c.dataset.originalDescription); else c.removeAttribute('aria-describedby'); }
    });
  }, [errors, instanceId]);
  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    // React events also bubble through portals; child activity forms must never submit the trip form.
    event.stopPropagation();
    const form = event.currentTarget, next: Errors = {};
    controls(form).forEach((c, i) => {
      if (c.matches(':disabled')) return;
      const labelNode = c.labels?.[0]?.cloneNode(true) as Element | undefined;
      labelNode?.querySelectorAll('.form-field-error,input,select,textarea').forEach(node => node.remove());
      const key = keyOf(c, i), label = labelNode?.textContent?.replace(/\s*\*\s*$/, '').trim() || c.getAttribute('aria-label') || 'Thông tin';
      if (c.required && !c.value.trim()) next[key] = `Vui lòng nhập hoặc chọn ${label.toLowerCase()}.`;
      else if (!c.validity.valid) next[key] = c.type === 'radio' && c.validity.valueMissing ? 'Vui lòng chọn số sao cho trải nghiệm của bạn.' : c.validity.typeMismatch ? 'Nhập đúng định dạng email.' : c.validity.rangeUnderflow ? `Giá trị tối thiểu là ${(c as HTMLInputElement).min}.` : c.validity.rangeOverflow ? `Giá trị tối đa là ${(c as HTMLInputElement).max}.` : c.validity.tooShort ? `Nhập ít nhất ${(c as HTMLInputElement).minLength} ký tự.` : c.validity.stepMismatch ? 'Kiểm tra định dạng số hoặc phần thập phân.' : 'Kiểm tra lại giá trị và định dạng trong ô này.';
    });
    Object.assign(next, validate?.(form));
    showErrors(next, form);
    if (Object.keys(next).length) { event.preventDefault(); return; }
    onSubmit?.(event);
  };
  return <form {...props} ref={ref} noValidate onSubmit={submit} onInputCapture={e => {
    if (!(e.target instanceof Element) || !e.currentTarget.contains(e.target)) return;
    const c = e.target as Control; const all = ref.current ? controls(ref.current) : []; const key = keyOf(c, all.indexOf(c));
    if (errors[key]) setErrors(old => { const next = { ...old }; delete next[key]; return next; });
  }}>
    {props.children}
    {Object.keys(errors).length > 0 && <span className="form-error-announcement" role="alert">{[...new Set(Object.values(errors))].join(' ')}</span>}
    {targets.map(({ key, label }) => errors[key] ? createPortal(<small className="form-field-error" id={`${instanceId}-${key}-error`} aria-hidden="true">{errors[key]}</small>, label, key) : null)}
  </form>;
}
