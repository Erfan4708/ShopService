using System.Text;

namespace Shop.Application.Common;

public static class SlugHelper
{
    public static string Slugify(string input)
    {
        var sb = new StringBuilder();
        foreach (var ch in (input ?? "").Trim().ToLowerInvariant())
        {
            if (char.IsLetterOrDigit(ch)) sb.Append(ch);
            else if (char.IsWhiteSpace(ch) || ch == '-' || ch == '_')
            {
                if (sb.Length > 0 && sb[sb.Length - 1] != '-') sb.Append('-');
            }
        }
        var slug = sb.ToString().Trim('-');
        return slug.Length == 0 ? Guid.NewGuid().ToString("N").Substring(0, 8) : slug;
    }
}

public static class PhoneHelper
{
    public static string? Normalize(string? phone)
    {
        if (string.IsNullOrWhiteSpace(phone)) return null;
        var sb = new StringBuilder();
        foreach (var ch in phone)
        {
            if (ch >= '0' && ch <= '9') sb.Append(ch);
            else if (ch >= '\u06F0' && ch <= '\u06F9') sb.Append((char)('0' + (ch - '\u06F0')));
            else if (ch >= '\u0660' && ch <= '\u0669') sb.Append((char)('0' + (ch - '\u0660')));
        }
        var d = sb.ToString();
        if (d.StartsWith("0098") && d.Length == 14) d = "0" + d.Substring(4);
        else if (d.StartsWith("98") && d.Length == 12) d = "0" + d.Substring(2);
        else if (d.StartsWith("9") && d.Length == 10) d = "0" + d;
        return d.Length == 0 ? null : d;
    }
}
