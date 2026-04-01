using System.Text;
using System.Security.Cryptography;

namespace UserManagement.Services;

/// <summary>
/// Custom AES-128 Implementation (Từ Golang code)
/// Mã hóa và giải mã dữ liệu bằng thuật toán AES-128 tự viết
/// Sử dụng IV (Initialization Vector) và PBKDF2 để tăng cường bảo mật
/// </summary>
public class Aes128Engine
{
    // ── S-BOX và RCON (Giống hệt thuật toán AES chuẩn) ─────────────────────
    private static readonly byte[] SBox = new byte[256]
    {
        0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76,
        0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0,
        0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15,
        0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75,
        0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84,
        0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf,
        0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8,
        0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2,
        0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73,
        0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb,
        0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79,
        0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08,
        0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a,
        0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e,
        0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf,
        0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16,
    };

    private static readonly byte[] RCon = new byte[11]
    {
        0x00, 0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1B, 0x36
    };

    private byte[] _invSbox;

    public Aes128Engine()
    {
        // Tạo Inverse S-BOX
        _invSbox = new byte[256];
        for (int i = 0; i < 256; i++)
        {
            _invSbox[SBox[i]] = (byte)i;
        }
    }

    // ── ENCRYPTION ────────────────────────────────────────────────────────

    /// <summary>
    /// Mã hóa dữ liệu từ plaintext và password (hoặc hex key)
    /// Sử dụng PBKDF2 để dẫn xuất khóa và IV ngẫu nhiên cho CBC mode
    /// Trả về IV + Ciphertext dạng Base64 hoặc Hex
    /// </summary>
    public string EncryptData(string plainData, string hexKey)
    {
        // Bước 1: Chuyển đầu vào thành byte
        byte[] dataBytes = Encoding.UTF8.GetBytes(plainData);

        // Bước 2: Sinh IV ngẫu nhiên (16 bytes)
        byte[] iv = new byte[16];
        using (var rng = RandomNumberGenerator.Create())
        {
            rng.GetBytes(iv);
        }

        // Bước 3: Dẫn xuất khóa từ input (sử dụng PBKDF2 nếu có, hoặc trực tiếp từ hex)
        byte[] keyBytes;
        if (hexKey.StartsWith("0x") || hexKey.All(c => "0123456789abcdefABCDEF".Contains(c)))
        {
            // Nếu là hex string, chuyển đổi
            keyBytes = HexStringToByteArray(hexKey);
        }
        else
        {
            // Nếu là password, dẫn xuất khóa sử dụng PBKDF2
            keyBytes = DeriveKeyFromPassword(hexKey, iv);
        }

        // Đảm bảo khóa có độ dài 16 bytes
        if (keyBytes.Length < 16)
        {
            var padded = new byte[16];
            Array.Copy(keyBytes, padded, keyBytes.Length);
            keyBytes = padded;
        }
        else if (keyBytes.Length > 16)
        {
            Array.Resize(ref keyBytes, 16);
        }

        // Bước 4: Padding dữ liệu (PKCS#7)
        int padLen = 16 - (dataBytes.Length % 16);
        byte[] padding = new byte[padLen];
        for (int i = 0; i < padLen; i++)
            padding[i] = (byte)padLen;

        byte[] dataToEncrypt = new byte[dataBytes.Length + padLen];
        Array.Copy(dataBytes, dataToEncrypt, dataBytes.Length);
        Array.Copy(padding, 0, dataToEncrypt, dataBytes.Length, padLen);

        // Bước 5: Sinh key expansion (11 round keys)
        byte[][] roundKeys = KeyExpansion(keyBytes);

        // Bước 6: Mã hóa từng khối 16 bytes sử dụng CBC mode (kết hợp với IV)
        byte[] encrypted = new byte[dataToEncrypt.Length];
        byte[] previousBlock = new byte[16];
        Array.Copy(iv, previousBlock, 16);

        for (int i = 0; i < dataToEncrypt.Length; i += 16)
        {
            byte[] block = new byte[16];
            Array.Copy(dataToEncrypt, i, block, 0, 16);

            // XOR với khối trước (IV cho khối đầu tiên)
            for (int j = 0; j < 16; j++)
                block[j] ^= previousBlock[j];

            byte[] encryptedBlock = EncryptBlock(block, roundKeys);
            Array.Copy(encryptedBlock, 0, encrypted, i, 16);
            previousBlock = encryptedBlock;
        }

        // Bước 7: Ghép IV + encrypted data và trả về Base64
        byte[] ivAndEncrypted = new byte[iv.Length + encrypted.Length];
        Array.Copy(iv, 0, ivAndEncrypted, 0, iv.Length);
        Array.Copy(encrypted, 0, ivAndEncrypted, iv.Length, encrypted.Length);

        // Trả về Base64 (tiêu chuẩn)
        return Convert.ToBase64String(ivAndEncrypted);
    }

