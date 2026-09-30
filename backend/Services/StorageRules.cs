using backend.Security;

namespace backend.Services;

// Monetary columns in this schema are DECIMAL(15,2). Validate before SQL so
// malformed input returns a useful 400 instead of overflow/rounding in MySQL.
public static class StorageRules
{
    public const decimal MaxMoney = 9999999999999.99m;

    public static void Money(decimal value, string label)
    {
        if (value < 0 || value > MaxMoney || decimal.Round(value, 2) != value)
            throw new RequestRuleException($"{label} phải không âm, tối đa {MaxMoney:N2} và không quá 2 chữ số thập phân.");
    }

    public static void Date(DateTime value, string label)
    {
        if (value.Year < 1000)
            throw new RequestRuleException($"{label} phải là ngày hợp lệ từ năm 1000.");
    }
}
