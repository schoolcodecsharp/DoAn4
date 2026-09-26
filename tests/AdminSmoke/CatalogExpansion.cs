using System.Diagnostics;
using System.Security.Cryptography;
using System.Text.Json;
using Dapper;
using Microsoft.Extensions.Configuration;
using MySqlConnector;

static class CatalogExpansion
{
    private sealed record Place(string Prefix,string Name,string Province,string Description,decimal Price);
    private static readonly Place[] Places = {
        new("sa-pa","Cảnh quan Sa Pa","Lào Cai","Khám phá cảnh quan núi và ruộng bậc thang quanh Sa Pa.",650000),
        new("ninh-binh","Quần thể danh thắng Tràng An","Ninh Bình","Khám phá cảnh quan sông nước và núi đá vôi Tràng An.",750000),
        new("phu-quoc","Đảo Phú Quốc","An Giang","Bộ sưu tập bờ biển và cảnh quan trên đảo Phú Quốc.",850000),
        new("nha-trang","Bãi biển Nha Trang","Khánh Hòa","Dạo biển và ngắm cảnh ven biển Nha Trang.",450000),
        new("quy-nhon","Tháp Đôi Quy Nhơn","Gia Lai","Tham quan không gian kiến trúc Tháp Đôi tại Quy Nhơn.",350000),
        new("mui-ne","Đồi cát Mũi Né","Lâm Đồng","Ngắm cảnh đồi cát và chụp ảnh tại Mũi Né.",550000),
        new("phong-nha","Hang động Phong Nha","Quảng Trị","Khám phá cảnh quan hang động trong khu vực Phong Nha.",850000),
        new("ho-guom","Hồ Hoàn Kiếm","Hà Nội","Đi bộ ven hồ và khám phá không gian cảnh quan trung tâm Hà Nội.",250000)
    };
    public static async Task Run(MySqlConnection db,IConfiguration config,string root)
    {
        var project=Path.GetFullPath(Path.Combine(root,".."));
        var source=Path.Combine(project,"AnhDuLich");
        var metadata=Path.Combine(root,"Data","photo-sources");
        var output=Path.Combine(root,"wwwroot","media","library");
        Directory.CreateDirectory(output);
        var json=new JsonSerializerOptions {PropertyNameCaseInsensitive=true};
        var photos=Directory.GetFiles(metadata,"*.source.json").Select(path => (
            File:Path.GetFileName(path).Replace(".source.json",""),
            Meta:JsonSerializer.Deserialize<backend.Tools.ImageLibraryImport.ImportedImage>(File.ReadAllText(path),json)!
        )).ToArray();
        foreach(var photo in photos) {
            var bytes=await File.ReadAllBytesAsync(Path.Combine(source,photo.File));
            if(Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant()!=photo.Meta.Sha256) throw new Exception("Checksum mismatch: "+photo.File);
        }
        if(await db.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM ThanhToan WHERE SoTien<=0")!=0 ||
           await db.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM (SELECT MaGiaoDich FROM ThanhToan WHERE MaGiaoDich IS NOT NULL GROUP BY MaGiaoDich HAVING COUNT(*)>1) x")!=0)
            throw new Exception("Payment migration preflight failed; no changes made.");
        var backupDir=Path.Combine(root,"backups");
        Directory.CreateDirectory(backupDir);
        var backup=Path.Combine(backupDir,$"before-catalog-fixes-{DateTime.Now:yyyyMMdd-HHmmssfff}.sql");
        var cs=new MySqlConnectionStringBuilder(config.GetConnectionString("DefaultConnection"));
        var start=new ProcessStartInfo(@"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe") {UseShellExecute=false,CreateNoWindow=true,RedirectStandardError=true};
        foreach(var arg in new[]{"--host="+cs.Server,"--port="+cs.Port,"--user="+cs.UserID,"--single-transaction","--routines","--triggers","--no-tablespaces","--databases",cs.Database,"--result-file="+backup}) start.ArgumentList.Add(arg);
        start.Environment["MYSQL_PWD"]=cs.Password;
        using(var process=Process.Start(start)!) {
            var errors=await process.StandardError.ReadToEndAsync(); await process.WaitForExitAsync();
            if(process.ExitCode!=0 || new FileInfo(backup).Length<100) throw new Exception("Backup failed: "+errors);
        }
        Console.WriteLine("BACKUP: "+backup);
        if(await db.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='ThanhToan' AND CONSTRAINT_NAME='ck_payment_positive'")==0)
            await db.ExecuteAsync("ALTER TABLE ThanhToan ADD CONSTRAINT ck_payment_positive CHECK(SoTien>0)");
        if(await db.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ThanhToan' AND INDEX_NAME='ux_payment_reference'")==0)
            await db.ExecuteAsync("CREATE UNIQUE INDEX ux_payment_reference ON ThanhToan(MaGiaoDich)");
        var before=await db.QuerySingleAsync<(int,int,int,int)>("SELECT (SELECT COUNT(*) FROM DiaDiem),(SELECT COUNT(*) FROM Tour),(SELECT COUNT(*) FROM HinhAnh),(SELECT COUNT(*) FROM TourKhoiHanh)");
        if(await db.ExecuteScalarAsync<int>("SELECT GET_LOCK('nvt_catalog_expansion',10)")!=1) throw new Exception("Another expansion is running.");
        try {
            using var tx=await db.BeginTransactionAsync();
            var actor=await db.ExecuteScalarAsync<int>("SELECT MaNguoiDung FROM NguoiDung WHERE MaVaiTro=1 AND TrangThai=1 ORDER BY MaNguoiDung LIMIT 1",transaction:tx);
            if(actor==0) throw new Exception("Create an admin before importing demo tours.");
            var category=await db.ExecuteScalarAsync<int>("SELECT MaLoai FROM LoaiDiaDiem WHERE TrangThai=1 ORDER BY MaLoai LIMIT 1",transaction:tx);
            async Task Link(int id,string column,string caption,(string File,backend.Tools.ImageLibraryImport.ImportedImage Meta) photo) {
                var target=Path.Combine(output,photo.File);
                if(!File.Exists(target)) File.Copy(Path.Combine(source,photo.File),target);
                else if(Convert.ToHexString(SHA256.HashData(await File.ReadAllBytesAsync(target))).ToLowerInvariant()!=photo.Meta.Sha256)
                    throw new Exception("Existing served image differs: "+photo.File);
                var url="/media/library/"+photo.File;
                if(await db.ExecuteScalarAsync<int>($"SELECT COUNT(*) FROM HinhAnh WHERE {column}=@id AND DuongDan=@url",new{id,url},tx)>0) return;
                var order=await db.ExecuteScalarAsync<int>($"SELECT COALESCE(MAX(ThuTu),-1)+1 FROM HinhAnh WHERE {column}=@id",new{id},tx);
                await db.ExecuteAsync($"INSERT INTO HinhAnh({column},DuongDan,MoTa,ThuTu,Nguon,TacGia,GiayPhep,UrlGiayPhep) VALUES(@id,@url,@caption,@order,@Nguon,@TacGia,@GiayPhep,@UrlGiayPhep)",
                    new{id,url,caption,order,photo.Meta.Nguon,photo.Meta.TacGia,photo.Meta.GiayPhep,photo.Meta.UrlGiayPhep},tx);
            }
            foreach(var place in Places) {
                var gallery=photos.Where(p=>p.File.StartsWith(place.Prefix+"-")).ToArray();
                if(gallery.Length<2) throw new Exception("Need at least two photos: "+place.Name);
                var destination=await db.ExecuteScalarAsync<int>("SELECT MaDiaDiem FROM DiaDiem WHERE TenDiaDiem=@Name ORDER BY MaDiaDiem LIMIT 1",place,tx);
                if(destination==0) destination=await db.ExecuteScalarAsync<int>("INSERT INTO DiaDiem(MaLoai,TenDiaDiem,TinhThanh,MoTa,ThoiGianThamQuan,TrangThai) VALUES(@category,@Name,@Province,@description,180,1); SELECT LAST_INSERT_ID();",
                    new{category,place.Name,place.Province,description=place.Description+" Giá vé chưa cập nhật; liên hệ điểm tham quan trước khi đi."},tx);
                var name=place.Name+" - trải nghiệm một ngày (tour mẫu)";
                var tour=await db.ExecuteScalarAsync<int>("SELECT MaTour FROM Tour WHERE TenTour=@name ORDER BY MaTour LIMIT 1",new{name},tx);
                if(tour==0) {
                    tour=await db.ExecuteScalarAsync<int>("INSERT INTO Tour(MaNguoiTao,TenTour,MoTa,DiemKhoiHanh,DiemDen,SoNgay,SoDem,GiaTour,SoNguoiToiDa,SoNguoiToiThieu,TrangThai) VALUES(@actor,@tourName,@description,@origin,@Province,1,0,@Price,20,1,'Active'); SELECT LAST_INSERT_ID();",
                        new{actor,tourName=name,origin=place.Name,place.Province,place.Price,description="DỮ LIỆU DEMO: giá và lịch khởi hành chỉ phục vụ kiểm thử đồ án, không phải chào bán thực tế. "+place.Description},tx);
                    for(var order=1;order<=2;order++)
                        await db.ExecuteAsync("INSERT INTO TourChiTiet(MaTour,NgayThu,ThuTu,LoaiDiaDiem,MaDiaDiem,ThoiGianBatDau,ThoiGianKetThuc,GhiChu) VALUES(@tour,1,@order,'DiaDiem',@destination,@start,@end,@note)",
                            new{tour,order,destination,start=order==1?"09:00:00":"14:00:00",end=order==1?"11:00:00":"16:00:00",note=order==1?"Tham quan và tìm hiểu cảnh quan: "+place.Name:"Tự do ngắm cảnh, chụp ảnh và kết thúc hành trình: "+place.Name},tx);
                    foreach(var offset in new[]{30,45})
                        await db.ExecuteAsync("INSERT INTO TourKhoiHanh(MaTour,NgayKhoiHanh,SoChoToiDa,SoChoDaDat,GiaApDung,TrangThai) VALUES(@tour,@date,20,0,@Price,'OpenForBooking')",
                            new{tour,date=backend.Services.BookingRules.Today.AddDays(offset),place.Price},tx);
                }
                foreach(var photo in gallery) { await Link(destination,"MaDiaDiem",place.Name,photo); await Link(tour,"MaTour",place.Name,photo); }
            }
            foreach(var group in new[]{("ha-long","Vịnh Hạ Long"),("hoi-an","Phố cổ Hội An"),("hue","Đại Nội Huế")}) {
                var destination=await db.ExecuteScalarAsync<int>("SELECT MaDiaDiem FROM DiaDiem WHERE TenDiaDiem=@name ORDER BY MaDiaDiem LIMIT 1",new{name=group.Item2},tx);
                if(destination==0) continue;
                var tours=(await db.QueryAsync<int>("SELECT DISTINCT MaTour FROM TourChiTiet WHERE MaDiaDiem=@destination",new{destination},tx)).ToArray();
                foreach(var photo in photos.Where(p=>p.File.StartsWith(group.Item1+"-") && char.IsDigit(p.File[(group.Item1+"-").Length]) && !p.Meta.Title.Contains("1932"))) {
                    await Link(destination,"MaDiaDiem",group.Item2,photo);
                    foreach(var tour in tours) await Link(tour,"MaTour",group.Item2,photo);
                }
            }
            await tx.CommitAsync();
        } finally { await db.ExecuteAsync("SELECT RELEASE_LOCK('nvt_catalog_expansion')"); }
        var after=await db.QuerySingleAsync<(int,int,int,int)>("SELECT (SELECT COUNT(*) FROM DiaDiem),(SELECT COUNT(*) FROM Tour),(SELECT COUNT(*) FROM HinhAnh),(SELECT COUNT(*) FROM TourKhoiHanh)");
        Console.WriteLine($"ADDED destinations={after.Item1-before.Item1}, tours={after.Item2-before.Item2}, images={after.Item3-before.Item3}, departures={after.Item4-before.Item4}");
        Console.WriteLine($"TOTAL destinations={after.Item1}, tours={after.Item2}, image-links={after.Item3}, departures={after.Item4}");
    }
}
