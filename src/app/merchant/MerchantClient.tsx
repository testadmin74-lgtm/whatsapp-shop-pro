"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, Copy, Check, Image as ImageIcon, X, Package, Settings, Home, Eye, ShoppingBag, Receipt, Power, Star, Tag, BarChart3, ImagePlus, Megaphone } from "lucide-react";
import { addProduct, editProduct, deleteProduct, updateMerchantSettings, toggleStoreStatus, toggleFeatured, updateOrderStatus, addPromoCode, deletePromoCode, updateStoreBanner, addProductVariant, deleteProductVariant } from "@/lib/actions";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type VariantType = {
  id: string;
  name: string;
  price: number;
};

type ProductType = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string;
  category: string;
  isFeatured: boolean;
  variants?: VariantType[];
};

type PromoType = {
  id: string;
  code: string;
  discountPercent: number;
};

type OrderItem = {
  id: string;
  productName: string;
  quantity: number;
  price: number;
}

type OrderType = {
  id: string;
  customerName: string;
  customerAddress: string;
  totalAmount: number;
  status: string;
  createdAt: Date;
  items: OrderItem[];
};

type MerchantType = {
  id: string;
  name: string;
  slug: string;
  phone: string;
  theme: string;
  layout: string;
  isOpen: boolean;
  subscriptionTier: string;
  coverImageUrl?: string | null;
  welcomeMessage?: string | null;
  products: ProductType[];
  orders?: OrderType[];
  promos?: PromoType[];
};

