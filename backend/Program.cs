using MySqlConnector;
using backend.Data;
using backend.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

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
builder.Services.AddControllers(o => {
    o.Filters.AddService<backend.Security.CustomerAccessFilter>();
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
builder.Services.AddCors(options => {
    options.AddPolicy("AllowAll", policy => {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

// =============================================
// DATA LAYER - Repositories
// =============================================
builder.Services.AddScoped<IVaiTroRepository, VaiTroRepository>();
builder.Services.AddScoped<INguoiDungRepository, NguoiDungRepository>();
builder.Services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
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
builder.Services.AddScoped<IRefreshTokenService, RefreshTokenService>();
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

app.UseCors("AllowAll");
app.UseStaticFiles(new StaticFileOptions {
    OnPrepareResponse = context => {
        context.Context.Response.Headers["X-Content-Type-Options"] = "nosniff";
        context.Context.Response.Headers["Cache-Control"] = "public,max-age=3600";
    }
});
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.MapGet("/api/health", () => Results.Json(new {
    status = "OK",
    message = "Backend WebDuLich dang chay!",
    time = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")
}));

app.Run(builder.Configuration["Urls"] ?? "http://0.0.0.0:5000");
