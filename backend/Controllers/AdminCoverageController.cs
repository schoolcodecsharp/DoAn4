using Dapper;
using Microsoft.AspNetCore.Mvc;
using MySqlConnector;

namespace backend.Controllers;

// Admin-only through CustomerAccessFilter; returns schema names, never row contents.
[ApiController]
[Route("api/admin/coverage")]
public sealed class AdminCoverageController(IConfiguration config) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        await using var db = new MySqlConnection(config.GetConnectionString("DefaultConnection"));
        var tables = await db.QueryAsync<string>("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME");
        return Ok(new { tables });
    }
}
