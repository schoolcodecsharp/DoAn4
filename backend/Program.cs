using MySqlConnector;
using backend.Data;
using backend.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Threading.RateLimiting;
using System.Security.Claims;
using Microsoft.AspNetCore.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

if (Array.IndexOf(args, "--create-admin") is var adminArg && adminArg >= 0)
{
    if (adminArg + 1 >= args.Length) throw new ArgumentException("Dùng --create-admin email@example.com");
    await backend.Tools.AdminBootstrap.RunAsync(builder.Configuration, args[adminArg + 1]);
    return;
}

if (args.Contains("--import-images") || args.Contains("--download-images"))
{
    await backend.Tools.ImageLibraryImport.RunAsync(builder.Configuration, builder.Environment.ContentRootPath, args.Contains("--download-images"));
    return;
}

// =============================================
// Controller + JSON
// =============================================
builder.Services.AddScoped<backend.Security.CustomerAccessFilter>();
builder.Services.AddScoped<CatalogImageFilter>();
builder.Services.AddScoped<backend.Security.AdminAuditFilter>();
builder.Services.AddControllers(o => {
    o.Filters.Add<backend.Security.DatabaseErrorFilter>();
    o.Filters.AddService<backend.Security.CustomerAccessFilter>();
    o.Filters.AddService<backend.Security.AdminAuditFilter>();
    o.Filters.AddService<CatalogImageFilter>();
}).AddJsonOptions(o => {
    o.JsonSerializerOptions.DefaultBufferSize = 50 * 1024 * 1024;
});

builder.WebHost.ConfigureKestrel(options => {
    options.Limits.MaxRequestBodySize = 50 * 1024 * 1024;
});

// =============================================
// Swagger
// =============================================
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c => {
    c.SwaggerDoc("v1", new() { Title = "WebDuLich API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Nhap JWT token: Bearer {token}"
    });
    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// =============================================
// JWT Authentication
// =============================================
var jwtSecret = builder.Configuration["Jwt:Secret"]!;
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => {
        options.TokenValidationParameters = new TokenValidationParameters {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
        };
    });
builder.Services.AddAuthorization();

// =============================================
// CORS
// =============================================
builder.Services.AddCors(options => options.AddPolicy("Frontend", policy => {
    var origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
        ?? (builder.Environment.IsDevelopment() ? new[] { "http://localhost:5173", "http://127.0.0.1:5173" } : Array.Empty<string>());
    if (origins.Length > 0) policy.WithOrigins(origins).AllowAnyMethod().AllowAnyHeader();
}));
builder.Services.AddRateLimiter(options => {
    options.RejectionStatusCode = 429;
    options.OnRejected = async (context, token) => {
        var seconds = context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retry) ? Math.Max(1, (int)Math.Ceiling(retry.TotalSeconds)) : 60;
        context.HttpContext.Response.Headers.RetryAfter = seconds.ToString();
        await context.HttpContext.Response.WriteAsJsonAsync(new { message = $"Bạn thao tác quá nhanh. Vui lòng thử lại sau {seconds} giây." }, token);
    };
    options.AddPolicy("auth", context => RateLimitPartition.GetFixedWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown", _ => new FixedWindowRateLimiterOptions {
            PermitLimit = 10, Window = TimeSpan.FromMinutes(1), QueueLimit = 0
        }));
    options.AddPolicy("feedback", context => RateLimitPartition.GetFixedWindowLimiter(
        context.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = 20, Window = TimeSpan.FromMinutes(1), QueueLimit = 0 }));
});

