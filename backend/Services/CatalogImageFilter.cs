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
            // Hide unpublished tours, their departures, itinerary and image links from public readers.
            if (context.HttpContext.Items["CatalogAdmin"] is not true)
            {
                static int? TourId(object item) => item switch {
                    TourResponseDto t => t.MaTour,
                    TourKhoiHanhResponseDto d => d.MaTour,
                    TourChiTietResponseDto a => a.MaTour,
                    HinhAnhResponseDto h when h.LoaiDoiTuong == "Tour" => h.MaDoiTuong,
                    _ => null
                };
                var collection = result.Value is IEnumerable && result.Value is not string;
                var items = collection ? ((IEnumerable)result.Value).Cast<object>().ToArray() : new[] { result.Value };
                var ids = items.Select(TourId).Where(id => id.HasValue).Select(id => id!.Value).Distinct().ToArray();
                if (ids.Length > 0)
                {
                    await using var db = new MySqlConnection(config.GetConnectionString("DefaultConnection"));
                    var hidden = (await db.QueryAsync<int>("SELECT MaTour FROM Tour WHERE MaTour IN @ids AND TrangThai='Draft'", new { ids })).ToHashSet();
                    var visible = items.Where(item => TourId(item) is not int id || !hidden.Contains(id)).ToArray();
                    if (!collection && visible.Length == 0) { context.Result = new NotFoundResult(); await next(); return; }
                    if (collection) result.Value = visible;
                }
            }
            var owners = result.Value is IImageOwner single ? new[] { single } :
                result.Value is IEnumerable list ? list.Cast<object>().OfType<IImageOwner>().ToArray() : Array.Empty<IImageOwner>();
            if (owners.Length > 0)
            {
                await using var conn = new MySqlConnection(config.GetConnectionString("DefaultConnection"));
                foreach (var group in owners.GroupBy(o => o.ImageOwnerType))
                {
                    var ownerColumn = group.Key switch
                    {
                        "Tour" => "MaTour", "DiaDiem" => "MaDiaDiem", "NhaHang" => "MaNhaHang",
                        "KhachSan" => "MaKhachSan", "LoaiPhong" => "MaLoaiPhong",
                        _ => throw new InvalidOperationException("Loại đối tượng ảnh không hợp lệ.")
                    };
                    var images = (await conn.QueryAsync<HinhAnhResponseDto>($"""
                        SELECT HinhAnh.*, @type AS LoaiDoiTuong, {ownerColumn} AS MaDoiTuong
                        FROM HinhAnh WHERE {ownerColumn} IN @ids
                        ORDER BY ThuTu, MaHinhAnh
                        """, new { type = group.Key, ids = group.Select(o => o.ImageOwnerId).Distinct().ToArray() }))
                        .Where(i => i.DuongDan.StartsWith("/media/", StringComparison.Ordinal) && !i.DuongDan.Contains("..") && !i.DuongDan.Contains('\\'))
                        .ToLookup(i => i.MaDoiTuong);
                    foreach (var owner in group)
                    {
                        owner.HinhAnh = images[owner.ImageOwnerId].ToList();
                        owner.AnhDaiDien = owner.HinhAnh.FirstOrDefault()?.DuongDan;
                    }
                    if (group.Any(o => o is IReviewSummary))
                    {
                        var ratings=(await conn.QueryAsync<RatingSummary>($"SELECT {ownerColumn} AS Id,ROUND(AVG(SoSao),2) AS Average,COUNT(*) AS Count FROM DanhGia WHERE {ownerColumn} IN @ids AND TrangThai=1 AND {FeedbackRules.Verified} GROUP BY {ownerColumn}",new{ids=group.Select(o=>o.ImageOwnerId).ToArray()})).ToDictionary(r=>r.Id);
                        foreach(var owner in group)
                            if(owner is IReviewSummary summary)
                            {
                                ratings.TryGetValue(owner.ImageOwnerId,out var rating);
                                summary.DiemDanhGia=rating?.Average??0;
                                summary.SoLuotDanhGia=rating?.Count??0;
                            }
                    }
                }
            }
        }
        await next();
    }
    private sealed class RatingSummary { public int Id {get;set;} public decimal Average {get;set;} public int Count {get;set;} }
}
