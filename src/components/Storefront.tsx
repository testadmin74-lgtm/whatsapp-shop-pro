"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Plus, Minus, X, Store, Search, User, MapPin, ChevronRight, CheckCircle2, Lock, Star, Tag, MessageSquare, Heart, Clock, Receipt } from "lucide-react";
import { placeOrder } from "@/lib/actions";

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

type CartItem = ProductType & { 
  cartId: string; 
  selectedVariant?: VariantType;
  quantity: number; 
};

type OrderHistoryItem = {
  date: string;
  totalPrice: number;
  items: string[];
};

type MerchantType = {
  id: string;
  name: string;
  slug: string;
  phone: string;
  theme: string;
  layout: string;
  isOpen: boolean;
  coverImageUrl?: string | null;
  welcomeMessage?: string | null;
  products: ProductType[];
  promos?: PromoType[];
};

const THEMES: Record<string, { bg: string, text: string, primary: string, primaryText: string, cardBg: string, cardBorder: string }> = {
  light: { bg: "bg-[#F8F9FA]", text: "text-slate-900", primary: "bg-slate-900", primaryText: "text-white", cardBg: "bg-white", cardBorder: "border-slate-100" },
  dark: { bg: "bg-slate-950", text: "text-white", primary: "bg-white", primaryText: "text-slate-900", cardBg: "bg-slate-900", cardBorder: "border-slate-800" },
  orange: { bg: "bg-orange-50", text: "text-slate-900", primary: "bg-orange-600", primaryText: "text-white", cardBg: "bg-white", cardBorder: "border-orange-100" },
  green: { bg: "bg-green-50", text: "text-slate-900", primary: "bg-green-600", primaryText: "text-white", cardBg: "bg-white", cardBorder: "border-green-100" },
  blue: { bg: "bg-blue-50", text: "text-slate-900", primary: "bg-blue-600", primaryText: "text-white", cardBg: "bg-white", cardBorder: "border-blue-100" },
};

