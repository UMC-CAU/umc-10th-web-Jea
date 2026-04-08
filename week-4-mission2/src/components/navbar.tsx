import { Link } from 'react-router-dom';

const Navbar = () => {

  return (
    <nav className="bg-neutral-900 flex items-center justify-between px-6 h-14">
      {/* 로고 */}
      <Link to="/" className="text-pink-500 font-bold text-lg">
        돌려돌려LP판
      </Link>

      {/* 우측 버튼 */}
      <div className="flex gap-2">
        <Link
          to="/login"
          className="text-white border border-neutral-600 rounded px-4 py-1.5 text-sm hover:bg-neutral-700 transition"
        >
          로그인
        </Link>
        <Link
          to="/signup"
          className="text-white bg-pink-500 rounded px-4 py-1.5 text-sm hover:bg-pink-600 transition"
        >
          회원가입
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;