// =============================================
// DATA LAYER - Repositories
// =============================================
builder.Services.AddScoped<IVaiTroRepository, VaiTroRepository>();
builder.Services.AddScoped<INguoiDungRepository, NguoiDungRepository>();
builder.Services.AddScoped<ILoaiDiaDiemRepository, LoaiDiaDiemRepository>();
builder.Services.AddScoped<IDiaDiemRepository, DiaDiemRepository>();
builder.Services.AddScoped<INhaHangRepository, NhaHangRepository>();
builder.Services.AddScoped<IKhachSanRepository, KhachSanRepository>();
builder.Services.AddScoped<ILoaiPhongRepository, LoaiPhongRepository>();
builder.Services.AddScoped<IDatPhongRepository, DatPhongRepository>();
builder.Services.AddScoped<ITourRepository, TourRepository>();
builder.Services.AddScoped<ITourKhoiHanhRepository, TourKhoiHanhRepository>();
builder.Services.AddScoped<ITourChiTietRepository, TourChiTietRepository>();
builder.Services.AddScoped<IChuyenDiRepository, ChuyenDiRepository>();
builder.Services.AddScoped<IThanhVienChuyenDiRepository, ThanhVienChuyenDiRepository>();
builder.Services.AddScoped<ILichTrinhRepository, LichTrinhRepository>();
builder.Services.AddScoped<ILichTrinhChiTietRepository, LichTrinhChiTietRepository>();
builder.Services.AddScoped<IDatTourRepository, DatTourRepository>();
builder.Services.AddScoped<IThanhToanRepository, ThanhToanRepository>();
builder.Services.AddScoped<IMaGiamGiaRepository, MaGiamGiaRepository>();
builder.Services.AddScoped<IHinhAnhRepository, HinhAnhRepository>();
builder.Services.AddScoped<IChiPhiRepository, ChiPhiRepository>();
builder.Services.AddScoped<IDanhGiaRepository, DanhGiaRepository>();
builder.Services.AddScoped<IYeuThichRepository, YeuThichRepository>();

// =============================================
// BUSINESS LOGIC LAYER - Services
// =============================================
builder.Services.AddScoped<IVaiTroService, VaiTroService>();
builder.Services.AddScoped<INguoiDungService, NguoiDungService>();
builder.Services.AddScoped<ILoaiDiaDiemService, LoaiDiaDiemService>();
builder.Services.AddScoped<IDiaDiemService, DiaDiemService>();
builder.Services.AddScoped<INhaHangService, NhaHangService>();
builder.Services.AddScoped<IKhachSanService, KhachSanService>();
builder.Services.AddScoped<ILoaiPhongService, LoaiPhongService>();
builder.Services.AddScoped<IDatPhongService, DatPhongService>();
builder.Services.AddScoped<ITourService, TourService>();
builder.Services.AddScoped<ITourKhoiHanhService, TourKhoiHanhService>();
builder.Services.AddScoped<ITourChiTietService, TourChiTietService>();
builder.Services.AddScoped<IChuyenDiService, ChuyenDiService>();
builder.Services.AddScoped<IThanhVienChuyenDiService, ThanhVienChuyenDiService>();
builder.Services.AddScoped<ILichTrinhService, LichTrinhService>();
builder.Services.AddScoped<ILichTrinhChiTietService, LichTrinhChiTietService>();
builder.Services.AddScoped<IDatTourService, DatTourService>();
builder.Services.AddScoped<IThanhToanService, ThanhToanService>();
builder.Services.AddScoped<IMaGiamGiaService, MaGiamGiaService>();
builder.Services.AddScoped<IHinhAnhService, HinhAnhService>();
builder.Services.AddScoped<IChiPhiService, ChiPhiService>();
builder.Services.AddScoped<IDanhGiaService, DanhGiaService>();
builder.Services.AddScoped<IYeuThichService, YeuThichService>();

// =============================================
// BUILD
// =============================================
var app = builder.Build();

if (app.Environment.IsDevelopment()) {
    app.UseSwagger();
    app.UseSwaggerUI(c => {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "WebDuLich API v1");
        c.RoutePrefix = "swagger";
    });
}

app.UseCors("Frontend");
app.UseStaticFiles(new StaticFileOptions {
    OnPrepareResponse = context => {
        context.Context.Response.Headers["X-Content-Type-Options"] = "nosniff";
        context.Context.Response.Headers["Cache-Control"] = "public,max-age=3600";
    }
});
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();
app.MapControllers();

app.MapGet("/api/health", () => Results.Json(new {
    status = "OK",
    message = "Backend WebDuLich dang chay!",
    time = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")
}));

app.Run(builder.Configuration["Urls"] ?? "http://0.0.0.0:5000");
