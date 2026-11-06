namespace Shop.Application.Common;

public class AppException : Exception
{
    public int StatusCode { get; }
    public string Code { get; }
    public AppException(string message, int statusCode = 400, string code = "bad_request") : base(message)
    {
        StatusCode = statusCode;
        Code = code;
    }
}

public class NotFoundException : AppException
{
    public NotFoundException(string message = "The requested resource was not found.")
        : base(message, 404, "not_found") { }
}

public class ConflictException : AppException
{
    public ConflictException(string message) : base(message, 409, "conflict") { }
}

public class BusinessRuleException : AppException
{
    public BusinessRuleException(string message) : base(message, 422, "business_rule") { }
}

public class UnauthorizedAppException : AppException
{
    public UnauthorizedAppException(string message = "Authentication failed.")
        : base(message, 401, "unauthorized") { }
}

public class ForbiddenException : AppException
{
    public ForbiddenException(string message = "Access is denied.")
        : base(message, 403, "forbidden") { }
}