    /// <summary>
    /// Mã hóa dữ liệu và trả về dạng Hex (thay vì Base64)
    /// </summary>
    public string EncryptDataHex(string plainData, string hexKey)
    {
        byte[] dataBytes = Encoding.UTF8.GetBytes(plainData);

        // Sinh IV ngẫu nhiên
        byte[] iv = new byte[16];
        using (var rng = RandomNumberGenerator.Create())
        {
            rng.GetBytes(iv);
        }

        byte[] keyBytes = DeriveKeyBytes(hexKey, iv);

        // PKCS#7 Padding
        int padLen = 16 - (dataBytes.Length % 16);
        byte[] padding = new byte[padLen];
        for (int i = 0; i < padLen; i++)
            padding[i] = (byte)padLen;

        byte[] dataToEncrypt = new byte[dataBytes.Length + padLen];
        Array.Copy(dataBytes, dataToEncrypt, dataBytes.Length);
        Array.Copy(padding, 0, dataToEncrypt, dataBytes.Length, padLen);

        byte[][] roundKeys = KeyExpansion(keyBytes);

        byte[] encrypted = new byte[dataToEncrypt.Length];
        byte[] previousBlock = new byte[16];
        Array.Copy(iv, previousBlock, 16);

        for (int i = 0; i < dataToEncrypt.Length; i += 16)
        {
            byte[] block = new byte[16];
            Array.Copy(dataToEncrypt, i, block, 0, 16);

            for (int j = 0; j < 16; j++)
                block[j] ^= previousBlock[j];

            byte[] encryptedBlock = EncryptBlock(block, roundKeys);
            Array.Copy(encryptedBlock, 0, encrypted, i, 16);
            previousBlock = encryptedBlock;
        }

        // Ghép IV + encrypted data
        byte[] ivAndEncrypted = new byte[iv.Length + encrypted.Length];
        Array.Copy(iv, 0, ivAndEncrypted, 0, iv.Length);
        Array.Copy(encrypted, 0, ivAndEncrypted, iv.Length, encrypted.Length);

        return ByteArrayToHexString(ivAndEncrypted);
    }

    /// <summary>
    /// Giải mã dữ liệu từ Base64 string (chứa IV + ciphertext)
    /// </summary>
    public string DecryptData(string base64Encrypted, string hexKey)
    {
        try
        {
            // Giải mã Base64
            byte[] ivAndEncrypted = Convert.FromBase64String(base64Encrypted);

            // Tách IV (16 bytes đầu) và ciphertext
            if (ivAndEncrypted.Length < 16)
                return base64Encrypted; // Nếu quá ngắn, trả về nguyên bản

            byte[] iv = new byte[16];
            byte[] encrypted = new byte[ivAndEncrypted.Length - 16];
            Array.Copy(ivAndEncrypted, 0, iv, 0, 16);
            Array.Copy(ivAndEncrypted, 16, encrypted, 0, encrypted.Length);

            // Dẫn xuất khóa (sử dụng cùng IV)
            byte[] keyBytes = DeriveKeyBytes(hexKey, iv);

            // Kiểm tra độ dài hợp lệ
            if (encrypted.Length % 16 != 0)
                return base64Encrypted;

            // Sinh round keys
            byte[][] roundKeys = KeyExpansion(keyBytes);

            // Giải mã từng khối 16 bytes sử dụng CBC mode
            byte[] decrypted = new byte[encrypted.Length];
            byte[] previousBlock = new byte[16];
            Array.Copy(iv, previousBlock, 16);

            for (int i = 0; i < encrypted.Length; i += 16)
            {
                byte[] block = new byte[16];
                Array.Copy(encrypted, i, block, 0, 16);

                byte[] decryptedBlock = DecryptBlock(block, roundKeys);

                // XOR với khối ciphertext trước (IV cho khối đầu tiên)
                for (int j = 0; j < 16; j++)
                    decryptedBlock[j] ^= previousBlock[j];

                Array.Copy(decryptedBlock, 0, decrypted, i, 16);
                previousBlock = block;
            }

            // Gỡ PKCS#7 Padding
            if (decrypted.Length > 0)
            {
                int padLen = decrypted[decrypted.Length - 1];
                if (padLen > 0 && padLen <= 16)
                {
                    Array.Resize(ref decrypted, decrypted.Length - padLen);
                }
            }

            return Encoding.UTF8.GetString(decrypted);
        }
        catch
        {
            return base64Encrypted; // Nếu lỗi, trả về nguyên bản
        }
    }

