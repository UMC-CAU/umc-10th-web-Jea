import MoviePage from "./pages/MoviePage";
import Navbar from "./components/navbar";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";
import HomePage from "./pages/Home";
import NotFound from "./pages/NotFound";
import MovieDetailPage from "./pages/MovieDetailPage";

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
      { path: "/movies/:movieId", element: <MovieDetailPage />}
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}