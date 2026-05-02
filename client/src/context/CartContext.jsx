import { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [savedItems, setSavedItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem("tregu_saved") || "[]"); } catch { return []; }
  });

  const addToCart = (product, selectedSize = null) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.id === product.id && i.selectedSize === selectedSize);
      if (existing) {
        return prev.map(i => i.id === product.id && i.selectedSize === selectedSize
          ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...product, qty: 1, selectedSize }];
    });
  };

  const removeFromCart = (productId, selectedSize) => {
    setCartItems(prev => prev.filter(i => !(i.id === productId && i.selectedSize === selectedSize)));
  };

  const updateQty = (productId, selectedSize, qty) => {
    if (qty < 1) { removeFromCart(productId, selectedSize); return; }
    setCartItems(prev => prev.map(i =>
      i.id === productId && i.selectedSize === selectedSize ? { ...i, qty } : i
    ));
  };

  useEffect(() => {
    localStorage.setItem("tregu_saved", JSON.stringify(savedItems));
  }, [savedItems]);

  useEffect(() => {
    localStorage.setItem("tregu_saved", JSON.stringify(savedItems));
  }, [savedItems]);

  const toggleSaved = (product) => {
    setSavedItems(prev =>
      prev.find(i => i.id === product.id)
        ? prev.filter(i => i.id !== product.id)
        : [...prev, product]
    );
  };

  const isSaved = (id) => savedItems.some(i => i.id === id);

  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <CartContext.Provider value={{
      cartItems, savedItems, addToCart, removeFromCart, updateQty,
      toggleSaved, isSaved, cartCount, cartTotal
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
