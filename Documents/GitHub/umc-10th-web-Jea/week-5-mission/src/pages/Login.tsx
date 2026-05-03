import { useNavigate } from "react-router-dom";
import { ChevronLeft } from 'lucide-react';
import { useForm } from "../hooks/useForm";
import { useAuth } from "../context/AuthContext";





export const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    
    const { values, handleChange, isEmailValid, isPasswordValid, isFormValid } = useForm({
        email: "",
        password: ""
    });

    const handleLogin = async () => {
        try {
            await login(values.email, values.password);
            navigate("/");
        } catch {
            alert("이메일 또는 비밀번호가 올바르지 않습니다.");
        }
    };

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6 px-4">
            <div className="relative flex items-center justify-center w-80">
                <button className="absolute left-0 text-white" onClick={() => navigate(-1)}>
                    <ChevronLeft size={28} />
                </button>
                <span className="text-white font-bold text-xl">로그인</span>
            </div>

            <div className="flex flex-col gap-3 w-80">
                <button
                    type="button"
                    onClick={() => window.location.href = "http://localhost:8080/api/auth/google"}
                    className="flex items-center justify-center gap-3 border border-neutral-600 rounded-lg py-3 text-white hover:bg-neutral-800 transition"
                >
                    <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                    구글 로그인
                </button>

                <div className="flex items-center gap-3 my-2">
                    <div className="flex-1 h-px bg-neutral-700" />
                    <span className="text-neutral-500 text-xs">OR</span>
                    <div className="flex-1 h-px bg-neutral-700" />
                </div>

                <div className="flex flex-col gap-1.5">
                    <input
                        name="email" 
                        type="email"
                        value={values.email}
                        onChange={handleChange}
                        placeholder="이메일을 입력해주세요!"
                        className={`bg-transparent border rounded-lg px-4 py-3 text-white placeholder-neutral-500 outline-none transition ${
                            values.email && !isEmailValid ? 'border-red-500' : 'border-neutral-600 focus:border-pink-500'
                        }`}
                    />
                    <div className="h-4">
                        {values.email && !isEmailValid && (
                            <span className="text-red-500 text-xs px-1">올바른 이메일 형식을 입력해주세요.</span>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-1.5">
                    <input
                        name="password"
                        type="password"
                        value={values.password}
                        onChange={handleChange}
                        placeholder="비밀번호를 입력해주세요!"
                        className={`bg-transparent border rounded-lg px-4 py-3 text-white placeholder-neutral-500 outline-none transition ${
                            values.password && !isPasswordValid ? 'border-red-500' : 'border-neutral-600 focus:border-pink-500'
                        }`}
                    />
                    <div className="h-4">
                        {values.password && !isPasswordValid && (
                            <span className="text-red-500 text-xs px-1">비밀번호는 6자 이상이어야 합니다.</span>
                        )}
                    </div>
                </div>

                <button 
                    onClick={handleLogin}
                    disabled={!isFormValid}
                    className={`mt-4 rounded-lg py-3 font-bold transition text-white ${
                        isFormValid 
                        ? 'bg-pink-500 hover:bg-pink-600 cursor-pointer' 
                        : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                    }`}
                >
                    로그인
                </button>
            </div>
        </div>
    );
};