export default function Storefront({ merchant }: { merchant: MerchantType }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<PromoType | null>(null);

  const [selectedProductForVariant, setSelectedProductForVariant] = useState<ProductType | null>(null);

  // Phase 11: Local Storage Profile & History
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [orderHistory, setOrderHistory] = useState<OrderHistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    const savedName = localStorage.getItem(`customerName_${merchant.id}`);
    const savedAddress = localStorage.getItem(`customerAddress_${merchant.id}`);
    const savedWishlist = localStorage.getItem(`wishlist_${merchant.id}`);
    const savedHistory = localStorage.getItem(`history_${merchant.id}`);

    if (savedName) setCustomerName(savedName);
    if (savedAddress) setCustomerAddress(savedAddress);
    if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
    if (savedHistory) setOrderHistory(JSON.parse(savedHistory));
  }, [merchant.id]);

  const toggleWishlist = (productId: string) => {
    let newWishlist;
    if (wishlist.includes(productId)) {
      newWishlist = wishlist.filter(id => id !== productId);
    } else {
      newWishlist = [...wishlist, productId];
    }
    setWishlist(newWishlist);
    localStorage.setItem(`wishlist_${merchant.id}`, JSON.stringify(newWishlist));
  };

  const theme = THEMES[merchant.theme] || THEMES.light;
  const isListLayout = merchant.layout === "list";
  const categories = ["All", "Favorites", ...Array.from(new Set(merchant.products.map(p => p.category)))];

  const addToCart = (product: ProductType, variant?: VariantType) => {
    if (!merchant.isOpen) return;
    
    if (product.variants && product.variants.length > 0 && !variant) {
      setSelectedProductForVariant(product);
      return;
    }

    const cartId = variant ? `${product.id}-${variant.id}` : product.id;
    const finalPrice = variant ? variant.price : product.price;

    setCart((prev) => {
      const existing = prev.find((item) => item.cartId === cartId);
      if (existing) {
        return prev.map((item) =>
          item.cartId === cartId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, cartId, selectedVariant: variant, price: finalPrice, quantity: 1 }];
    });

    setSelectedProductForVariant(null);
  };

  const removeFromCart = (cartId: string) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.cartId === cartId);
      if (existing && existing.quantity > 1) {
        return prev.map((item) =>
          item.cartId === cartId ? { ...item, quantity: item.quantity - 1 } : item
        );
      }
      return prev.filter((item) => item.cartId !== cartId);
    });
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = appliedPromo ? (subtotal * appliedPromo.discountPercent) / 100 : 0;
  const totalPrice = Math.round(subtotal - discountAmount);

  const sortedProducts = [...merchant.products].sort((a, b) => {
    if (a.isFeatured && !b.isFeatured) return -1;
    if (!a.isFeatured && b.isFeatured) return 1;
    return 0;
  });

  const filteredProducts = sortedProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "All" || 
                           (activeCategory === "Favorites" ? wishlist.includes(p.id) : p.category === activeCategory);
    return matchesSearch && matchesCategory;
  });

  const applyPromoCode = () => {
    const validPromo = (merchant.promos || []).find(p => p.code === promoCodeInput.toUpperCase());
    if (validPromo) {
      setAppliedPromo(validPromo);
    } else {
      alert("Invalid or expired promo code.");
      setAppliedPromo(null);
    }
  };

  const handleWhatsAppOrder = async () => {
    if (!customerName || !customerAddress) {
      alert("Please enter your name and address first.");
      return;
    }

    setIsPlacingOrder(true);

    // Save profile for next time
    localStorage.setItem(`customerName_${merchant.id}`, customerName);
    localStorage.setItem(`customerAddress_${merchant.id}`, customerAddress);

    const itemsToSave = cart.map(item => ({
      productName: item.selectedVariant ? `${item.name} (${item.selectedVariant.name})` : item.name,
      quantity: item.quantity,
      price: item.price
    }));

    // Update history
    const newHistoryItem: OrderHistoryItem = {
      date: new Date().toLocaleString(),
      totalPrice,
      items: itemsToSave.map(i => `${i.quantity}x ${i.productName}`)
    };
    const updatedHistory = [newHistoryItem, ...orderHistory].slice(0, 10);
    setOrderHistory(updatedHistory);
    localStorage.setItem(`history_${merchant.id}`, JSON.stringify(updatedHistory));

    const res = await placeOrder(merchant.id, customerName, customerAddress, totalPrice, itemsToSave);
    if (res.error) {
      alert("Something went wrong saving the order. Proceeding to WhatsApp anyway.");
    }

    const merchantNumber = merchant.phone;
    let message = `*New Order from ${merchant.name}!*\n\n`;
    message += `*Customer Details:*\nName: ${customerName}\nAddress: ${customerAddress}\n\n*Order Summary:*\n`;
    
    itemsToSave.forEach((item) => {
      message += `${item.quantity}x ${item.productName} (Rs. ${item.price * item.quantity})\n`;
    });
    
    message += `\nSubtotal: Rs. ${subtotal}`;
    if (appliedPromo) {
      message += `\nPromo Applied: ${appliedPromo.code} (-${appliedPromo.discountPercent}%)`;
      message += `\nDiscount: -Rs. ${Math.round(discountAmount)}`;
    }
    message += `\n\n*Total Payable Amount: Rs. ${totalPrice}*\n\nPayment Method: Cash on Delivery (COD)`;
    if (res.orderId) {
      message += `\nOrder ID: #${res.orderId.substring(0, 6).toUpperCase()}`;
    }

    setIsPlacingOrder(false);
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${merchantNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
    setCart([]);
    setIsCheckoutOpen(false);
    setAppliedPromo(null);
  };

  return (
    <div className={`relative min-h-screen ${theme.bg} pb-28 font-sans w-full transition-colors duration-500`}>
      
      {!merchant.isOpen && (
        <div className="bg-red-500 text-white text-center py-2 text-sm font-bold flex items-center justify-center sticky top-0 z-50 shadow-md">
          <Lock className="w-4 h-4 mr-2" /> Store is currently closed. You cannot place orders.
        </div>
      )}

      {/* Hero Banner Section */}
      {merchant.coverImageUrl && (
        <div className="w-full h-48 sm:h-56 relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={merchant.coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/30"></div>
          
          <button 
            onClick={() => setIsHistoryOpen(true)}
            className="absolute top-4 right-4 bg-white/90 backdrop-blur-md text-slate-900 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center space-x-1"
          >
            <Clock className="w-3 h-3" />
            <span>My Orders</span>
          </button>
        </div>
      )}

      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`${theme.cardBg} px-6 pt-6 pb-6 rounded-b-[2.5rem] shadow-sm sticky ${merchant.coverImageUrl ? '-mt-10 relative z-30' : 'top-0 z-30'}`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-14 h-14 ${theme.primary} ${theme.primaryText} rounded-2xl flex items-center justify-center shadow-lg`}>
              <Store className="w-7 h-7" />
            </div>
            <div>
              <h1 className={`text-2xl font-black ${theme.text} tracking-tight`}>{merchant.name}</h1>
              <p className="text-sm font-medium text-slate-500 flex items-center">
                {merchant.isOpen ? (
                  <><span className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>Accepting Orders</>
                ) : (
                  <><span className="w-2 h-2 bg-red-500 rounded-full mr-1.5"></span>Closed</>
                )}
              </p>
            </div>
          </div>
          {!merchant.coverImageUrl && (
            <button 
              onClick={() => setIsHistoryOpen(true)}
              className="bg-slate-100 text-slate-600 p-2 rounded-full shadow-sm"
            >
              <Clock className="w-5 h-5" />
            </button>
          )}
        </div>

        {merchant.welcomeMessage && (
          <div className="mb-5 bg-opacity-5 bg-indigo-500 p-3 rounded-2xl flex items-start space-x-2">
            <MessageSquare className={`w-5 h-5 ${theme.text} opacity-50 mt-0.5`} />
            <p className={`text-sm font-medium ${theme.text} opacity-80 italic`}>"{merchant.welcomeMessage}"</p>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-slate-400" />
          </div>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 bg-opacity-5 rounded-2xl text-sm font-medium ${theme.text} placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all ${merchant.theme === 'dark' ? 'bg-white focus:ring-white' : 'bg-slate-900 focus:ring-slate-900'}`}
            placeholder="Search for something delicious..."
          />
        </div>

        {/* Category Pills */}
        <div className="flex overflow-x-auto hide-scrollbar space-x-2 -mx-2 px-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 flex items-center space-x-1.5 ${
                activeCategory === cat 
                  ? `${theme.primary} ${theme.primaryText} shadow-md` 
                  : `bg-opacity-5 border border-opacity-10 ${theme.text} ${merchant.theme === 'dark' ? 'bg-white border-white hover:bg-opacity-10' : 'bg-slate-900 border-slate-900 hover:bg-opacity-10'}`
              }`}
            >
              {cat === "Favorites" && <Heart className={`w-3.5 h-3.5 ${activeCategory === cat ? 'fill-white' : 'fill-red-500 text-red-500'}`} />}
              <span>{cat}</span>
            </button>
          ))}
        </div>
      </motion.header>

      {/* Product List */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className={`px-5 pt-6 grid gap-6 ${isListLayout ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}
      >
        {filteredProducts.length === 0 ? (
          <div className="col-span-full text-center py-20">
            <div className="w-20 h-20 bg-opacity-5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 opacity-50" />
            </div>
            <h3 className={`font-bold text-lg mb-1 ${theme.text}`}>No products found</h3>
            <p className="opacity-70 text-sm">Try searching or checking a different category.</p>
          </div>
        ) : (
          filteredProducts.map((product, index) => {
            const productCartItems = cart.filter(item => item.id === product.id);
            const totalQuantity = productCartItems.reduce((sum, item) => sum + item.quantity, 0);
            const hasVariants = product.variants && product.variants.length > 0;
            const displayPrice = hasVariants ? `From Rs. ${Math.min(...product.variants!.map(v=>v.price))}` : `Rs. ${product.price}`;
            const isFav = wishlist.includes(product.id);

            return (
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                key={product.id} 
                className={`${theme.cardBg} rounded-[2rem] p-4 ${isListLayout ? 'flex flex-row space-x-4 items-center' : 'flex flex-col'} hover:shadow-xl shadow-sm border ${product.isFeatured ? 'border-yellow-400 bg-yellow-50/10 shadow-yellow-200/50' : theme.cardBorder} transition-all duration-300 ${!merchant.isOpen && 'opacity-60 grayscale'}`}
              >
                {/* Premium Image Area */}
                <div className={`${isListLayout ? 'w-28 h-28 shrink-0' : 'h-48 w-full mb-4'} bg-opacity-5 rounded-[1.5rem] relative overflow-hidden group`}>
                  {product.isFeatured && (
                    <div className="absolute top-0 left-0 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-br-xl z-10 flex items-center shadow-md">
                      <Star className="w-3 h-3 fill-white mr-1" /> Bestseller
                    </div>
                  )}
                  
                  <button 
                    onClick={() => toggleWishlist(product.id)}
                    className="absolute top-2 right-2 p-2 bg-white/80 backdrop-blur-md rounded-full shadow-sm z-10"
                  >
                    <Heart className={`w-4 h-4 transition-colors ${isFav ? 'fill-red-500 text-red-500' : 'text-slate-400'}`} />
                  </button>

                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={product.imageUrl} 
                    alt={product.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" 
                  />
                  {totalQuantity > 0 && !isListLayout && (
                    <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full shadow-sm z-10">
                      <span className="font-bold text-slate-900 text-xs">{totalQuantity} in cart</span>
                    </div>
                  )}
                </div>
                
                {/* Details Area */}
                <div className={`flex-1 flex flex-col px-1 ${isListLayout ? 'h-full justify-center' : ''}`}>
                  <div className={`flex justify-between items-start mb-1 gap-4 ${isListLayout ? 'flex-col gap-1' : ''}`}>
                    <h3 className={`font-bold text-lg ${theme.text} leading-tight`}>{product.name}</h3>
                    <span className={`font-black ${product.isFeatured ? 'text-yellow-600' : theme.text} text-sm whitespace-nowrap`}>
                      {displayPrice}
                    </span>
                  </div>
                  {product.description && !isListLayout && (
                    <p className="text-sm opacity-60 line-clamp-2 leading-relaxed mb-4 flex-1">
                      {product.description}
                    </p>
                  )}
                  
                  {/* Add to Cart Controls */}
                  {merchant.isOpen && (
                    <div className={`mt-auto pt-2 ${isListLayout ? 'mt-2' : ''}`}>
                      {hasVariants ? (
                        <motion.button 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => addToCart(product)}
                          className={`w-full ${theme.primary} ${theme.primaryText} py-3 rounded-2xl font-bold hover:opacity-90 transition-opacity flex items-center justify-center space-x-2`}
                        >
                          <Plus className="w-4 h-4" />
                          <span>Select Option</span>
                        </motion.button>
                      ) : (
                        <AnimatePresence mode="wait">
                          {totalQuantity > 0 ? (
                            <motion.div 
                              key="controls"
                              initial={{ scale: 0.9, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.9, opacity: 0 }}
                              className={`flex items-center justify-between ${theme.text} bg-opacity-5 rounded-2xl p-1 border border-opacity-10 ${merchant.theme === 'dark' ? 'bg-white border-white' : 'bg-slate-900 border-slate-900'}`}
                            >
                              <button onClick={() => removeFromCart(product.id)} className={`w-8 h-8 flex items-center justify-center rounded-xl shadow-sm hover:opacity-70 transition-opacity ${theme.cardBg}`}>
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="font-bold text-lg w-8 text-center">{totalQuantity}</span>
                              <button onClick={() => addToCart(product)} className={`w-8 h-8 flex items-center justify-center rounded-xl shadow-sm hover:opacity-70 transition-opacity ${theme.cardBg}`}>
                                <Plus className="w-4 h-4" />
                              </button>
                            </motion.div>
                          ) : (
                            <motion.button 
                              key="add-btn"
                              initial={{ scale: 0.9, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.9, opacity: 0 }}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => addToCart(product)}
                              className={`w-full ${product.isFeatured ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white' : `${theme.primary} ${theme.primaryText}`} py-3 rounded-2xl font-bold hover:opacity-90 transition-opacity flex items-center justify-center space-x-2`}
                            >
                              <Plus className="w-4 h-4" />
                              <span>Add</span>
                            </motion.button>
                          )}
                        </AnimatePresence>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </motion.div>

      {/* Floating Action Checkout Button */}
      <AnimatePresence>
        {totalItems > 0 && merchant.isOpen && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-0 right-0 px-5 z-40 max-w-md mx-auto"
          >
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsCheckoutOpen(true)}
              className={`w-full ${theme.primary} ${theme.primaryText} rounded-[2rem] p-4 flex items-center justify-between shadow-2xl`}
            >
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg relative">
                  <ShoppingCart className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                    {totalItems}
                  </span>
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-semibold text-xs opacity-70 uppercase tracking-wider">Cart Total</span>
                  <span className="font-black text-xl">Rs. {subtotal}</span>
                </div>
              </div>
              <div className="bg-white/20 px-5 py-3 rounded-full font-bold text-sm flex items-center space-x-1 hover:bg-white/30 transition-colors">
                <span>Checkout</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Variant Selection Modal */}
      <AnimatePresence>
        {selectedProductForVariant && (
          <div className="fixed inset-0 z-50 flex items-end justify-center font-sans">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedProductForVariant(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={`${theme.cardBg} w-full max-w-md rounded-t-[2.5rem] shadow-2xl relative z-10 p-6 pb-safe`}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className={`text-xl font-black ${theme.text}`}>{selectedProductForVariant.name}</h3>
                  <p className={`text-sm opacity-60 ${theme.text}`}>Select an option to continue</p>
                </div>
                <button onClick={() => setSelectedProductForVariant(null)} className={`p-2 bg-opacity-5 bg-black rounded-full ${theme.text}`}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                {selectedProductForVariant.variants?.map(variant => {
                  const cartId = `${selectedProductForVariant.id}-${variant.id}`;
                  const cartItem = cart.find(c => c.cartId === cartId);
                  const qty = cartItem?.quantity || 0;

                  return (
                    <div key={variant.id} className={`flex items-center justify-between p-4 border border-opacity-10 bg-opacity-5 ${theme.cardBorder} rounded-2xl`}>
                      <div>
                        <div className={`font-bold ${theme.text}`}>{variant.name}</div>
                        <div className={`font-black ${theme.text} opacity-80`}>Rs. {variant.price}</div>
                      </div>
                      
                      {qty > 0 ? (
                        <div className={`flex items-center space-x-3 bg-opacity-10 bg-black p-1.5 rounded-xl ${theme.text}`}>
                          <button onClick={() => removeFromCart(cartId)} className={`w-8 h-8 flex items-center justify-center rounded-lg ${theme.cardBg} shadow-sm`}>
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="font-bold w-4 text-center">{qty}</span>
                          <button onClick={() => addToCart(selectedProductForVariant, variant)} className={`w-8 h-8 flex items-center justify-center rounded-lg ${theme.cardBg} shadow-sm`}>
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => addToCart(selectedProductForVariant, variant)} className={`px-5 py-2 ${theme.primary} ${theme.primaryText} font-bold rounded-xl`}>
                          Add
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* History Bottom Sheet */}
      <AnimatePresence>
        {isHistoryOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center font-sans">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsHistoryOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={`${theme.cardBg} w-full max-w-md max-h-[85vh] overflow-y-auto rounded-t-[2.5rem] shadow-2xl relative z-10 p-6 pb-safe`}
            >
              <div className="flex justify-between items-start mb-6 sticky top-0 bg-inherit py-2 z-20 border-b border-opacity-10 border-black">
                <div>
                  <h3 className={`text-xl font-black ${theme.text} flex items-center`}><Clock className="w-5 h-5 mr-2" /> My Orders</h3>
                  <p className={`text-sm opacity-60 ${theme.text}`}>Your recent order history</p>
                </div>
                <button onClick={() => setIsHistoryOpen(false)} className={`p-2 bg-opacity-5 bg-black rounded-full ${theme.text}`}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                {orderHistory.length === 0 ? (
                  <div className="text-center py-10 opacity-50">
                    <Receipt className={`w-12 h-12 mx-auto mb-3 ${theme.text}`} />
                    <p className={theme.text}>No past orders found.</p>
                  </div>
                ) : (
                  orderHistory.map((order, idx) => (
                    <div key={idx} className={`p-4 border border-opacity-10 bg-opacity-5 ${theme.cardBorder} rounded-2xl`}>
                      <div className="flex justify-between mb-2">
                        <span className={`text-xs font-bold opacity-60 ${theme.text}`}>{order.date}</span>
                        <span className={`font-black ${theme.text}`}>Rs. {order.totalPrice}</span>
                      </div>
                      <div className={`space-y-1 text-sm ${theme.text} opacity-80`}>
                        {order.items.map((item, i) => <div key={i}>{item}</div>)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Premium Checkout Bottom Sheet */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center font-sans">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={`${theme.cardBg} w-full max-w-md max-h-[95vh] overflow-y-auto rounded-t-[2.5rem] shadow-2xl relative z-10 flex flex-col pb-safe`}
            >
              <div className={`sticky top-0 ${theme.cardBg}/90 backdrop-blur-md pt-6 pb-4 px-6 border-b ${theme.cardBorder} z-20 rounded-t-[2.5rem]`}>
                <div className="w-12 h-1.5 bg-opacity-10 bg-black rounded-full mx-auto mb-6"></div>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className={`text-2xl font-black ${theme.text} tracking-tight`}>Checkout</h2>
                    <p className="opacity-60 text-sm font-medium mt-1">Review your order details</p>
                  </div>
                  <button onClick={() => setIsCheckoutOpen(false)} className={`w-10 h-10 bg-opacity-5 bg-black rounded-full flex items-center justify-center ${theme.text} transition-colors`}>
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-8">
                {/* Order Items */}
                <div>
                  <h3 className={`font-bold ${theme.text} mb-4 flex items-center text-sm uppercase tracking-wider`}>
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Order Summary
                  </h3>
                  <div className={`bg-opacity-5 bg-black p-5 rounded-3xl border ${theme.cardBorder} space-y-4`}>
                    {cart.map((item) => (
                      <div key={item.cartId} className={`flex justify-between items-start text-sm ${theme.text}`}>
                        <div className="flex space-x-3">
                          <div className={`font-black ${theme.cardBg} px-2 py-0.5 rounded-lg h-fit shadow-sm`}>
                            {item.quantity}x
                          </div>
                          <div>
                            <div className="font-bold">
                              {item.name} {item.selectedVariant && <span className="opacity-60 font-medium">({item.selectedVariant.name})</span>}
                            </div>
                            <div className="opacity-60 text-xs mt-0.5">Rs. {item.price} each</div>
                          </div>
                        </div>
                        <span className="font-black">Rs. {item.price * item.quantity}</span>
                      </div>
                    ))}
                    
                    <div className={`pt-4 mt-4 border-t border-dashed ${theme.cardBorder}`}>
                      <div className="flex justify-between items-center mb-2 opacity-60 text-sm font-medium">
                        <span>Subtotal</span>
                        <span>Rs. {subtotal}</span>
                      </div>
                      <div className="flex justify-between items-center mb-4 opacity-60 text-sm font-medium">
                        <span>Delivery Fee</span>
                        <span className="text-green-500 font-bold">Free</span>
                      </div>
                      
                      {/* Promo Code Logic */}
                      {appliedPromo && (
                        <div className="flex justify-between items-center mb-4 text-green-600 text-sm font-bold bg-green-50 p-2 rounded-lg -mx-2 px-2">
                          <span>Promo Applied ({appliedPromo.code})</span>
                          <span>- Rs. {Math.round(discountAmount)}</span>
                        </div>
                      )}

                      <div className={`flex justify-between items-center font-black text-2xl ${theme.text}`}>
                        <span>Total</span>
                        <span>Rs. {totalPrice}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Promo Code Input */}
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Tag className="w-4 h-4 opacity-40" />
                    </div>
                    <input 
                      type="text" 
                      value={promoCodeInput}
                      onChange={(e) => setPromoCodeInput(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 bg-opacity-5 bg-black border-2 border-transparent rounded-2xl focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all font-bold ${theme.text} placeholder-opacity-40 uppercase`}
                      placeholder="PROMO CODE"
                    />
                  </div>
                  <button 
                    onClick={applyPromoCode}
                    className="px-6 py-3 bg-slate-900 text-white font-bold rounded-2xl shadow-sm hover:bg-slate-800 transition-colors"
                  >
                    Apply
                  </button>
                </div>

                {/* Delivery Form */}
                <div>
                  <h3 className={`font-bold ${theme.text} mb-4 flex items-center text-sm uppercase tracking-wider`}>
                    <MapPin className="w-4 h-4 mr-2" /> Delivery Details
                  </h3>
                  <div className="space-y-4">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="w-5 h-5 opacity-40" />
                      </div>
                      <input 
                        type="text" 
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className={`w-full pl-12 pr-4 py-4 bg-opacity-5 bg-black border-2 border-transparent rounded-2xl focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all font-medium ${theme.text} placeholder-opacity-40`}
                        placeholder="Your Full Name"
                      />
                    </div>
                    <div className="relative">
                      <div className="absolute top-4 left-4 pointer-events-none">
                        <MapPin className="w-5 h-5 opacity-40" />
                      </div>
                      <textarea 
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        className={`w-full pl-12 pr-4 py-4 bg-opacity-5 bg-black border-2 border-transparent rounded-2xl focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all min-h-[100px] font-medium ${theme.text} placeholder-opacity-40 resize-none`}
                        placeholder="Complete Delivery Address..."
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Action */}
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isPlacingOrder}
                  onClick={handleWhatsAppOrder}
                  className="w-full bg-[#25D366] text-white py-5 rounded-[2rem] font-black text-lg shadow-xl shadow-green-500/30 flex items-center justify-center space-x-3 mb-6 disabled:opacity-50"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.205.534 1.291.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824zm-3.423-14.416c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm.029 18.88c-1.161 0-2.305-.292-3.318-.844l-3.677.964.984-3.595c-.607-1.052-.927-2.246-.926-3.468.001-3.825 3.113-6.937 6.937-6.937 3.825 0 6.937 3.112 6.937 6.937-.001 3.825-3.113 6.937-6.937 6.937z"/>
                  </svg>
                  <span>{isPlacingOrder ? "Placing Order..." : "Send Order to WhatsApp"}</span>
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
