namespace backend.Security;
public sealed class RequestRuleException(string message, int status = 400) : Exception(message)
{
    public int Status { get; } = status;
}
