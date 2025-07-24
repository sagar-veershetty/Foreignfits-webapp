import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { Customer, CartItem, CustomerOrder, CustomerAuthState } from '../types/customer';
import { Product } from '../types';

interface CustomerState extends CustomerAuthState {
  cart: CartItem[];
  orders: CustomerOrder[];
  wishlist: Product[];
}

type CustomerAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: Customer }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'ADD_TO_CART'; payload: CartItem }
  | { type: 'REMOVE_FROM_CART'; payload: string }
  | { type: 'UPDATE_CART_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'ADD_TO_WISHLIST'; payload: Product }
  | { type: 'REMOVE_FROM_WISHLIST'; payload: string }
  | { type: 'PLACE_ORDER'; payload: CustomerOrder };

const initialState: CustomerState = {
  customer: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  cart: [],
  orders: [],
  wishlist: [],
};

const CustomerContext = createContext<{
  state: CustomerState;
  dispatch: React.Dispatch<CustomerAction>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  placeOrder: (order: Omit<CustomerOrder, 'id' | 'orderDate'>) => void;
} | null>(null);

function customerReducer(state: CustomerState, action: CustomerAction): CustomerState {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        customer: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        customer: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        customer: null,
        isAuthenticated: false,
        cart: [],
        wishlist: [],
        error: null,
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'ADD_TO_CART':
      const existingItem = state.cart.find(item => item.productId === action.payload.productId);
      if (existingItem) {
        return {
          ...state,
          cart: state.cart.map(item =>
            item.productId === action.payload.productId
              ? { ...item, quantity: item.quantity + action.payload.quantity, total: (item.quantity + action.payload.quantity) * item.price }
              : item
          ),
        };
      }
      return { ...state, cart: [...state.cart, action.payload] };
    case 'REMOVE_FROM_CART':
      return {
        ...state,
        cart: state.cart.filter(item => item.productId !== action.payload),
      };
    case 'UPDATE_CART_QUANTITY':
      return {
        ...state,
        cart: state.cart.map(item =>
          item.productId === action.payload.productId
            ? { ...item, quantity: action.payload.quantity, total: action.payload.quantity * item.price }
            : item
        ),
      };
    case 'CLEAR_CART':
      return { ...state, cart: [] };
    case 'ADD_TO_WISHLIST':
      if (!state.wishlist.find(item => item.id === action.payload.id)) {
        return { ...state, wishlist: [...state.wishlist, action.payload] };
      }
      return state;
    case 'REMOVE_FROM_WISHLIST':
      return {
        ...state,
        wishlist: state.wishlist.filter(item => item.id !== action.payload),
      };
    case 'PLACE_ORDER':
      return {
        ...state,
        orders: [action.payload, ...state.orders],
        cart: [],
      };
    default:
      return state;
  }
}

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(customerReducer, initialState);

  // Load customer data from localStorage
  useEffect(() => {
    const savedCustomer = localStorage.getItem('foreignfits_customer');
    const savedCart = localStorage.getItem('foreignfits_cart');
    const savedWishlist = localStorage.getItem('foreignfits_wishlist');

    if (savedCustomer) {
      try {
        const customer = JSON.parse(savedCustomer);
        dispatch({ type: 'LOGIN_SUCCESS', payload: customer });
      } catch (error) {
        localStorage.removeItem('foreignfits_customer');
      }
    }

    if (savedCart) {
      try {
        const cart = JSON.parse(savedCart);
        cart.forEach((item: CartItem) => {
          dispatch({ type: 'ADD_TO_CART', payload: item });
        });
      } catch (error) {
        localStorage.removeItem('foreignfits_cart');
      }
    }

    if (savedWishlist) {
      try {
        const wishlist = JSON.parse(savedWishlist);
        wishlist.forEach((product: Product) => {
          dispatch({ type: 'ADD_TO_WISHLIST', payload: product });
        });
      } catch (error) {
        localStorage.removeItem('foreignfits_wishlist');
      }
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('foreignfits_cart', JSON.stringify(state.cart));
  }, [state.cart]);

  // Save wishlist to localStorage
  useEffect(() => {
    localStorage.setItem('foreignfits_wishlist', JSON.stringify(state.wishlist));
  }, [state.wishlist]);

  const login = async (email: string, password: string): Promise<void> => {
    dispatch({ type: 'LOGIN_START' });

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock customer login - in real app, this would be an API call
    if (email === 'customer@example.com' && password === 'customer123') {
      const customer: Customer = {
        id: 'cust-001',
        name: 'John Customer',
        email: 'customer@example.com',
        phone: '+1 (555) 123-4567',
        address: {
          street: '123 Main St',
          city: 'Fashion City',
          state: 'CA',
          zipCode: '90210',
          country: 'USA',
        },
        createdAt: new Date('2024-01-01'),
        lastLogin: new Date(),
      };

      localStorage.setItem('foreignfits_customer', JSON.stringify(customer));
      dispatch({ type: 'LOGIN_SUCCESS', payload: customer });
    } else {
      dispatch({ type: 'LOGIN_FAILURE', payload: 'Invalid email or password' });
    }
  };

  const logout = () => {
    localStorage.removeItem('foreignfits_customer');
    localStorage.removeItem('foreignfits_cart');
    localStorage.removeItem('foreignfits_wishlist');
    dispatch({ type: 'LOGOUT' });
  };

  const addToCart = (product: Product, quantity: number) => {
    const cartItem: CartItem = {
      productId: product.id,
      product,
      quantity,
      price: product.price,
      total: product.price * quantity,
    };
    dispatch({ type: 'ADD_TO_CART', payload: cartItem });
  };

  const removeFromCart = (productId: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: productId });
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      dispatch({ type: 'UPDATE_CART_QUANTITY', payload: { productId, quantity } });
    }
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const addToWishlist = (product: Product) => {
    dispatch({ type: 'ADD_TO_WISHLIST', payload: product });
  };

  const removeFromWishlist = (productId: string) => {
    dispatch({ type: 'REMOVE_FROM_WISHLIST', payload: productId });
  };

  const placeOrder = (orderData: Omit<CustomerOrder, 'id' | 'orderDate'>) => {
    const order: CustomerOrder = {
      ...orderData,
      id: Math.random().toString(36).substr(2, 9),
      orderDate: new Date(),
    };
    dispatch({ type: 'PLACE_ORDER', payload: order });
  };

  return (
    <CustomerContext.Provider value={{
      state,
      dispatch,
      login,
      logout,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart,
      addToWishlist,
      removeFromWishlist,
      placeOrder,
    }}>
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer() {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }
  return context;
}