import React, { useState, useEffect } from 'react';

interface Place {
  name: string;
  type: string;
  cost: number;
}

interface DestinationData {
  stay: number;
  food: number;
  transport: number;
  places: Place[];
}

const DESTINATIONS: Record<string, DestinationData> = {
  danang: {
    stay: 450000, food: 200000, transport: 150000,
    places: [
      { name: 'Biển Mỹ Khê', type: 'Biển', cost: 0 },
      { name: 'Bán đảo Sơn Trà', type: 'Thiên nhiên', cost: 0 },
      { name: 'Chùa Linh Ứng', type: 'Văn hóa', cost: 0 },
      { name: 'Ngũ Hành Sơn', type: 'Văn hóa', cost: 40000 },
      { name: 'Cầu Tình Yêu', type: 'Check-in', cost: 0 },
      { name: 'Mì Quảng bà Vị', type: 'Ẩm thực', cost: 50000 }
    ]
  },
  hanoi: {
    stay: 500000, food: 250000, transport: 100000,
    places: [
      { name: 'Hồ Hoàn Kiếm', type: 'Thiên nhiên', cost: 0 },
      { name: 'Văn Miếu', type: 'Văn hóa', cost: 30000 },
      { name: 'Phố cổ', type: 'Check-in', cost: 0 },
      { name: 'Phở Bát Đàn', type: 'Ẩm thực', cost: 60000 }
    ]
  },
  dalat: {
    stay: 400000, food: 200000, transport: 150000,
    places: [
      { name: 'Hồ Xuân Hương', type: 'Thiên nhiên', cost: 0 },
      { name: 'Thung lũng Tình Yêu', type: 'Thiên nhiên', cost: 250000 },
      { name: 'Chợ đêm', type: 'Ẩm thực', cost: 100000 },
      { name: 'Quảng trường Lâm Viên', type: 'Check-in', cost: 0 }
    ]
  },
  halong: {
    stay: 600000, food: 300000, transport: 200000,
    places: [
      { name: 'Vịnh Hạ Long', type: 'Thiên nhiên', cost: 300000 },
      { name: 'Đảo Titop', type: 'Biển', cost: 0 },
      { name: 'Bảo tàng Quảng Ninh', type: 'Văn hóa', cost: 40000 },
      { name: 'Hải sản', type: 'Ẩm thực', cost: 200000 }
    ]
  },
  hoian: {
    stay: 450000, food: 150000, transport: 50000,
    places: [
      { name: 'Phố cổ Hội An', type: 'Văn hóa', cost: 120000 },
      { name: 'Chùa Cầu', type: 'Check-in', cost: 0 },
      { name: 'Biển An Bàng', type: 'Biển', cost: 0 },
      { name: 'Cao lầu', type: 'Ẩm thực', cost: 40000 }
    ]
  },
  hagiang: {
    stay: 300000, food: 150000, transport: 250000,
    places: [
      { name: 'Đèo Mã Pí Lèng', type: 'Thiên nhiên', cost: 0 },
      { name: 'Sông Nho Quế', type: 'Thiên nhiên', cost: 120000 },
      { name: 'Cột cờ Lũng Cú', type: 'Văn hóa', cost: 40000 },
      { name: 'Thắng cố', type: 'Ẩm thực', cost: 100000 }
    ]
  },
  caobang: {
    stay: 350000, food: 150000, transport: 200000,
    places: [
      { name: 'Thác Bản Giốc', type: 'Thiên nhiên', cost: 45000 },
      { name: 'Động Ngườm Ngao', type: 'Thiên nhiên', cost: 45000 },
      { name: 'Khu di tích Pác Bó', type: 'Văn hóa', cost: 40000 },
      { name: 'Phở chua', type: 'Ẩm thực', cost: 40000 }
    ]
  },
  hue: {
    stay: 400000, food: 150000, transport: 100000,
    places: [
      { name: 'Đại Nội Huế', type: 'Văn hóa', cost: 200000 },
      { name: 'Lăng Tự Đức', type: 'Văn hóa', cost: 150000 },
      { name: 'Chợ Đông Ba', type: 'Ẩm thực', cost: 50000 },
      { name: 'Sông Hương', type: 'Thiên nhiên', cost: 0 }
    ]
  },
  lyson: {
    stay: 350000, food: 200000, transport: 150000,
    places: [
      { name: 'Đỉnh Thới Lới', type: 'Thiên nhiên', cost: 0 },
      { name: 'Cổng Tò Vò', type: 'Check-in', cost: 0 },
      { name: 'Đảo Bé', type: 'Biển', cost: 100000 },
      { name: 'Gỏi tỏi', type: 'Ẩm thực', cost: 100000 }
    ]
  },
  cantho: {
    stay: 400000, food: 200000, transport: 100000,
    places: [
      { name: 'Chợ nổi Cái Răng', type: 'Văn hóa', cost: 50000 },
      { name: 'Bến Ninh Kiều', type: 'Check-in', cost: 0 },
      { name: 'Vườn cò Bằng Lăng', type: 'Thiên nhiên', cost: 20000 },
      { name: 'Lẩu mắm', type: 'Ẩm thực', cost: 150000 }
    ]
  }
};

