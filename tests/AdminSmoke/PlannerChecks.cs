using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using backend.Services;
using Dapper;
using MySqlConnector;

static class PlannerChecks
{
    public static async Task Run(MySqlConnection db, string root)
    {
        using var credentials = JsonDocument.Parse(await File.ReadAllTextAsync(Path.Combine(root,"../.local/test-accounts.json")));
        using var user = new HttpClient { BaseAddress = new Uri("http://localhost:5000/api/") };
        using var admin = new HttpClient { BaseAddress = user.BaseAddress };
        using var anonymous = new HttpClient { BaseAddress = user.BaseAddress };
        async Task<int> Login(HttpClient client, string role)
        {
            var account = credentials.RootElement.GetProperty(role);
            var response = await client.PostAsJsonAsync("auth/login", new { email = account.GetProperty("email").GetString(), matKhau = account.GetProperty("password").GetString() });
            response.EnsureSuccessStatusCode();
            var session = await response.Content.ReadFromJsonAsync<JsonElement>();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", session.GetProperty("token").GetString());
            return session.GetProperty("user").GetProperty("maNguoiDung").GetInt32();
        }
        var owner = await Login(user,"user"); await Login(admin,"admin");
        var tag = "planner-check-" + Guid.NewGuid().ToString("N");
        int hotel=0,room=0,restaurant=0,trip=0;
        var places = new List<int>(); var bookings = new List<int>();
        var start = BookingRules.Today.AddDays(90);
        void Check(bool ok, string label) { if(!ok) throw new Exception("FAIL planner: " + label); Console.WriteLine("PASS planner: " + label); }
        async Task<JsonElement> Read(HttpResponseMessage response)
        { if(!response.IsSuccessStatusCode) throw new Exception($"HTTP {(int)response.StatusCode}: {await response.Content.ReadAsStringAsync()}"); return await response.Content.ReadFromJsonAsync<JsonElement>(); }
        object Event(string kind, int id, int? roomId=null, int rooms=1, int quantity=2, int nights=2, string from="08:00:00",string to="09:00:00") =>
            new { loaiDiaDiem=kind,maDoiTuong=id,roomId,rooms,quantity,nights,thoiGianBatDau=from,thoiGianKetThuc=to };
        object Plan(object[] events, int revision=0) => new { tenChuyenDi=tag,diemKhoiHanh="Hà Nội",diemDen="Quảng Ninh",ngayBatDau=start,soNguoi=2,nganSach=5000000,revision,days=new[]{new{tieuDe="Ngày kiểm thử",activities=events}} };
        async Task<JsonElement> Quote(object[] events) => (await Read(await user.PostAsJsonAsync("account/itineraries/estimate",Plan(events)))).GetProperty("days")[0];
        try
        {
            var category = await db.ExecuteScalarAsync<int>("SELECT MaLoai FROM LoaiDiaDiem ORDER BY MaLoai LIMIT 1");
            foreach(var (price,free) in new[]{(100000m,false),(0m,true),(0m,false)})
                places.Add(await db.ExecuteScalarAsync<int>("INSERT INTO DiaDiem(MaLoai,TenDiaDiem,GiaVe,MienPhi,TrangThai) VALUES(@category,@tag,@price,@free,1); SELECT LAST_INSERT_ID();",new{category,tag,price,free}));
            hotel=await db.ExecuteScalarAsync<int>("INSERT INTO KhachSan(TenKhachSan,TrangThai) VALUES(@tag,1);SELECT LAST_INSERT_ID();",new{tag});
            room=await db.ExecuteScalarAsync<int>("INSERT INTO LoaiPhong(MaKhachSan,TenLoaiPhong,GiaMoiDem,SucChua,SoLuongPhong,TrangThai) VALUES(@hotel,@tag,500000,2,3,1);SELECT LAST_INSERT_ID();",new{hotel,tag});
            restaurant=await db.ExecuteScalarAsync<int>("INSERT INTO NhaHang(TenNhaHang,GiaMin,GiaMax,TrangThai) VALUES(@tag,100000,200000,1);SELECT LAST_INSERT_ID();",new{tag});
            var activities = new[]{Event("DiaDiem",places[0]),Event("DiaDiem",places[1],from:"09:00:00",to:"10:00:00"),Event("DiaDiem",places[2],from:"10:00:00",to:"11:00:00"),Event("NhaHang",restaurant,from:"11:00:00",to:"12:00:00"),Event("KhachSan",hotel,room,2,2,2,"14:00:00","15:00:00")};
            var q=await Quote(activities);
            Check(q[0].GetProperty("minTotal").GetDecimal()==200000,"ticket price multiplied by quantity");
            Check(q[1].GetProperty("free").GetBoolean()&&q[1].GetProperty("minTotal").GetDecimal()==0,"explicit free admission");
            Check(q[2].GetProperty("minTotal").ValueKind==JsonValueKind.Null,"legacy zero is unknown, not free");
            Check(q[3].GetProperty("minTotal").GetDecimal()==200000&&q[3].GetProperty("maxTotal").GetDecimal()==400000,"restaurant range multiplied by diners");
            Check(q[4].GetProperty("minTotal").GetDecimal()==2000000&&q[4].GetProperty("availableRooms").GetInt32()==3,"room rate x nights x rooms; no reservation created");
            foreach(var (state,offset) in new[]{("Pending",0),("Confirmed",1),("Cancelled",0),("CheckedOut",0)})
                bookings.Add(await db.ExecuteScalarAsync<int>("INSERT INTO DatPhong(MaNguoiDung,MaLoaiPhong,NgayNhanPhong,NgayTraPhong,SoLuongPhong,SoNguoi,GiaMoiDem,TongTien,TrangThai,GhiChu) VALUES(@owner,@room,@from,@to,1,1,500000,500000,@state,@tag);SELECT LAST_INSERT_ID();",new{owner,room,from=start.AddDays(offset),to=start.AddDays(offset+1),state,tag}));
            q=await Quote(new[]{activities[4]});
            Check(q[0].GetProperty("availableRooms").GetInt32()==2&&q[0].GetProperty("available").GetBoolean(),"per-night minimum; adjacent stays not summed; cancelled/checked-out ignored");
            q=await Quote(new[]{Event("KhachSan",hotel,room,3)});
            Check(!q[0].GetProperty("available").GetBoolean(),"insufficient inventory reported");
            q=await Quote(new[]{Event("KhachSan",hotel,room,1,3)});
            Check(!q[0].GetProperty("available").GetBoolean(),"capacity checked independently");
            Check((await user.PostAsJsonAsync("account/itineraries/estimate",Plan(new[]{Event("KhachSan",hotel,int.MaxValue)}))).StatusCode==HttpStatusCode.BadRequest,"foreign or missing room rejected");
            Check((await user.PostAsJsonAsync("account/itineraries/estimate",Plan(new[]{Event("DiaDiem",places[0],quantity:-1)}))).StatusCode==HttpStatusCode.BadRequest,"negative quantity rejected");
            Check((await anonymous.PostAsJsonAsync("account/itineraries/estimate",Plan(activities))).StatusCode==HttpStatusCode.Unauthorized,"anonymous estimate denied");
            trip=(await Read(await user.PostAsJsonAsync("account/itineraries",Plan(activities)))).GetProperty("id").GetInt32();
            Check(await db.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM LichTrinhChiTiet a JOIN LichTrinh l ON l.MaLichTrinh=a.MaLichTrinh WHERE l.MaChuyenDi=@trip AND a.DuToan IS NOT NULL",new{trip})==5,"all estimates persisted with activities");
            await db.ExecuteAsync("UPDATE DiaDiem SET GiaVe=150000 WHERE MaDiaDiem=@id",new{id=places[0]});
            var account=await Read(await user.GetAsync("account"));
            var saved=account.GetProperty("trips").EnumerateArray().Single(t=>t.GetProperty("maChuyenDi").GetInt32()==trip);
            Check(saved.GetProperty("days")[0].GetProperty("activities")[0].GetProperty("estimate").GetProperty("minTotal").GetDecimal()==200000,"saved estimate survives catalog price change");
            Check(saved.GetProperty("days")[0].GetProperty("activities")[4].GetProperty("estimate").GetProperty("roomOptions").ValueKind==JsonValueKind.Null,"do not persist inventory options as current availability");
            Check((await admin.PutAsJsonAsync("account/itineraries/"+trip,Plan(activities))).StatusCode==HttpStatusCode.NotFound,"another account cannot edit owner's itinerary");
            var updated=await user.PutAsJsonAsync("account/itineraries/"+trip,Plan(activities)); updated.EnsureSuccessStatusCode();
            Check((await user.PutAsJsonAsync("account/itineraries/"+trip,Plan(activities))).StatusCode==HttpStatusCode.Conflict,"stale revision still rejected");
            Check((await Quote(new[]{activities[0]}))[0].GetProperty("minTotal").GetDecimal()==300000,"fresh estimate uses changed server price");
            await db.ExecuteAsync("UPDATE DiaDiem SET GiaVe=9999999999999 WHERE MaDiaDiem=@id",new{id=places[0]});
            Check((await user.PostAsJsonAsync("account/itineraries/estimate",Plan(new[]{activities[0]}))).StatusCode==HttpStatusCode.BadRequest,"computed monetary overflow rejected");
            var order=account.GetProperty("hotels").EnumerateArray().Single(b=>b.GetProperty("id").GetInt32()==bookings[0]);
            Check(order.GetProperty("unitPrice").GetDecimal()==500000 && order.GetProperty("nights").GetInt32()==1,"booking exposes historical unit price and nights");
            Check(await db.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM DatPhong WHERE MaLoaiPhong=@room",new{room})==4,"saving itinerary does not reserve rooms");
        }
        finally
        {
            if(trip>0)await db.ExecuteAsync("DELETE FROM ChuyenDi WHERE MaChuyenDi=@trip AND TenChuyenDi=@tag",new{trip,tag});
            if(bookings.Count>0)await db.ExecuteAsync("DELETE FROM DatPhong WHERE MaDatPhong IN @bookings AND GhiChu=@tag",new{bookings,tag});
            if(room>0)await db.ExecuteAsync("DELETE FROM LoaiPhong WHERE MaLoaiPhong=@room AND TenLoaiPhong=@tag",new{room,tag});
            if(hotel>0)await db.ExecuteAsync("DELETE FROM KhachSan WHERE MaKhachSan=@hotel AND TenKhachSan=@tag",new{hotel,tag});
            if(restaurant>0)await db.ExecuteAsync("DELETE FROM NhaHang WHERE MaNhaHang=@restaurant AND TenNhaHang=@tag",new{restaurant,tag});
            if(places.Count>0)await db.ExecuteAsync("DELETE FROM DiaDiem WHERE MaDiaDiem IN @places AND TenDiaDiem=@tag",new{places,tag});
            Console.WriteLine("Planner fixtures cleaned; existing users and bookings preserved.");
        }
    }
}
