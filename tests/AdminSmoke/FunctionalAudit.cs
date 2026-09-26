using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Dapper;
using MySqlConnector;

static class FunctionalAudit
{
    public static async Task Run(MySqlConnection db, string adminToken, string customerToken, int userId, int adminId, int tourId, int departureId, int destinationId)
    {
        using var admin = new HttpClient { BaseAddress = new Uri("http://localhost:5000/api/") };
        using var customer = new HttpClient { BaseAddress = admin.BaseAddress };
        using var guest = new HttpClient { BaseAddress = admin.BaseAddress };
        admin.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer",adminToken);
        customer.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer",customerToken);
        int passes = 0, failures = 0, hotelId = 0, roomId = 0;
        void Check(bool ok, string name) { if (ok) passes++; else failures++; Console.WriteLine($"{(ok ? "PASS" : "FAIL")}: {name}"); }
        async Task<JsonElement> Json(HttpResponseMessage response) {
            if (!response.IsSuccessStatusCode) throw new Exception($"Unexpected HTTP {response.StatusCode}: {await response.Content.ReadAsStringAsync()}");
            return await response.Content.ReadFromJsonAsync<JsonElement>();
        }
        try {
            foreach (var path in new[] {"tour","tourchitiet","tourkhoihanh","diadiem","loaidiadiem","khachsan","loaiphong","nhahang","hinhanh"})
                Check((await guest.GetAsync(path)).StatusCode == HttpStatusCode.OK,$"Public GET /{path}");
            foreach (var path in new[] {"nguoidung","vaitro","dattour","datphong","thanhtoan","magiamgia","chuyendi","lichtrinh","lichtrinhchitiet","thanhvienchuyendi","chiphi","danhgia","yeuthich"}) {
                Check((await guest.GetAsync(path)).StatusCode == HttpStatusCode.Unauthorized,$"Guest blocked /{path}");
                Check((await admin.GetAsync(path)).StatusCode == HttpStatusCode.OK,$"Admin GET /{path}");
                Check((await customer.GetAsync(path)).StatusCode == HttpStatusCode.Forbidden,$"Customer blocked admin /{path}");
            }
            Check((await guest.GetAsync("refreshtoken")).StatusCode == HttpStatusCode.NotFound,"Removed RefreshToken API is 404");
            Check((await guest.PostAsJsonAsync("auth/login",new {email="invalid@example.invalid",matKhau="wrong"})).StatusCode == HttpStatusCode.Unauthorized,"Wrong credentials rejected");
            using(var bad = new HttpClient { BaseAddress=admin.BaseAddress }) {
                bad.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer","invalid-token");
                Check((await bad.GetAsync("auth/me")).StatusCode == HttpStatusCode.Unauthorized,"Forged token rejected");
            }
            var users = await Json(await admin.GetAsync("nguoidung"));
            Check(users.EnumerateArray().All(u => !u.TryGetProperty("matKhau",out _)),"Account list does not expose password hashes");
            using(var form = new MultipartFormDataContent()) {
                form.Add(new ByteArrayContent("not an image"u8.ToArray()),"file","fake.jpg");
                form.Add(new StringContent("Tour"),"loaiDoiTuong"); form.Add(new StringContent(tourId.ToString()),"maDoiTuong");
                Check((await admin.PostAsync("hinhanh/upload",form)).StatusCode == HttpStatusCode.BadRequest,"Fake JPG upload rejected");
            }
            var emptyAccount = await Json(await customer.GetAsync("account"));
            Check(emptyAccount.GetProperty("tours").GetArrayLength() == 0 && emptyAccount.GetProperty("hotels").GetArrayLength() == 0,"New user cannot see another customer's bookings");
            await db.ExecuteAsync("UPDATE Tour SET TrangThai='Active' WHERE MaTour=@tourId; UPDATE TourKhoiHanh SET SoChoToiDa=3,SoChoDaDat=0 WHERE MaKhoiHanh=@departureId",new {tourId,departureId});
            Check((await customer.PostAsJsonAsync("account/bookings/tours",new {maKhoiHanh=departureId,soNguoi=0})).StatusCode == HttpStatusCode.BadRequest,"Zero travelers rejected");
            var results = await Task.WhenAll(Enumerable.Range(0,2).Select(_ => customer.PostAsJsonAsync("account/bookings/tours",new {maKhoiHanh=departureId,soNguoi=2,tongTien=1})));
            Check(results.Count(r => r.StatusCode == HttpStatusCode.Created) == 1 && results.Count(r => r.StatusCode == HttpStatusCode.Conflict) == 1,"Concurrent tour requests cannot overbook");
            var booking = await Json(results.First(r => r.StatusCode == HttpStatusCode.Created));
            Check(booking.GetProperty("total").GetDecimal() == 2000000,"Tour price calculated by server, ignores forged total");
            var bookingId = booking.GetProperty("id").GetInt32();
            await admin.PutAsJsonAsync($"dattour/{bookingId}",new {trangThai="Cancelled"});
            var remainingCounter = await db.ExecuteScalarAsync<int>("SELECT SoChoDaDat FROM TourKhoiHanh WHERE MaKhoiHanh=@departureId",new {departureId});
            Check(remainingCounter == 0,"Admin cancellation releases tour capacity");
            Check((await admin.PutAsJsonAsync($"dattour/{bookingId}",new {trangThai="Confirmed"})).StatusCode==HttpStatusCode.Conflict,"Cancelled booking cannot be reopened");
            booking=await Json(await customer.PostAsJsonAsync("account/bookings/tours",new {maKhoiHanh=departureId,soNguoi=2}));
            bookingId=booking.GetProperty("id").GetInt32();
            await admin.PutAsJsonAsync($"dattour/{bookingId}",new {trangThai="Confirmed"});
            Check(await db.ExecuteScalarAsync<int>("SELECT SoChoDaDat FROM TourKhoiHanh WHERE MaKhoiHanh=@departureId",new{departureId})==2,"Repeated status update does not reserve twice");
            var date = await db.ExecuteScalarAsync<DateTime>("SELECT NgayKhoiHanh FROM TourKhoiHanh WHERE MaKhoiHanh=@departureId",new{departureId});
            Check((await admin.PutAsJsonAsync($"tourkhoihanh/{departureId}",new {maTour=tourId,ngayKhoiHanh=date,soChoToiDa=3,soChoDaDat=0,giaApDung=1000000,trangThai="OpenForBooking"})).IsSuccessStatusCode && await db.ExecuteScalarAsync<int>("SELECT SoChoDaDat FROM TourKhoiHanh WHERE MaKhoiHanh=@departureId",new{departureId})==2,"Stale admin form cannot overwrite reserved seats");
            Check((await admin.PutAsJsonAsync($"tourkhoihanh/{departureId}",new {maTour=tourId,ngayKhoiHanh=date,soChoToiDa=1,soChoDaDat=0,giaApDung=1000000,trangThai="OpenForBooking"})).StatusCode==HttpStatusCode.Conflict,"Capacity cannot be reduced below bookings");
            Check((await admin.DeleteAsync($"dattour/{bookingId}")).StatusCode==HttpStatusCode.Conflict,"Order deletion forbidden to preserve history");
            await admin.PutAsJsonAsync($"dattour/{bookingId}",new {trangThai="Cancelled"});
            Check(await db.ExecuteScalarAsync<int>("SELECT SoChoDaDat FROM TourKhoiHanh WHERE MaKhoiHanh=@departureId",new{departureId})==0,"Cancelling confirmed reservation releases seats");
            var newHotel = await Json(await admin.PostAsJsonAsync("khachsan",new {tenKhachSan="Audit " + Guid.NewGuid().ToString("N"),loaiLuuTru="Hotel",trangThai=true}));
            hotelId = newHotel.GetProperty("id").GetInt32();
            roomId = await db.ExecuteScalarAsync<int>("INSERT INTO LoaiPhong(MaKhachSan,TenLoaiPhong,SucChua,SoLuongPhong,GiaMoiDem,TrangThai) VALUES(@hotelId,'Audit room',2,1,500000,1); SELECT LAST_INSERT_ID();",new {hotelId});
            var start = DateTime.UtcNow.AddHours(7).Date.AddDays(30);
            var stay = new {maLoaiPhong=roomId,ngayNhanPhong=start,ngayTraPhong=start.AddDays(2),soLuongPhong=1,soNguoi=2,tongTien=1};
            var roomResults = await Task.WhenAll(Enumerable.Range(0,2).Select(_ => customer.PostAsJsonAsync("account/bookings/hotels",stay)));
            Check(roomResults.Count(r => r.StatusCode==HttpStatusCode.Created)==1 && roomResults.Count(r => r.StatusCode==HttpStatusCode.Conflict)==1,"Concurrent room requests cannot overbook");
            var hotelBooking = await Json(roomResults.First(r => r.StatusCode==HttpStatusCode.Created));
            Check(hotelBooking.GetProperty("total").GetDecimal()==1000000,"Room price uses nights and stored price");
            Check((await customer.PostAsJsonAsync("account/bookings/hotels",new {maLoaiPhong=roomId,ngayNhanPhong=start,ngayTraPhong=start,soLuongPhong=1,soNguoi=1})).StatusCode==HttpStatusCode.BadRequest,"Invalid stay dates rejected");
            var roomBookingId=hotelBooking.GetProperty("id").GetInt32();
            Check((await admin.PostAsJsonAsync("datphong",new {maNguoiDung=userId,maLoaiPhong=roomId,ngayNhanPhong=start,ngayTraPhong=start.AddDays(2),soLuongPhong=1,soNguoi=2,giaMoiDem=1,tongTien=1})).StatusCode==HttpStatusCode.Conflict,"Admin room booking uses same inventory as customer");
            Check((await admin.PutAsJsonAsync($"datphong/{roomBookingId}",new {tongTien=1})).StatusCode==HttpStatusCode.Conflict,"Admin cannot overwrite booked room price");
            Check((await admin.PutAsJsonAsync($"datphong/{roomBookingId}",new {trangThai="CheckedOut"})).StatusCode==HttpStatusCode.Conflict,"Room cannot skip confirmation/check-in");
            Check((await admin.PutAsJsonAsync($"datphong/{roomBookingId}",new {trangThai="Confirmed"})).IsSuccessStatusCode,"Room Pending to Confirmed allowed");
            Check((await admin.PutAsJsonAsync($"datphong/{roomBookingId}",new {trangThai="CheckedIn"})).StatusCode==HttpStatusCode.Conflict,"Early check-in blocked");
            Check((await admin.DeleteAsync($"datphong/{roomBookingId}")).StatusCode==HttpStatusCode.Conflict,"Room booking history cannot be deleted");
            Check((await admin.PutAsJsonAsync($"datphong/{roomBookingId}",new {trangThai="Cancelled"})).IsSuccessStatusCode,"Unpaid confirmed room can cancel");
            Check((await admin.PutAsJsonAsync($"datphong/{roomBookingId}",new {trangThai="Confirmed"})).StatusCode==HttpStatusCode.Conflict,"Cancelled room cannot reopen");
            var adminRoom=await Json(await admin.PostAsJsonAsync("datphong",new {maNguoiDung=userId,maLoaiPhong=roomId,ngayNhanPhong=start,ngayTraPhong=start.AddDays(2),soLuongPhong=1,soNguoi=2,giaMoiDem=1,tongTien=1}));
            Check(adminRoom.GetProperty("tongTien").GetDecimal()==1000000,"Admin room price calculated by shared server rules");
            var dateTour=await db.ExecuteScalarAsync<DateTime>("SELECT NgayKhoiHanh FROM TourKhoiHanh WHERE MaKhoiHanh=@departureId",new{departureId});
            var adminTour=await Json(await admin.PostAsJsonAsync("dattour",new{maNguoiDung=userId,maTour=tourId,maKhoiHanh=departureId,ngayKhoiHanh=dateTour,soNguoi=2,giaMoiNguoi=1,tongTien=1}));
            var adminTourId=adminTour.GetProperty("id").GetInt32();
            adminTour=await Json(await admin.GetAsync($"dattour/{adminTourId}"));
            Check(adminTour.GetProperty("tongTien").GetDecimal()==2000000,"Admin tour price calculated by shared server rules");
            Check((await admin.PutAsJsonAsync($"dattour/{adminTourId}",new{trangThai="Completed"})).StatusCode==HttpStatusCode.Conflict,"Tour cannot skip confirmation");
            await admin.PutAsJsonAsync($"dattour/{adminTourId}",new{trangThai="Confirmed"});
            Check((await admin.PutAsJsonAsync($"dattour/{adminTourId}",new{trangThai="Completed"})).StatusCode==HttpStatusCode.Conflict,"Future tour cannot complete");
            Check((await admin.DeleteAsync($"tour/{tourId}")).IsSuccessStatusCode && await db.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM Tour WHERE MaTour=@tourId AND TrangThai='Inactive'",new{tourId})==1,"Archive booked tour preserves existing order");
            Check((await admin.PostAsJsonAsync("dattour",new{maNguoiDung=userId,maTour=tourId,maKhoiHanh=departureId,ngayKhoiHanh=dateTour,soNguoi=1})).StatusCode==HttpStatusCode.Conflict,"Admin cannot book archived tour");
            Check((await customer.PostAsJsonAsync("account/bookings/tours",new{maKhoiHanh=departureId,soNguoi=1})).StatusCode==HttpStatusCode.Conflict,"Customer cannot book archived tour");
            await db.ExecuteAsync("UPDATE Tour SET TrangThai='Active' WHERE MaTour=@tourId",new{tourId});
            var pendingRoomId=await db.ExecuteScalarAsync<int>("SELECT MaDatPhong FROM DatPhong WHERE MaNguoiDung=@userId AND TrangThai='Pending' ORDER BY MaDatPhong DESC LIMIT 1",new{userId});
            await ReviewRegression.Run(db,admin,customer,guest,tourId,departureId,adminId,adminTourId,pendingRoomId);
            foreach(var path in new[]{"admin/dashboard","admin/audit"}) {
                Check((await guest.GetAsync(path)).StatusCode==HttpStatusCode.Unauthorized,$"Guest blocked {path}");
                Check((await customer.GetAsync(path)).StatusCode==HttpStatusCode.Forbidden,$"Customer blocked {path}");
            }
            var dashboard=await Json(await admin.GetAsync("admin/dashboard"));
            Check(dashboard.GetProperty("summary").GetProperty("receivedRevenue").GetDecimal()==await db.ExecuteScalarAsync<decimal>("SELECT COALESCE(SUM(SoTien),0) FROM ThanhToan WHERE TrangThai='ThanhCong'"),"Dashboard uses successful payments, not order totals");
            var logs=await Json(await admin.GetAsync("admin/audit?page=1&pageSize=100"));
            Check(logs.GetProperty("items").EnumerateArray().Any(x=>x.GetProperty("actorId").GetInt32()==adminId && x.GetProperty("outcome").GetString()=="Succeeded"),"Audit records successful admin actor");
            Check(logs.GetProperty("items").EnumerateArray().Any(x=>x.GetProperty("actorId").GetInt32()==adminId && x.GetProperty("status").ValueKind==JsonValueKind.Number && x.GetProperty("status").GetInt32()==409),"Audit records rejected mutations");
            Check(!logs.GetRawText().Contains("matKhau",StringComparison.OrdinalIgnoreCase) && !logs.GetRawText().Contains(adminToken),"Audit does not expose credentials");
            Check((await admin.GetAsync("admin/audit?page=0")).StatusCode==HttpStatusCode.BadRequest,"Audit pagination validated");
            var trip = await Json(await customer.PostAsJsonAsync("account/itineraries",new {tenChuyenDi="Audit trip",diemKhoiHanh="Hà Nội",diemDen="Quảng Ninh",ngayBatDau=start,soNguoi=2,nganSach=3000000,days=new[]{new{tieuDe="Ngày 1",ghiChu="Tham quan"},new{tieuDe="Ngày 2",ghiChu="Trở về"}}}));
            Check(trip.GetProperty("id").GetInt32()>0,"Customer can save a two-day itinerary");
            await MembershipAudit.Run(db,customer,admin,guest,trip.GetProperty("id").GetInt32(),userId,adminId);
            var account = await Json(await customer.GetAsync("account"));
            Check(account.GetProperty("trips")[0].GetProperty("days").GetArrayLength()==2,"Account returns both itinerary days");
            Check((await guest.GetAsync("account")).StatusCode==HttpStatusCode.Unauthorized,"Account requires authentication");
            var invalidDay = await admin.PostAsJsonAsync("tourchitiet",new {maTour=tourId,ngayThu=99,thuTu=1,loaiDiaDiem="DiaDiem",maDiaDiem=destinationId,ghiChu="Audit invalid day"});
            Check(invalidDay.StatusCode==HttpStatusCode.BadRequest,"Activity outside tour duration is rejected by API");
            var like = new {maNguoiDung=userId,maTour=tourId};
            await Json(await admin.PostAsJsonAsync("yeuthich",like));
            var duplicate = await admin.PostAsJsonAsync("yeuthich",like);
            Check(duplicate.StatusCode==HttpStatusCode.Conflict,"Duplicate favorite prevented by database/API");
            await db.ExecuteAsync("UPDATE NguoiDung SET TrangThai=0 WHERE MaNguoiDung=@userId",new {userId});
            Check((await customer.GetAsync("account")).StatusCode==HttpStatusCode.Unauthorized,"Locked user loses access with existing JWT");
            await db.ExecuteAsync("UPDATE NguoiDung SET TrangThai=1 WHERE MaNguoiDung=@userId",new {userId});
        }
        finally {
            await db.ExecuteAsync("DELETE FROM YeuThich WHERE MaNguoiDung=@userId; DELETE FROM DatTour WHERE MaNguoiDung=@userId; DELETE FROM DatPhong WHERE MaNguoiDung=@userId; DELETE FROM ChuyenDi WHERE MaNguoiDung=@userId; DELETE FROM TourChiTiet WHERE MaTour=@tourId AND NgayThu=99",new{userId,tourId});
            await db.ExecuteAsync("UPDATE TourKhoiHanh SET SoChoDaDat=0 WHERE MaKhoiHanh=@departureId",new{departureId});
            if(roomId>0) await db.ExecuteAsync("DELETE FROM LoaiPhong WHERE MaLoaiPhong=@roomId",new{roomId});
            if(hotelId>0) await db.ExecuteAsync("DELETE FROM KhachSan WHERE MaKhachSan=@hotelId",new{hotelId});
            Console.WriteLine($"FUNCTIONAL AUDIT: {passes} passed, {failures} failed. Test fixtures removed.");
            if (failures > 0) Environment.ExitCode = 1;
        }
    }
}
