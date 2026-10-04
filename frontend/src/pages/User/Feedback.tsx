import { useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useSession } from '../../context/AuthContext';
import { api, dateLabel, errorMessage } from '../../lib/api';
import { useResource, type Kind } from './catalog';
import './feedback.css';
import FormDialog from '../../components/FormDialog';
import ValidatedForm from '../../components/ValidatedForm';
import { reportFormError } from '../../components/form-validation';

type Entry = { id: number; author: string; content: string; createdAt: string; stars?: number };
type FeedbackData = { summary: { average: number; count: number }; reviews: Entry[]; comments: Entry[]; commentCount: number; pageSize: number };
type Eligibility = { canReview: boolean; alreadyReviewed: boolean; requirement: string };

function Star({ filled }: { filled: boolean }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5"><path d="m12 3 2.8 5.7 6.3.9-4.6 4.5 1.1 6.3-5.6-3-5.6 3 1.1-6.3L2.9 9.6l6.3-.9Z" /></svg>;
}

function ReviewForm({ endpoint, changed }: { endpoint: string; changed: () => void }) {
  const { data, loading, error, reload } = useResource<Eligibility>(endpoint + '/eligibility');
  const [stars, setStars] = useState(0), [content, setContent] = useState(''), [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false); const sending = useRef(false);
  const [open, setOpen] = useState(false); const editor = useRef<HTMLFormElement>(null);
  async function submit(e: FormEvent) {
    e.preventDefault(); if (sending.current) return;
    if (!stars) { setMessage('Vui lòng chọn số sao.'); return; }
    sending.current = true; setBusy(true); setMessage('');
    try { await api.post(endpoint + '/reviews', { stars, content }); setOpen(false); changed(); reload(); }
    catch (err) { setMessage(errorMessage(err)); reportFormError(editor.current, err, { stars: ['số sao'], content: ['nội dung'] }); }
    finally { sending.current = false; setBusy(false); }
  }
  if (loading) return <p role="status">Đang kiểm tra trải nghiệm của bạn…</p>;
  if (error) return <p role="alert">{error} <button className="user-text-link" onClick={reload}>Thử lại</button></p>;
  if (data?.alreadyReviewed) return <p role="status">Bạn đã đánh giá dịch vụ này. Mỗi tài khoản được chấm sao một lần. Nội dung bị ẩn bởi quản trị viên sẽ không xuất hiện công khai.</p>;
  if (!data?.canReview) return <p>{data?.requirement}</p>;
  return <><button type="button" className="user-button" onClick={() => { setMessage(''); setOpen(true); }}>Viết đánh giá</button>{open && <FormDialog title="Đánh giá trải nghiệm" busy={busy} onClose={() => setOpen(false)}><ValidatedForm formRef={editor} onSubmit={submit} className="feedback-form">
    <p>Bạn đã hoàn thành trải nghiệm và có thể chia sẻ đánh giá.</p>
    <fieldset disabled={busy}><legend>Bạn đánh giá bao nhiêu sao?</legend><div className="feedback-stars">{[1,2,3,4,5].map(value => <label key={value}><input type="radio" name="stars" value={value} checked={stars === value} onChange={() => setStars(value)} required /><Star filled={value <= stars} /><span>{value} sao</span></label>)}</div></fieldset>
    <label>Nhận xét về trải nghiệm (không bắt buộc)<textarea name="content" maxLength={2000} value={content} onChange={e => setContent(e.target.value)} disabled={busy} rows={3} /></label>
    {message && <p role="alert" className="user-alert">{message}</p>}
    <button className="user-button" disabled={busy}>{busy ? 'Đang gửi…' : 'Gửi đánh giá'}</button>
  </ValidatedForm></FormDialog>}</>;
}

function CommentForm({ endpoint, changed }: { endpoint: string; changed: () => void }) {
  const [content, setContent] = useState(''), [error, setError] = useState('');
  const [busy, setBusy] = useState(false); const sending = useRef(false);
  const [open, setOpen] = useState(false); const editor = useRef<HTMLFormElement>(null);
  async function submit(e: FormEvent) {
    e.preventDefault(); if (sending.current) return;
    if (!content.trim()) { setError('Nhập nội dung bình luận trước khi gửi.'); return; }
    sending.current = true; setBusy(true); setError('');
    try { await api.post(endpoint + '/comments', { content }); setContent(''); setOpen(false); changed(); }
    catch (err) { setError(errorMessage(err)); reportFormError(editor.current, err, { content: ['nội dung', 'bình luận'] }); }
    finally { sending.current = false; setBusy(false); }
  }
  return <><button type="button" className="user-button" onClick={() => { setError(''); setOpen(true); }}>Viết bình luận</button>{open && <FormDialog title="Viết bình luận" busy={busy} onClose={() => setOpen(false)}><ValidatedForm formRef={editor} onSubmit={submit} className="feedback-form"><label>Bình luận của bạn<textarea name="content" required maxLength={2000} value={content} onChange={e => setContent(e.target.value)} rows={3} disabled={busy} placeholder="Chia sẻ hoặc đặt câu hỏi về dịch vụ này" /></label><small>{content.length}/2.000 ký tự · Bình luận được hiển thị công khai.</small>{error && <p role="alert" className="user-alert">{error}</p>}<button className="user-button" disabled={busy}>{busy ? 'Đang gửi…' : 'Gửi bình luận'}</button></ValidatedForm></FormDialog>}</>;
}

