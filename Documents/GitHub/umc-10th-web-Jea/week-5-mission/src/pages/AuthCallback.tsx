import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const AuthCallback = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const accessToken = params.get("accessToken");
        const refreshToken = params.get("refreshToken");
        const nickname = params.get("nickname");

        if (accessToken && refreshToken && nickname) {
            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem("refreshToken", refreshToken);
            localStorage.setItem("nickname", nickname);
            navigate("/mypage");
        } else {
            navigate("/login");
        }
    }, []);

    return (
        <div className="min-h-screen bg-black flex items-center justify-center text-white">
            <p>로그인 중...</p>
        </div>
    );
};