    /// <summary>
    /// Giải mã dữ liệu từ Hex string (chứa IV + ciphertext)
    /// </summary>
    public string DecryptDataHex(string hexEncrypted, string hexKey)
    {
        try
        {
            byte[] ivAndEncrypted = HexStringToByteArray(hexEncrypted);

            // Tách IV và ciphertext
            if (ivAndEncrypted.Length < 16)
                return hexEncrypted;

            byte[] iv = new byte[16];
            byte[] encrypted = new byte[ivAndEncrypted.Length - 16];
            Array.Copy(ivAndEncrypted, 0, iv, 0, 16);
            Array.Copy(ivAndEncrypted, 16, encrypted, 0, encrypted.Length);

            byte[] keyBytes = DeriveKeyBytes(hexKey, iv);

            if (encrypted.Length % 16 != 0)
                return hexEncrypted;

            byte[][] roundKeys = KeyExpansion(keyBytes);

            byte[] decrypted = new byte[encrypted.Length];
            byte[] previousBlock = new byte[16];
            Array.Copy(iv, previousBlock, 16);

            for (int i = 0; i < encrypted.Length; i += 16)
            {
                byte[] block = new byte[16];
                Array.Copy(encrypted, i, block, 0, 16);

                byte[] decryptedBlock = DecryptBlock(block, roundKeys);

                for (int j = 0; j < 16; j++)
                    decryptedBlock[j] ^= previousBlock[j];

                Array.Copy(decryptedBlock, 0, decrypted, i, 16);
                previousBlock = block;
            }

            // Gỡ PKCS#7 Padding
            if (decrypted.Length > 0)
            {
                int padLen = decrypted[decrypted.Length - 1];
                if (padLen > 0 && padLen <= 16)
                {
                    Array.Resize(ref decrypted, decrypted.Length - padLen);
                }
            }

            return Encoding.UTF8.GetString(decrypted);
        }
        catch
        {
            return hexEncrypted;
        }
    }

    // ── HELPER FUNCTIONS ──────────────────────────────────────────────────

    /// <summary>XTime: phép nhân trên trường Galois</summary>
    private byte XTime(byte a)
    {
        if ((a & 0x80) != 0)
            return (byte)((a << 1) ^ 0x1B);
        return (byte)(a << 1);
    }

    /// <summary>Key Expansion: mở rộng 16 byte key thành 11 round keys</summary>
    private byte[][] KeyExpansion(byte[] key)
    {
        byte[] w = new byte[176]; // 11 rounds * 16 bytes
        Array.Copy(key, w, 16);
        for (int i = 4; i < 44; i++)
        {
            byte[] temp = new byte[4];
            Array.Copy(w, (i - 1) * 4, temp, 0, 4);
            if (i % 4 == 0)
            {
                // RotWord & SubWord
                byte t = temp[0];
                temp[0] = (byte)(SBox[temp[1]] ^ RCon[i / 4]);
                temp[1] = SBox[temp[2]];
                temp[2] = SBox[temp[3]];
                temp[3] = SBox[t];
            }
            for (int j = 0; j < 4; j++)
                w[i * 4 + j] = (byte)(w[(i - 4) * 4 + j] ^ temp[j]);
        }
        byte[][] roundKeys = new byte[11][];
        for (int i = 0; i < 11; i++)
        {
            roundKeys[i] = new byte[16];
            Array.Copy(w, i * 16, roundKeys[i], 0, 16);
        }
        return roundKeys;
    }

    /// <summary>MixColumns: bước hỗn trộn cột trong mã hóa</summary>
    private void MixColumns(byte[] state)
    {
        for (int i = 0; i < 16; i += 4)
        {
            byte s0 = state[i];
            byte s1 = state[i + 1];
            byte s2 = state[i + 2];
            byte s3 = state[i + 3];

            state[i] = (byte)(XTime(s0) ^ (XTime(s1) ^ s1) ^ s2 ^ s3);
            state[i + 1] = (byte)(s0 ^ XTime(s1) ^ (XTime(s2) ^ s2) ^ s3);
            state[i + 2] = (byte)(s0 ^ s1 ^ XTime(s2) ^ (XTime(s3) ^ s3));
            state[i + 3] = (byte)((XTime(s0) ^ s0) ^ s1 ^ s2 ^ XTime(s3));
        }
    }

