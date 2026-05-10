import { createContext, useContext, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

interface AuthContextType {
    accessToken: string | null;
    nickname: string | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [accessToken, setAccessToken] = useState<string | null>(
        localStorage.getItem("accessToken")
    );
    const [nickname, setNickname] = useState<string | null>(
        localStorage.getItem("nickname")
    );
    const navigate = useNavigate();

    const login = async (email: string, password: string) => {
        const res = await axiosInstance.post("/api/auth/login", { email, password });

        localStorage.setItem("accessToken", res.data.accessToken);
        localStorage.setItem("refreshToken", res.data.refreshToken);
        localStorage.setItem("nickname", res.data.nickname);
        setAccessToken(res.data.accessToken);
        setNickname(res.data.nickname);
        navigate("/mypage");
    };

    const logout = async () => {
        try {
            await axiosInstance.post("/api/auth/logout");
        } catch {
        } finally {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("nickname");
            setAccessToken(null);
            setNickname(null);
            navigate("/");
        }
    };

    return (
        <AuthContext.Provider value={{ accessToken, nickname, login, logout, isAuthenticated: !!accessToken }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
};