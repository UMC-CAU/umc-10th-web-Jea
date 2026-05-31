import { create } from 'zustand';
import type { CartItems } from '../types/cart';
import cartItems from '../constants/cartItems';

interface CartStore {
    cartItems: CartItems;
    amount: number;
    total: number;
    isModalOpen: boolean;
    increase: (id: string) => void;
    decrease: (id: string) => void;
    removeItem: (id: string) => void;
    clearCart: () => void;
    calculateTotal: () => void;
    openModal: () => void;
    closeModal: () => void;
}

const useCartStore = create<CartStore>((set) => ({
    cartItems: cartItems,
    amount: 0,
    total: 0,
    isModalOpen: false,

    increase: (id) => set((state) => ({
        cartItems: state.cartItems.map((item) =>
            item.id === id ? { ...item, amount: item.amount + 1 } : item
        ),
    })),

    decrease: (id) => set((state) => ({
        cartItems: state.cartItems.map((item) =>
            item.id === id ? { ...item, amount: item.amount - 1 } : item
        ),
    })),

    removeItem: (id) => set((state) => ({
        cartItems: state.cartItems.filter((item) => item.id !== id),
    })),

    clearCart: () => set({ cartItems: [] }),

    calculateTotal: () => set((state) => {
        let amount = 0;
        let total = 0;
        state.cartItems.forEach((item) => {
            amount += item.amount;
            total += item.amount * item.price;
        });
        return { amount, total };
    }),

    openModal: () => set({ isModalOpen: true }),
    closeModal: () => set({ isModalOpen: false }),
}));

export default useCartStore;