import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    
    const storagedCart = localStorage.getItem('@RocketShoes:cart');
    
    if (storagedCart) return JSON.parse(storagedCart)

    return [];
  });

  const addProduct = async (productId: number) => {
    try {

      const inCart = cart.find(product => product.id === productId);

      if (!inCart) {
        const { data: product } = await api.get(`/products/${productId}`);

        setCart([...cart, {
          ...product, 
          amount: 1
        }]);

        localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, {...product, amount: 1}]));
        return
      }
      
      updateProductAmount({ productId, amount : inCart.amount + 1 })
     
    } catch (error)  {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {

      const products = cart.filter(product => product.id !== productId && product)

      if (products.length === cart.length) {
        toast.error('Erro na remoção do produto')
        return
      }
      
      setCart([...products]);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(products));
      
    } catch (error) {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({ productId, amount,}: UpdateProductAmount) => {
    try {
      const stock = await api.get(`/stock/${productId}`)
      const { amount : amountProduct } = stock.data;

      if (amount < 1) {
        return 
      }
      if (amount > amountProduct) {
        toast.error('Quantidade solicitada fora de estoque');
        return 
      }

      const products = cart.map(product => {
        if (product.id === productId) {
          product.amount = amount
        }
        return product;
      })

      setCart([...products]);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(products));

    } catch (error) {
      toast.error('Erro na alteração de quantidade do produto');

    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
