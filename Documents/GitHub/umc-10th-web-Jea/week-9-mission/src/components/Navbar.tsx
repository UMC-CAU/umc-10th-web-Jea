import { FaShoppingCart } from "react-icons/fa";
import { useEffect } from 'react';
import useCartStore from '../store/useCartStore';

const Navbar = () => {
    const { amount, cartItems, calculateTotal } = useCartStore();

    useEffect(() => {
        calculateTotal();
    }, [cartItems]);

    return (
        <div className="flex justify-between items-center p-4 bg-gray-800 text-white">
            <h1
                onClick={() => { window.location.href = '/'; }}
                className='text-2xl font-semibold cursor-pointer'
            >
                jea nice
            </h1>
            <div className='flex items-center space-x-2'>
                <FaShoppingCart className='text-2xl' />
                <span className='text-xl font-medium'>{amount}</span>
            </div>
        </div>
    );
};

export default Navbar;