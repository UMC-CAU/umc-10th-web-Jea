import axios from "axios";

const axiosInstance = axios.create({
    baseURL: "http://localhost:8080",
    headers: { "Content-Type": "application/json" },
});

// 요청 인터셉터 - 모든 요청에 accessToken 자동 첨부
axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// 응답 인터셉터 - accessToken 만료 시 refreshToken으로 재발급
axiosInstance.interceptors.response.use(
    (response) => response, // 성공은 그냥 통과

    async (error) => {
        const originalRequest = error.config;

        // 401 에러 && 재시도 안한 요청일 때만 처리 (_retry 플래그로 무한루프 방지)
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true; // 🔒 무한 루프 방지

            try {
                const refreshToken = localStorage.getItem("refreshToken");
                if (!refreshToken) throw new Error("refreshToken 없음");

                // refreshToken으로 새 accessToken 발급
                const res = await axios.post("http://localhost:8080/api/auth/refresh", {
                    refreshToken,
                });

                const newAccessToken = res.data.accessToken;

                // 새 토큰 저장
                localStorage.setItem("accessToken", newAccessToken);

                // 실패했던 요청 헤더 업데이트 후 재시도
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return axiosInstance(originalRequest);

            } catch {
                // refreshToken도 만료 → 로그아웃 처리
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
                window.location.href = "/login";
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;