import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  withCredentials: true, // required for cookies
});

// Handle unauthorized responses globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const publicRoutes = ["/login", "/forgot-password", "/reset-password"];

    const currentPath = window.location.pathname;

    const isPublic = publicRoutes.some((route) =>
      currentPath.startsWith(route),
    );

    if (error.response?.status === 401 && !isPublic) {
      window.location.href = "/login";
    }

    return Promise.reject(error);
  },
);
export default api;
