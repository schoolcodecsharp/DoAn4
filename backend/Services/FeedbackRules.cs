using backend.Security;
using Dapper;
using MySqlConnector;

namespace backend.Services;

public static class FeedbackRules
{
    public const string Verified = "(MaDatTourXacMinh IS NOT NULL OR MaDatPhongXacMinh IS NOT NULL)";
    public static (string Table,string Column) Target(string kind) => kind switch
    {
        "tours" => ("Tour","MaTour"), "hotels" => ("KhachSan","MaKhachSan"),
        "destinations" => ("DiaDiem","MaDiaDiem"),
        _ => throw new RequestRuleException("Loại dịch vụ không hỗ trợ phản hồi.",404)
    };
    public static async Task EnsureTarget(MySqlConnection db,string kind,int id,MySqlTransaction? tx=null)
    {
        var (table,column)=Target(kind);
        if(id<1 || await db.ExecuteScalarAsync<int>($"SELECT COUNT(*) FROM {table} WHERE {column}=@id"+(kind=="tours"?" AND TrangThai<>'Draft'":""),new{id},tx)!=1)
            throw new RequestRuleException("Không tìm thấy dịch vụ.",404);
    }
    public static async Task<int?> Proof(MySqlConnection db,string kind,int id,int owner,MySqlTransaction? tx=null)
    {
        // A plan or accepted trip invitation is not evidence of a completed service.
        var sql=kind switch
        {
            "tours" => "SELECT d.MaDatTour FROM DatTour d JOIN Tour t ON t.MaTour=d.MaTour WHERE d.MaNguoiDung=@owner AND d.MaTour=@id AND d.TrangThai='Completed' AND DATE_ADD(d.NgayKhoiHanh,INTERVAL t.SoNgay DAY)<=@today ORDER BY d.MaDatTour LIMIT 1",
            "hotels" => "SELECT d.MaDatPhong FROM DatPhong d JOIN LoaiPhong r ON r.MaLoaiPhong=d.MaLoaiPhong WHERE d.MaNguoiDung=@owner AND r.MaKhachSan=@id AND d.TrangThai='CheckedOut' AND d.NgayTraPhong<=@today ORDER BY d.MaDatPhong LIMIT 1",
            "destinations" => "SELECT d.MaDatTour FROM DatTour d JOIN Tour t ON t.MaTour=d.MaTour WHERE d.MaNguoiDung=@owner AND d.TrangThai='Completed' AND DATE_ADD(d.NgayKhoiHanh,INTERVAL t.SoNgay DAY)<=@today AND EXISTS (SELECT 1 FROM TourChiTiet c WHERE c.MaTour=d.MaTour AND c.MaDiaDiem=@id AND c.LoaiDiaDiem='DiaDiem') ORDER BY d.MaDatTour LIMIT 1",
            _ => throw new RequestRuleException("Loại dịch vụ không hỗ trợ đánh giá.",404)
        };
        return await db.ExecuteScalarAsync<int?>(sql,new{owner,id,today=BookingRules.Today},tx);
    }
    public static string Requirement(string kind) => kind switch
    {
        "tours" => "Chỉ chấm sao sau khi đơn tour của bạn được xác nhận Đã hoàn thành và chuyến đi đã kết thúc.",
        "hotels" => "Chỉ chấm sao sau khi đơn phòng của bạn được xác nhận Đã trả phòng và đã đến ngày trả phòng.",
        _ => "Chỉ chấm sao khi bạn đã hoàn thành tour có ghé địa điểm này. Lịch trình tự lập chưa phải xác nhận đã tham quan."
    };
    public static string Content(string? text,bool required)
    {
        var value=text?.Trim()??"";
        if((required&&value.Length==0)||value.Length>2000)throw new RequestRuleException("Nội dung cần từ 1 đến 2.000 ký tự; phần nhận xét kèm sao có thể để trống.");
        return value;
    }
}
