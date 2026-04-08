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

    // 유효성 검사 로직 (Zod 없이 수동 체크)
    const isPasswordLenValid = values.password.length > 6;
    const isPasswordMatch = values.password === values.passwordConfirm && values.password !== "";
    const isStep2Valid = isPasswordLenValid && isPasswordMatch;
    const isNicknameValid = values.nickname.trim().length >= 2;

    const handleBack = () => {
        if (step === 3) setStep(2);
        else if (step === 2) setStep(1);
        else navigate(-1);
    };

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6 px-4 text-white">
            <header className="relative flex items-center justify-center w-full max-w-xs">
                <button className="absolute left-0" onClick={handleBack}><ChevronLeft size={24} /></button>
                <span className="font-bold text-lg">회원가입</span>
            </header>

            <div className="flex flex-col gap-4 w-full max-w-xs">
                {step === 1 && (
                    <>
                        <div className={`flex items-center gap-3 bg-neutral-900 border rounded-lg px-4 py-3 ${values.email && !isEmailValid ? 'border-red-500' : 'border-neutral-800 focus-within:border-pink-500'}`}>
                            <Mail size={20} className="text-neutral-500" />
                            <input name="email" type="email" value={values.email} onChange={handleChange} placeholder="이메일을 입력해주세요" className="bg-transparent w-full outline-none" />
                        </div>
                        <div className="h-4">{values.email && !isEmailValid && <span className="text-red-500 text-xs">올바른 이메일 형식을 입력해주세요.</span>}</div>
                        <button onClick={() => setStep(2)} disabled={!isEmailValid} className={`mt-4 py-3 rounded-lg font-bold ${isEmailValid ? 'bg-pink-500' : 'bg-neutral-800 text-neutral-500'}`}>다음</button>
                    </>
                )}

                {step === 2 && (
                    <>
                        <div className="flex flex-col gap-3">
                            <div className={`bg-neutral-900 border rounded-lg px-4 py-3 flex items-center justify-between ${values.password && !isPasswordLenValid ? 'border-red-500' : 'border-neutral-800'}`}>
                                <input name="password" type={showPassword ? "text" : "password"} value={values.password} onChange={handleChange} placeholder="비밀번호를 입력해주세요!" className="bg-transparent w-full outline-none" />
                                <button onClick={() => setShowPassword(!showPassword)}>{showPassword ? <Eye size={20} /> : <EyeOff size={20} />}</button>
                            </div>
                            <div className="h-2">{values.password && !isPasswordLenValid && <span className="text-red-500 text-[10px]">비밀번호는 6글자를 넘어야 합니다.</span>}</div>

                            <div className={`bg-neutral-900 border rounded-lg px-4 py-3 flex items-center justify-between ${values.passwordConfirm && !isPasswordMatch ? 'border-red-500' : 'border-neutral-800'}`}>
                                <input name="passwordConfirm" type={showPasswordConfirm ? "text" : "password"} value={values.passwordConfirm} onChange={handleChange} placeholder="비밀번호 확인" className="bg-transparent w-full outline-none" />
                                <button onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}>{showPasswordConfirm ? <Eye size={20} /> : <EyeOff size={20} />}</button>
                            </div>
                            <div className="h-2">{values.passwordConfirm && !isPasswordMatch && <span className="text-red-500 text-[10px]">비밀번호가 일치하지 않습니다.</span>}</div>
                        </div>
                        <button onClick={() => setStep(3)} disabled={!isStep2Valid} className={`mt-8 py-3 rounded-lg font-bold ${isStep2Valid ? 'bg-pink-500' : 'bg-neutral-800'}`}>다음</button>
                    </>
                )}

                {step === 3 && (
                    <div className="flex flex-col items-center gap-6">
                        <div className="w-32 h-32 bg-neutral-800 rounded-full flex items-center justify-center border-4 border-neutral-700"><User size={64} className="text-neutral-500" /></div>
                        <div className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3">
                            <input name="nickname" value={values.nickname} onChange={handleChange} placeholder="닉네임을 입력해주세요" className="bg-transparent w-full text-center outline-none" />
                        </div>
                        <button onClick={() => { alert("가입 완료!"); navigate("/"); }} disabled={!isNicknameValid} className={`w-full py-3 rounded-lg font-bold ${isNicknameValid ? 'bg-pink-500' : 'bg-neutral-800'}`}>회원가입 완료</button>
                    </div>
                )}
            </div>
        </div>
    );
};