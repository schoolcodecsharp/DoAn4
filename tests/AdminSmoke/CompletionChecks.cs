using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using backend.Services;
using Dapper;
using MySqlConnector;

// Existing accounts only; mutable fixtures have an exact unique tag.
static class CompletionChecks
{
    public static async Task Run(MySqlConnection db, string root)
    {
        using var accounts = JsonDocument.Parse(await File.ReadAllTextAsync(Path.Combine(root,"../.local/test-accounts.json")));
        using var admin = new HttpClient { BaseAddress = new Uri("http://localhost:5000/api/") };
        using var customer = new HttpClient { BaseAddress = admin.BaseAddress };
        using var guest = new HttpClient { BaseAddress = admin.BaseAddress };
        async Task<int> Login(HttpClient client,string role)
        {
            var a=accounts.RootElement.GetProperty(role);
            var r=await client.PostAsJsonAsync("auth/login",new { email=a.GetProperty("email").GetString(),matKhau=a.GetProperty("password").GetString() });
            r.EnsureSuccessStatusCode();
            var s=await r.Content.ReadFromJsonAsync<JsonElement>();
            client.DefaultRequestHeaders.Authorization=new AuthenticationHeaderValue("Bearer",s.GetProperty("token").GetString());
            return s.GetProperty("user").GetProperty("maNguoiDung").GetInt32();
        }
        var adminId=await Login(admin,"admin"); await Login(customer,"user");
        var tag="completion-"+Guid.NewGuid().ToString("N");
        var date=BookingRules.Today.AddDays(60);
        int hotel=0,otherHotel=0,room=0,tour=0,departure=0,trip=0,passes=0;
        void Check(bool ok,string label) { if(!ok)throw new Exception("FAIL completion: "+label); passes++;Console.WriteLine("PASS completion: "+label); }
        async Task<int> Created(HttpResponseMessage r,string key="id")
        {
            if(r.StatusCode!=HttpStatusCode.Created)throw new Exception($"Fixture create failed ({r.StatusCode}): {await r.Content.ReadAsStringAsync()}");
            return (await r.Content.ReadFromJsonAsync<JsonElement>()).GetProperty(key).GetInt32();
        }
        async Task Status(Task<HttpResponseMessage> action,HttpStatusCode expected,string label)
        { using var r=await action;Check(r.StatusCode==expected,$"{label} (HTTP {(int)r.StatusCode})"); }
        object Room(int? parent=null,string? name=null,decimal price=500000) => new {maKhachSan=parent??hotel,tenLoaiPhong=name??tag,moTa="Disposable fixture",sucChua=2,soLuongPhong=1,giaMoiDem=price,trangThai=true};
        object Departure(DateTime when,decimal price=1000000,string state="OpenForBooking") => new {maTour=tour,ngayKhoiHanh=when,soChoToiDa=2,soChoDaDat=0,giaApDung=price,trangThai=state};
        try
        {
            hotel=await Created(await admin.PostAsJsonAsync("khachsan",new {tenKhachSan=tag,loaiLuuTru="Hotel",trangThai=true}));
            otherHotel=await Created(await admin.PostAsJsonAsync("khachsan",new {tenKhachSan=tag+"-other",loaiLuuTru="Hotel",trangThai=true}));
            await Status(admin.PostAsJsonAsync("loaiphong",Room(name:"   ")),HttpStatusCode.BadRequest,"reject blank room name");
            await Status(admin.PostAsJsonAsync("loaiphong",Room(parent:0)),HttpStatusCode.BadRequest,"reject missing hotel");
            await Status(admin.PostAsJsonAsync("loaiphong",Room(price:10000000000000m)),HttpStatusCode.BadRequest,"reject oversized room price");
            await Status(admin.PostAsJsonAsync("loaiphong",Room(price:1.001m)),HttpStatusCode.BadRequest,"reject silent price rounding");
            room=await Created(await admin.PostAsJsonAsync("loaiphong",Room()),"maLoaiPhong");
            var tourBody=new {maNguoiTao=adminId,tenTour=tag,moTa="Disposable fixture",diemKhoiHanh="Hà Nội",diemDen="Quảng Ninh",soNgay=1,soDem=0,giaTour=1000000,soNguoiToiThieu=1,soNguoiToiDa=2,trangThai="Active"};
            tour=await Created(await admin.PostAsJsonAsync("tour",tourBody),"maTour");
            await Status(admin.PostAsJsonAsync("tourkhoihanh",Departure(BookingRules.Today.AddDays(-1))),HttpStatusCode.BadRequest,"reject new departure in past");
            await Status(admin.PostAsJsonAsync("tourkhoihanh",Departure(date,state:"Invalid")),HttpStatusCode.BadRequest,"reject unknown departure state");
            await Status(admin.PostAsJsonAsync("tourkhoihanh",Departure(date,state:"Completed")),HttpStatusCode.BadRequest,"reject completed new departure");
            await Status(admin.PostAsJsonAsync("tourkhoihanh",Departure(date,10000000000000m)),HttpStatusCode.BadRequest,"reject oversized departure price");
            departure=await Created(await admin.PostAsJsonAsync("tourkhoihanh",Departure(date)),"maKhoiHanh");
            await Status(admin.PutAsJsonAsync($"tourkhoihanh/{departure}",Departure(date,1.001m)),HttpStatusCode.BadRequest,"validate departure update price");
            var tourRequest=new {maKhoiHanh=departure,soNguoi=2,ghiChu=tag,tongTien=1};
            await Status(guest.PostAsJsonAsync("account/bookings/tours",tourRequest),HttpStatusCode.Unauthorized,"guest cannot book");
            await Status(customer.PostAsJsonAsync("tour",tourBody),HttpStatusCode.Forbidden,"customer cannot edit catalog");
            var tourRace=await Task.WhenAll(customer.PostAsJsonAsync("account/bookings/tours",tourRequest),customer.PostAsJsonAsync("account/bookings/tours",tourRequest));
            Check(tourRace.Count(r=>r.StatusCode==HttpStatusCode.Created)==1 && tourRace.Count(r=>r.StatusCode==HttpStatusCode.Conflict)==1,"concurrent requests cannot oversell tour");
            var tourBooking=await Created(tourRace.Single(r=>r.StatusCode==HttpStatusCode.Created));
            Check(await db.ExecuteScalarAsync<decimal>("SELECT TongTien FROM DatTour WHERE MaDatTour=@tourBooking",new{tourBooking})==2000000,"server ignores forged booking total");
            Check(await db.ExecuteScalarAsync<int>("SELECT SoChoDaDat FROM TourKhoiHanh WHERE MaKhoiHanh=@departure",new{departure})==2,"seat counter equals successful booking");
            await Status(admin.PutAsJsonAsync($"tourkhoihanh/{departure}",Departure(date,state:"Cancelled")),HttpStatusCode.Conflict,"cannot cancel departure with live bookings");
            await Status(admin.PutAsJsonAsync($"tourkhoihanh/{departure}",Departure(date,state:"Completed")),HttpStatusCode.Conflict,"cannot finish future departure");
            var hotelRequest=new {maLoaiPhong=room,ngayNhanPhong=date,ngayTraPhong=date.AddDays(1),soLuongPhong=1,soNguoi=2,ghiChu=tag};
            var roomRace=await Task.WhenAll(customer.PostAsJsonAsync("account/bookings/hotels",hotelRequest),customer.PostAsJsonAsync("account/bookings/hotels",hotelRequest));
            Check(roomRace.Count(r=>r.StatusCode==HttpStatusCode.Created)==1 && roomRace.Count(r=>r.StatusCode==HttpStatusCode.Conflict)==1,"concurrent requests cannot oversell room");
            var roomBooking=await Created(roomRace.Single(r=>r.StatusCode==HttpStatusCode.Created));
            await Status(admin.PutAsJsonAsync($"loaiphong/{room}",Room(parent:otherHotel)),HttpStatusCode.Conflict,"cannot reparent room with pending order");
            await ReviewRegression.Run(db,admin,customer,guest,tour,departure,adminId,tourBooking,roomBooking);
            await Status(admin.PutAsJsonAsync($"loaiphong/{room}",Room(parent:otherHotel)),HttpStatusCode.Conflict,"cannot reparent room after cancelled order");
            await db.ExecuteAsync("UPDATE DatPhong SET TrangThai='CheckedOut',NgayNhanPhong=@start,NgayTraPhong=@end WHERE MaDatPhong=@roomBooking AND GhiChu=@tag",new{roomBooking,tag,start=BookingRules.Today.AddDays(-3),end=BookingRules.Today.AddDays(-2)});
            await Status(admin.PutAsJsonAsync($"loaiphong/{room}",Room(parent:otherHotel)),HttpStatusCode.Conflict,"cannot rewrite completed hotel history");
            await Status(admin.PutAsJsonAsync($"loaiphong/{room}",Room(price:StorageRules.MaxMoney)),HttpStatusCode.OK,"valid maximum SQL room price accepted");
            await Status(customer.PostAsJsonAsync("account/bookings/hotels",new {maLoaiPhong=room,ngayNhanPhong=date,ngayTraPhong=date.AddDays(2),soLuongPhong=1,soNguoi=1,ghiChu=tag}),HttpStatusCode.BadRequest,"oversized room total fails before SQL");
            var expensive=await Created(await admin.PostAsJsonAsync("tourkhoihanh",Departure(date.AddDays(1),StorageRules.MaxMoney)),"maKhoiHanh");
            await Status(customer.PostAsJsonAsync("account/bookings/tours",new {maKhoiHanh=expensive,soNguoi=2,ghiChu=tag}),HttpStatusCode.BadRequest,"oversized tour total fails before SQL");
            Check(await db.ExecuteScalarAsync<int>("SELECT SoChoDaDat FROM TourKhoiHanh WHERE MaKhoiHanh=@expensive",new{expensive})==0,"failed total validation reserves no seats");
            await Status(admin.PutAsJsonAsync($"tourkhoihanh/{expensive}",Departure(date.AddDays(1),state:"Cancelled")),HttpStatusCode.NoContent,"cancel empty departure");
            await Status(admin.PutAsJsonAsync($"tourkhoihanh/{expensive}",Departure(date.AddDays(1))),HttpStatusCode.Conflict,"cannot reopen cancelled departure");
            await Status(admin.DeleteAsync($"tourkhoihanh/{expensive}"),HttpStatusCode.NoContent,"closing cancelled departure is safe");
            Check(await db.ExecuteScalarAsync<string>("SELECT TrangThai FROM TourKhoiHanh WHERE MaKhoiHanh=@expensive",new{expensive})=="Cancelled","delete cannot bypass terminal state");
            trip=await Created(await customer.PostAsJsonAsync("account/itineraries",new {tenChuyenDi=tag,diemKhoiHanh="Hà Nội",diemDen="Quảng Ninh",ngayBatDau=date,soNguoi=1,nganSach=1000000,days=new[]{new{tieuDe="Ngày thử",ghiChu=tag}}}));
            await Status(admin.PostAsJsonAsync("chiphi",new {maChuyenDi=trip,tenChiPhi=tag,soTien=100,ngayChi=DateTime.MinValue}),HttpStatusCode.BadRequest,"reject invalid expense date");
            var expense=await Created(await admin.PostAsJsonAsync("chiphi",new {maChuyenDi=trip,tenChiPhi=tag,soTien=100,ngayChi=date}));
            await Status(admin.PutAsJsonAsync($"chiphi/{expense}",new {ngayChi=DateTime.MinValue}),HttpStatusCode.BadRequest,"validate expense date update");
            await Status(admin.PostAsJsonAsync("magiamgia",new {code=tag,loaiGiam="PhanTram",giaTriGiam=10,ngayBatDau=DateTime.MinValue,ngayKetThuc=date}),HttpStatusCode.BadRequest,"reject invalid coupon date");
            await Status(admin.PostAsJsonAsync("magiamgia",new {code=tag,loaiGiam="PhanTram",giaTriGiam=10,donHangToiThieu=10000000000000m,ngayBatDau=date,ngayKetThuc=date.AddDays(1)}),HttpStatusCode.BadRequest,"reject oversized coupon threshold");
            var account=await customer.GetFromJsonAsync<JsonElement>("account");
            Check(account.GetProperty("tours").EnumerateArray().Any(b=>b.GetProperty("id").GetInt32()==tourBooking),"customer sees own booking");
            var other=await admin.GetFromJsonAsync<JsonElement>("account");
            Check(!other.GetProperty("tours").EnumerateArray().Any(b=>b.GetProperty("id").GetInt32()==tourBooking),"account bookings isolated by owner");
            Console.WriteLine($"COMPLETION CHECKS: {passes} passed, plus ReviewRegression above.");
        }
        finally
        {
            await using var tx=await db.BeginTransactionAsync();
            await db.ExecuteAsync("DELETE p FROM ThanhToan p JOIN DatTour d ON d.MaDatTour=p.MaDatTour JOIN Tour t ON t.MaTour=d.MaTour WHERE t.MaTour=@tour AND t.TenTour=@tag",new{tour,tag},tx);
            await db.ExecuteAsync("DELETE p FROM ThanhToan p JOIN DatPhong d ON d.MaDatPhong=p.MaDatPhong JOIN LoaiPhong r ON r.MaLoaiPhong=d.MaLoaiPhong WHERE r.MaLoaiPhong=@room AND r.TenLoaiPhong=@tag",new{room,tag},tx);
            await db.ExecuteAsync("DELETE d FROM DatTour d JOIN Tour t ON t.MaTour=d.MaTour WHERE t.MaTour=@tour AND t.TenTour=@tag",new{tour,tag},tx);
            await db.ExecuteAsync("DELETE d FROM DatPhong d JOIN LoaiPhong r ON r.MaLoaiPhong=d.MaLoaiPhong WHERE r.MaLoaiPhong=@room AND r.TenLoaiPhong=@tag",new{room,tag},tx);
            await db.ExecuteAsync("DELETE FROM Tour WHERE MaTour=@tour AND TenTour=@tag",new{tour,tag},tx);
            await db.ExecuteAsync("DELETE FROM LoaiPhong WHERE MaLoaiPhong=@room AND TenLoaiPhong=@tag",new{room,tag},tx);
            await db.ExecuteAsync("DELETE FROM KhachSan WHERE (MaKhachSan=@hotel AND TenKhachSan=@tag) OR (MaKhachSan=@otherHotel AND TenKhachSan=@other)",new{hotel,otherHotel,tag,other=tag+"-other"},tx);
            await db.ExecuteAsync("DELETE FROM ChuyenDi WHERE MaChuyenDi=@trip AND TenChuyenDi=@tag",new{trip,tag},tx);
            await db.ExecuteAsync("DELETE FROM MaGiamGia WHERE Code=@tag",new{tag},tx);
            await tx.CommitAsync();
            Console.WriteLine("Completion fixtures cleaned; existing users and application records preserved.");
        }
    }
}
