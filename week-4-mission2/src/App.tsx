import './App.css'
import Navbar from './components/navbar'
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { Login } from './pages/Login'
import { SignUp } from './pages/Signup'

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
        children: [
            { index: true, element: <HomePage /> },
            { path: "/login", element: <Login /> },
            { path: "/signup", element: <SignUp /> },
        ],
    },
]);

function App() {
    return(
        <>
        <RouterProvider router={router} />
        </>
    )
}

export default App
