using System.Text.Json;
using backend.Security;
using Dapper;
using Microsoft.AspNetCore.Mvc;
using MySqlConnector;

namespace backend.Controllers;

public sealed partial class AccountController
{
    private static readonly JsonSerializerOptions EstimateJson = new(JsonSerializerDefaults.Web);

    [HttpPost("itineraries/estimate")]
    public async Task<IActionResult> EstimateItinerary(ItineraryEstimateRequest request)
    {
        await using var db = Connection();
        await db.OpenAsync();
        await using var tx = await db.BeginTransactionAsync();
        var estimates = await BuildEstimates(db, tx, request);
        return Ok(new { days = estimates, checkedAt = DateTime.UtcNow });
    }

    // Shared by preview and save: the client never supplies authoritative prices or availability.
    private static async Task<List<List<ActivityEstimate>>> BuildEstimates(MySqlConnection db, MySqlTransaction tx, ItineraryEstimateRequest request)
    {
        if (request.NgayBatDau.Date < VietnamToday || request.NgayBatDau.Year > 9998 || request.SoNguoi is < 1 or > 100 ||
            request.Days == null || request.Days.Count is < 1 or > 30 || request.Days.Any(d => d == null || (d.Activities?.Count ?? 0) > 20))
            throw new RequestRuleException("Chọn ngày bắt đầu từ hôm nay, 1–100 người và 1–30 ngày.");
        var all = request.Days.SelectMany(d => d.Activities ?? []).ToArray();
        if (all.Any(a => a == null || !ActivityTargets.ContainsKey(a.LoaiDiaDiem ?? "") || a.MaDoiTuong <= 0 ||
            a.Quantity is < 1 or > 100 || a.Rooms is < 1 or > 100 || a.Nights is < 1 or > 30 || a.RoomId is <= 0))
            throw new RequestRuleException("Kiểm tra điểm dừng, số vé/suất, số phòng (1–100) và số đêm (1–30).");
        var places = new Dictionary<(string, int), PricePlace>();
        foreach (var group in all.GroupBy(a => a.LoaiDiaDiem))
        {
            var columns = group.Key switch
            {
                "DiaDiem" => "MaDiaDiem AS Id,TenDiaDiem AS Name,GiaVe AS Price,GiaVeMin AS Min,GiaVeMax AS Max,MienPhi AS Free",
                "NhaHang" => "MaNhaHang AS Id,TenNhaHang AS Name,0 AS Price,GiaMin AS Min,GiaMax AS Max,0 AS Free",
                _ => "MaKhachSan AS Id,TenKhachSan AS Name,0 AS Price,0 AS Min,0 AS Max,0 AS Free"
            };
            var rows = await db.QueryAsync<PricePlace>($"SELECT {columns} FROM {group.Key} WHERE {ActivityTargets[group.Key]} IN @ids AND TrangThai=1",
                new { ids = group.Select(a => a.MaDoiTuong).Distinct().ToArray() }, tx);
            foreach (var row in rows) places[(group.Key, row.Id)] = row;
        }
        var hotelIds = all.Where(a => a.LoaiDiaDiem == "KhachSan").Select(a => a.MaDoiTuong).Distinct().ToArray();
        var rooms = (await db.QueryAsync<PriceRoom>("SELECT * FROM LoaiPhong WHERE MaKhachSan IN @hotelIds AND TrangThai=1", new { hotelIds }, tx)).ToArray();
        var first = request.NgayBatDau.Date;
        var last = first.AddDays(request.Days.Count + 30);
        var stays = (await db.QueryAsync<PriceStay>("""
            SELECT d.MaLoaiPhong,d.NgayNhanPhong,d.NgayTraPhong,d.SoLuongPhong FROM DatPhong d
            JOIN LoaiPhong p ON p.MaLoaiPhong=d.MaLoaiPhong
            WHERE p.MaKhachSan IN @hotelIds AND d.TrangThai IN ('Pending','Confirmed','CheckedIn')
              AND d.NgayNhanPhong<@last AND d.NgayTraPhong>@first
            """, new { hotelIds, first, last }, tx)).ToLookup(s => s.MaLoaiPhong);
        var result = new List<List<ActivityEstimate>>();
        for (var dayIndex = 0; dayIndex < request.Days.Count; dayIndex++)
        {
            var day = new List<ActivityEstimate>();
            foreach (var activity in request.Days[dayIndex].Activities ?? [])
            {
                if (!places.TryGetValue((activity.LoaiDiaDiem, activity.MaDoiTuong), out var place))
                    throw new RequestRuleException("Điểm dừng không tồn tại hoặc đã ngừng hoạt động. Hãy chọn lại.");
                var q = new ActivityEstimate { Quantity = activity.Quantity ?? request.SoNguoi, CheckedAt = DateTime.UtcNow };
                if (activity.LoaiDiaDiem != "KhachSan")
                {
                    q.Unit = activity.LoaiDiaDiem == "DiaDiem" ? "vé" : "suất";
                    q.Free = activity.LoaiDiaDiem == "DiaDiem" && place.Free;
                    if (q.Free) q.UnitMin = q.UnitMax = 0;
                    else if (place.Price > 0) q.UnitMin = q.UnitMax = place.Price;
                    else if (place.Min > 0) { q.UnitMin = place.Min; q.UnitMax = Math.Max(place.Min, place.Max); }
                    q.MinTotal = q.UnitMin * q.Quantity;
                    q.MaxTotal = q.UnitMax * q.Quantity;
                    q.Message = q.Free ? "Miễn phí vé vào cửa theo dữ liệu đã xác nhận." : q.MinTotal.HasValue
                        ? "Giá tham khảo trong hệ thống; xác nhận lại với đơn vị cung cấp."
                        : "Chưa cập nhật giá; chưa tính vào tổng dự toán.";
                }
                else
                {
                    q.Unit = "phòng/đêm";
                    q.RoomId = activity.RoomId;
                    q.Rooms = activity.Rooms ?? 1;
                    q.Nights = activity.Nights ?? 1;
                    q.Checkin = first.AddDays(dayIndex);
                    q.Checkout = q.Checkin.Value.AddDays(q.Nights.Value);
                    var roomOptions = new List<EstimateRoom>();
                    foreach (var room in rooms.Where(r => r.MaKhachSan == activity.MaDoiTuong))
                    {
                        var available = room.SoLuongPhong;
                        for (var date = q.Checkin.Value; date < q.Checkout.Value; date = date.AddDays(1))
                            available = Math.Min(available, room.SoLuongPhong - stays[room.MaLoaiPhong].Where(s => s.NgayNhanPhong.Date <= date && s.NgayTraPhong.Date > date).Sum(s => s.SoLuongPhong));
                        roomOptions.Add(new EstimateRoom { Id = room.MaLoaiPhong, Name = room.TenLoaiPhong, Capacity = room.SucChua,
                            Price = room.GiaMoiDem, Available = Math.Max(0, available) });
                    }
                    q.RoomOptions = roomOptions;
                    if (activity.RoomId.HasValue)
                    {
                        var selected = roomOptions.Find(r => r.Id == activity.RoomId);
                        if (selected == null) throw new RequestRuleException("Loại phòng không thuộc khách sạn hoặc đã ngừng hoạt động.");
                        q.RoomName = selected.Name;
                        q.Capacity = selected.Capacity;
                        q.UnitMin = q.UnitMax = selected.Price;
                        q.MinTotal = q.MaxTotal = selected.Price * q.Rooms * q.Nights;
                        q.AvailableRooms = selected.Available;
                        q.Available = selected.Available >= q.Rooms && selected.Capacity * q.Rooms >= q.Quantity;
                        q.Message = selected.Capacity * q.Rooms < q.Quantity ? "Số phòng đã chọn không đủ sức chứa cho nhóm."
                            : q.Available == true ? "Đủ phòng tại thời điểm kiểm tra; lịch trình không giữ chỗ."
                            : "Không đủ phòng trong khoảng ngày này. Hãy đổi loại phòng hoặc ngày ở.";
                    }
                    else q.Message = roomOptions.Count == 0 ? "Khách sạn chưa cập nhật loại phòng trên hệ thống. Chưa tính chi phí lưu trú."
                        : "Chọn loại phòng để tính tiền và kiểm tra sức chứa.";
                }
                if (q.MinTotal.HasValue) backend.Services.StorageRules.Money(q.MinTotal.Value, "Chi phí hoạt động");
                if (q.MaxTotal.HasValue) backend.Services.StorageRules.Money(q.MaxTotal.Value, "Chi phí hoạt động cao nhất");
                activity.Estimate = q;
                day.Add(q);
            }
            result.Add(day);
        }
        return result;
    }
    private sealed class PricePlace { public int Id { get; set; } public string Name { get; set; } = ""; public decimal Price { get; set; } public decimal Min { get; set; } public decimal Max { get; set; } public bool Free { get; set; } }
    private sealed class PriceRoom { public int MaLoaiPhong { get; set; } public int MaKhachSan { get; set; } public string TenLoaiPhong { get; set; } = ""; public int SucChua { get; set; } public int SoLuongPhong { get; set; } public decimal GiaMoiDem { get; set; } }
    private sealed class PriceStay { public int MaLoaiPhong { get; set; } public DateTime NgayNhanPhong { get; set; } public DateTime NgayTraPhong { get; set; } public int SoLuongPhong { get; set; } }
}

public sealed class ItineraryEstimateRequest
{
    public DateTime NgayBatDau { get; set; }
    public int SoNguoi { get; set; }
    public List<ItineraryDay>? Days { get; set; }
}
public sealed class ActivityEstimate
{
    public string Unit { get; set; } = "";
    public int Quantity { get; set; }
    public bool Free { get; set; }
    public decimal? UnitMin { get; set; }
    public decimal? UnitMax { get; set; }
    public decimal? MinTotal { get; set; }
    public decimal? MaxTotal { get; set; }
    public int? RoomId { get; set; }
    public string? RoomName { get; set; }
    public int? Capacity { get; set; }
    public int? Rooms { get; set; }
    public int? Nights { get; set; }
    public DateTime? Checkin { get; set; }
    public DateTime? Checkout { get; set; }
    public int? AvailableRooms { get; set; }
    public bool? Available { get; set; }
    public string Message { get; set; } = "";
    public DateTime CheckedAt { get; set; }
    // Options are preview-only. Persist the chosen room, never an inventory promise.
    public List<EstimateRoom>? RoomOptions { get; set; }
}
public sealed class EstimateRoom
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public decimal Price { get; set; }
    public int Capacity { get; set; }
    public int Available { get; set; }
}
