using System.Text;

namespace UserManagement.Services;

/// <summary>
/// Custom AES-128 Implementation (Từ Golang code)
/// Mã hóa và giải mã dữ liệu bằng thuật toán AES-128 tự viết
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

    /// <summary>Mã hóa dữ liệu từ plaintext và hex key, trả về hex string</summary>
    public string EncryptData(string plainData, string hexKey)
    {
        // Chuyển hex key thành byte array
        byte[] keyBytes = HexStringToByteArray(hexKey);
        if (keyBytes.Length < 16)
        {
            // Padding key nếu nhỏ hơn 16 bytes
            var padded = new byte[16];
            Array.Copy(keyBytes, padded, keyBytes.Length);
            keyBytes = padded;
        }
        else if (keyBytes.Length > 16)
        {
            // Cắt ngắn key nếu lớn hơn 16 bytes
            Array.Resize(ref keyBytes, 16);
        }

        byte[] dataBytes = Encoding.UTF8.GetBytes(plainData);

        // PKCS#7 Padding
        int padLen = 16 - (dataBytes.Length % 16);
        byte[] padding = new byte[padLen];
        for (int i = 0; i < padLen; i++)
            padding[i] = (byte)padLen;

        byte[] dataToEncrypt = new byte[dataBytes.Length + padLen];
        Array.Copy(dataBytes, dataToEncrypt, dataBytes.Length);
        Array.Copy(padding, 0, dataToEncrypt, dataBytes.Length, padLen);

        // Expand key
        byte[][] roundKeys = KeyExpansion(keyBytes);

        // Mã hóa từng khối 16 bytes
        byte[] encrypted = new byte[dataToEncrypt.Length];
        for (int i = 0; i < dataToEncrypt.Length; i += 16)
        {
            byte[] block = new byte[16];
            Array.Copy(dataToEncrypt, i, block, 0, 16);
            byte[] encryptedBlock = EncryptBlock(block, roundKeys);
            Array.Copy(encryptedBlock, 0, encrypted, i, 16);
        }

        // Trả về hex string
        return ByteArrayToHexString(encrypted);
    }

    /// <summary>Giải mã dữ liệu từ hex string, trả về plaintext</summary>
    public string DecryptData(string hexEncrypted, string hexKey)
    {
        // Chuyển hex key thành byte array
        byte[] keyBytes = HexStringToByteArray(hexKey);
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

        // Chuyển hex string thành byte array
        byte[] encrypted = HexStringToByteArray(hexEncrypted);

        // Kiểm tra độ dài hợp lệ
        if (encrypted.Length % 16 != 0)
            return hexEncrypted; // Nếu không hợp lệ, trả về nguyên bản

        // Expand key
        byte[][] roundKeys = KeyExpansion(keyBytes);

        // Giải mã từng khối 16 bytes
        byte[] decrypted = new byte[encrypted.Length];
        for (int i = 0; i < encrypted.Length; i += 16)
        {
            byte[] block = new byte[16];
            Array.Copy(encrypted, i, block, 0, 16);
            byte[] decryptedBlock = DecryptBlock(block, roundKeys);
            Array.Copy(decryptedBlock, 0, decrypted, i, 16);
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
            byte[] c = new byte[4];
            Array.Copy(state, i, c, 0, 4);

            state[i] = (byte)(XTime(c[0]) ^ (XTime(c[1]) ^ c[1]) ^ c[2] ^ c[3]);
            state[i + 1] = (byte)(c[0] ^ XTime(c[1]) ^ (XTime(c[2]) ^ c[2]) ^ c[3]);
            state[i + 2] = (byte)(c[0] ^ c[1] ^ XTime(c[2]) ^ (XTime(c[3]) ^ c[3]));
            state[i + 3] = (byte)((XTime(c[0]) ^ c[0]) ^ c[1] ^ c[2] ^ XTime(c[3]));
        }
    }

    /// <summary>EncryptBlock: mã hóa 1 khối 16 bytes</summary>
    private byte[] EncryptBlock(byte[] block, byte[][] roundKeys)
    {
        byte[] state = new byte[16];
        Array.Copy(block, state, 16);

        // AddRoundKey round 0
        for (int i = 0; i < 16; i++)
            state[i] ^= roundKeys[0][i];

        // 9 vòng chính
        for (int r = 1; r < 10; r++)
        {
            // SubBytes
            for (int i = 0; i < 16; i++)
                state[i] = SBox[state[i]];

            // ShiftRows
            byte t1 = state[1];
            state[1] = state[5];
            state[5] = state[9];
            state[9] = state[13];
            state[13] = t1;

            byte t2 = state[2];
            byte t3 = state[6];
            state[2] = state[10];
            state[6] = state[14];
            state[10] = t2;
            state[14] = t3;

            byte t4 = state[3];
            state[3] = state[15];
            state[15] = state[11];
            state[11] = state[7];
            state[7] = t4;

            // MixColumns
            MixColumns(state);

            // AddRoundKey
            for (int i = 0; i < 16; i++)
                state[i] ^= roundKeys[r][i];
        }

        // Final Round (no MixColumns)
        for (int i = 0; i < 16; i++)
            state[i] = SBox[state[i]];

        // ShiftRows
        byte f1 = state[1];
        state[1] = state[5];
        state[5] = state[9];
        state[9] = state[13];
        state[13] = f1;

        byte f2 = state[2];
        byte f3 = state[6];
        state[2] = state[10];
        state[6] = state[14];
        state[10] = f2;
        state[14] = f3;

        byte f4 = state[3];
        state[3] = state[15];
        state[15] = state[11];
        state[11] = state[7];
        state[7] = f4;

        // AddRoundKey
        for (int i = 0; i < 16; i++)
            state[i] ^= roundKeys[10][i];

        return state;
    }

    // ── DECRYPTION ────────────────────────────────────────────────────────

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

    /// <summary>InvMixColumns: bước hỗn trộn cột nghịch đảo</summary>
    private void InvMixColumns(byte[] state)
    {
        for (int i = 0; i < 16; i += 4)
        {
            byte[] c = new byte[4];
            Array.Copy(state, i, c, 0, 4);

            state[i] = (byte)(MulGf(c[0], 0x0e) ^ MulGf(c[1], 0x0b) ^ MulGf(c[2], 0x0d) ^ MulGf(c[3], 0x09));
            state[i + 1] = (byte)(MulGf(c[0], 0x09) ^ MulGf(c[1], 0x0e) ^ MulGf(c[2], 0x0b) ^ MulGf(c[3], 0x0d));
            state[i + 2] = (byte)(MulGf(c[0], 0x0d) ^ MulGf(c[1], 0x09) ^ MulGf(c[2], 0x0e) ^ MulGf(c[3], 0x0b));
            state[i + 3] = (byte)(MulGf(c[0], 0x0b) ^ MulGf(c[1], 0x0d) ^ MulGf(c[2], 0x09) ^ MulGf(c[3], 0x0e));
        }
    }

    /// <summary>DecryptBlock: giải mã 1 khối 16 bytes</summary>
    private byte[] DecryptBlock(byte[] block, byte[][] roundKeys)
    {
        byte[] state = new byte[16];
        Array.Copy(block, state, 16);

        // AddRoundKey round 10
        for (int i = 0; i < 16; i++)
            state[i] ^= roundKeys[10][i];

        // 9 vòng ngược
        for (int r = 9; r > 0; r--)
        {
            // InvShiftRows
            byte d1 = state[1];
            state[1] = state[13];
            state[13] = state[9];
            state[9] = state[5];
            state[5] = d1;

            byte d2 = state[2];
            byte d3 = state[6];
            state[2] = state[10];
            state[6] = state[14];
            state[10] = d2;
            state[14] = d3;

            byte d4 = state[3];
            state[3] = state[7];
            state[7] = state[11];
            state[11] = state[15];
            state[15] = d4;

            // InvSubBytes
            for (int i = 0; i < 16; i++)
                state[i] = _invSbox[state[i]];

            // AddRoundKey
            for (int i = 0; i < 16; i++)
                state[i] ^= roundKeys[r][i];

            // InvMixColumns
            InvMixColumns(state);
        }

        // Final Round
        byte f1 = state[1];
        state[1] = state[13];
        state[13] = state[9];
        state[9] = state[5];
        state[5] = f1;

        byte f2 = state[2];
        byte f3 = state[6];
        state[2] = state[10];
        state[6] = state[14];
        state[10] = f2;
        state[14] = f3;

        byte f4 = state[3];
        state[3] = state[7];
        state[7] = state[11];
        state[11] = state[15];
        state[15] = f4;

        for (int i = 0; i < 16; i++)
            state[i] = _invSbox[state[i]];

        for (int i = 0; i < 16; i++)
            state[i] ^= roundKeys[0][i];

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
