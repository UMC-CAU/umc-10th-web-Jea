import { createContext, useContext, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

interface AuthContextType {
    accessToken: string | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [accessToken, setAccessToken] = useState<string | null>(
        localStorage.getItem("accessToken")
    );
    const navigate = useNavigate();

    const login = async (email: string, password: string) => {
        const res = await axiosInstance.post("/api/auth/login", { email, password });

        localStorage.setItem("accessToken", res.data.accessToken);
        localStorage.setItem("refreshToken", res.data.refreshToken);
        setAccessToken(res.data.accessToken);
        navigate("/mypage");
    };

    const logout = async () => {
        try {
            await axiosInstance.post("/api/auth/logout");
        } catch {
        } finally {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            setAccessToken(null);
            navigate("/");
        }
    };

    return (
        <AuthContext.Provider value={{ accessToken, login, logout, isAuthenticated: !!accessToken }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
};