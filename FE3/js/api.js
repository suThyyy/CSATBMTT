// Quản lý API calls
class ApiClient {

  // mock disabled
  static isMockEnabled() {
    return false;
  }

  static setMockEnabled(enabled) {
    localStorage.setItem(API_CONFIG.MOCK_MODE_KEY, String(enabled));
  }

  static async request(method, endpoint, data = null, params = null) {
    try {
      const config = {
        method,
        url: API_CONFIG.BASE_URL + endpoint,
        headers: {
          "Content-Type": "application/json",
        },
      };

      const token = AuthManager.getToken();
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }

      if (data) config.data = data;
      if (params) config.params = params;

      const response = await axios(config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  static handleError(error) {
    if (error.response) {
      const { status, data } = error.response;
      if (status === 401) {
        AuthManager.logout();
      }
      return new Error(data?.message || "Lỗi từ server");
    }
    return new Error("Lỗi kết nối mạng");
  }

  // AUTH ENDPOINTS
  static register(username, email, phone, password) {
    return this.request("POST", ENDPOINTS.AUTH.REGISTER, {
      username,
      email,
      phone,
      password,
    });
  }

  static login(username, password) {
    return this.request("POST", ENDPOINTS.AUTH.LOGIN, {
      username,
      password,
    });
  }

  // USERS ENDPOINTS
  static getUsers(mask = true, skip = 0, limit = 10) {
    return this.request("GET", ENDPOINTS.USERS.GET_ALL, null, {
      mask,
      skip,
      limit,
    });
  }

  static getCurrentUser() {
    return this.request("GET", ENDPOINTS.USERS.GET_CURRENT);
  }

  static getUserById(id, mask = true) {
    const endpoint = ENDPOINTS.USERS.GET_BY_ID.replace("{id}", id);
    return this.request("GET", endpoint, null, { mask });
  }

  static updateUser(id, username, email, phone, password) {
    const endpoint = ENDPOINTS.USERS.UPDATE.replace("{id}", id);
    return this.request("PUT", endpoint, {
      id,
      username,
      email,
      phone,
      password,
    });
  }

  static deleteUser(id) {
    const endpoint = ENDPOINTS.USERS.DELETE.replace("{id}", id);
    return this.request("DELETE", endpoint);
  }

  static toggleUserActive(id, isActive) {
    const endpoint = ENDPOINTS.USERS.TOGGLE_ACTIVE.replace("{id}", id);
    return this.request("PATCH", endpoint, null, { isActive });
  }

  static promoteToViewer(id) {
    const endpoint = ENDPOINTS.USERS.PROMOTE_TO_VIEWER.replace("{id}", id);
    return this.request("PATCH", endpoint);
  }

  // MASKING ENDPOINTS
  static getMaskingDemo(email, phone) {
    return this.request("POST", ENDPOINTS.MASKING.DEMO, {
      email,
      phone,
    });
  }

  static getUserWithMasking(id) {
    const endpoint = ENDPOINTS.MASKING.USER.replace("{id}", id);
    return this.request("GET", endpoint);
  }

  // ADMIN MASKING ENDPOINTS
  static getMaskingConfig() {
    return this.request("GET", ENDPOINTS.ADMIN.GET_MASKING_CONFIG);
  }

  static updateMaskingConfig(enabled, algorithm) {
    return this.request("PUT", ENDPOINTS.ADMIN.UPDATE_MASKING_CONFIG, {
      enabled,
      algorithm,
    });
  }

  static getMaskingAlgorithms() {
    return this.request("GET", ENDPOINTS.ADMIN.GET_MASKING_ALGORITHMS);
  }
  //mock

  static async mockRequest(method, endpoint, data = null, params = null) {
    await this.delay(200);

    const normalizedMethod = method.toUpperCase();
    const normalizedEndpoint = endpoint.toLowerCase();
    const db = this.getMockDb();

    // AUTH
    if (
      normalizedMethod === "POST" &&
      normalizedEndpoint === ENDPOINTS.AUTH.LOGIN.toLowerCase()
    ) {
      const user = db.users.find((u) => u.username === data.username);
      if (!user || user.password !== data.password) {
        throw new Error("Sai tên đăng nhập hoặc mật khẩu");
      }
      if (!user.isActive) {
        throw new Error("Tài khoản đã bị khóa");
      }

      return {
        success: true,
        data: {
          token: `mock-token-${user.id}`,
          id: user.id,
          username: user.username,
          role: user.role,
        },
      };
    }

    if (
      normalizedMethod === "POST" &&
      normalizedEndpoint === ENDPOINTS.AUTH.REGISTER.toLowerCase()
    ) {
      const usernameExists = db.users.some((u) => u.username === data.username);
      if (usernameExists) {
        throw new Error("Tên đăng nhập đã tồn tại");
      }

      const emailExists = db.users.some((u) => u.email === data.email);
      if (emailExists) {
        throw new Error("Email đã được sử dụng");
      }

      const newUser = {
        id: db.nextUserId,
        username: data.username,
        email: data.email,
        phone: data.phone,
        password: data.password,
        role: ROLES.USER,
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      db.users.push(newUser);
      db.nextUserId += 1;
      this.saveMockDb(db);

      return {
        success: true,
        data: {
          id: newUser.id,
          username: newUser.username,
          role: newUser.role,
        },
      };
    }

    // USERS LIST
    if (
      normalizedMethod === "GET" &&
      normalizedEndpoint === ENDPOINTS.USERS.GET_ALL.toLowerCase()
    ) {
      const shouldMask = params?.mask !== false && params?.mask !== "false";
      const skip = Number(params?.skip || 0);
      const limit = Number(params?.limit || 10);

      const items = db.users.slice(skip, skip + limit).map((u) => {
        return shouldMask ? this.applyMaskingToUser(u, db.maskingConfig.algorithm) : { ...u };
      });

      return {
        success: true,
        data: {
          items,
          total: db.users.length,
        },
      };
    }

    // CURRENT USER
    if (
      normalizedMethod === "GET" &&
      normalizedEndpoint === ENDPOINTS.USERS.GET_CURRENT.toLowerCase()
    ) {
      const currentUser = AuthManager.getUser();
      if (!currentUser) {
        throw new Error("Chưa đăng nhập");
      }

      const fullUser = db.users.find((u) => u.id === currentUser.id);
      if (!fullUser) {
        throw new Error("Không tìm thấy người dùng hiện tại");
      }

      return {
        success: true,
        data: { ...fullUser },
      };
    }

    // USER BY ID
    const userByIdMatch = normalizedEndpoint.match(/^\/users\/(\d+)$/);
    if (normalizedMethod === "GET" && userByIdMatch) {
      const id = Number(userByIdMatch[1]);
      const shouldMask = params?.mask !== false && params?.mask !== "false";
      const user = db.users.find((u) => u.id === id);
      if (!user) {
        throw new Error("Không tìm thấy người dùng");
      }

      return {
        success: true,
        data: shouldMask
          ? this.applyMaskingToUser(user, db.maskingConfig.algorithm)
          : { ...user },
      };
    }

    // UPDATE USER
    if (normalizedMethod === "PUT" && userByIdMatch) {
      const id = Number(userByIdMatch[1]);
      const index = db.users.findIndex((u) => u.id === id);
      if (index < 0) {
        throw new Error("Không tìm thấy người dùng");
      }

      db.users[index] = {
        ...db.users[index],
        username: data.username,
        email: data.email,
        phone: data.phone,
        password: data.password || db.users[index].password,
      };

      this.saveMockDb(db);
      return {
        success: true,
        data: { ...db.users[index] },
      };
    }

    // DELETE USER
    if (normalizedMethod === "DELETE" && userByIdMatch) {
      const id = Number(userByIdMatch[1]);
      const exists = db.users.some((u) => u.id === id);
      if (!exists) {
        throw new Error("Không tìm thấy người dùng");
      }

      db.users = db.users.filter((u) => u.id !== id);
      this.saveMockDb(db);
      return {
        success: true,
        data: {
          deletedId: id,
        },
      };
    }

    // TOGGLE ACTIVE
    const toggleActiveMatch = normalizedEndpoint.match(/^\/users\/(\d+)\/active$/);
    if (normalizedMethod === "PATCH" && toggleActiveMatch) {
      const id = Number(toggleActiveMatch[1]);
      const user = db.users.find((u) => u.id === id);
      if (!user) {
        throw new Error("Không tìm thấy người dùng");
      }

      const isActive = params?.isActive === true || params?.isActive === "true";
      user.isActive = isActive;
      this.saveMockDb(db);

      return {
        success: true,
        data: { ...user },
      };
    }

    // PROMOTE TO VIEWER
    const promoteMatch = normalizedEndpoint.match(
      /^\/users\/(\d+)\/promote-to-viewer$/,
    );
    if (normalizedMethod === "PATCH" && promoteMatch) {
      const id = Number(promoteMatch[1]);
      const user = db.users.find((u) => u.id === id);
      if (!user) {
        throw new Error("Không tìm thấy người dùng");
      }

      user.role = ROLES.VIEWER;
      this.saveMockDb(db);

      return {
        success: true,
        data: { ...user },
      };
    }

    // MASKING DEMO
    if (
      normalizedMethod === "POST" &&
      normalizedEndpoint === ENDPOINTS.MASKING.DEMO.toLowerCase()
    ) {
      return {
        success: true,
        data: {
          original: {
            email: data.email,
            phone: data.phone,
          },
          characterMasking: {
            description: "Che bớt ký tự nhưng vẫn giữ định dạng",
            email: this.maskEmail(data.email, 1),
            phone: this.maskPhone(data.phone, 1),
          },
          datashuffling: {
            description: "Xáo trộn một phần dữ liệu",
            email: this.maskEmail(data.email, 2),
            phone: this.maskPhone(data.phone, 2),
          },
          datasubstitution: {
            description: "Thay thế bằng dữ liệu mẫu",
            email: this.maskEmail(data.email, 3),
            phone: this.maskPhone(data.phone, 3),
          },
          noiseaddition: {
            description: "Thêm nhiễu để khó suy đoán dữ liệu thật",
            email: this.maskEmail(data.email, 4),
            phone: this.maskPhone(data.phone, 4),
          },
        },
      };
    }

    // MASKING USER
    const maskingUserMatch = normalizedEndpoint.match(/^\/masking\/user\/(\d+)$/);
    if (normalizedMethod === "GET" && maskingUserMatch) {
      const id = Number(maskingUserMatch[1]);
      const user = db.users.find((u) => u.id === id);
      if (!user) {
        throw new Error("Không tìm thấy người dùng");
      }

      return {
        success: true,
        data: this.applyMaskingToUser(user, db.maskingConfig.algorithm),
      };
    }

    // ADMIN MASKING CONFIG
    if (
      normalizedMethod === "GET" &&
      normalizedEndpoint === ENDPOINTS.ADMIN.GET_MASKING_CONFIG.toLowerCase()
    ) {
      return {
        success: true,
        data: { ...db.maskingConfig },
      };
    }

    if (
      normalizedMethod === "PUT" &&
      normalizedEndpoint === ENDPOINTS.ADMIN.UPDATE_MASKING_CONFIG.toLowerCase()
    ) {
      const selectedAlgorithm = db.maskingAlgorithms.find(
        (a) => a.id === Number(data.algorithm),
      );
      if (!selectedAlgorithm) {
        throw new Error("Thuật toán masking không hợp lệ");
      }

      db.maskingConfig = {
        enabled: !!data.enabled,
        algorithm: selectedAlgorithm.id,
        algorithmName: selectedAlgorithm.name,
        updatedAt: new Date().toISOString(),
      };

      this.saveMockDb(db);
      return {
        success: true,
        data: { ...db.maskingConfig },
      };
    }

    if (
      normalizedMethod === "GET" &&
      normalizedEndpoint === ENDPOINTS.ADMIN.GET_MASKING_ALGORITHMS.toLowerCase()
    ) {
      return {
        success: true,
        data: db.maskingAlgorithms.map((a) => ({ ...a })),
      };
    }

    throw new Error(`Mock chưa hỗ trợ endpoint: ${method} ${endpoint}`);
  }

  static applyMaskingToUser(user, algorithm) {
    const shouldMask = this.getMockDb().maskingConfig.enabled;
    if (!shouldMask) {
      return { ...user };
    }

    return {
      ...user,
      email: this.maskEmail(user.email, algorithm),
      phone: this.maskPhone(user.phone, algorithm),
    };
  }

  static maskEmail(email, algorithm) {
    const [name = "", domain = "example.com"] = String(email).split("@");

    if (algorithm === 1) {
      const keep = name.slice(0, 2);
      return `${keep}${"*".repeat(Math.max(name.length - 2, 1))}@${domain}`;
    }

    if (algorithm === 2) {
      const shuffled = name.split("").reverse().join("");
      return `${shuffled}@${domain}`;
    }

    if (algorithm === 3) {
      return "hidden.user@example.com";
    }

    const noisy = `${name.slice(0, 1)}${Math.floor(Math.random() * 90 + 10)}${name.slice(-1)}`;
    return `${noisy}@${domain}`;
  }

  static maskPhone(phone, algorithm) {
    const raw = String(phone);

    if (algorithm === 1) {
      const tail = raw.slice(-2);
      return `${"*".repeat(Math.max(raw.length - 2, 1))}${tail}`;
    }

    if (algorithm === 2) {
      return raw.split("").reverse().join("");
    }

    if (algorithm === 3) {
      return "+8499XXXXXXX";
    }

    return raw.replace(/\d/g, (d, idx) => {
      if (idx % 2 === 0) return d;
      return String((Number(d) + 3) % 10);
    });
  }

  static getMockDb() {
    const saved = localStorage.getItem(API_CONFIG.MOCK_DB_KEY);
    if (saved) {
      return JSON.parse(saved);
    }

    const seed = {
      nextUserId: 6,
      users: [
        {
          id: 1,
          username: "admin",
          email: "admin@company.com",
          phone: "+84901234501",
          password: "admin123",
          role: ROLES.ADMIN,
          isActive: true,
          createdAt: "2026-01-01T08:00:00.000Z",
        },
        {
          id: 2,
          username: "john_doe",
          email: "john.doe@company.com",
          phone: "+84901234567",
          password: "123456",
          role: ROLES.USER,
          isActive: true,
          createdAt: "2026-01-10T09:30:00.000Z",
        },
        {
          id: 3,
          username: "viewer_anna",
          email: "anna.viewer@company.com",
          phone: "+84908887766",
          password: "123456",
          role: ROLES.VIEWER,
          isActive: true,
          createdAt: "2026-01-12T03:45:00.000Z",
        },
        {
          id: 4,
          username: "minh_nguyen",
          email: "minh.nguyen@company.com",
          phone: "+84903332211",
          password: "123456",
          role: ROLES.USER,
          isActive: false,
          createdAt: "2026-02-05T10:20:00.000Z",
        },
        {
          id: 5,
          username: "linh_tran",
          email: "linh.tran@company.com",
          phone: "+84907775544",
          password: "123456",
          role: ROLES.USER,
          isActive: true,
          createdAt: "2026-02-20T12:05:00.000Z",
        },
      ],
      maskingAlgorithms: [
        {
          id: 1,
          name: "Character Masking",
          description: "Che bớt ký tự dữ liệu",
        },
        {
          id: 2,
          name: "Data Shuffling",
          description: "Xáo trộn các ký tự",
        },
        {
          id: 3,
          name: "Data Substitution",
          description: "Thay dữ liệu bằng giá trị an toàn",
        },
        {
          id: 4,
          name: "Noise Addition",
          description: "Thêm nhiễu vào dữ liệu nhạy cảm",
        },
      ],
      maskingConfig: {
        enabled: true,
        algorithm: 1,
        algorithmName: "Character Masking",
        updatedAt: new Date().toISOString(),
      },
    };

    this.saveMockDb(seed);
    return seed;
  }

  static saveMockDb(db) {
    localStorage.setItem(API_CONFIG.MOCK_DB_KEY, JSON.stringify(db));
  }

  static delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
