using Dapper;
using Microsoft.AspNetCore.Mvc;
using MySqlConnector;

namespace backend.Controllers;

// Admin moderation only; public reads and customer writes use FeedbackController.
[ApiController]
[Route("api/binhluan")]
public sealed class BinhLuanController(IConfiguration config) : ControllerBase
{
    private MySqlConnection Connection()=>new(config.GetConnectionString("DefaultConnection"));
    [HttpGet]
    public async Task<IActionResult> All(){await using var db=Connection();return Ok(await db.QueryAsync<CommentDto>("SELECT * FROM BinhLuan ORDER BY MaBinhLuan DESC"));}
    [HttpGet("{id:int}")]
    public async Task<IActionResult> One(int id){await using var db=Connection();var row=await db.QuerySingleOrDefaultAsync<CommentDto>("SELECT * FROM BinhLuan WHERE MaBinhLuan=@id",new{id});return row==null?NotFound():Ok(row);}
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Moderate(int id,Visibility request)
    {
        if(request.TrangThai==null)return BadRequest(new{message="Chọn trạng thái hiển thị."});
        await using var db=Connection();
        return await db.ExecuteAsync("UPDATE BinhLuan SET TrangThai=@TrangThai WHERE MaBinhLuan=@id",new{id,request.TrangThai})>0?NoContent():NotFound();
    }
    public sealed record Visibility(bool? TrangThai);
    public sealed class CommentDto
    {
        public int MaBinhLuan { get; set; }
        public int MaNguoiDung { get; set; }
        public int? MaTour { get; set; }
        public int? MaDiaDiem { get; set; }
        public int? MaKhachSan { get; set; }
        public string NoiDung { get; set; } = "";
        public DateTime NgayTao { get; set; }
        public bool TrangThai { get; set; }
    }
}