    // ── ENCRYPTION CORE OPERATIONS ────────────────────────────────────────

    /// <summary>SubBytes: thay thế từng byte từ S-Box</summary>
    private void SubBytes(byte[] state)
    {
        for (int i = 0; i < 16; i++)
            state[i] = SBox[state[i]];
    }

    /// <summary>ShiftRows: dịch chuyển các hàng trong state</summary>
    private void ShiftRows(byte[] state)
    {
        // Row 1: dịch 1 vị trí
        byte t1 = state[1]; state[1] = state[5];  state[5] = state[9]; state[9] = state[13]; state[13] = t1;
        // Row 2: dịch 2 vị trí
        byte t2 = state[2]; byte t3 = state[6]; state[2] = state[10]; state[6] = state[14]; state[10] = t2; state[14] = t3;
        // Row 3: dịch 3 vị trí
        byte t4 = state[3]; state[3] = state[15]; state[15] = state[11]; state[11] = state[7]; state[7] = t4;
    }
    /// <summary>AddRoundKey: XOR với round key</summary>
    private void AddRoundKey(byte[] state, byte[] roundKey)
    {
        for (int i = 0; i < 16; i++)
            state[i] ^= roundKey[i];
    }

    /// <summary>Thực hiện 1 round mã hóa chính (SubBytes -> ShiftRows -> MixColumns -> AddRoundKey)</summary>
    private void EncryptMainRound(byte[] state, byte[] roundKey)
    {
        SubBytes(state); ShiftRows(state); MixColumns(state); AddRoundKey(state, roundKey);
    }

    /// <summary>Thực hiện round cuối cùng mã hóa (SubBytes -> ShiftRows -> AddRoundKey, không MixColumns)</summary>
    private void EncryptFinalRound(byte[] state, byte[] roundKey)
    {
        SubBytes(state); ShiftRows(state); AddRoundKey(state, roundKey);
    }

    /// <summary>EncryptBlock: mã hóa 1 khối 16 bytes</summary>
    private byte[] EncryptBlock(byte[] block, byte[][] roundKeys)
    {
        byte[] state = new byte[16];
        Array.Copy(block, state, 16);
        // Initial Round: AddRoundKey round 0
        AddRoundKey(state, roundKeys[0]);
        // 9 vòng chính (round 1-9)
        for (int r = 1; r < 10; r++)
            EncryptMainRound(state, roundKeys[r]);
        // Final Round (round 10, không MixColumns)
        EncryptFinalRound(state, roundKeys[10]);
        return state;
    }

    // ── KEY DERIVATION ────────────────────────────────────────────────────

    /// <summary>
    /// Dẫn xuất khóa từ password sử dụng PBKDF2
    /// PBKDF2 áp dụng hàm hash (HMAC-SHA256) lặp đi lặp lại để tăng cường bảo mật
    /// </summary>
    private byte[] DeriveKeyFromPassword(string password, byte[] salt)
    {
        // Sử dụng static method Pbkdf2 thay vì constructor (khuyến cáo từ .NET 6+)
        var key = Rfc2898DeriveBytes.Pbkdf2(
            Encoding.UTF8.GetBytes(password),
            salt,
            iterations: 10000,
            HashAlgorithmName.SHA256,
            outputLength: 16); // AES-128 cần key 16 bytes

        return key;
    }

    /// <summary>
    /// Dẫn xuất khóa từ hex key hoặc password
    /// </summary>
    private byte[] DeriveKeyBytes(string input, byte[] salt)
    {
        byte[] keyBytes;

        // Kiểm tra xem input có phải hex string không
        if (input.StartsWith("0x") || input.All(c => "0123456789abcdefABCDEF".Contains(c)))
        {
            // Nếu là hex, chuyển đổi
            keyBytes = HexStringToByteArray(input);
        }
        else
        {
            // Nếu là password, dẫn xuất khóa sử dụng PBKDF2
            keyBytes = DeriveKeyFromPassword(input, salt);
        }

        // Đảm bảo kích thước 16 bytes
        if (keyBytes.Length < 16)
        {
            var padded = new byte[16];
            Array.Copy(keyBytes, padded, keyBytes.Length);
            keyBytes = padded;
        }
        else if (keyBytes.Length > 16)
        {
            Array.Resize(ref keyBytes, 16);
        }

        return keyBytes;
    }

    // ── DECRYPTION CORE OPERATIONS ────────────────────────────────────────

