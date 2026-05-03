import './App.css'
import Navbar from './components/navbar'
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { Login } from './pages/Login'
import { SignUp } from './pages/SignUp'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import { MyPage } from './pages/MyPage'

const Layout = () => (
    <>
        <Navbar />
        <Outlet />
    </>
);

const router = createBrowserRouter([
    {
        path: "/",
        element: (
            <AuthProvider>  {/* ✅ Router 안에서 AuthProvider 감싸기 */}
                <Layout />
            </AuthProvider>
        ),
        children: [
            { index: true, element: <HomePage /> },
            { path: "/login", element: <Login /> },
            { path: "/signup", element: <SignUp /> },
            {
                element: <ProtectedRoute />,
                children: [
                    { path: "/mypage", element: <MyPage /> },
                ],
            },
        ],
    },
]);

function App() {
    return <RouterProvider router={router} />
}

export default App