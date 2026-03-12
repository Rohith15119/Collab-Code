import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/index";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      localStorage.setItem("token", token);
      window.history.replaceState({}, "", "/dashboard");
    }

    api
      .get("/auth/me")
      .then(({ data }) => {
        if (isMounted) setUser(data.user);
      })
      .catch(() => {
        localStorage.removeItem("token");
        if (isMounted) setUser(null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", data.token);
      setUser(data);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const refreshUser = async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data.user);
    } catch (err) {
      console.error(err);
    }
  };

  const register = async (name, email, password) => {
    try {
      const { data } = await api.post("/auth/register", {
        name,
        email,
        password,
      });
      setUser(data.user);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
      localStorage.removeItem("token");
      setUser(null);
    } catch (err) {
      console.error(err);
    }
  };

  const forgetPassword = async (email) => {
    try {
      await api.post("/auth/forgot-password-request", { email });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        forgetPassword,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