    /// <summary>MulGF: phép nhân trên trường Galois (cho InvMixColumns)</summary>
    private byte MulGf(byte a, byte b)
    {
        byte res = 0;
        for (int i = 0; i < 8; i++)
        {
            if ((b & 1) != 0)
                res ^= a;
            a = XTime(a);
            b >>= 1;
        }
        return res;
    }

    /// <summary>InvSubBytes: thay thế từng byte từ Inverse S-Box</summary>
    private void InvSubBytes(byte[] state)
    {
        for (int i = 0; i < 16; i++)
            state[i] = _invSbox[state[i]];
    }

    /// <summary>InvShiftRows: dịch chuyển các hàng ngược lại (giải mã)</summary>
    private void InvShiftRows(byte[] state)
    {
        // Row 1: dịch ngược 1 vị trí
        byte d1 = state[1];
        state[1] = state[13];
        state[13] = state[9];
        state[9] = state[5];
        state[5] = d1;

        // Row 2: dịch ngược 2 vị trí
        byte d2 = state[2];
        byte d3 = state[6];
        state[2] = state[10];
        state[6] = state[14];
        state[10] = d2;
        state[14] = d3;

        // Row 3: dịch ngược 3 vị trí
        byte d4 = state[3];
        state[3] = state[7];
        state[7] = state[11];
        state[11] = state[15];
        state[15] = d4;
    }

    /// <summary>InvMixColumns: bước hỗn trộn cột nghịch đảo</summary>
    private void InvMixColumns(byte[] state)
    {
        for (int i = 0; i < 16; i += 4)
        {
            byte s0 = state[i];
            byte s1 = state[i + 1];
            byte s2 = state[i + 2];
            byte s3 = state[i + 3];

            state[i] = (byte)(MulGf(s0, 0x0e) ^ MulGf(s1, 0x0b) ^ MulGf(s2, 0x0d) ^ MulGf(s3, 0x09));
            state[i + 1] = (byte)(MulGf(s0, 0x09) ^ MulGf(s1, 0x0e) ^ MulGf(s2, 0x0b) ^ MulGf(s3, 0x0d));
            state[i + 2] = (byte)(MulGf(s0, 0x0d) ^ MulGf(s1, 0x09) ^ MulGf(s2, 0x0e) ^ MulGf(s3, 0x0b));
            state[i + 3] = (byte)(MulGf(s0, 0x0b) ^ MulGf(s1, 0x0d) ^ MulGf(s2, 0x09) ^ MulGf(s3, 0x0e));
        }
    }

    /// <summary>Thực hiện 1 round giải mã chính (InvShiftRows -> InvSubBytes -> AddRoundKey -> InvMixColumns)</summary>
    private void DecryptMainRound(byte[] state, byte[] roundKey)
    {
        InvShiftRows(state);
        InvSubBytes(state);
        AddRoundKey(state, roundKey);
        InvMixColumns(state);
    }
    /// <summary>Thực hiện round cuối cùng giải mã (InvShiftRows -> InvSubBytes -> AddRoundKey, không InvMixColumns)</summary>
    private void DecryptFinalRound(byte[] state, byte[] roundKey)
    {
        InvShiftRows(state);
        InvSubBytes(state);
        AddRoundKey(state, roundKey);
    }
    /// <summary>DecryptBlock: giải mã 1 khối 16 bytes</summary>
    private byte[] DecryptBlock(byte[] block, byte[][] roundKeys)
    {
        byte[] state = new byte[16];
        Array.Copy(block, state, 16);
        // Initial Round: AddRoundKey round 10
        AddRoundKey(state, roundKeys[10]);
        // 9 vòng chính ngược (round 9-1)
        for (int r = 9; r > 0; r--)
            DecryptMainRound(state, roundKeys[r]);
        // Final Round (round 0, không InvMixColumns)
        DecryptFinalRound(state, roundKeys[0]);
        return state;
    }

    // ── UTILITY FUNCTIONS ─────────────────────────────────────────────────

    /// <summary>Chuyển hex string thành byte array</summary>
    private byte[] HexStringToByteArray(string hex)
    {
        // Loại bỏ khoảng trắng nếu có
        hex = hex.Replace(" ", "");

        int length = hex.Length;
        byte[] bytes = new byte[length / 2];

        for (int i = 0; i < length; i += 2)
            bytes[i / 2] = Convert.ToByte(hex.Substring(i, 2), 16);

        return bytes;
    }

    /// <summary>Chuyển byte array thành hex string</summary>
    private string ByteArrayToHexString(byte[] bytes)
    {
        StringBuilder sb = new StringBuilder(bytes.Length * 2);
        foreach (byte b in bytes)
            sb.Append(b.ToString("x2"));
        return sb.ToString();
    }
}
