// src/components/Navbar.tsx
import { Link, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/', label: '홈' },
  { path: '/movies', label: '인기 영화' },
  { path: '/playing', label: '상영 중' },
  { path: '/rated', label: '평점 높은' },
  { path: '/expect', label: '개봉 예정' },
];

const Navbar = () => {
  const { pathname } = useLocation();

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '0 24px',
      height: '52px',
      background: '#0a0a14',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <span style={{
        fontSize: '16px',
        fontWeight: 800,
        color: '#fff',
        marginRight: '16px',
        letterSpacing: '-0.5px',
      }}>
        JEA<span style={{ color: '#e74c3c' }}>MOVIE</span>
      </span>

      {NAV_ITEMS.map(({ path, label }) => {
        const isActive = pathname === path;
        return (
          <Link
            key={path}
            to={path}
            style={{
              padding: '0 14px',
              height: '52px',
              display: 'flex',
              alignItems: 'center',
              fontSize: '14px',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? '#fff' : 'rgba(255,255,255,0.45)',
              textDecoration: 'none',
              borderBottom: isActive ? '2px solid #e74c3c' : '2px solid transparent',
              transition: 'color 0.15s',
            }}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
};

export default Navbar;