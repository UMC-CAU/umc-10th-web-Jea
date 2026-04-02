/* import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import Navbar from './GogumaMission/components/navbar';
import HomePage from './GogumaMission/pages/home';
import PostDetailPage from './GogumaMission/pages/post-detail';
import NotFound from './GogumaMission/pages/not-found';

const Layout = () => (
  <>
    <Navbar />
    <Outlet />
  </>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'posts/:id', element: <PostDetailPage /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
  */

import MoviePage from "./pages/MoviePage";
import Navbar from "./components/navbar";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";
import HomePage from "./pages/Home";
import NotFound from "./pages/NotFound";

const Layout = () => (
  <>
    <Navbar />
    <Outlet />
  </>
);

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "/movies", element: <MoviePage /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}