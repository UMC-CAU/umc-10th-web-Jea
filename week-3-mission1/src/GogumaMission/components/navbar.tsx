import { Link } from 'react-router-dom'

const Navbar = () => {
    return (
        <nav style={{
            padding: '12px 24px',
            borderBottom: '1px solid #eee',
            display: 'flex',
            gap: '16px',
        }}>
            <Link to="/" style={{
                fontWeight: 'bold',
                textDecoration: 'none',
            }}>
                미니 블로그
            </Link>
        </nav>
    )
}

export default Navbar;