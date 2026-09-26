using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Dapper;
using MySqlConnector;

static class MembershipAudit
{
    public static async Task Run(MySqlConnection db,HttpClient owner,HttpClient invited,HttpClient guest,int tripId,int ownerId,int invitedId)
    {
        int checks=0;
        void Check(bool ok,string message) { if(!ok) throw new Exception("MEMBERSHIP FAIL: "+message); checks++; Console.WriteLine("PASS members: "+message); }
        var email=await db.ExecuteScalarAsync<string>("SELECT Email FROM NguoiDung WHERE MaNguoiDung=@invitedId",new{invitedId});
        var ownEmail=await db.ExecuteScalarAsync<string>("SELECT Email FROM NguoiDung WHERE MaNguoiDung=@ownerId",new{ownerId});
        string endpoint=$"account/itineraries/{tripId}/members";
        Check((await guest.GetAsync(endpoint)).StatusCode==HttpStatusCode.Unauthorized,"guest cannot read members");
        Check((await invited.GetAsync(endpoint)).StatusCode==HttpStatusCode.NotFound,"non-owner cannot read private member list");
        Check((await invited.PostAsJsonAsync(endpoint,new{email=ownEmail})).StatusCode==HttpStatusCode.NotFound,"non-owner cannot invite");
        Check((await owner.PostAsJsonAsync(endpoint,new{email=ownEmail})).StatusCode==HttpStatusCode.BadRequest,"owner cannot invite self");
        Check((await owner.PostAsJsonAsync(endpoint,new{email="bad-address"})).StatusCode==HttpStatusCode.BadRequest,"invalid email rejected");
        var results=await Task.WhenAll(Enumerable.Range(0,2).Select(_=>owner.PostAsJsonAsync(endpoint,new{email})));
        Check(results.Count(r=>r.StatusCode==HttpStatusCode.Created)==1 && results.Count(r=>r.StatusCode==HttpStatusCode.Conflict)==1,"concurrent invitations deduplicated");
        var id=(await results.Single(r=>r.StatusCode==HttpStatusCode.Created).Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetInt32();
        var account=await invited.GetFromJsonAsync<JsonElement>("account");
        Check(account.GetProperty("invitations").EnumerateArray().Any(i=>i.GetProperty("id").GetInt32()==id),"recipient sees invitation");
        Check(!account.GetProperty("trips").EnumerateArray().Any(t=>t.GetProperty("maChuyenDi").GetInt32()==tripId),"pending invitation does not expose itinerary");
        Check((await owner.PutAsJsonAsync($"account/invitations/{id}",new{status="Accepted"})).StatusCode==HttpStatusCode.NotFound,"owner cannot accept on recipient behalf");
        Check((await invited.PutAsJsonAsync($"account/invitations/{id}",new{status="Owner"})).StatusCode==HttpStatusCode.BadRequest,"cannot forge membership role");
        Check((await invited.PutAsJsonAsync($"account/invitations/{id}",new{status="Rejected"})).IsSuccessStatusCode,"recipient can decline");
        Check((await owner.PostAsJsonAsync(endpoint,new{email})).StatusCode==HttpStatusCode.Created,"owner can re-invite declined member");
        Check((await invited.PutAsJsonAsync($"account/invitations/{id}",new{status="Accepted"})).IsSuccessStatusCode,"recipient can accept");
        Check((await invited.PutAsJsonAsync($"account/invitations/{id}",new{status="Accepted"})).IsSuccessStatusCode,"accept retry idempotent");
        account=await invited.GetFromJsonAsync<JsonElement>("account");
        var shared=account.GetProperty("trips").EnumerateArray().Single(t=>t.GetProperty("maChuyenDi").GetInt32()==tripId);
        Check(!shared.GetProperty("isOwner").GetBoolean() && shared.GetProperty("days").GetArrayLength()==2,"accepted member sees read-only shared itinerary");
        Check((await invited.DeleteAsync(endpoint+"/"+id)).StatusCode==HttpStatusCode.NotFound,"member cannot remove members");
        Check((await owner.DeleteAsync(endpoint+"/"+id)).IsSuccessStatusCode,"owner removes membership");
        account=await invited.GetFromJsonAsync<JsonElement>("account");
        Check(!account.GetProperty("trips").EnumerateArray().Any(t=>t.GetProperty("maChuyenDi").GetInt32()==tripId),"removal revokes itinerary access");
        Check((await invited.PutAsJsonAsync($"account/invitations/{id}",new{status="Accepted"})).StatusCode==HttpStatusCode.NotFound,"removed invitation cannot be accepted");
        Console.WriteLine($"MEMBERSHIP AUDIT: {checks} passed");
    }
}

