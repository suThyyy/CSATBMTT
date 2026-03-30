namespace UserManagement.Services;

/// <summary>
/// Dịch vụ mặt nạ dữ liệu (Data Masking) - 4 phương pháp
/// </summary>
public class DataMaskingService
{
    // ══════════════════════════════════════════════════════════════════════
    // 1.2.1 CHE MẶT NẠ KÝ TỰ (Character Masking)
    // Che giấu một phần ký tự bằng dấu *
    // john@example.com → j***@example.com
    // ══════════════════════════════════════════════════════════════════════

    public string MaskEmail(string email)
    {
        if (string.IsNullOrEmpty(email)) return "***@***";

        int atIndex = -1;
        for (int i = 0; i < email.Length; i++)
            if (email[i] == '@') { atIndex = i; break; }

        if (atIndex < 0) return "***@***";

        string local = email.Substring(0, atIndex);
        string domain = email.Substring(atIndex + 1);

        if (local.Length <= 1) return local + "***@" + domain;

        string masked = local[0].ToString();
        for (int i = 1; i < local.Length; i++) masked += "*";
        return masked + "@" + domain;
    }

    public string MaskPhone(string phone)
    {
        if (string.IsNullOrEmpty(phone)) return "****";

        string cleaned = "";
        string prefix = "";
        for (int i = 0; i < phone.Length; i++)
        {
            if (i == 0 && phone[i] == '+') { prefix = "+"; continue; }
            if (phone[i] >= '0' && phone[i] <= '9') cleaned += phone[i];
        }

        if (cleaned.Length < 4) return "****";

        string first = cleaned.Substring(0, 2);
        string last = cleaned.Substring(cleaned.Length - 2);
        string middle = "";
        for (int i = 0; i < cleaned.Length - 4; i++) middle += "*";
        return prefix + first + middle + last;
    }

    public string MaskPassword(string _) => "***";

    // ══════════════════════════════════════════════════════════════════════
    // 1.2.2 XÁO TRỘN DỮ LIỆU (Data Shuffling)
    // Xáo trộn vị trí các ký tự trong dữ liệu
    // john@example.com → nhjo@example.com
    // ══════════════════════════════════════════════════════════════════════

    public string ShuffleEmail(string email)
    {
        if (string.IsNullOrEmpty(email)) return email;

        int atIndex = -1;
        for (int i = 0; i < email.Length; i++)
            if (email[i] == '@') { atIndex = i; break; }

        if (atIndex < 0) return ShuffleString(email);

        string local = email.Substring(0, atIndex);
        string domain = email.Substring(atIndex + 1);

        // Chỉ xáo trộn phần local, giữ nguyên domain
        return ShuffleString(local) + "@" + domain;
    }

    public string ShufflePhone(string phone)
    {
        if (string.IsNullOrEmpty(phone)) return phone;

        string prefix = "";
        string digits = "";
        for (int i = 0; i < phone.Length; i++)
        {
            if (i == 0 && phone[i] == '+') { prefix = "+"; continue; }
            if (phone[i] >= '0' && phone[i] <= '9') digits += phone[i];
        }

        // Giữ nguyên 2 số đầu và 2 số cuối, xáo trộn phần giữa
        if (digits.Length <= 4) return prefix + ShuffleString(digits);

        string first = digits.Substring(0, 2);
        string last = digits.Substring(digits.Length - 2);
        string middle = digits.Substring(2, digits.Length - 4);
        return prefix + first + ShuffleString(middle) + last;
    }

    private string ShuffleString(string input)
    {
        char[] chars = new char[input.Length];
        for (int i = 0; i < input.Length; i++) chars[i] = input[i];

        // Fisher-Yates shuffle dùng seed từ length (deterministic)
        int seed = input.Length * 31;
        for (int i = chars.Length - 1; i > 0; i--)
        {
            seed = (seed * 1103515245 + 12345) & 0x7FFFFFFF;
            int j = seed % (i + 1);
            char tmp = chars[i];
            chars[i] = chars[j];
            chars[j] = tmp;
        }

        string result = "";
        for (int i = 0; i < chars.Length; i++) result += chars[i];
        return result;
    }

    // ══════════════════════════════════════════════════════════════════════
    // 1.2.3 THAY THẾ GIẢ DỮ LIỆU (Data Substitution)
    // Thay thế bằng dữ liệu giả trông hợp lệ
    // john@example.com → sarah.wilson@outlook.com
    // ══════════════════════════════════════════════════════════════════════

