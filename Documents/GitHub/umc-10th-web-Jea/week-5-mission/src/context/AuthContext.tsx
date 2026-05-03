import { createContext, useContext, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";

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
        // 1. API 호출로 토큰 발급
        const res = await fetch("http://localhost:8080/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        if (!res.ok) throw new Error("로그인 실패");

        const data = await res.json();

        // 2. 로컬 스토리지에 저장
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);

        // 3. 상태 업데이트로 리렌더링 트리거
        setAccessToken(data.accessToken);

        // 4. 성공 시 마이페이지로 이동
        navigate("/mypage");
    };

    const logout = async () => {
        try {
            // 1. API 호출로 세션 종료
            await fetch("http://localhost:8080/api/auth/logout", {
                method: "POST",
                headers: { Authorization: `Bearer ${accessToken}` },
            });
        } catch {
            // 서버 오류여도 클라이언트 로그아웃은 진행
        } finally {
            // 2. 로컬 스토리지에서 토큰 삭제 (clear 대신 removeItem)
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");

            // 3. 상태를 null로 초기화
            setAccessToken(null);

            // 4. 홈으로 리다이렉트
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