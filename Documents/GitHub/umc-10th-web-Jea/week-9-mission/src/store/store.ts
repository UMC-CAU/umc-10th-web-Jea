// 1. 저장소 생성
import { configureStore } from '@reduxjs/toolkit';
import cartReducer from '../slices/cartSlice';

function createStore() {
    const store = configureStore({
        reducer: {
            cart: cartReducer,
        },
    });

    return store;
}

// store 활용할수 있도록 내보내기
const store = createStore();
export default store;

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;