import React, { createContext, useContext, useState } from 'react'

interface CartContextType {
  cartCount: number
  setCartCount: (n: number) => void
  refreshCart: () => void
  cartRefreshKey: number
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartCount, setCartCount] = useState(0)
  const [cartRefreshKey, setCartRefreshKey] = useState(0)

  const refreshCart = () => setCartRefreshKey((k) => k + 1)

  return (
    <CartContext.Provider value={{ cartCount, setCartCount, refreshCart, cartRefreshKey }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCartContext() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCartContext must be used inside CartProvider')
  return ctx
}