interface FormData {
  destination: string;
  days: number;
  people: number;
  budget: number;
  interests: string[];
}

interface PlanResult {
  days: { day: number; activities: { time: string; name: string; cost: number }[] }[];
  totalCost: number;
}

const PlannerPage: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    destination: 'danang',
    days: 3,
    people: 2,
    budget: 5000000,
    interests: []
  });
  const [planResult, setPlanResult] = useState<PlanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Fake API Calls to show how we might load real destinations and tours
  const [apiDestinations, setApiDestinations] = useState<any[]>([]);
  const [apiTours, setApiTours] = useState<any[]>([]);

  useEffect(() => {
    // Thêm gọi API thật nếu có backend
    fetch('/api/diadiem')
      .then(res => res.json())
      .then(data => setApiDestinations(data))
      .catch(err => console.log('Mock: Lỗi lấy địa điểm', err));
      
    fetch('/api/tour')
      .then(res => res.json())
      .then(data => setApiTours(data))
      .catch(err => console.log('Mock: Lỗi lấy tour', err));
  }, []);

  const handleInterestChange = (val: string) => {
    setFormData(prev => {
      const interests = prev.interests.includes(val)
        ? prev.interests.filter(i => i !== val)
        : [...prev.interests, val];
      return { ...prev, interests };
    });
  };

  const generatePlan = () => {
    setLoading(true);
    setError('');
    
    setTimeout(() => {
      const destData = DESTINATIONS[formData.destination];
      if (!destData) {
        setError('Không tìm thấy dữ liệu điểm đến.');
        setLoading(false);
        return;
      }

      let filteredPlaces = destData.places;
      if (formData.interests.length > 0) {
        filteredPlaces = destData.places.filter(p => formData.interests.includes(p.type));
        if (filteredPlaces.length === 0) {
          filteredPlaces = destData.places; // Fallback
        }
      }

      const plan: PlanResult = {
        days: [],
        totalCost: 0
      };

      let placeIndex = 0;
      let totalCost = 0;

      for (let i = 1; i <= formData.days; i++) {
        const dailyActivities = [];
        
        // Sáng
        const morningPlace = filteredPlaces[placeIndex % filteredPlaces.length];
        dailyActivities.push({ time: '08:00', name: morningPlace.name, cost: morningPlace.cost });
        placeIndex++;
        
        // Trưa
        dailyActivities.push({ time: '12:00', name: 'Ăn trưa & Nghỉ ngơi', cost: destData.food / 2 });
        
        // Chiều
        const afternoonPlace = filteredPlaces[placeIndex % filteredPlaces.length];
        dailyActivities.push({ time: '14:00', name: afternoonPlace.name, cost: afternoonPlace.cost });
        placeIndex++;
        
        // Tối
        dailyActivities.push({ time: '19:00', name: 'Ăn tối & Tự do', cost: destData.food / 2 });

        plan.days.push({ day: i, activities: dailyActivities });
        
        totalCost += destData.stay + destData.transport + destData.food + morningPlace.cost + afternoonPlace.cost;
      }

      totalCost *= formData.people;
      plan.totalCost = totalCost;

      if (totalCost > formData.budget) {
        setError(`Cảnh báo: Chi phí ước tính (${totalCost.toLocaleString()}đ) vượt quá ngân sách!`);
      }

      setPlanResult(plan);
      setLoading(false);
    }, 1000);
  };

  const savePlan = () => {
    if (planResult) {
      localStorage.setItem('savedPlan', JSON.stringify(planResult));
      alert('Đã lưu lịch trình!');
    }
  };

  return (
    <div className="planner-page">
      <div className="workspace-dialog">
        <div className="workspace-top">
          <div className="workspace-eyebrow">NVT DU LỊCH · LẬP LỊCH TRÌNH</div>
          <button className="workspace-close">X</button>
        </div>

        <div className="planner-layout">
          <div className="planner-form">
            <h2 className="form-intro">Lên kế hoạch chuyến đi của bạn</h2>
            
            <div className="form-pair">
              <label>Điểm đến</label>
              <select 
                value={formData.destination}
                onChange={e => setFormData({...formData, destination: e.target.value})}
              >
                <option value="danang">Đà Nẵng</option>
                <option value="hanoi">Hà Nội</option>
                <option value="dalat">Đà Lạt</option>
                <option value="halong">Hạ Long</option>
                <option value="hoian">Hội An</option>
                <option value="hagiang">Hà Giang</option>
                <option value="caobang">Cao Bằng</option>
                <option value="hue">Huế</option>
                <option value="lyson">Lý Sơn</option>
                <option value="cantho">Cần Thơ</option>
              </select>
            </div>

            <div className="form-pair">
              <label>Số ngày</label>
              <input type="number" min="1" max="14" value={formData.days} onChange={e => setFormData({...formData, days: parseInt(e.target.value) || 1})} />
            </div>

            <div className="form-pair">
              <label>Số người</label>
              <input type="number" min="1" max="20" value={formData.people} onChange={e => setFormData({...formData, people: parseInt(e.target.value) || 1})} />
            </div>

            <div className="form-pair">
              <label>Ngân sách (VNĐ)</label>
              <input type="number" step="100000" value={formData.budget} onChange={e => setFormData({...formData, budget: parseInt(e.target.value) || 0})} />
            </div>

            <div className="form-pair">
              <label>Sở thích</label>
              <div className="interest-options">
                {['Ẩm thực', 'Biển', 'Thiên nhiên', 'Văn hóa', 'Check-in'].map(int => (
                  <label key={int}>
                    <input type="checkbox" checked={formData.interests.includes(int)} onChange={() => handleInterestChange(int)} />
                    {int}
                  </label>
                ))}
              </div>
            </div>

            {error && <div className="form-error" style={{ color: 'red', marginTop: '10px' }}>{error}</div>}

            <button className="primary-action" onClick={generatePlan} disabled={loading} style={{ marginTop: '20px' }}>
              {loading ? 'Đang tạo...' : 'Tạo lịch trình'}
            </button>
          </div>

          <div className="plan-result">
            {!planResult ? (
              <div className="plan-empty">
                <p>Lịch trình của bạn sẽ hiển thị ở đây</p>
                <div className="planning-note">Hãy điền thông tin và bấm "Tạo lịch trình"</div>
              </div>
            ) : (
              <div>
                <h2>Lịch trình đề xuất</h2>
                <div style={{ marginBottom: '20px' }}>
                  <strong>Tổng chi phí ước tính: </strong> 
                  <span style={{ color: planResult.totalCost > formData.budget ? 'red' : 'green' }}>
                    {planResult.totalCost.toLocaleString()} VNĐ
                  </span>
                </div>
                
                {planResult.days.map(d => (
                  <div key={d.day} style={{ marginBottom: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '8px' }}>
                    <h3>Ngày {d.day}</h3>
                    <ul style={{ listStyleType: 'none', padding: 0 }}>
                      {d.activities.map((act, idx) => (
                        <li key={idx} style={{ padding: '8px 0', borderBottom: '1px solid #ddd' }}>
                          <strong>{act.time}</strong> - {act.name} 
                          {act.cost > 0 && <span style={{ float: 'right', color: '#666' }}>({act.cost.toLocaleString()}đ)</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                
                <button className="primary-action" onClick={savePlan}>Lưu lịch trình</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlannerPage;
