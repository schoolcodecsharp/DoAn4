using backend.Security;
namespace backend.Services;

public static class TourRules
{
    public static void Validate(string? name, string? origin, string? destination, int days, int nights,
        decimal price, decimal minPrice, decimal maxPrice, int minimum, int maximum, string? status)
    {
        static bool Name(string? value) => !string.IsNullOrWhiteSpace(value) && value.Trim().Length <= 200;
        if (!Name(name) || !Name(origin) || !Name(destination) || days is < 1 or > 365 || nights < 0 || nights > days ||
            price < 0 || minPrice < 0 || maxPrice < minPrice || price > 9999999999999.99m ||
            maxPrice > 9999999999999.99m || minimum < 1 || maximum < minimum ||
            status is not ("Draft" or "Active" or "Inactive"))
            throw new RequestRuleException("Kiểm tra tên/điểm đến (tối đa 200 ký tự), số ngày 1–365, số đêm, giá không âm và số khách tối thiểu/tối đa.");
    }
}
