import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  withCredentials: true, // required for cookies
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
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
      localStorage.removeItem("token");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  },
);

export default api;
