using System.Collections;
using backend.DTOs;
using Dapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using MySqlConnector;

namespace backend.Services;

// One query per object type, not one query per card. Every catalog read, including
// filtered lists and detail routes, uses the same HinhAnh source of truth.
public sealed class CatalogImageFilter(IConfiguration config) : IAsyncResultFilter
{
    public async Task OnResultExecutionAsync(ResultExecutingContext context, ResultExecutionDelegate next)
    {
        if (context.Result is ObjectResult { Value: not null } result && HttpMethods.IsGet(context.HttpContext.Request.Method))
        {
            var owners = result.Value is IImageOwner single ? new[] { single } :
                result.Value is IEnumerable list ? list.Cast<object>().OfType<IImageOwner>().ToArray() : Array.Empty<IImageOwner>();
            if (owners.Length > 0)
            {
                await using var conn = new MySqlConnection(config.GetConnectionString("DefaultConnection"));
                foreach (var group in owners.GroupBy(o => o.ImageOwnerType))
                {
                    var images = (await conn.QueryAsync<HinhAnhResponseDto>("""
                        SELECT * FROM HinhAnh WHERE LoaiDoiTuong=@type AND MaDoiTuong IN @ids
                        ORDER BY ThuTu, MaHinhAnh
                        """, new { type = group.Key, ids = group.Select(o => o.ImageOwnerId).Distinct().ToArray() }))
                        .Where(i => i.DuongDan.StartsWith("/media/", StringComparison.Ordinal) && !i.DuongDan.Contains("..") && !i.DuongDan.Contains('\\'))
                        .ToLookup(i => i.MaDoiTuong);
                    foreach (var owner in group)
                    {
                        owner.HinhAnh = images[owner.ImageOwnerId].ToList();
                        owner.AnhDaiDien = owner.HinhAnh.FirstOrDefault()?.DuongDan;
                    }
                }
            }
        }
        await next();
    }
}
