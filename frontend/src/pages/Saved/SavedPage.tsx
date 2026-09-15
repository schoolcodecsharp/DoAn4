import React, { useState, useEffect } from 'react';
import { chuyenDiApi } from '../../services/api';

interface SavedPlan {
  id: string;
  destination: string;
  destinationName: string;
  days: number;
  people: number;
  budget: number;
  createdAt: string;
  planDays: Array<{
    number: number;
    activities: Array<{ name: string; tag: string; cost: number; time: string }>;
  }>;
  costs: {
    totalPerPerson: number;
    total: number;
    over: boolean;
  };
}

const SavedPage: React.FC = () => {
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [serverTrips, setServerTrips] = useState<any[]>([]);

  useEffect(() => {
    // Load từ localStorage
    try {
      const raw = localStorage.getItem('tripmate_saved');
      if (raw) setSavedPlans(JSON.parse(raw));
    } catch { /* ignore */ }

    // Load từ server nếu đã đăng nhập
    const auth = localStorage.getItem('tripmate_auth');
    if (auth) {
      try {
        const { user } = JSON.parse(auth);
        if (user?.maNguoiDung) {
          chuyenDiApi.getByNguoiDung(user.maNguoiDung)
            .then((res: any) => setServerTrips(Array.isArray(res) ? res : (res?.data ?? [])))
            .catch(() => {});
        }
      } catch { /* ignore */ }
    }
  }, []);

  const deletePlan = (id: string) => {
    const updated = savedPlans.filter((p) => p.id !== id);
    setSavedPlans(updated);
    localStorage.setItem('tripmate_saved', JSON.stringify(updated));
  };

  const formatMoney = (n: number) =>
    n.toLocaleString('vi-VN') + ' đ';

  return (
    <div className="workspace-dialog saved-dialog" style={{ position: 'relative', minHeight: '100vh', padding: '2rem' }}>
      <div className="workspace-top">
        <div>
          <span className="workspace-eyebrow">NHỮNG HÀNH TRÌNH CỦA BẠN</span>
          <h2>Lịch trình đã lưu</h2>
        </div>
      </div>

      {serverTrips.length > 0 && (
        <section style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', opacity: 0.7, fontSize: '0.85rem', letterSpacing: '0.05em' }}>
            CHUYẾN ĐI CỦA BẠN (TỪ SERVER)
          </h3>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {serverTrips.map((trip: any) => (
              <div key={trip.maChuyenDi} style={{
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '8px',
                padding: '1.25rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ margin: 0 }}>{trip.tenChuyenDi}</h4>
                    <p style={{ margin: '0.25rem 0 0', opacity: 0.6, fontSize: '0.85rem' }}>
                      {trip.diemKhoiHanh} → {trip.diemDen} · {trip.soNguoi} người
                    </p>
                  </div>
                  <span style={{
                    fontSize: '0.75rem', padding: '0.25rem 0.75rem',
                    borderRadius: '20px', background: 'rgba(255,255,255,0.1)'
                  }}>
                    {trip.trangThai}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <p className="saved-note">Lưu trên trình duyệt này, không đồng bộ giữa các thiết bị.</p>

      {savedPlans.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', opacity: 0.5 }}>
          <p style={{ fontSize: '2rem', marginBottom: '1rem' }}>✧</p>
          <h3>Chưa có lịch trình nào</h3>
          <p>Tạo lịch trình ở trang Lên kế hoạch và nhấn "Lưu lịch trình" để xem tại đây.</p>
        </div>
      ) : (
        <div id="saved-list" style={{ display: 'grid', gap: '1rem' }}>
          {savedPlans.map((plan) => (
            <div key={plan.id} style={{
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '8px',
              overflow: 'hidden',
            }}>
              <div
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
                onClick={() => setExpandedId(expandedId === plan.id ? null : plan.id)}
              >
                <div>
                  <h4 style={{ margin: 0 }}>{plan.destinationName}</h4>
                  <p style={{ margin: '0.25rem 0 0', opacity: 0.6, fontSize: '0.85rem' }}>
                    {plan.days} ngày · {plan.people} người · {formatMoney(plan.budget)}/người
                  </p>
                  <p style={{ margin: '0.25rem 0 0', opacity: 0.5, fontSize: '0.75rem' }}>
                    Tạo lúc {new Date(plan.createdAt).toLocaleString('vi-VN')}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '0.8rem', padding: '0.2rem 0.6rem',
                    background: plan.costs.over ? 'rgba(220,80,80,0.2)' : 'rgba(80,180,80,0.2)',
                    borderRadius: '4px',
                    color: plan.costs.over ? '#f87171' : '#4ade80',
                  }}>
                    {formatMoney(plan.costs.totalPerPerson)}/người
                  </span>
                  <span style={{ opacity: 0.5 }}>{expandedId === plan.id ? '↑' : '↓'}</span>
                </div>
              </div>

              {expandedId === plan.id && (
                <div style={{ padding: '0 1.25rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  {plan.planDays.map((day) => (
                    <div key={day.number} style={{ marginTop: '1rem' }}>
                      <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Ngày {day.number}</p>
                      {day.activities.map((act, i) => (
                        <div key={i} style={{
                          display: 'flex', justifyContent: 'space-between',
                          padding: '0.3rem 0', fontSize: '0.85rem', opacity: 0.8,
                        }}>
                          <span>{act.time} · {act.name}</span>
                          <span>{act.cost > 0 ? formatMoney(act.cost) : 'Miễn phí'}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                  <button
                    onClick={() => deletePlan(plan.id)}
                    style={{
                      marginTop: '1rem', padding: '0.5rem 1rem',
                      background: 'rgba(220,80,80,0.2)', border: '1px solid rgba(220,80,80,0.4)',
                      borderRadius: '6px', color: '#f87171', cursor: 'pointer', fontSize: '0.85rem',
                    }}
                  >
                    Xóa lịch trình
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedPage;
