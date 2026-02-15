import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { Product } from '@/types/restaurant';

const STORAGE_KEY = 'restaurant_products';

// Default products for demo
const defaultProducts: Product[] = [
  { id: '1', name: 'Água Mineral', price: 5.00, forKitchen: false, createdAt: new Date().toISOString() },
  { id: '2', name: 'Refrigerante Lata', price: 7.00, forKitchen: false, createdAt: new Date().toISOString() },
  { id: '3', name: 'Cerveja Long Neck', price: 12.00, forKitchen: false, createdAt: new Date().toISOString() },
  { id: '4', name: 'Porção de Batata Frita', price: 35.00, forKitchen: true, createdAt: new Date().toISOString() },
  { id: '5', name: 'Hambúrguer Artesanal', price: 42.00, forKitchen: true, createdAt: new Date().toISOString() },
];

export function useProducts() {
  const [products, setProducts] = useLocalStorage<Product[]>(STORAGE_KEY, defaultProducts);

  const addProduct = useCallback((name: string, price: number, forKitchen: boolean = false) => {
    const newProduct: Product = {
      id: crypto.randomUUID(),
      name: name.trim(),
      price,
      forKitchen,
      createdAt: new Date().toISOString(),
    };
    setProducts((prev) => [...prev, newProduct]);
    return newProduct;
  }, [setProducts]);

  const updateProduct = useCallback((id: string, name: string, price: number, forKitchen: boolean = false) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name: name.trim(), price, forKitchen } : p))
    );
  }, [setProducts]);

  const deleteProduct = useCallback((id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }, [setProducts]);

  const getProduct = useCallback((id: string) => {
    return products.find((p) => p.id === id);
  }, [products]);

  return {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    getProduct,
  };
}
