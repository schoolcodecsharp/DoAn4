using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Dapper;
using Microsoft.Extensions.Configuration;
using MySqlConnector;

// Integration smoke test: creates only uniquely named test records and removes
// exactly those records/files in finally. Never resets or re-seeds the database.
var root = Path.GetFullPath(args.Length > 0 ? args[0] : "../../backend");
var config = new ConfigurationBuilder().SetBasePath(root).AddJsonFile("appsettings.json").AddJsonFile("appsettings.Development.json", true).AddEnvironmentVariables().Build();
await using var db = new MySqlConnection(config.GetConnectionString("DefaultConnection"));
await db.OpenAsync();
if(args.Contains("--capacity-checks")) { await CapacityChecks.Run(db,root); return; }
if(args.Contains("--verified-catalog") || args.Contains("--verified-coverage")) { await VerifiedCatalog.Run(db,config,root,args.Contains("--verified-catalog")); return; }
if(args.Contains("--coverage-fixtures")) { await CoverageFixtures.Run(db,args); return; }
if(args.Contains("--expand-catalog")) { await CatalogExpansion.Run(db,config,root); return; }
if(args.Contains("--browser")) { await BrowserAudit.Run(db,root); return; }
if(args.Contains("--upgrade-workflow")) { await WorkflowUpgrade.Run(db,config,root); return; }
if(args.Contains("--complete-sample-data")) { await SampleCompletion.Run(db,config,root); return; }
if(args.Contains("--check-sample-data")) { await SampleCompletion.Check(db,root,true); return; }
if(args.Contains("--repair-confirmed")) { await DatabaseRepair.Run(db,config,root); return; }
if (args.Contains("--sql-roundtrip")) { await SqlRoundTrip.Run(db,config,root); return; }
if (args.Contains("--audit") || args.Contains("--remove-unused-refresh-token")) {
    await DatabaseAudit.Run(db, config, root, args.Contains("--remove-unused-refresh-token"));
    return;
}
using var api = new HttpClient { BaseAddress = new Uri("http://localhost:5000/api/") };
var suffix = Guid.NewGuid().ToString("N");
var email = $"smoke-{suffix}@example.invalid";
var password = Guid.NewGuid().ToString("N") + "Aa1!";
int adminId = 0, userId = 0, destinationId = 0, tourId = 0, activityId = 0, departureId = 0;
string? uploadedPath = null;
void Check(bool ok, string name) { if (!ok) throw new Exception("FAIL: " + name); Console.WriteLine("PASS: " + name); }
async Task<JsonElement> Read(HttpResponseMessage response) {
    if (!response.IsSuccessStatusCode) throw new Exception($"HTTP {response.StatusCode}: {await response.Content.ReadAsStringAsync()}");
    return await response.Content.ReadFromJsonAsync<JsonElement>();
}
try {
    Check((await api.GetAsync("nguoidung")).StatusCode == HttpStatusCode.Unauthorized, "Anonymous cannot list accounts");
    adminId = await db.ExecuteScalarAsync<int>("INSERT INTO NguoiDung(MaVaiTro,HoTen,Email,MatKhau,TrangThai) VALUES(1,'Admin smoke test',@email,@hash,1); SELECT LAST_INSERT_ID();", new { email, hash = BCrypt.Net.BCrypt.HashPassword(password) });
    var session = await Read(await api.PostAsJsonAsync("auth/login",new { email, matKhau=password }));
    api.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer",session.GetProperty("token").GetString());
    Check((await api.GetAsync("nguoidung")).IsSuccessStatusCode,"Admin can list accounts");
    var categoryId = await db.ExecuteScalarAsync<int>("SELECT MaLoai FROM LoaiDiaDiem ORDER BY MaLoai LIMIT 1");
    var destination = await Read(await api.PostAsJsonAsync("diadiem",new { maLoai=categoryId, tenDiaDiem="Smoke " + suffix, moTa="Test description", tinhThanh="Quảng Ninh", trangThai=true, thoiGianThamQuan=60 }));
    destinationId = destination.GetProperty("id").GetInt32();
    var tour = await Read(await api.PostAsJsonAsync("tour",new { maNguoiTao=adminId,tenTour="Smoke " + suffix,moTa="Test itinerary",diemKhoiHanh="Hà Nội",diemDen="Quảng Ninh",soNgay=2,soDem=1,giaTour=1000000,soNguoiToiDa=20,soNguoiToiThieu=1,trangThai="Draft" }));
    tourId = tour.GetProperty("maTour").GetInt32();
    var activity = await Read(await api.PostAsJsonAsync("tourchitiet",new { maTour=tourId,ngayThu=1,thuTu=1,loaiDiaDiem="DiaDiem",maDiaDiem=destinationId,ghiChu="Test day one",thoiGianBatDau="08:00:00",thoiGianKetThuc="10:00:00" }));
    activityId = activity.GetProperty("maTourChiTiet").GetInt32();
    var departure = await Read(await api.PostAsJsonAsync("tourkhoihanh",new { maTour=tourId,ngayKhoiHanh="2027-10-01",soChoToiDa=20,soChoDaDat=0,giaApDung=1000000,trangThai="OpenForBooking" }));
    departureId = departure.GetProperty("maKhoiHanh").GetInt32();
    Check(activityId > 0 && departureId > 0,"Create destination, tour, daily activity and departure");
    using (var form = new MultipartFormDataContent()) {
        var image = new ByteArrayContent(await File.ReadAllBytesAsync(Path.Combine(root,"wwwroot/media/vietnam/ha-long.jpg")));
        image.Headers.ContentType = new MediaTypeHeaderValue("image/jpeg"); form.Add(image,"file","smoke.jpg");
        form.Add(new StringContent("DiaDiem"),"loaiDoiTuong"); form.Add(new StringContent(destinationId.ToString()),"maDoiTuong"); form.Add(new StringContent("Test image"),"moTa");
        var photo = await Read(await api.PostAsync("hinhanh/upload",form)); uploadedPath = photo.GetProperty("duongDan").GetString();
    }
    var itinerary = await Read(await api.GetAsync($"tourchitiet/bytour/{tourId}"));
    Check(itinerary[0].GetProperty("hinhAnh").GetArrayLength() == 1,"Uploaded image appears in tour daily itinerary");
    Check((await api.DeleteAsync($"diadiem/{destinationId}")).IsSuccessStatusCode && await db.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM DiaDiem WHERE MaDiaDiem=@destinationId AND TrangThai=0",new{destinationId})==1,"Destination archive keeps row and related history");
    var account = await Read(await api.PostAsJsonAsync("nguoidung",new { hoTen="Smoke user",email="user-"+email,matKhau=password,maVaiTro=2,trangThai=true }));
    userId = account.GetProperty("id").GetInt32();
    var customer = await Read(await api.PostAsJsonAsync("auth/login",new { email="user-"+email,matKhau=password }));
    api.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer",customer.GetProperty("token").GetString());
    Check((await api.GetAsync("nguoidung")).StatusCode == HttpStatusCode.Forbidden,"Customer cannot list accounts");
    Check((await api.DeleteAsync($"tour/{tourId}")).StatusCode == HttpStatusCode.Forbidden,"Customer cannot modify catalog");
    if (args.Contains("--functional")) await FunctionalAudit.Run(db,session.GetProperty("token").GetString()!,customer.GetProperty("token").GetString()!,userId,adminId,tourId,departureId,destinationId);
} finally {
    if (departureId > 0) await db.ExecuteAsync("DELETE FROM TourKhoiHanh WHERE MaKhoiHanh=@departureId",new {departureId});
    if (activityId > 0) await db.ExecuteAsync("DELETE FROM TourChiTiet WHERE MaTourChiTiet=@activityId",new {activityId});
    if (tourId > 0) await db.ExecuteAsync("DELETE FROM Tour WHERE MaTour=@tourId AND TenTour=@name",new {tourId,name="Smoke "+suffix});
    if (destinationId > 0) await db.ExecuteAsync("DELETE FROM DiaDiem WHERE MaDiaDiem=@destinationId AND TenDiaDiem=@name",new {destinationId,name="Smoke "+suffix});
    if (userId > 0) await db.ExecuteAsync("DELETE FROM NguoiDung WHERE MaNguoiDung=@userId AND Email=@email",new {userId,email="user-"+email});
    if (adminId > 0) await db.ExecuteAsync("DELETE FROM NguoiDung WHERE MaNguoiDung=@adminId AND Email=@email",new {adminId,email});
    if (uploadedPath != null) {
        var file = Path.GetFullPath(Path.Combine(root,"wwwroot",uploadedPath.TrimStart('/')));
        var allowed = Path.GetFullPath(Path.Combine(root,"wwwroot/media/uploads")) + Path.DirectorySeparatorChar;
        if (file.StartsWith(allowed,StringComparison.OrdinalIgnoreCase) && File.Exists(file)) File.Delete(file);
    }
    Console.WriteLine("Test-only records and uploaded file cleaned up.");
}
