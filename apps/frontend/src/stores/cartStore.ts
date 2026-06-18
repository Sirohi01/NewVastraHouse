import { create } from "zustand";
import type { Cart } from "@/lib/commerce";

type CartStore = {
  itemCount: number;
  setCart: (cart: Cart) => void;
};

export const useCartStore = create<CartStore>((set) => ({
  itemCount: 0,
  setCart: (cart) =>
    set({
      itemCount: cart.items.reduce((total, item) => total + item.quantity, 0),
    }),
}));