    private static readonly string[] FakeFirstNames =
    {
        "james","oliver","emma","sophia","liam",
        "noah","ava","isabella","mia","ethan"
    };

    private static readonly string[] FakeLastNames =
    {
        "smith","johnson","williams","brown","jones",
        "garcia","miller","davis","wilson","taylor"
    };

    private static readonly string[] FakeDomains =
    {
        "gmail.com","outlook.com","yahoo.com",
        "hotmail.com","proton.me"
    };

    public string SubstituteEmail(string email)
    {
        // Dùng hash của email gốc để chọn fake data (deterministic)
        int seed = 0;
        for (int i = 0; i < email.Length; i++)
            seed = seed * 31 + email[i];
        seed = seed < 0 ? -seed : seed;

        string firstName = FakeFirstNames[seed % FakeFirstNames.Length];
        string lastName = FakeLastNames[(seed / 10) % FakeLastNames.Length];
        string domain = FakeDomains[(seed / 100) % FakeDomains.Length];
        int number = (seed % 900) + 100;

        return firstName + "." + lastName + number + "@" + domain;
    }

    public string SubstitutePhone(string phone)
    {
        int seed = 0;
        for (int i = 0; i < phone.Length; i++)
            if (phone[i] >= '0' && phone[i] <= '9')
                seed = seed * 31 + phone[i];
        seed = seed < 0 ? -seed : seed;

        // Tạo số điện thoại giả bắt đầu bằng 09x
        string[] prefixes = { "090", "091", "093", "094", "096", "097", "098" };
        string prefix = prefixes[seed % prefixes.Length];

        string fakePhone = prefix;
        int s = seed;
        for (int i = 0; i < 7; i++)
        {
            s = (s * 1103515245 + 12345) & 0x7FFFFFFF;
            fakePhone += (char)('0' + (s % 10));
        }
        return fakePhone;
    }

    // ══════════════════════════════════════════════════════════════════════
    // 1.2.4 THÊM NHIỄU (Noise Addition)
    // Thêm ký tự ngẫu nhiên vào dữ liệu
    // john@example.com → joxhn@exazmple.com
    // ══════════════════════════════════════════════════════════════════════

    public string AddNoiseToEmail(string email)
    {
        if (string.IsNullOrEmpty(email)) return email;

        int atIndex = -1;
        for (int i = 0; i < email.Length; i++)
            if (email[i] == '@') { atIndex = i; break; }

        if (atIndex < 0) return AddNoiseToString(email, 2);

        string local = email.Substring(0, atIndex);
        string domain = email.Substring(atIndex + 1);

        // Thêm nhiễu vào cả local và domain
        return AddNoiseToString(local, 1) + "@" + AddNoiseToString(domain, 1);
    }

    public string AddNoiseToPhone(string phone)
    {
        if (string.IsNullOrEmpty(phone)) return phone;

        string prefix = "";
        string digits = "";
        for (int i = 0; i < phone.Length; i++)
        {
            if (i == 0 && phone[i] == '+') { prefix = "+"; continue; }
            if (phone[i] >= '0' && phone[i] <= '9') digits += phone[i];
        }

        // Thêm 2 chữ số nhiễu vào giữa
        return prefix + AddNoiseToString(digits, 2);
    }

    private string AddNoiseToString(string input, int noiseCount)
    {
        if (input.Length == 0) return input;

        char[] noiseChars = "abcdefghijklmnopqrstuvwxyz0123456789".ToCharArray();
        string result = input;
        int seed = input.Length * 7919;

        for (int n = 0; n < noiseCount; n++)
        {
            seed = (seed * 1103515245 + 12345) & 0x7FFFFFFF;

            // Vị trí chèn nhiễu (không chèn vào đầu hoặc cuối)
            int pos = 1 + (seed % (result.Length - 1 > 0 ? result.Length - 1 : 1));
            seed = (seed * 1103515245 + 12345) & 0x7FFFFFFF;
            char noiseChar = noiseChars[seed % noiseChars.Length];

            // Chèn ký tự nhiễu vào vị trí pos
            string newResult = "";
            for (int i = 0; i < result.Length; i++)
            {
                if (i == pos) newResult += noiseChar;
                newResult += result[i];
            }
            result = newResult;
        }

        return result;
    }
}
