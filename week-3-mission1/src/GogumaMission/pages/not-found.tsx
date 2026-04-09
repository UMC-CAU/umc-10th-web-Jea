import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div style={{ padding: '24px' }}>
      <h1>404 - 페이지를 찾을 수 없어요</h1>
      <Link to="/">홈으로 돌아가기</Link>
    </div>
  );
};

export default NotFound;