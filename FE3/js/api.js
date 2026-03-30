// Quản lý API calls
class ApiClient {
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
}
