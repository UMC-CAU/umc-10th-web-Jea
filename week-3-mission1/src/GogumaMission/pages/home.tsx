import { Link } from 'react-router-dom';
import { posts } from '../data/posts';

const HomePage = () => {
  return (
    <div style={{ padding: '24px' }}>
      <h1>글 목록</h1>
      {posts.map((post) => (
        <div key={post.id} style={{ borderBottom: '1px solid #eee', padding: '16px 0' }}>
          <h2>
            <Link to={`/posts/${post.id}`}>{post.title}</Link>
          </h2>
          <p style={{ color: '#666' }}>{post.author} · {post.date}</p>
        </div>
      ))}
    </div>
  );
};

export default HomePage;