function Entries({ items }: { items: Entry[] }) {
  return <div className="feedback-entries">{items.map(entry => <article key={entry.id}><div className="feedback-entry-heading"><strong>{entry.author}</strong><time dateTime={entry.createdAt}>{dateLabel(entry.createdAt)}</time></div>{entry.stars !== undefined && <p className="feedback-score"><Star filled /><span>{entry.stars}/5 sao · Đã trải nghiệm</span></p>}{entry.content && <p className="feedback-content">{entry.content}</p>}</article>)}</div>;
}

function Pages({ page, count, change, label }: { page: number; count: number; change: (page: number) => void; label: string }) {
  const pages = Math.max(1, Math.ceil(count / 10));
  if (pages === 1 && page === 1) return null;
  return <nav className="feedback-pages" aria-label={label}><button className="user-button secondary" disabled={page <= 1} onClick={() => change(page - 1)}>Trước</button><span>Trang {page}/{pages}</span><button className="user-button secondary" disabled={page >= pages} onClick={() => change(page + 1)}>Sau</button></nav>;
}

export default function Feedback({ kind, id }: { kind: Exclude<Kind, 'restaurants'>; id: string }) {
  const { user, loading: sessionLoading } = useSession();
  const [reviewPage, setReviewPage] = useState(1), [commentPage, setCommentPage] = useState(1), [notice, setNotice] = useState('');
  const endpoint = `/feedback/${kind}/${id}`;
  const { data, loading, error, reload } = useResource<FeedbackData>(`${endpoint}?reviewPage=${reviewPage}&commentPage=${commentPage}`);
  const login = `/login?returnTo=${encodeURIComponent(`/${kind}/${id}#feedback`)}`;
  const changed = (review: boolean) => { if (review) setReviewPage(1); else setCommentPage(1); setNotice(review ? 'Đã lưu đánh giá của bạn.' : 'Đã gửi bình luận.'); reload(); };
  return <section id="feedback" className="feedback-section" aria-label="Đánh giá và bình luận">
    <h2>Chia sẻ về trải nghiệm</h2><p>Đánh giá và bình luận đều công khai. Chỉ những khách đã hoàn thành dịch vụ mới được chấm sao.</p>
    {notice && <p role="status">{notice}</p>}
    {loading && <p role="status">Đang tải đánh giá và bình luận…</p>}
    {error && <p role="alert">{error} <button className="user-text-link" onClick={reload}>Thử lại</button></p>}
    <section className="user-panel feedback-panel" aria-labelledby="review-heading"><h3 id="review-heading">Đánh giá từ khách đã trải nghiệm</h3>
      {data && <><p className="feedback-summary">{data.summary.count ? `${data.summary.average.toLocaleString('vi-VN')}/5 sao từ ${data.summary.count} đánh giá đã xác minh` : 'Chưa có đánh giá đã xác minh.'}</p><Entries items={data.reviews} /><Pages page={reviewPage} count={data.summary.count} change={setReviewPage} label="Trang đánh giá" /></>}
      {!sessionLoading && (user ? <ReviewForm key={user.maNguoiDung} endpoint={endpoint} changed={() => changed(true)} /> : <p><Link to={login}>Đăng nhập</Link> để kiểm tra quyền chấm sao sau chuyến đi.</p>)}
    </section>
    <section className="user-panel feedback-panel" aria-labelledby="comment-heading"><h3 id="comment-heading">Bình luận{data ? ` (${data.commentCount})` : ''}</h3><p>Bạn có thể hỏi hoặc chia sẻ thông tin khi đã đăng nhập, không cần đặt dịch vụ trước.</p>
      {data && <>{!data.comments.length && <p>Chưa có bình luận.</p>}<Entries items={data.comments} /><Pages page={commentPage} count={data.commentCount} change={setCommentPage} label="Trang bình luận" /></>}
      {!sessionLoading && (user ? <CommentForm key={user.maNguoiDung} endpoint={endpoint} changed={() => changed(false)} /> : <p><Link to={login}>Đăng nhập để bình luận</Link></p>)}
    </section>
  </section>;
}
