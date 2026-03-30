// Quản lý authentication
class AuthManager {
  static setToken(token) {
    localStorage.setItem(API_CONFIG.TOKEN_KEY, token);
  }

  static getToken() {
    return localStorage.getItem(API_CONFIG.TOKEN_KEY);
  }

  static setUser(user) {
    localStorage.setItem(API_CONFIG.USER_KEY, JSON.stringify(user));
    localStorage.setItem(API_CONFIG.ROLE_KEY, user.role);
  }

  static getUser() {
    const user = localStorage.getItem(API_CONFIG.USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  static getRole() {
    return localStorage.getItem(API_CONFIG.ROLE_KEY);
  }

  static isAuthenticated() {
    return !!this.getToken() && !!this.getUser();
  }

  static isAdmin() {
    return this.getRole() === ROLES.ADMIN;
  }

  static isViewer() {
    return this.getRole() === ROLES.VIEWER;
  }

  static isUser() {
    return this.getRole() === ROLES.USER;
  }

  static logout() {
    localStorage.removeItem(API_CONFIG.TOKEN_KEY);
    localStorage.removeItem(API_CONFIG.USER_KEY);
    localStorage.removeItem(API_CONFIG.ROLE_KEY);
    window.location.hash = "#/login";
  }

  static canView(userId) {
    const currentUser = this.getUser();
    return (
      this.isAdmin() ||
      this.isViewer() ||
      (this.isUser() && currentUser.id === userId)
    );
  }

  static canEdit(userId) {
    const currentUser = this.getUser();
    return this.isAdmin() || (this.isUser() && currentUser.id === userId);
  }

  static canDelete(userId) {
    return this.isAdmin();
  }
}