export default function MerchantClient({ merchant, globalAnnouncement }: { merchant: MerchantType | null, globalAnnouncement: string }) {
  const [activeTab, setActiveTab] = useState("home");
  const [products, setProducts] = useState(merchant?.products || []);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductType | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  if (merchant && merchant.products !== products && !loading) {
      setProducts(merchant.products);
  }

  if (!merchant) {
    return <div className="p-8 text-center text-slate-500">No merchants found. Please create one in Admin Panel first.</div>;
  }

  const isFreeTier = merchant.subscriptionTier === "Free";
  const isLimitReached = isFreeTier && products.length >= 10;

  const orders = merchant.orders || [];
  const promos = merchant.promos || [];
  const totalRevenue = orders.filter(o => o.status === "Completed").reduce((sum, o) => sum + o.totalAmount, 0);

  // Generate basic chart data (last 7 orders by revenue, simplified for MVP)
  const chartData = orders.filter(o => o.status === "Completed").slice(0, 7).map((o, i) => ({
    name: `Order ${orders.length - i}`,
    Revenue: o.totalAmount
  })).reverse();

  const storeLink = `localhost:3000/${merchant.slug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(storeLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setImagePreview(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product: ProductType) => {
    setEditingProduct(product);
    setImagePreview(product.imageUrl);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    if (editingProduct) {
      const res = await editProduct(editingProduct.id, formData);
      if (res?.error) alert(res.error);
    } else {
      const res = await addProduct(merchant.id, formData);
      if (res?.error) alert(res.error);
    }
    
    setIsModalOpen(false);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if(confirm("Delete this product?")) {
      setLoading(true);
      setProducts(products.filter(p => p.id !== id));
      await deleteProduct(id);
      setLoading(false);
    }
  };

  const handleSettingsUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await updateMerchantSettings(merchant.id, formData);
    if (res?.error) alert(res.error);
    else alert("Settings updated successfully!");
    setLoading(false);
  };
  
  const handleBannerUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await updateStoreBanner(merchant.id, formData);
    if (res && res.error) alert(res.error);
    else alert("Banner updated successfully!");
    setLoading(false);
  };

  const handleToggleStoreStatus = async () => {
    setLoading(true);
    await toggleStoreStatus(merchant.id, merchant.isOpen);
    setLoading(false);
  };

  const handleToggleFeatured = async (id: string, current: boolean) => {
    setLoading(true);
    await toggleFeatured(id, current);
    setLoading(false);
  };

  const handleStatusChange = async (orderId: string, status: string) => {
    setLoading(true);
    await updateOrderStatus(orderId, status);
    setLoading(false);
  };

  const handleAddPromo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await addPromoCode(merchant.id, formData);
    if (res?.error) alert(res.error);
    e.currentTarget.reset();
    setLoading(false);
  };

  const handleAddVariant = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingProduct) return;
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await addProductVariant(editingProduct.id, formData);
    if (res?.error) alert(res.error);
    e.currentTarget.reset();
    setLoading(false);
  };

  // --- VIEWS ---

  const renderHomeView = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 space-y-6 pb-28">
      {globalAnnouncement && (
        <div className="bg-indigo-600 text-white p-4 rounded-2xl shadow-lg flex items-start space-x-3">
          <Megaphone className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-sm font-medium">{globalAnnouncement}</div>
        </div>
      )}

      <div>
        <h2 className="font-black text-slate-900 text-lg mb-3">Dashboard</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center mb-3">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div className="text-3xl font-black text-slate-900">{products.length}</div>
            <div className="text-slate-500 text-sm font-bold">Total Products</div>
          </div>
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
            <div className="w-10 h-10 bg-green-50 text-green-500 rounded-xl flex items-center justify-center mb-3">
              <Receipt className="w-5 h-5" />
            </div>
            <div className="text-3xl font-black text-slate-900">{orders.length}</div>
            <div className="text-slate-500 text-sm font-bold">Total Orders</div>
          </div>
          <div className="col-span-2 bg-gradient-to-r from-slate-900 to-indigo-900 text-white p-6 rounded-3xl shadow-lg">
            <div className="text-indigo-200 text-sm font-bold mb-1">Total Revenue (Completed)</div>
            <div className="text-4xl font-black">Rs. {totalRevenue.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Analytics Chart */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
        <h3 className="font-bold text-slate-900 text-lg mb-4 flex items-center"><BarChart3 className="w-5 h-5 mr-2 text-indigo-500" /> Revenue Analytics</h3>
        <div className="h-48 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="Revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm font-medium">No completed orders yet.</div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-col items-center text-center">
        <div className="w-32 h-32 bg-slate-100 rounded-2xl flex items-center justify-center mb-4 overflow-hidden border-2 border-indigo-100 p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=http://${storeLink}`} alt="Store QR Code" className="w-full h-full object-contain" />
        </div>
        <h3 className="font-bold text-slate-900 text-lg mb-2">Your Store QR Code</h3>
        <p className="text-sm text-slate-500 mb-4">Print this and paste it on your counter.</p>
        
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-1.5 flex items-center w-full">
          <div className="px-3 text-sm font-medium text-slate-600 truncate flex-1 text-left">
            {storeLink}
          </div>
          <button 
            onClick={handleCopyLink}
            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center space-x-1.5 transition-colors ${
              copied ? 'bg-green-100 text-green-700' : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );

  const renderProductsView = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 space-y-6 pb-28">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-black text-slate-900 text-lg">My Products</h2>
        <span className="bg-slate-200 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-full">{products.length} Items</span>
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {products.map((product) => (
            <motion.div 
              key={product.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, height: 0, marginBottom: 0 }}
              className={`bg-white p-3 rounded-2xl shadow-sm border ${product.isFeatured ? 'border-yellow-400 bg-yellow-50/30' : 'border-slate-100'} flex items-center space-x-4`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={product.imageUrl} alt={product.name} className="w-20 h-20 rounded-xl object-cover" />
              <div className="flex-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 flex items-center">
                  {product.category}
                  {product.isFeatured && <span className="ml-2 text-yellow-600 flex items-center"><Star className="w-3 h-3 fill-yellow-400 mr-0.5" /> Featured</span>}
                </div>
                <h3 className="font-bold text-slate-900 leading-tight mb-1">{product.name}</h3>
                <div className="font-black text-indigo-600 text-sm flex items-center">
                  Rs. {product.price}
                  {product.variants && product.variants.length > 0 && (
                    <span className="ml-2 text-xs font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">+{product.variants.length} Variants</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col space-y-2">
                <button 
                  onClick={() => handleToggleFeatured(product.id, product.isFeatured)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${product.isFeatured ? 'bg-yellow-100 text-yellow-600' : 'bg-slate-50 text-slate-400 hover:text-yellow-500 hover:bg-yellow-50'}`}
                >
                  <Star className={`w-4 h-4 ${product.isFeatured ? 'fill-yellow-500' : ''}`} />
                </button>
                <button 
                  onClick={() => openEditModal(product)}
                  className="w-8 h-8 bg-slate-50 text-slate-600 rounded-full flex items-center justify-center hover:bg-slate-100"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <button 
        onClick={() => {
          if (isLimitReached) alert("Free Tier limit reached. You can only add up to 10 products. Contact Admin to upgrade to Pro.");
          else openAddModal();
        }}
        className={`w-full mt-6 bg-white border-2 border-dashed border-indigo-200 text-indigo-600 py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 transition-colors ${isLimitReached ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-50'}`}
      >
        <Plus className="w-5 h-5" />
        <span>{isLimitReached ? "Product Limit Reached (Free Tier)" : "Add New Product"}</span>
      </button>
    </motion.div>
  );

  const renderOrdersView = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 space-y-6 pb-28">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-black text-slate-900 text-lg">Live Orders</h2>
        <span className="bg-slate-200 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-full">{orders.length} Total</span>
      </div>

      <div className="space-y-4">
        {orders.length === 0 ? (
           <div className="text-center p-8 bg-white rounded-3xl border border-slate-100">
             <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
             <p className="text-slate-500 font-medium">No orders yet.</p>
           </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
              <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                <div>
                  <div className="font-bold text-slate-900">{order.customerName}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{new Date(order.createdAt).toLocaleString()}</div>
                  <div className="text-xs font-bold text-slate-400 mt-1">ID: #{order.id.substring(0,6).toUpperCase()}</div>
                </div>
                <div className="text-right">
                  <div className="font-black text-green-600 mb-2">Rs. {order.totalAmount}</div>
                  <select 
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    className={`text-xs font-bold px-2 py-1 rounded-lg border-2 focus:outline-none ${
                      order.status === 'Pending' ? 'bg-orange-50 border-orange-200 text-orange-600' :
                      order.status === 'Preparing' ? 'bg-blue-50 border-blue-200 text-blue-600' :
                      order.status === 'Out for Delivery' ? 'bg-purple-50 border-purple-200 text-purple-600' :
                      'bg-green-50 border-green-200 text-green-600'
                    }`}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Preparing">Preparing</option>
                    <option value="Out for Delivery">Delivery</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                {order.items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-slate-600 font-medium">{item.quantity}x {item.productName}</span>
                    <span className="text-slate-400">Rs. {item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="text-xs font-medium text-slate-600 pt-3 border-t border-slate-100 bg-slate-50 -mx-5 px-5 -mb-5 pb-5 rounded-b-2xl">
                <div className="font-bold mb-1 text-slate-400 uppercase">Delivery Address</div>
                {order.customerAddress}
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );

  const renderSettingsView = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 space-y-6 pb-28">
      
      {/* Store Status Toggle */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="font-black text-slate-900 text-lg">Store Status</h2>
          <p className="text-sm text-slate-500 mt-1">{merchant.isOpen ? "Customers can place orders." : "Store is closed. Ordering is disabled."}</p>
        </div>
        <button 
          onClick={handleToggleStoreStatus}
          disabled={loading}
          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${merchant.isOpen ? 'bg-green-500' : 'bg-slate-300'}`}
        >
          <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${merchant.isOpen ? 'translate-x-7' : 'translate-x-1'}`} />
        </button>
      </div>
      
      {/* Storefront Banner Settings */}
      <form onSubmit={handleBannerUpdate} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-5">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-4">
          <ImagePlus className="w-5 h-5 text-indigo-500" />
          <h2 className="font-black text-slate-900 text-lg">Storefront Hero Banner</h2>
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Cover Image URL</label>
          <input name="coverImageUrl" defaultValue={merchant.coverImageUrl || ""} type="url" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium" placeholder="https://example.com/image.jpg" />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Welcome Message</label>
          <input name="welcomeMessage" defaultValue={merchant.welcomeMessage || ""} type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium" placeholder="Welcome to our store! Enjoy 20% off today." />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white py-3 mt-4 rounded-xl font-bold shadow-lg shadow-slate-900/30 hover:bg-slate-800 transition-colors disabled:opacity-50">
          Update Banner
        </button>
      </form>

      {/* Basic Settings */}
      <form onSubmit={handleSettingsUpdate} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-5">
        <h2 className="font-black text-slate-900 text-lg border-b border-slate-100 pb-3 mb-4">Basic Settings</h2>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Store Name</label>
          <input name="name" defaultValue={merchant.name} required type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium" />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">WhatsApp Phone Number</label>
          <input name="phone" defaultValue={merchant.phone} required type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium" />
        </div>
        
        <div className="pt-4 border-t border-slate-100">
          <label className="block text-sm font-bold text-slate-700 mb-2">Store Theme</label>
          <select name="theme" defaultValue={merchant.theme} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium">
            <option value="light">Classic Minimal (Apple Style)</option>
            <option value="dark">Midnight Dark</option>
            <option value="orange">Foodie Orange (Foodpanda Style)</option>
            <option value="green">Organic Green</option>
            <option value="blue">Ocean Blue</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Product Layout</label>
          <div className="grid grid-cols-2 gap-3">
            <label className="relative flex items-center justify-center p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
              <input type="radio" name="layout" value="grid" defaultChecked={merchant.layout === "grid"} className="absolute opacity-0" />
              <div className="font-bold text-sm text-slate-700 text-center">Grid View</div>
            </label>
            <label className="relative flex items-center justify-center p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
              <input type="radio" name="layout" value="list" defaultChecked={merchant.layout === "list"} className="absolute opacity-0" />
              <div className="font-bold text-sm text-slate-700 text-center">List View</div>
            </label>
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-3 mt-4 rounded-xl font-bold shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition-colors disabled:opacity-50">
          Save Profile & Theme
        </button>
      </form>

      {/* Promos Section */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-5 mb-10">
        <div className="flex items-center space-x-2">
          <Tag className="w-5 h-5 text-indigo-500" />
          <h2 className="font-black text-slate-900 text-lg">Promo Codes</h2>
        </div>
        
        <form onSubmit={handleAddPromo} className="flex space-x-2">
          <input name="code" required type="text" placeholder="CODE (e.g. AZADI)" className="flex-1 min-w-0 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl uppercase font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <div className="relative w-24">
            <input name="discountPercent" required type="number" min="1" max="99" placeholder="%" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <span className="absolute right-3 top-3 text-slate-400 font-bold">%</span>
          </div>
          <button type="submit" disabled={loading} className="px-4 bg-indigo-600 text-white rounded-xl font-bold shadow-sm hover:bg-indigo-700 disabled:opacity-50">
            <Plus className="w-5 h-5" />
          </button>
        </form>

        <div className="space-y-2">
          {promos.map(promo => (
            <div key={promo.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="flex items-center space-x-3">
                <span className="font-black tracking-widest text-indigo-600">{promo.code}</span>
                <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{promo.discountPercent}% OFF</span>
              </div>
              <button onClick={() => {
                setLoading(true);
                deletePromoCode(promo.id).then(() => setLoading(false));
              }} className="p-2 text-red-400 hover:bg-red-50 rounded-lg">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {promos.length === 0 && <p className="text-sm text-slate-500 text-center py-2">No active promo codes.</p>}
        </div>
      </div>
    </motion.div>
  );

  return (
    <>
      <div className="flex-1 overflow-x-hidden">
        {activeTab === "home" && renderHomeView()}
        {activeTab === "orders" && renderOrdersView()}
        {activeTab === "products" && renderProductsView()}
        {activeTab === "settings" && renderSettingsView()}
      </div>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 px-6 py-3 pb-safe z-40 max-w-md mx-auto">
        <div className="flex justify-between items-center">
          <NavButton icon={<Home />} label="Home" isActive={activeTab === "home"} onClick={() => setActiveTab("home")} />
          <NavButton icon={<Receipt />} label="Orders" isActive={activeTab === "orders"} onClick={() => setActiveTab("orders")} />
          <NavButton icon={<Package />} label="Products" isActive={activeTab === "products"} onClick={() => setActiveTab("products")} />
          <NavButton icon={<Settings />} label="Settings" isActive={activeTab === "settings"} onClick={() => setActiveTab("settings")} />
        </div>
      </div>

      {/* Add/Edit Product Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center font-sans">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm max-w-md mx-auto" />
            
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="bg-white w-full max-w-md max-h-[95vh] overflow-y-auto rounded-t-[2rem] shadow-2xl relative z-10 flex flex-col pb-safe">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md z-20">
                <h2 className="text-xl font-black text-slate-900">{editingProduct ? "Edit Product" : "Add New Product"}</h2>
                <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6">
                <form onSubmit={handleFormSubmit} className="space-y-6">
                  
                  {!editingProduct && (
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Product Photo</label>
                      <div className="w-full h-40 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-slate-500 relative overflow-hidden">
                        {imagePreview ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                        ) : (
                          <>
                            <ImageIcon className="w-6 h-6 text-indigo-500 mb-2" />
                            <span className="text-sm font-medium text-slate-600">Tap to upload</span>
                          </>
                        )}
                        <input type="file" name="image" required={!editingProduct} accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <input name="name" defaultValue={editingProduct?.name} required type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium" placeholder="Product Name" />
                    <input name="category" defaultValue={editingProduct?.category || "Uncategorized"} required type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium" placeholder="Category" />
                    <input name="description" defaultValue={editingProduct?.description || ""} type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium" placeholder="Description (Optional)" />
                    <input name="price" defaultValue={editingProduct?.price} required type="number" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium" placeholder="Base Price" />
                  </div>

                  <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-colors disabled:opacity-50">
                    {editingProduct ? "Save Changes" : "Save Product"}
                  </button>
                </form>

                {/* Variants Section (Only visible when editing an existing product) */}
                {editingProduct && (
                  <div className="mt-10 border-t border-slate-100 pt-6">
                    <h3 className="font-black text-slate-900 text-lg mb-4">Product Variants</h3>
                    <p className="text-xs text-slate-500 mb-4">Add different sizes or add-ons (e.g., Small, Large). If variants exist, base price is ignored.</p>
                    
                    <form onSubmit={handleAddVariant} className="flex space-x-2 mb-4">
                      <input name="name" required type="text" placeholder="Name (e.g. Large)" className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      <input name="price" required type="number" placeholder="Price" className="w-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      <button type="submit" disabled={loading} className="px-3 bg-slate-900 text-white rounded-lg font-bold shadow-sm hover:bg-slate-800 disabled:opacity-50">
                        <Plus className="w-4 h-4" />
                      </button>
                    </form>

                    <div className="space-y-2">
                      {editingProduct.variants?.map(variant => (
                        <div key={variant.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <span className="font-bold text-slate-700">{variant.name}</span>
                          <div className="flex items-center space-x-3">
                            <span className="text-sm font-black text-indigo-600">Rs. {variant.price}</span>
                            <button onClick={() => {
                              setLoading(true);
                              deleteProductVariant(variant.id).then(() => setLoading(false));
                            }} className="p-1.5 text-red-400 hover:bg-red-50 rounded-md">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {(!editingProduct.variants || editingProduct.variants.length === 0) && (
                        <p className="text-sm text-slate-400 text-center py-2">No variants added.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function NavButton({ icon, label, isActive, onClick }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center w-16 h-12 relative transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
      <div className="relative z-10 flex flex-col items-center">
        {icon}
        <span className="text-[10px] font-bold mt-1">{label}</span>
      </div>
      {isActive && <motion.div layoutId="bottomNavBubble" className="absolute inset-0 bg-indigo-50 rounded-2xl -z-0" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
    </button>
  );
}
