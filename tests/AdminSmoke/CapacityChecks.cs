using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Dapper;
using MySqlConnector;

static class CapacityChecks
{
    public static async Task Run(MySqlConnection db, string root)
    {
        using var accounts = JsonDocument.Parse(await File.ReadAllTextAsync(Path.Combine(root,"../.local/test-accounts.json")));
        var account = accounts.RootElement.GetProperty("admin");
        using var api = new HttpClient { BaseAddress = new Uri("http://localhost:5000/api/") };
        var login = await api.PostAsJsonAsync("auth/login", new { email=account.GetProperty("email").GetString(), matKhau=account.GetProperty("password").GetString() });
        login.EnsureSuccessStatusCode();
        var session = await login.Content.ReadFromJsonAsync<JsonElement>();
        api.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer",session.GetProperty("token").GetString());
        var actor = await db.ExecuteScalarAsync<int>("SELECT MaNguoiDung FROM NguoiDung WHERE Email=@email AND MaVaiTro=1",new {email=account.GetProperty("email").GetString()});
        var name = "capacity-check-" + Guid.NewGuid().ToString("N"); int id=0;
        object Tour(int min,int max) => new { maNguoiTao=actor,tenTour=name,moTa="Disposable regression fixture",diemKhoiHanh="Hà Nội",diemDen="Hưng Yên",soNgay=1,soDem=0,giaTour=100,giaTourMin=0,giaTourMax=0,soNguoiToiThieu=min,soNguoiToiDa=max,trangThai="Draft" };
        void Check(HttpResponseMessage response,int expected,string label) { if((int)response.StatusCode!=expected) throw new Exception($"FAIL {label}: {response.StatusCode}"); Console.WriteLine("PASS "+label); }
        try
        {
            var created=await api.PostAsJsonAsync("tour",Tour(0,0)); Check(created,201,"Create reference with paired unknown capacities");
            id=(await created.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("maTour").GetInt32();
            Check(await api.PutAsJsonAsync("tour/"+id,Tour(0,0)),204,"Edit reference without inventing capacity");
            Check(await api.PutAsJsonAsync("tour/"+id,Tour(0,5)),400,"Reject partially unknown capacity");
            Check(await api.PutAsJsonAsync("tour/"+id,Tour(2,1)),400,"Reject reversed limits");
            var departure=new {maTour=id,ngayKhoiHanh=DateTime.Today.AddYears(1).ToString("yyyy-MM-dd"),soChoToiDa=5,soChoDaDat=0,giaApDung=100,trangThai="OpenForBooking"};
            Check(await api.PostAsJsonAsync("tourkhoihanh",departure),400,"Reject departure until tour capacity confirmed");
            Check(await api.PutAsJsonAsync("tour/"+id,Tour(1,5)),204,"Confirm fixture capacity");
            Check(await api.PostAsJsonAsync("tourkhoihanh",departure),201,"Existing confirmed-capacity departure flow works");
            Check(await api.PutAsJsonAsync("tour/"+id,Tour(0,0)),409,"Prevent clearing capacity with existing departure");
        }
        finally
        {
            if(id>0)
            {
                using var tx=await db.BeginTransactionAsync();
                if(await db.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM Tour WHERE MaTour=@id AND TenTour=@name",new{id,name},tx)==1)
                {
                    await db.ExecuteAsync("DELETE FROM TourKhoiHanh WHERE MaTour=@id",new{id},tx);
                    await db.ExecuteAsync("DELETE FROM Tour WHERE MaTour=@id AND TenTour=@name",new{id,name},tx);
                }
                await tx.CommitAsync();
            }
            Console.WriteLine("Only exact-tag capacity fixture removed; existing users unchanged.");
        }
    }
}
