'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { PlusCircle, Image as ImageIcon } from 'lucide-react';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('fresh');
  const [price, setPrice] = useState('');
  const [images, setImages] = useState<FileList | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      // For now fetching all, but in real scenario would filter by this vendor's ID
      const res = await axios.get('http://localhost:4000/api/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(res.data.products);
    } catch (error) {
      console.error('Failed to fetch products', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('price', price);

    if (images) {
      for (let i = 0; i < images.length; i++) {
        formData.append('images', images[i]);
      }
    }

    try {
      await axios.post('http://localhost:4000/api/products', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setShowAddForm(false);
      fetchProducts();
    } catch (error) {
      console.error('Failed to add product', error);
      alert('Failed to add product');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">My Products</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <PlusCircle size={20} />
          {showAddForm ? 'Cancel' : 'Add Product'}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Add New Product</h3>
          <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Product Name</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full rounded border-gray-300 shadow-sm p-2 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Price (₹)</label>
              <input type="number" required value={price} onChange={e => setPrice(e.target.value)} className="mt-1 block w-full rounded border-gray-300 shadow-sm p-2 border" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="mt-1 block w-full rounded border-gray-300 shadow-sm p-2 border">
                <option value="fresh">Fresh</option>
                <option value="dry">Dry</option>
                <option value="pickles">Pickles</option>
                <option value="ready-to-cook">Ready to Cook</option>
                <option value="combos">Combos</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Images</label>
              <input type="file" multiple accept="image/*" onChange={e => setImages(e.target.files)} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea required value={description} onChange={e => setDescription(e.target.value)} rows={3} className="mt-1 block w-full rounded border-gray-300 shadow-sm p-2 border" />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">Save Product</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={4} className="text-center py-4 text-gray-500">Loading...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-4 text-gray-500">No products found.</td></tr>
            ) : (
              products.map((product: any) => (
                <tr key={product._id}>
                  <td className="px-6 py-4 whitespace-nowrap flex items-center gap-3">
                    {product.images && product.images.length > 0 ? (
                      <img src={`http://localhost:4000${product.images[0]}`} className="h-10 w-10 rounded object-cover" alt="img" />
                    ) : (
                      <div className="h-10 w-10 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                        <ImageIcon size={20} />
                      </div>
                    )}
                    <span className="font-medium text-gray-900">{product.name}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{product.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{product.price}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {product.isAvailable ? 'Active' : 'Out of Stock'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
