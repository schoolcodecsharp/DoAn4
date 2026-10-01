using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using backend.Security;

namespace backend.Services;

public sealed record ProvinceEntry(int Code, string Name, string DivisionType, string[] Aliases, string VerifiedOn);
public sealed record ProvinceManifest(string VerifiedOn, string[] Sources, ProvinceEntry[] Provinces);

// Versioned, reviewed snapshot. No unreviewed remote data is applied at runtime.
public static class ProvinceCatalog
{
    public static readonly ProvinceManifest Manifest = Load();
    public static IReadOnlyList<ProvinceEntry> All => Manifest.Provinces;
    private static readonly Dictionary<string, string> Names = All
        .SelectMany(p => p.Aliases.Prepend(p.Name).Select(a => (Key: Key(a), p.Name)))
        .GroupBy(p => p.Key).ToDictionary(g => g.Key, g => g.First().Name);

    private static ProvinceManifest Load()
    {
        using var stream = typeof(ProvinceCatalog).Assembly.GetManifestResourceStream("backend.Data.provinces-20261001.json")
            ?? throw new InvalidOperationException("Missing province snapshot.");
        return JsonSerializer.Deserialize<ProvinceManifest>(stream, new JsonSerializerOptions { PropertyNameCaseInsensitive = true })!;
    }

    public static string Key(string value)
    {
        var text = value.Trim().ToLowerInvariant().Replace('đ', 'd').Normalize(NormalizationForm.FormD);
        text = string.Concat(text.Where(c => CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark));
        text = Regex.Replace(text, @"^(tinh|thanh pho|tp\.?)[\s.]+", "");
        return string.Concat(text.Where(char.IsLetterOrDigit));
    }

    public static string? Resolve(string? value) => string.IsNullOrWhiteSpace(value) ? null
        : Names.GetValueOrDefault(Key(value));

    public static string? Require(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        return Resolve(value) ?? throw new RequestRuleException("Chọn tỉnh/thành trong danh mục hiện hành; tên tỉnh cũ được tự động quy đổi.");
    }
}
