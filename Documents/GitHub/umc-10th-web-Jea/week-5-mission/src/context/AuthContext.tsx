import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

interface AuthContextType {
    accessToken: string | null;
    nickname: string | null;
    isAuthenticated: boolean;
    login: (accessToken: string, refreshToken: string, nickname: string) => void;
    logout: () => void;
    setNickname: (nickname: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [accessToken, setAccessToken] = useState<string | null>(
        localStorage.getItem("accessToken")
    );
    const [nickname, setNicknameState] = useState<string | null>(
        localStorage.getItem("nickname")
    );

    const login = (token: string, refreshToken: string, nick: string) => {
        localStorage.setItem("accessToken", token);
        localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("nickname", nick);
        setAccessToken(token);
        setNicknameState(nick);
    };

    const logout = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("nickname");
        setAccessToken(null);
        setNicknameState(null);
    };

    const setNickname = (nick: string) => {
        localStorage.setItem("nickname", nick);
        setNicknameState(nick);
    };

    return (
        <AuthContext.Provider value={{
            accessToken,
            nickname,
            isAuthenticated: !!accessToken,
            login,
            logout,
            setNickname,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
};