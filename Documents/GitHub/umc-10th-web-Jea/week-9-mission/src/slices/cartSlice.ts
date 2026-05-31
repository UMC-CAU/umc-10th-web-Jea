import type { CartItems } from '../types/cart';
import cartItems from '../constants/cartItems';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface CartState {
    cartItems: CartItems;
    amount: number;
    total: number;
}

const initialState: CartState = {
    cartItems: cartItems,
    amount: 0,
    total: 0,
};

const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        // TODO: 수량 증가, 감소, 아이템 제거
        // TODO: clearCart 장바구니 비우기
        // TODO: 총액 게산
        increase: (state, action: PayloadAction<{ id: string }>) => {
            const itemId = action.payload.id;
            const item = state.cartItems.find((cartItem) => cartItem.id === itemId);
            if (item) {
                item.amount += 1;
            }
        },

        decrease: (state, action: PayloadAction<{ id: string }>) => {
            const itemId = action.payload.id;
            const item = state.cartItems.find((cartItem) => cartItem.id === itemId);
            if (item) {
                item.amount -= 1;
            }
        },

        removeItem: (state, action: PayloadAction<{ id: string }>) => {
            const itemId = action.payload.id;
            state.cartItems = state.cartItems.filter((cartItem) => cartItem.id !== itemId);
        },

        clearCart: (state) => {
            state.cartItems = [];
        },

        calculateTotal: (state) => {
            let amount = 0;
            let total = 0;

            state.cartItems.forEach((item) => {
                amount += item.amount;
                total += item.amount * item.price;
            });

            state.amount = amount;
            state.total = total;
        }
    },
});
export const { increase, decrease, removeItem, clearCart, calculateTotal } = cartSlice.actions;

const cartReducer = cartSlice.reducer;

export default cartReducer;