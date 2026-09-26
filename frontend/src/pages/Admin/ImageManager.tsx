import { useState, type FormEvent } from 'react';
import { api, errorMessage } from '../../lib/api';
import { useResource, type TravelImage } from '../User/catalog';

function ImageRow({ photo, refresh }: { photo: TravelImage; refresh: () => void }) {
  const [caption, setCaption] = useState(photo.moTa || '');
  const [order, setOrder] = useState(photo.thuTu);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function save(e: FormEvent) { e.preventDefault(); setBusy(true); setMessage(''); try { await api.put(`/hinhanh/${photo.maHinhAnh}`, { moTa: caption, thuTu: order }); refresh(); } catch(e) { setMessage(errorMessage(e)); } finally { setBusy(false); } }
  async function remove() { if (!window.confirm('Gỡ ảnh này khỏi bộ ảnh? File gốc trên máy chủ sẽ được giữ lại.')) return; setBusy(true); try { await api.delete(`/hinhanh/${photo.maHinhAnh}`); refresh(); } catch(e) { setMessage(errorMessage(e)); } finally { setBusy(false); } }
  return <form className="admin-image-card" onSubmit={save}><img src={photo.duongDan} alt={photo.moTa || 'Ảnh đã tải lên'} /><label>Mô tả ảnh<input value={caption} onChange={e => setCaption(e.target.value)} maxLength={255}/></label><label>Thứ tự<input type="number" min="0" required value={order} onChange={e => setOrder(Number(e.target.value))}/></label><div className="admin-actions"><button disabled={busy}>Lưu ảnh</button><button type="button" className="danger" disabled={busy} onClick={remove}>Gỡ ảnh</button></div>{message && <p role="alert">{message}</p>}</form>;
}
export default function ImageManager({ owner, id }: { owner: string; id: number }) {
  const { data, loading, error, reload } = useResource<TravelImage[]>(`/hinhanh/${owner}/${id}`);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [inputVersion, setInputVersion] = useState(0);
  async function upload(e: FormEvent) {
    e.preventDefault(); if (!files.length) return;
    if (files.some(file => file.size > 8 * 1024 * 1024 || !['image/jpeg','image/png','image/webp'].includes(file.type))) { setMessage('Chỉ chọn JPG, PNG hoặc WebP, mỗi file tối đa 8 MB.'); return; }
    setBusy(true); setMessage(''); let count = 0;
    const order = Math.max(-1, ...(data || []).map(p => p.thuTu)) + 1;
    try {
      for (const file of files) {
        const form = new FormData(); form.append('file',file); form.append('loaiDoiTuong',owner); form.append('maDoiTuong',String(id)); form.append('thuTu',String(order + count)); form.append('moTa',file.name.slice(0,255));
        await api.post('/hinhanh/upload',form); count++;
      }
      setMessage(`Đã tải ${count} ảnh thành công.`); setFiles([]); setInputVersion(n => n+1);
    } catch(e) { setFiles(files.slice(count)); setMessage(`Đã tải ${count}/${files.length} ảnh. ${errorMessage(e)} Các ảnh còn lại có thể thử lại.`); }
    finally { setBusy(false); reload(); }
  }
  return <section className="admin-panel"><h2>Bộ ảnh</h2><p>Mỗi {owner === 'Tour' ? 'tour' : 'địa điểm / cơ sở'} có thể có nhiều ảnh. Ảnh có thứ tự nhỏ nhất là ảnh đại diện.</p><form className="admin-upload" onSubmit={upload}><label>Chọn nhiều ảnh từ máy tính<input key={inputVersion} type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e => { setFiles(Array.from(e.target.files || [])); setMessage(''); }}/></label><span>{files.length} ảnh được chọn · Tối đa 8 MB/ảnh</span><button disabled={busy || !files.length || loading}>{busy ? 'Đang tải…' : 'Tải ảnh lên'}</button></form>{message && <p role="status">{message}</p>}{loading && <p>Đang tải bộ ảnh…</p>}{error && <p role="alert">{error} <button onClick={reload}>Thử lại</button></p>}<div className="admin-images">{data?.map(p => <ImageRow key={`${p.maHinhAnh}-${p.thuTu}-${p.moTa}`} photo={p} refresh={reload}/>)}</div></section>;
}
