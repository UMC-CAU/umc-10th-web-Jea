import './App.css'
import Navbar from './components/navbar'
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { Login } from './pages/Login'
import { SignUp } from './pages/SignUp'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import { MyPage } from './pages/MyPage'
import { AuthCallback } from './pages/AuthCallback'
import { useState } from 'react'
import { LpDetail } from './pages/LpDetail'

const Layout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return( 
        <>
            <Navbar onToggleSidebar={() => setSidebarOpen(prev => !prev)} />
            <Outlet context={{ sidebarOpen, setSidebarOpen}}/>
        </>
    )
};

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
            { path: "/auth/callback", element: <AuthCallback /> }, // ✅ 밖으로 이동
            {
                element: <ProtectedRoute />,
                children: [
                    { path: "/mypage", element: <MyPage /> },
                    { path: "/lp/:lpId", element: <LpDetail /> },
                ],
            },
        ],
    },
]);

function App() {
    return <RouterProvider router={router} />
}

export default App