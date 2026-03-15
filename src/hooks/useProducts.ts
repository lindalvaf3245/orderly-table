import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/restaurant';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching products:', error);
      return;
    }

    setProducts(
      (data || []).map((p) => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        forKitchen: p.for_kitchen,
        createdAt: p.created_at,
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts();

    const channel = supabase
      .channel('products-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchProducts();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchProducts]);

  const addProduct = useCallback(async (name: string, price: number, forKitchen: boolean = false) => {
    const { data, error } = await supabase
      .from('products')
      .insert({ name: name.trim(), price, for_kitchen: forKitchen })
      .select()
      .single();

    if (error) { console.error('Error adding product:', error); return null; }

    const newProduct: Product = {
      id: data.id,
      name: data.name,
      price: Number(data.price),
      forKitchen: data.for_kitchen,
      createdAt: data.created_at,
    };
    setProducts((prev) => [...prev, newProduct]);
    return newProduct;
  }, []);

  const updateProduct = useCallback(async (id: string, name: string, price: number, forKitchen: boolean = false) => {
    const { error } = await supabase
      .from('products')
      .update({ name: name.trim(), price, for_kitchen: forKitchen })
      .eq('id', id);

    if (error) { console.error('Error updating product:', error); return; }
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, name: name.trim(), price, forKitchen } : p)));
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) { console.error('Error deleting product:', error); return; }
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const getProduct = useCallback((id: string) => {
    return products.find((p) => p.id === id);
  }, [products]);

  return { products, loading, addProduct, updateProduct, deleteProduct, getProduct };
}
