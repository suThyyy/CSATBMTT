// Cấu hình API
const API_CONFIG = {
  BASE_URL: "http://localhost:5000/api",
  TOKEN_KEY: "auth_token",
  USER_KEY: "current_user",
  ROLE_KEY: "user_role",
};

// Cấu hình role
const ROLES = {
  ADMIN: "Admin",
  USER: "User",
  VIEWER: "Viewer",
};

// Các route công khai (không cần authentication)
const PUBLIC_ROUTES = ["/login", "/register"];

// Cấu hình endpoint
const ENDPOINTS = {
  AUTH: {
    REGISTER: "/Auth/register",
    LOGIN: "/Auth/login",
  },
  USERS: {
    GET_ALL: "/users",
    GET_BY_ID: "/users/{id}",
    GET_CURRENT: "/users/me",
    UPDATE: "/users/{id}",
    DELETE: "/users/{id}",
    TOGGLE_ACTIVE: "/users/{id}/active",
    PROMOTE_TO_VIEWER: "/users/{id}/promote-to-viewer",
  },
  MASKING: {
    DEMO: "/masking/demo",
    USER: "/masking/user/{id}",
  },
  ADMIN: {
    GET_MASKING_CONFIG: "/admin/masking-config",
    UPDATE_MASKING_CONFIG: "/admin/masking-config",
    GET_MASKING_ALGORITHMS: "/admin/masking-algorithms",
  },
};
