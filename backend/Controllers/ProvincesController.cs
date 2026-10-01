using Dapper;
using Microsoft.AspNetCore.Mvc;
using MySqlConnector;
using System.Text.Json;

namespace backend.Controllers;

[ApiController]
[Route("api/provinces")]
public sealed class ProvincesController(IConfiguration config) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        await using var db = new MySqlConnection(config.GetConnectionString("DefaultConnection"));
        var rows = await db.QueryAsync<ProvinceRow>("SELECT Code,Name,DivisionType,Aliases,VerifiedOn FROM TinhThanh ORDER BY Name");
        return Ok(rows.Select(p => new { p.Code, p.Name, p.DivisionType,
            aliases = JsonSerializer.Deserialize<string[]>(p.Aliases) ?? [],
            legacyNames = string.Join(", ", JsonSerializer.Deserialize<string[]>(p.Aliases) ?? []),
            verifiedOn = p.VerifiedOn.ToString("yyyy-MM-dd") }));
    }
    private sealed record ProvinceRow(int Code, string Name, string DivisionType, string Aliases, DateTime VerifiedOn);
}
