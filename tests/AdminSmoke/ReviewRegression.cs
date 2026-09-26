using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Dapper;
using MySqlConnector;

static class ReviewRegression
{
    public static async Task Run(MySqlConnection db,HttpClient admin,HttpClient customer,HttpClient guest,int tourId,int departureId,int adminId,int bookingId,int roomBookingId)
    {
        int passes=0;
        void Check(bool ok,string name) { if(!ok) throw new Exception("REGRESSION FAIL: "+name); passes++; Console.WriteLine("PASS regression: "+name); }
        async Task<int> Id(HttpResponseMessage response) {
            if(!response.IsSuccessStatusCode) throw new Exception(await response.Content.ReadAsStringAsync());
            return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetInt32();
        }
        await db.ExecuteAsync("UPDATE Tour SET TrangThai='Draft' WHERE MaTour=@tourId",new{tourId});
        try {
            foreach(var reader in new[]{guest,customer}) {
                Check((await reader.GetAsync($"tour/{tourId}")).StatusCode==HttpStatusCode.NotFound,"draft detail hidden");
                var list=await reader.GetFromJsonAsync<JsonElement>("tour?trangthai=Draft");
                Check(list.GetArrayLength()==0,"draft query cannot bypass visibility");
                Check((await reader.GetFromJsonAsync<JsonElement>($"tourkhoihanh/bytour/{tourId}")).GetArrayLength()==0,"draft departures hidden");
                Check((await reader.GetFromJsonAsync<JsonElement>($"tourchitiet/bytour/{tourId}")).GetArrayLength()==0,"draft itinerary hidden");
            }
            Check((await admin.GetAsync($"tour/{tourId}")).StatusCode==HttpStatusCode.OK,"admin can edit draft");
            Check((await admin.GetFromJsonAsync<JsonElement>($"tourkhoihanh/bytour/{tourId}")).GetArrayLength()>0,"admin sees draft departures");
        } finally { await db.ExecuteAsync("UPDATE Tour SET TrangThai='Active' WHERE MaTour=@tourId",new{tourId}); }
        var invalid=new {maNguoiTao=adminId,tenTour="Invalid review fixture",moTa="",diemKhoiHanh="Hà Nội",diemDen="Huế",soNgay=0,soDem=0,giaTour=-1,soNguoiToiThieu=5,soNguoiToiDa=1,trangThai="Draft"};
        Check((await admin.PostAsJsonAsync("tour",invalid)).StatusCode==HttpStatusCode.BadRequest,"invalid tour create rejected");
        Check((await admin.PutAsJsonAsync($"tour/{tourId}",invalid)).StatusCode==HttpStatusCode.BadRequest,"invalid tour update rejected");
        foreach(var amount in new[]{-1m,0m,2000001m}) {
            var response=await admin.PostAsJsonAsync("thanhtoan",new{loaiDon="DatTour",maDatTour=bookingId,soTien=amount,phuongThuc="TienMat"});
            Check(response.StatusCode==(amount<=0?HttpStatusCode.BadRequest:HttpStatusCode.Conflict),"invalid payment amount rejected");
        }
        var reference="review-"+Guid.NewGuid().ToString("N");
        var id=await Id(await admin.PostAsJsonAsync("thanhtoan",new{loaiDon="DatTour",maDatTour=bookingId,soTien=1000000,phuongThuc="ChuyenKhoan",maGiaoDich=reference}));
        Check((await admin.PostAsJsonAsync("thanhtoan",new{loaiDon="DatPhong",maDatPhong=roomBookingId,soTien=1,phuongThuc="ChuyenKhoan",maGiaoDich=reference})).StatusCode==HttpStatusCode.Conflict,"duplicate transaction reference blocked across bookings");
        Check((await admin.PutAsJsonAsync($"thanhtoan/{id}",new{trangThai="ThanhCong"})).IsSuccessStatusCode,"pending payment can succeed");
        var paid=await admin.GetFromJsonAsync<JsonElement>($"thanhtoan/{id}");
        Check(paid.GetProperty("ngayThanhToan").ValueKind==JsonValueKind.String,"server records successful payment time");
        Check((await admin.PutAsJsonAsync($"thanhtoan/{id}",new{trangThai="ThanhCong"})).IsSuccessStatusCode,"confirmation retry is idempotent");
        foreach(var status in new[]{"ThatBai","ChoThanhToan","DaHoanTien"})
            Check((await admin.PutAsJsonAsync($"thanhtoan/{id}",new{trangThai=status})).StatusCode==HttpStatusCode.Conflict,"cannot relabel successful payment: "+status);
        Check((await admin.DeleteAsync($"thanhtoan/{id}")).StatusCode==HttpStatusCode.Conflict,"cannot delete successful payment");
        Check((await admin.PutAsJsonAsync($"dattour/{bookingId}",new{trangThai="Cancelled"})).StatusCode==HttpStatusCode.Conflict,"paid tour cancellation blocked");
        var race=await Task.WhenAll(Enumerable.Range(0,2).Select(_=>admin.PostAsJsonAsync("thanhtoan",new{loaiDon="DatTour",maDatTour=bookingId,soTien=1000000,phuongThuc="TienMat"})));
        Check(race.Count(r=>r.StatusCode==HttpStatusCode.Created)==1 && race.Count(r=>r.StatusCode==HttpStatusCode.Conflict)==1,"concurrent payments cannot exceed booking total");
        var roomPayment=await Id(await admin.PostAsJsonAsync("thanhtoan",new{loaiDon="DatPhong",maDatPhong=roomBookingId,soTien=500000,phuongThuc="TienMat"}));
        Check((await admin.PutAsJsonAsync($"datphong/{roomBookingId}",new{trangThai="Cancelled"})).IsSuccessStatusCode,"unpaid room can cancel");
        Check((await admin.PutAsJsonAsync($"thanhtoan/{roomPayment}",new{trangThai="ThanhCong"})).StatusCode==HttpStatusCode.Conflict,"cancelled room cannot receive pending payment");
        Check((await admin.PostAsJsonAsync("thanhtoan",new{loaiDon="DatPhong",maDatPhong=roomBookingId,soTien=1,phuongThuc="TienMat"})).StatusCode==HttpStatusCode.Conflict,"cancelled room cannot create payment");
        Console.WriteLine($"REVIEW REGRESSION: {passes} passed");
    }
}

