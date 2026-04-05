import api from '@/lib/axios';

const CART_UPDATED_EVENT = 'cart:updated';
const dispatchCartUpdated = () => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
};

export type CartItem = {
  id: number;
  cartId: string;
  variantId: string;
  quantity: number;
  variant: {
    id: string;
    name: string;
    price: number;
    product: {
      id: string;
      name: string;
      images?: { id: number; url: string; order: number }[];
    };
  };
};

export type Cart = {
  id: string;
  userId: string;
  items: CartItem[];
};

export const cartService = {
  eventName: CART_UPDATED_EVENT,
  getCart() {
    return api.get<Cart>('/cart').then((r) => r.data);
  },
  addItem(variantId: string, quantity: number) {
    return api.post<Cart>('/cart/items', { variantId, quantity }).then((r) => {
      dispatchCartUpdated();
      return r.data;
    });
  },
  updateItem(itemId: number, quantity: number) {
    return api.patch<Cart>('/cart/items/' + itemId, { quantity }).then((r) => {
      dispatchCartUpdated();
      return r.data;
    });
  },
  removeItem(itemId: number) {
    return api.delete<Cart>('/cart/items/' + itemId).then((r) => {
      dispatchCartUpdated();
      return r.data;
    });
  },
};
