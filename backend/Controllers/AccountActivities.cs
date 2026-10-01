using backend.DTOs;
using Dapper;
using MySqlConnector;

namespace backend.Controllers;

public sealed partial class AccountController
{
    // Identifiers are selected from this whitelist, never interpolated from a request.
    private static readonly Dictionary<string, string> ActivityTargets = new()
    {
        ["DiaDiem"] = "MaDiaDiem", ["NhaHang"] = "MaNhaHang", ["KhachSan"] = "MaKhachSan"
    };

    private static async Task<string?> ValidateActivities(MySqlConnection db, MySqlTransaction tx, List<ItineraryDay> days)
    {
        foreach (var (day, index) in days.Select((day, index) => (day, index)))
        {
            var items = day.Activities ?? [];
            if (items.Count > 20) return $"Ngày {index + 1}: tối đa 20 hoạt động.";
            if (items.Any(a => a == null || !ActivityTargets.ContainsKey(a.LoaiDiaDiem ?? "") || a.MaDoiTuong <= 0 || a.GhiChu?.Length > 500 ||
                a.ThoiGianBatDau == null || a.ThoiGianKetThuc == null || a.ThoiGianBatDau < TimeSpan.Zero ||
                a.ThoiGianKetThuc >= TimeSpan.FromDays(1) || a.ThoiGianBatDau >= a.ThoiGianKetThuc))
                return $"Ngày {index + 1}: chọn địa điểm hợp lệ, giờ bắt đầu/kết thúc trong ngày và ghi chú tối đa 500 ký tự.";
            var sorted = items.OrderBy(a => a.ThoiGianBatDau).ToArray();
            for (var i = 1; i < sorted.Length; i++)
                if (sorted[i].ThoiGianBatDau < sorted[i - 1].ThoiGianKetThuc)
                    return $"Ngày {index + 1}: các hoạt động bị trùng giờ. Hãy điều chỉnh thời gian.";
        }
        foreach (var group in days.SelectMany(d => d.Activities ?? []).GroupBy(a => a.LoaiDiaDiem))
        {
            var ids = group.Select(a => a.MaDoiTuong).Distinct().ToArray();
            var count = await db.ExecuteScalarAsync<int>($"SELECT COUNT(*) FROM {group.Key} WHERE {ActivityTargets[group.Key]} IN @ids AND TrangThai=1", new { ids }, tx);
            if (count != ids.Length) return "Một địa điểm, nhà hàng hoặc khách sạn không còn hoạt động. Vui lòng chọn lại.";
        }
        return null;
    }

    private static async Task<List<SavedActivity>> ReadActivities(MySqlConnection db, int[] dayIds)
    {
        if (dayIds.Length == 0) return [];
        // dayIds originate exclusively from the owner/accepted-member scoped query.
        var items = (await db.QueryAsync<SavedActivity>("""
            SELECT a.MaChiTiet,a.MaLichTrinh,a.ThuTu,a.LoaiDiaDiem,
                   COALESCE(a.MaDiaDiem,a.MaNhaHang,a.MaKhachSan) AS MaDoiTuong,
                   COALESCE(d.TenDiaDiem,n.TenNhaHang,k.TenKhachSan) AS TenDiaDiem,
                   COALESCE(d.DiaChi,n.DiaChi,k.DiaChi) AS DiaChi,
                   a.ThoiGianBatDau,a.ThoiGianKetThuc,a.GhiChu,a.DuToan
            FROM LichTrinhChiTiet a
            LEFT JOIN DiaDiem d ON d.MaDiaDiem=a.MaDiaDiem
            LEFT JOIN NhaHang n ON n.MaNhaHang=a.MaNhaHang
            LEFT JOIN KhachSan k ON k.MaKhachSan=a.MaKhachSan
            WHERE a.MaLichTrinh IN @dayIds ORDER BY a.MaLichTrinh,a.ThuTu,a.MaChiTiet
            """, new { dayIds })).ToList();
        foreach (var group in items.GroupBy(a => a.LoaiDiaDiem))
        {
            if (!ActivityTargets.TryGetValue(group.Key, out var column)) continue;
            var ids = group.Select(a => a.MaDoiTuong).Distinct().ToArray();
            var images = (await db.QueryAsync<HinhAnhResponseDto>($"SELECT *, @type AS LoaiDoiTuong, {column} AS MaDoiTuong FROM HinhAnh WHERE {column} IN @ids ORDER BY ThuTu,MaHinhAnh", new { ids, type = group.Key })).ToLookup(p => p.MaDoiTuong);
            foreach (var item in group) item.HinhAnh = images[item.MaDoiTuong].ToList();
        }
        return items;
    }
}

public sealed class ItineraryActivityRequest
{
    public string LoaiDiaDiem { get; set; } = "";
    public int MaDoiTuong { get; set; }
    public TimeSpan? ThoiGianBatDau { get; set; }
    public TimeSpan? ThoiGianKetThuc { get; set; }
    public string? GhiChu { get; set; }
    public int? Quantity { get; set; }
    public int? RoomId { get; set; }
    public int? Nights { get; set; }
    public int? Rooms { get; set; }
    [System.Text.Json.Serialization.JsonIgnore]
    public ActivityEstimate? Estimate { get; set; }
}

public sealed class SavedActivity
{
    public int MaChiTiet { get; set; }
    public int MaLichTrinh { get; set; }
    public int ThuTu { get; set; }
    public string LoaiDiaDiem { get; set; } = "";
    public int MaDoiTuong { get; set; }
    public string? TenDiaDiem { get; set; }
    public string? DiaChi { get; set; }
    public TimeSpan? ThoiGianBatDau { get; set; }
    public TimeSpan? ThoiGianKetThuc { get; set; }
    public string? GhiChu { get; set; }
    public List<HinhAnhResponseDto> HinhAnh { get; set; } = [];
    [System.Text.Json.Serialization.JsonIgnore]
    public string? DuToan { get; set; }
    public ActivityEstimate? Estimate => string.IsNullOrWhiteSpace(DuToan) ? null : System.Text.Json.JsonSerializer.Deserialize<ActivityEstimate>(DuToan, new System.Text.Json.JsonSerializerOptions(System.Text.Json.JsonSerializerDefaults.Web));
}
