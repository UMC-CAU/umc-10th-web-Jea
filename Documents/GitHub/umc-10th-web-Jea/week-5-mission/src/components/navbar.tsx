import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../api/axiosInstance";

const HamburgerIcon = () => (
    <svg width="24" height="24" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M7.95 11.95h32m-32 12h32m-32 12h32" />
    </svg>
);

interface ConfirmModalProps {
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmModal = ({ message, onConfirm, onCancel }: ConfirmModalProps) => (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
        <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6 w-full max-w-xs flex flex-col gap-6">
            <div className="flex justify-end">
                <button onClick={onCancel} className="text-neutral-400 hover:text-white transition">
                    <X size={18} />
                </button>
            </div>
            <p className="text-white text-sm text-center">{message}</p>
            <div className="flex gap-3">
                <button
                    onClick={onConfirm}
                    className="flex-1 py-2.5 rounded-lg border border-neutral-600 text-white text-sm hover:bg-neutral-700 transition"
                >
                    예
                </button>
                <button
                    onClick={onCancel}
                    className="flex-1 py-2.5 rounded-lg bg-pink-500 hover:bg-pink-600 text-white text-sm font-bold transition"
                >
                    아니오
                </button>
            </div>
        </div>
    </div>
);

const Navbar = ({ onToggleSidebar }: { onToggleSidebar?: () => void }) => {
    const { isAuthenticated, logout, nickname } = useAuth();
    const navigate = useNavigate();
    const [showSearch, setShowSearch] = useState(false);
    const [search, setSearch] = useState("");

    const logoutMutation = useMutation({
        mutationFn: () => axiosInstance.post("/api/auth/logout"),
        onSettled: () => {
            logout();
            navigate("/login");
        },
    });

    return (
        <nav className="bg-neutral-900 flex items-center justify-between px-4 h-14 relative z-50">
            <div className="flex items-center gap-3">
                <button onClick={onToggleSidebar} className="text-white hover:text-pink-500 transition">
                    <HamburgerIcon />
                </button>
                <Link to="/" className="text-pink-500 font-bold text-lg">
                    돌려돌려LP판
                </Link>
            </div>

            <div className="flex items-center gap-3">
                {showSearch ? (
                    <div className="flex items-center gap-2 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5">
                        <Search size={16} className="text-neutral-400" />
                        <input
                            autoFocus
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="검색"
                            className="bg-transparent outline-none text-white text-sm w-36 placeholder-neutral-500"
                        />
                        <button onClick={() => { setShowSearch(false); setSearch(""); }}>
                            <X size={16} className="text-neutral-400 hover:text-white" />
                        </button>
                    </div>
                ) : (
                    <button onClick={() => setShowSearch(true)} className="text-white hover:text-pink-500 transition">
                        <Search size={20} />
                    </button>
                )}

                {isAuthenticated ? (
                    <>
                        <span className="text-white text-sm">{nickname}님 반갑습니다.</span>
                        <button
                            onClick={() => logoutMutation.mutate()}
                            disabled={logoutMutation.isPending}
                            className="text-white border border-neutral-600 rounded px-4 py-1.5 text-sm hover:bg-neutral-700 disabled:opacity-50 transition"
                        >
                            로그아웃
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/login" className="text-white border border-neutral-600 rounded px-4 py-1.5 text-sm hover:bg-neutral-700 transition">
                            로그인
                        </Link>
                        <Link to="/signup" className="text-white bg-pink-500 rounded px-4 py-1.5 text-sm hover:bg-pink-600 transition">
                            회원가입
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;