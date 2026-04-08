import { useState } from "react";
import { ChevronLeft, Mail, Eye, EyeOff, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useForm } from "../hooks/useForm";

export const SignUp = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

    const { values, handleChange, isEmailValid } = useForm({
        email: "",
        password: "",
        passwordConfirm: "",
        nickname: ""
    });

    const isPasswordLenValid = values.password.length > 6;
    const isPasswordMatch = values.password === values.passwordConfirm && values.password !== "";
    const isStep2Valid = isPasswordLenValid && isPasswordMatch;
    const isNicknameValid = values.nickname.trim().length >= 2;

    const handleBack = () => {
        if (step === 3) setStep(2);
        else if (step === 2) setStep(1);
        else navigate(-1);
    };

    const handleComplete = () => {
        alert("회원가입이 완료되었습니다!");
        navigate("/");
    };

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6 px-4">
            
            <header className="relative flex items-center justify-center w-full max-w-xs">
                <button className="absolute left-0 text-white p-1" onClick={handleBack}>
                    <ChevronLeft size={24} />
                </button>
                <span className="text-white font-bold text-lg" style={{ color: 'white' }}>
                    회원가입
                </span>
            </header>

            <div className="flex flex-col gap-4 w-full max-w-xs">
                
                {step === 1 && (
                    <>
                        <div className="flex flex-col gap-1">
                            <div className={`flex items-center gap-3 bg-neutral-900 border rounded-lg px-4 py-3 transition ${
                                values.email && !isEmailValid ? 'border-red-500' : 'border-neutral-800 focus-within:border-pink-500'
                            }`}>
                                <Mail size={20} className="text-neutral-500" />
                                <input
                                    name="email"
                                    type="email"
                                    autoFocus
                                    value={values.email}
                                    onChange={handleChange}
                                    placeholder="이메일을 입력해주세요"
                                    className="bg-transparent w-full text-white placeholder-neutral-500 outline-none"
                                />
                            </div>
                            <div className="h-4">
                                {values.email && !isEmailValid && (
                                    <span className="text-red-500 text-xs px-1">올바른 이메일 형식을 입력해주세요.</span>
                                )}
                            </div>
                        </div>

                        <button 
                            onClick={() => setStep(2)}
                            disabled={!isEmailValid}
                            className={`mt-4 rounded-lg py-3 font-bold transition text-white ${
                                isEmailValid ? 'bg-pink-500 hover:bg-pink-600' : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                            }`}
                        >
                            다음
                        </button>
                    </>
                )}

                {step === 2 && (
                    <>
                        <div className="flex items-center gap-2 mb-2 px-1">
                            <Mail size={16} className="text-white" />
                            <span className="text-white text-sm" style={{ color: 'white' }}>{values.email}</span>
                        </div>

                        <div className="flex flex-col gap-3">
                            <div className={`bg-neutral-900 border rounded-lg px-4 py-3 flex items-center justify-between transition ${
                                values.password && !isPasswordLenValid ? 'border-red-500' : 'border-neutral-800 focus-within:border-pink-500'
                            }`}>
                                <input
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    autoFocus
                                    value={values.password}
                                    onChange={handleChange}
                                    placeholder="비밀번호를 입력해주세요!"
                                    className="bg-transparent w-full text-white placeholder-neutral-500 outline-none"
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-neutral-500">
                                    {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                                </button>
                            </div>
                            <div className="h-2">
                                {values.password && !isPasswordLenValid && (
                                    <span className="text-red-500 text-[10px] px-1">비밀번호는 6글자를 넘어야 합니다.</span>
                                )}
                            </div>

                            <div className={`bg-neutral-900 border rounded-lg px-4 py-3 flex items-center justify-between transition ${
                                values.passwordConfirm && !isPasswordMatch ? 'border-red-500' : 'border-neutral-800 focus-within:border-pink-500'
                            }`}>
                                <input
                                    name="passwordConfirm"
                                    type={showPasswordConfirm ? "text" : "password"}
                                    value={values.passwordConfirm}
                                    onChange={handleChange}
                                    placeholder="비밀번호를 다시 한 번 입력해주세요!"
                                    className="bg-transparent w-full text-white placeholder-neutral-500 outline-none"
                                />
                                <button type="button" onClick={() => setShowPasswordConfirm(!showPasswordConfirm)} className="text-neutral-500">
                                    {showPasswordConfirm ? <Eye size={20} /> : <EyeOff size={20} />}
                                </button>
                            </div>
                            <div className="h-2">
                                {values.passwordConfirm && !isPasswordMatch && (
                                    <span className="text-red-500 text-[10px] px-1">비밀번호가 일치하지 않습니다.</span>
                                )}
                            </div>
                        </div>

                        <button 
                            onClick={() => setStep(3)}
                            disabled={!isStep2Valid}
                            className={`mt-8 rounded-lg py-3 font-bold transition text-white ${
                                isStep2Valid ? 'bg-pink-500 hover:bg-pink-600' : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                            }`}
                        >
                            다음
                        </button>
                    </>
                )}

                {step === 3 && (
                    <div className="flex flex-col items-center gap-6">
                        <div className="w-32 h-32 bg-neutral-800 rounded-full flex items-center justify-center overflow-hidden border-4 border-neutral-700">
                            <User size={64} className="text-neutral-500" />
                        </div>

                        <div className="w-full flex flex-col gap-1">
                            <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 focus-within:border-pink-500">
                                <input
                                    name="nickname"
                                    type="text"
                                    autoFocus
                                    value={values.nickname}
                                    onChange={handleChange}
                                    placeholder="닉네임을 입력해주세요"
                                    className="bg-transparent w-full text-white placeholder-neutral-500 outline-none text-center"
                                />
                            </div>
                            <div className="h-4">
                                {values.nickname && !isNicknameValid && (
                                    <span className="text-red-500 text-xs block text-center">닉네임은 2자 이상이어야 합니다.</span>
                                )}
                            </div>
                        </div>

                        <button 
                            onClick={handleComplete}
                            disabled={!isNicknameValid}
                            className={`w-full rounded-lg py-3 font-bold transition text-white ${
                                isNicknameValid ? 'bg-pink-500 hover:bg-pink-600' : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                            }`}
                        >
                            회원가입 완료
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};