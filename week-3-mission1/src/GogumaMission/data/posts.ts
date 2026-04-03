import type { Post } from '../types/post';

export const posts: Post[] = [
  { id: 1, title: '리액트 라우터 시작하기', content: 'React Router는 SPA를 만들 때 핵심 라이브러리입니다. createBrowserRouter를 사용하면 선언적으로 라우트를 구성할 수 있어요.', author: '제아', date: '2026-03-28' },
  { id: 2, title: 'useParams 완벽 이해', content: 'useParams 훅을 사용하면 URL의 동적 파라미터를 쉽게 읽을 수 있습니다. /posts/:id 경로에서 id 값을 가져오는 방법을 알아봐요.', author: '제아', date: '2026-03-29' },
  { id: 3, title: 'SPA vs MPA 차이점', content: 'Single Page Application은 페이지 전환 시 HTML 전체를 새로 받아오지 않습니다. 빠른 UX가 장점이지만 초기 로딩과 SEO에 주의가 필요해요.', author: '제아', date: '2026-03-30' },
];