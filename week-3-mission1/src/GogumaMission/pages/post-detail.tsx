import { useParams, Link } from 'react-router-dom';
import { posts } from '../data/posts';

const PostDetailPage = () => {
  const { id } = useParams();  // URL에서 :id 읽기
  const post = posts.find((p) => p.id === Number(id));

  if (!post) return <div style={{ padding: '24px' }}>글을 찾을 수 없어요. <Link to="/">돌아가기</Link></div>;

  return (
    <div style={{ padding: '24px', maxWidth: '640px' }}>
      <Link to="/">← 목록으로</Link>
      <h1 style={{ marginTop: '16px' }}>{post.title}</h1>
      <p style={{ color: '#666' }}>{post.author} · {post.date}</p>
      <p style={{ lineHeight: 1.7, marginTop: '24px' }}>{post.content}</p>
    </div>
  );
};

export default PostDetailPage;