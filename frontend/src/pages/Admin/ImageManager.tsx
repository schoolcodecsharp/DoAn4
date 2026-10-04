import { useRef, useState, type FormEvent } from 'react';
import { api, errorMessage } from '../../lib/api';
import { useResource, type TravelImage } from '../User/catalog';
import FormDialog from '../../components/FormDialog';
import ValidatedForm from '../../components/ValidatedForm';
import { reportFormError } from '../../components/form-validation';

function ImageRow({ photo, refresh, notify }: { photo: TravelImage; refresh: () => void; notify: (message: string) => void }) {
  const [open, setOpen] = useState(false);
  const [caption, setCaption] = useState(photo.moTa || '');
  const [order, setOrder] = useState(photo.thuTu);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const editor = useRef<HTMLFormElement>(null), lock = useRef(false);
  async function save(e: FormEvent) { e.preventDefault(); if (lock.current) return; lock.current = true; setBusy(true); setMessage(''); try { await api.put(`/hinhanh/${photo.maHinhAnh}`, { moTa: caption, thuTu: order }); setOpen(false); notify('Đã cập nhật thông tin ảnh.'); refresh(); } catch(e) { setMessage(errorMessage(e)); reportFormError(editor.current, e, { moTa: ['mô tả'], thuTu: ['thứ tự'] }); } finally { setBusy(false); lock.current = false; } }
  async function remove() { if (!window.confirm('Gỡ ảnh này khỏi bộ ảnh? File gốc trên máy chủ sẽ được giữ lại.')) return; setBusy(true); try { await api.delete(`/hinhanh/${photo.maHinhAnh}`); notify('Đã gỡ ảnh khỏi bộ ảnh.'); refresh(); } catch(e) { setMessage(errorMessage(e)); } finally { setBusy(false); } }
  return <article className="admin-image-card"><img src={photo.duongDan} alt={photo.moTa || 'Ảnh đã tải lên'} /><p>{photo.moTa || 'Chưa có mô tả'}</p><small>Thứ tự: {photo.thuTu}</small><div className="admin-actions"><button type="button" disabled={busy} onClick={() => { setCaption(photo.moTa || ''); setOrder(photo.thuTu); setMessage(''); setOpen(true); }}>Chỉnh sửa ảnh</button><button type="button" className="danger" disabled={busy} onClick={remove}>Gỡ ảnh</button></div>{!open && message && <p role="alert">{message}</p>}{open && <FormDialog title="Chỉnh sửa thông tin ảnh" busy={busy} onClose={() => setOpen(false)}><ValidatedForm className="user-form" formRef={editor} onSubmit={save}><img className="form-image-preview" src={photo.duongDan} alt={photo.moTa || 'Ảnh đang chỉnh sửa'} /><label>Mô tả ảnh<input name="moTa" value={caption} onChange={e => setCaption(e.target.value)} maxLength={255}/></label><label>Thứ tự<input name="thuTu" type="number" min="0" required value={order} onChange={e => setOrder(Number(e.target.value))}/></label>{message && <p role="alert">{message}</p>}<button disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu thay đổi'}</button></ValidatedForm></FormDialog>}</article>;
}
export default function ImageManager({ owner, id }: { owner: string; id: number }) {
  const { data, loading, error, reload } = useResource<TravelImage[]>(`/hinhanh/${owner}/${id}`);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [open, setOpen] = useState(false);
  const [failure, setFailure] = useState('');
  const editor = useRef<HTMLFormElement>(null), lock = useRef(false);
  function validate(): Record<string, string> { return !files.length ? { files: 'Chọn ít nhất một ảnh để tải lên.' } : files.some(file => file.size > 8 * 1024 * 1024 || !['image/jpeg','image/png','image/webp'].includes(file.type)) ? { files: 'Chỉ chọn JPG, PNG hoặc WebP, mỗi file tối đa 8 MB.' } : {}; }
  async function upload(e: FormEvent) {
    e.preventDefault(); if (lock.current) return;
    lock.current = true; setBusy(true); setFailure(''); let count = 0;
    const order = Math.max(-1, ...(data || []).map(p => p.thuTu)) + 1;
    try {
      for (const file of files) {
        const form = new FormData(); form.append('file',file); form.append('loaiDoiTuong',owner); form.append('maDoiTuong',String(id)); form.append('thuTu',String(order + count)); form.append('moTa',file.name.slice(0,255));
        await api.post('/hinhanh/upload',form); count++;
      }
      setMessage(`Đã tải ${count} ảnh thành công.`); setFiles([]); setOpen(false);
    } catch(e) { setFiles(files.slice(count)); setFailure(`Đã tải ${count}/${files.length} ảnh. ${errorMessage(e)} Các ảnh còn lại có thể thử lại.`); reportFormError(editor.current, e, { files: ['file', 'ảnh', 'định dạng', 'dung lượng'] }); }
    finally { setBusy(false); lock.current = false; reload(); }
  }
  return <section className="admin-panel"><h2>Bộ ảnh</h2><p>Ảnh có thứ tự nhỏ nhất là ảnh đại diện.</p><button type="button" onClick={() => { setFiles([]); setFailure(''); setOpen(true); }}>Thêm ảnh</button>{message && <p role="status">{message}</p>}{loading && <p>Đang tải bộ ảnh…</p>}{error && <p role="alert">{error} <button onClick={reload}>Thử lại</button></p>}<div className="admin-images">{data?.map(p => <ImageRow key={`${p.maHinhAnh}-${p.thuTu}-${p.moTa}`} photo={p} refresh={reload} notify={setMessage}/>)}</div>{open && <FormDialog title="Thêm ảnh vào bộ ảnh" busy={busy} onClose={() => setOpen(false)}><ValidatedForm className="user-form" formRef={editor} onSubmit={upload} validate={validate}><label>Chọn ảnh từ máy tính<input name="files" type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e => { setFiles(Array.from(e.target.files || [])); setFailure(''); }}/></label><p>{files.length} ảnh được chọn · Tối đa 8 MB/ảnh</p>{files.length > 0 && <ul>{files.map((file, i) => <li key={i}>{file.name}</li>)}</ul>}{failure && <p role="alert">{failure}</p>}<button disabled={busy || loading || Boolean(error)}>{busy ? 'Đang tải…' : 'Tải ảnh lên'}</button></ValidatedForm></FormDialog>}</section>;
}
