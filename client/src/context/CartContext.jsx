import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [savedItems, setSavedItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem("tregu_saved") || "[]"); } catch { return []; }
  });

  // Checkout only ever records a single shop_id per order (cartItems[0]'s
  // shop), so a cart silently mixing products from two shops meant the
  // second shop never saw the order in its dashboard at all -- not an RLS
  // issue, just data that was never attributable to more than one seller.
  // Keep the cart single-shop: adding a product from a different shop than
  // what's already in the cart asks to clear it first, same pattern most
  // single-vendor-cart marketplaces use.
  const addToCart = (product, selectedSize = null, selectedColor = null) => {
    const conflictsWithOtherShop = cartItems.length > 0 && product.shop_id &&
      cartItems.some(i => i.shop_id && i.shop_id !== product.shop_id);
    if (conflictsWithOtherShop) {
      const confirmed = window.confirm(
        "Shporta juaj ka produkte nga nje dyqan tjeter. Ta zbrazim shporten dhe te shtojme kete produkt?"
      );
      if (!confirmed) return false;
      setCartItems([{ ...product, qty: 1, selectedSize }]);
      return true;
    }
    setCartItems(prev => {
      const existing = prev.find(i => i.id === product.id && i.selectedSize === selectedSize);
      if (existing) {
        return prev.map(i => i.id === product.id && i.selectedSize === selectedSize
          ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...product, qty: 1, selectedSize }];
    });
    return true;
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
