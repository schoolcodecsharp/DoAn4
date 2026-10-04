import axios from 'axios';
import { errorMessage } from '../lib/api';

export type FieldErrors = Record<string, string>;
export type FormControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
const normalize = (v: string) => v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
export const controls = (form: HTMLFormElement) => Array.from(form.querySelectorAll<FormControl>('input,select,textarea')).filter(c => c.type !== 'hidden');
export const keyOf = (c: FormControl, i: number) => c.name || c.id || `field-${i}`;

// ModelState keys are authoritative; non-field failures remain in the form banner.
export function reportFormError(form: HTMLFormElement | null, error: unknown, aliases: Record<string, string[]> = {}) {
  if (!form) return;
  const message = errorMessage(error);
  const response = axios.isAxiosError(error) ? error.response?.data : null;
  const errors: FieldErrors = {};
  controls(form).forEach((c, i) => {
    const key = keyOf(c, i), terms = [key, ...(aliases[key] || [])];
    for (const [serverKey, messages] of Object.entries(response?.errors || {})) {
      if (terms.some(t => normalize(serverKey.split('.').at(-1) || serverKey) === normalize(t))) errors[key] = Array.isArray(messages) ? messages.join(' ') : String(messages);
    }
    if (!errors[key] && aliases[key]?.some(t => normalize(message).includes(normalize(t)))) errors[key] = message;
  });
  form.dispatchEvent(new CustomEvent('form-field-errors', { detail: errors }));
}
