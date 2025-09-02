import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice.jsx';
import productReducer from './slices/productSlice.jsx';
import cartReducer from './slices/cartSlice.jsx';
import orderReducer from './slices/orderSlice.jsx';
import uiReducer from './slices/uiSlice.jsx';
import wishlistReducer from './slices/wishlistSlice.jsx';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productReducer,
    cart: cartReducer,
    orders: orderReducer,
    ui: uiReducer,
    wishlist: wishlistReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
}); 