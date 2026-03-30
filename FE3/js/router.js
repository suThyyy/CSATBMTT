// Router đơn giản
class Router {
  constructor() {
    this.routes = {};
    this.currentRoute = null;
    this.init();
  }

  register(path, handler, requireAuth = true) {
    this.routes[path] = { handler, requireAuth };
  }

  init() {
    window.addEventListener("hashchange", () => this.navigate());
    this.navigate();
  }

  navigate() {
    const path = window.location.hash.slice(1) || "/";
    const cleanPath = path.split("?")[0];

    // Kiểm tra route tĩnh trước
    let route = this.routes[cleanPath];

    // Nếu không tìm thấy, kiểm tra route động
    if (!route) {
      const pathParts = cleanPath.split("/").filter((p) => p);

      for (const [routePath, routeConfig] of Object.entries(this.routes)) {
        const routeParts = routePath.split("/").filter((p) => p);

        // Kiểm tra số lượng parts và match pattern
        if (pathParts.length === routeParts.length) {
          let isMatch = true;

          for (let i = 0; i < routeParts.length; i++) {
            const routePart = routeParts[i];
            const pathPart = pathParts[i];

            // Nếu route part bắt đầu bằng ":", nó là parameter
            if (!routePart.startsWith(":") && routePart !== pathPart) {
              isMatch = false;
              break;
            }
          }

          if (isMatch) {
            route = routeConfig;
            break;
          }
        }
      }
    }

    if (!route) {
      this.renderNotFound();
      return;
    }

    if (route.requireAuth && !AuthManager.isAuthenticated()) {
      window.location.hash = "#/login";
      return;
    }

    this.currentRoute = cleanPath;
    route.handler();
  }

  renderNotFound() {
    const app = document.getElementById("app");
    app.innerHTML = `
            <div class="flex items-center justify-center min-h-screen bg-gray-50">
                <div class="text-center">
                    <h1 class="text-4xl font-bold text-gray-900 mb-4">404</h1>
                    <p class="text-xl text-gray-600 mb-8">Trang không tồn tại</p>
                    <a href="#/" class="text-blue-600 hover:text-blue-800 font-semibold">← Quay lại trang chính</a>
                </div>
            </div>
        `;
  }

  static redirect(path) {
    window.location.hash = `#${path}`;
  }
}

const router = new Router();
