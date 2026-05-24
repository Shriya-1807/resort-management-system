import React from 'react'
import { createContext, useContext, useState } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState([])
  const [bookingCtx, setBookingCtx] = useState(null)

  const addItem = (item) => {
    setItems(prev => {
      const existing = prev.find(i => i.item_id === item.item_id)
      if (existing) {
        return prev.map(i => i.item_id === item.item_id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  const removeItem = (item_id) => setItems(prev => prev.filter(i => i.item_id !== item_id))

  const updateQty = (item_id, qty) => {
    if (qty < 1) {
      removeItem(item_id)
      return
    }
    setItems(prev => prev.map(i => i.item_id === item_id ? { ...i, quantity: qty } : i))
  }

  const clearCart = () => setItems([])
  const total = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)
  const count = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, total, count, bookingCtx, setBookingCtx }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
