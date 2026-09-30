using System.Security.Claims;
using backend.Security;
using backend.Services;
using Dapper;
using Microsoft.AspNetCore.Mvc;
using MySqlConnector;

namespace backend.Controllers;

[ApiController]
[Route("api/feedback/{kind}/{id:int}")]
public sealed class FeedbackController(IConfiguration config) : ControllerBase
{
    private MySqlConnection Connection()=>new(config.GetConnectionString("DefaultConnection"));
    private int Owner=>int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> Read(string kind,int id,int reviewPage=1,int commentPage=1)
    {
        if(reviewPage is <1 or >100000 || commentPage is <1 or >100000)return BadRequest(new{message="Trang không hợp lệ."});
        await using var db=Connection();await FeedbackRules.EnsureTarget(db,kind,id);
        var (_,column)=FeedbackRules.Target(kind);
        var filter=$"{column}=@id AND TrangThai=1 AND {FeedbackRules.Verified}";
        var summary=await db.QuerySingleAsync($"SELECT COUNT(*) AS count,COALESCE(ROUND(AVG(SoSao),2),0) AS average FROM DanhGia WHERE {filter}",new{id});
        var reviews=await db.QueryAsync($"SELECT d.MaDanhGia AS id,u.HoTen AS author,d.SoSao AS stars,d.NoiDung AS content,d.NgayDanhGia AS createdAt FROM DanhGia d JOIN NguoiDung u ON u.MaNguoiDung=d.MaNguoiDung WHERE d.{column}=@id AND d.TrangThai=1 AND {FeedbackRules.Verified} ORDER BY d.MaDanhGia DESC LIMIT 10 OFFSET @offset",new{id,offset=(reviewPage-1)*10});
        var commentCount=await db.ExecuteScalarAsync<int>($"SELECT COUNT(*) FROM BinhLuan WHERE {column}=@id AND TrangThai=1",new{id});
        var comments=await db.QueryAsync($"SELECT b.MaBinhLuan AS id,u.HoTen AS author,b.NoiDung AS content,b.NgayTao AS createdAt FROM BinhLuan b JOIN NguoiDung u ON u.MaNguoiDung=b.MaNguoiDung WHERE b.{column}=@id AND b.TrangThai=1 ORDER BY b.MaBinhLuan DESC LIMIT 10 OFFSET @offset",new{id,offset=(commentPage-1)*10});
        return Ok(new{summary,reviews,comments,commentCount,reviewPage,commentPage,pageSize=10});
    }

    [HttpGet("eligibility")]
    public async Task<IActionResult> Eligibility(string kind,int id)
    {
        await using var db=Connection();await FeedbackRules.EnsureTarget(db,kind,id);
        var (_,column)=FeedbackRules.Target(kind);
        var existing=await db.QuerySingleOrDefaultAsync($"SELECT MaDanhGia AS id,TrangThai AS visible FROM DanhGia WHERE MaNguoiDung=@owner AND {column}=@id AND {FeedbackRules.Verified} LIMIT 1",new{owner=Owner,id});
        var eligible=await FeedbackRules.Proof(db,kind,id,Owner)!=null;
        return Ok(new{canReview=eligible&&existing==null,alreadyReviewed=existing!=null,requirement=FeedbackRules.Requirement(kind)});
    }

    [HttpPost("comments")]
    public async Task<IActionResult> Comment(string kind,int id,CommentRequest request)
    {
        var content=FeedbackRules.Content(request.Content,true);
        await using var db=Connection();await db.OpenAsync();
        await using var tx=await db.BeginTransactionAsync(System.Data.IsolationLevel.ReadCommitted);
        await LockAuthor(db,tx);
        await FeedbackRules.EnsureTarget(db,kind,id,tx);var (_,column)=FeedbackRules.Target(kind);
        if(await db.ExecuteScalarAsync<int>($"SELECT COUNT(*) FROM BinhLuan WHERE MaNguoiDung=@owner AND {column}=@id AND NoiDung=@content AND NgayTao>UTC_TIMESTAMP()-INTERVAL 1 MINUTE",new{owner=Owner,id,content},tx)>0)
            throw new RequestRuleException("Bình luận này vừa được gửi. Vui lòng tải lại để xem.",409);
        var saved=await db.ExecuteScalarAsync<int>($"INSERT INTO BinhLuan(MaNguoiDung,{column},NoiDung,NgayTao) VALUES(@owner,@id,@content,UTC_TIMESTAMP()); SELECT LAST_INSERT_ID();",new{owner=Owner,id,content},tx);
        await tx.CommitAsync();return StatusCode(201,new{id=saved});
    }

    [HttpPost("reviews")]
    public async Task<IActionResult> Review(string kind,int id,ReviewRequest request)
    {
        if(request.Stars is <1 or >5)return BadRequest(new{message="Chọn từ 1 đến 5 sao."});
        var content=FeedbackRules.Content(request.Content,false);
        await using var db=Connection();await db.OpenAsync();
        await using var tx=await db.BeginTransactionAsync(System.Data.IsolationLevel.ReadCommitted);
        await LockAuthor(db,tx);
        await FeedbackRules.EnsureTarget(db,kind,id,tx);var (_,column)=FeedbackRules.Target(kind);
        var proof=await FeedbackRules.Proof(db,kind,id,Owner,tx);
        if(proof==null)throw new RequestRuleException(FeedbackRules.Requirement(kind),403);
        if(await db.ExecuteScalarAsync<int>($"SELECT COUNT(*) FROM DanhGia WHERE MaNguoiDung=@owner AND {column}=@id AND {FeedbackRules.Verified}",new{owner=Owner,id},tx)>0)
            throw new RequestRuleException("Bạn đã chấm sao cho dịch vụ này. Mỗi tài khoản được đánh giá một lần, kể cả đánh giá đang được ẩn.",409);
        var proofColumn=kind=="hotels"?"MaDatPhongXacMinh":"MaDatTourXacMinh";
        var saved=await db.ExecuteScalarAsync<int>($"INSERT INTO DanhGia(MaNguoiDung,{column},SoSao,NoiDung,NgayDanhGia,{proofColumn}) VALUES(@owner,@id,@stars,@content,UTC_TIMESTAMP(),@proof); SELECT LAST_INSERT_ID();",new{owner=Owner,id,stars=request.Stars,content,proof},tx);
        await tx.CommitAsync();return StatusCode(201,new{id=saved});
    }

    private async Task LockAuthor(MySqlConnection db,MySqlTransaction tx)
    {
        if(await db.ExecuteScalarAsync<int>("SELECT MaNguoiDung FROM NguoiDung WHERE MaNguoiDung=@owner AND TrangThai=1 FOR UPDATE",new{owner=Owner},tx)==0)
            throw new RequestRuleException("Tài khoản không còn hoạt động.",401);
    }
    public sealed record CommentRequest(string? Content);
    public sealed record ReviewRequest(int Stars,string? Content);
}
