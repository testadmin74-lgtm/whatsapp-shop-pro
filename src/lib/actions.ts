"use server";

import { db } from "./db";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { login } from "./auth";

// -- Admin Actions (Merchant Management) --

export async function getMerchants() {
  return await db.merchant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { products: true }
      }
    }
  });
}

export async function addMerchant(formData: FormData) {
  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const phone = formData.get("phone") as string;

  if (!name || !slug || !phone) return { error: "Missing fields" };

  try {
    await db.merchant.create({
      data: { name, slug, phone }
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return { error: "Slug might already exist" };
  }
}

export async function toggleMerchantStatus(id: string, currentStatus: boolean) {
  await db.merchant.update({
    where: { id },
    data: { isActive: !currentStatus }
  });
  revalidatePath("/admin");
}

export async function deleteMerchant(id: string) {
  await db.merchant.delete({ where: { id } });
  revalidatePath("/admin");
}

export async function updateMerchantSettings(merchantId: string, data: FormData) {
  try {
    const name = data.get("name") as string;
    const phone = data.get("phone") as string;
    const theme = data.get("theme") as string || "light";
    const layout = data.get("layout") as string || "grid";
    const deliveryFee = parseInt(data.get("deliveryFee") as string) || 0;
    const freeDeliveryThresholdStr = data.get("freeDeliveryThreshold") as string;
    const freeDeliveryThreshold = freeDeliveryThresholdStr ? parseInt(freeDeliveryThresholdStr) : null;

    if (!name || !phone) return { error: "Name and phone are required" };

    await db.merchant.update({
      where: { id: merchantId },
      data: { name, phone, theme, layout, deliveryFee, freeDeliveryThreshold }
    });
    revalidatePath("/merchant");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return { error: "Failed to update settings" };
  }
}

// -- Merchant Actions (Product Management) --

export async function getMerchantBySlug(slug: string) {
  return await db.merchant.findUnique({
    where: { slug },
    include: { products: true }
  });
}

export async function addProduct(merchantId: string, formData: FormData) {
  const name = formData.get("name") as string;
  const price = parseFloat(formData.get("price") as string);
  const description = formData.get("description") as string;
  const category = formData.get("category") as string || "Uncategorized";
  const trackStock = formData.get("trackStock") === "on";
  const stockCount = parseInt(formData.get("stockCount") as string) || 0;
  const image = formData.get("image") as File;

  if (!name || isNaN(price) || !image || image.size === 0) {
    return { error: "Missing required fields or invalid image" };
  }

  try {
    // 1. Save Image
    const buffer = Buffer.from(await image.arrayBuffer());
    const ext = image.name.split('.').pop();
    const filename = `${uuidv4()}.${ext}`;
    
    // Ensure uploads directory exists
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    
    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, buffer);

    const imageUrl = `/uploads/${filename}`;

    // 2. Save Product to DB
    await db.product.create({
      data: {
        name,
        price,
        description,
        imageUrl,
        category,
        merchantId,
        trackStock,
        stockCount
      }
    });

    revalidatePath("/merchant");
    revalidatePath("/[storeSlug]", "page");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Failed to upload product" };
  }
}

export async function editProduct(id: string, formData: FormData) {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const price = parseFloat(formData.get("price") as string);
  const category = formData.get("category") as string || "Uncategorized";
  const trackStock = formData.get("trackStock") === "on";
  const stockCount = parseInt(formData.get("stockCount") as string) || 0;
  
  if (!name || isNaN(price)) return { error: "Name and valid price are required" };

  try {
    await db.product.update({
      where: { id },
      data: { name, description, price, category, trackStock, stockCount }
    });
    revalidatePath("/merchant");
    revalidatePath("/[storeSlug]", "page");
    return { success: true };
  } catch (error) {
    return { error: "Failed to edit product" };
  }
}

export async function deleteProduct(id: string) {
  await db.product.delete({ where: { id } });
  revalidatePath("/merchant");
  revalidatePath("/[storeSlug]", "page");
}

export async function toggleStoreStatus(merchantId: string, currentStatus: boolean) {
  await db.merchant.update({
    where: { id: merchantId },
    data: { isOpen: !currentStatus }
  });
  revalidatePath("/merchant");
  revalidatePath("/[storeSlug]", "page");
}

export async function placeOrder(merchantId: string, orderData: { customerName: string, customerAddress: string, totalAmount: number, items: { id: string, name: string, quantity: number, price: number }[] }) {
  try {
    const order = await db.order.create({
      data: {
        merchantId,
        customerName: orderData.customerName,
        customerAddress: orderData.customerAddress,
        totalAmount: orderData.totalAmount,
        items: {
          create: orderData.items.map(item => ({
            productName: item.name,
            quantity: item.quantity,
            price: item.price
          }))
        }
      }
    });

    // Decrement stock for tracked products
    for (const item of orderData.items) {
      const product = await db.product.findUnique({ where: { id: item.id } });
      if (product && product.trackStock && product.stockCount > 0) {
        await db.product.update({
          where: { id: item.id },
          data: { stockCount: Math.max(0, product.stockCount - item.quantity) }
        });
      }
    }

    revalidatePath("/merchant");
    return { success: true, orderId: order.id };
  } catch (error) {
    console.error(error);
    return { error: "Failed to save order" };
  }
}

export async function toggleFeatured(productId: string, currentStatus: boolean) {
  await db.product.update({
    where: { id: productId },
    data: { isFeatured: !currentStatus }
  });
  revalidatePath("/merchant");
  revalidatePath("/[storeSlug]", "page");
}

export async function updateOrderStatus(orderId: string, status: string) {
  await db.order.update({
    where: { id: orderId },
    data: { status }
  });
  revalidatePath("/merchant");
}

export async function addPromoCode(merchantId: string, formData: FormData) {
  const code = formData.get("code") as string;
  const discountPercent = parseInt(formData.get("discountPercent") as string);

  if (!code || isNaN(discountPercent)) return { error: "Invalid promo details" };

  try {
    await db.promoCode.create({
      data: { code: code.toUpperCase(), discountPercent, merchantId }
    });
    revalidatePath("/merchant");
    revalidatePath("/[storeSlug]", "page");
    return { success: true };
  } catch (error) {
    return { error: "Failed to add promo" };
  }
}

export async function deletePromoCode(id: string) {
  await db.promoCode.delete({ where: { id } });
  revalidatePath("/merchant");
  revalidatePath("/[storeSlug]", "page");
}

export async function updateStoreBanner(merchantId: string, formData: FormData) {
  const coverImageUrl = formData.get("coverImageUrl") as string;
  const welcomeMessage = formData.get("welcomeMessage") as string;

  await db.merchant.update({
    where: { id: merchantId },
    data: {
      coverImageUrl: coverImageUrl || null,
      welcomeMessage: welcomeMessage || null,
    }
  });
  revalidatePath("/merchant");
  revalidatePath("/[storeSlug]", "page");
}

export async function addProductVariant(productId: string, formData: FormData) {
  const name = formData.get("name") as string;
  const price = parseFloat(formData.get("price") as string);

  if (!name || isNaN(price)) return { error: "Invalid variant details" };

  try {
    await db.productVariant.create({
      data: { name, price, productId }
    });
    revalidatePath("/merchant");
    revalidatePath("/[storeSlug]", "page");
    return { success: true };
  } catch (error) {
    return { error: "Failed to add variant" };
  }
}

export async function deleteProductVariant(id: string) {
  await db.productVariant.delete({ where: { id } });
  revalidatePath("/merchant");
  revalidatePath("/[storeSlug]", "page");
}

export async function updatePlatformAnnouncement(message: string) {
  await db.platformSettings.upsert({
    where: { id: "global" },
    update: { broadcastMessage: message || null },
    create: { id: "global", broadcastMessage: message || null }
  });
  revalidatePath("/admin");
  revalidatePath("/merchant");
}

export async function updateMerchantTier(merchantId: string, tier: string) {
  await db.merchant.update({
    where: { id: merchantId },
    data: { subscriptionTier: tier }
  });
  revalidatePath("/admin");
  revalidatePath("/merchant");
}

export async function authenticateMerchant(phone: string, pin: string) {
  try {
    // 1. Try Merchant (Admin)
    const merchant = await db.merchant.findFirst({
      where: { phone }
    });
    
    if (merchant) {
      if (merchant.pin !== pin) return { error: "Invalid PIN." };
      await login(merchant.id, "ADMIN", merchant.id);
      return { success: true };
    }

    // 2. Try Staff
    const staff = await db.staff.findFirst({
      where: { phone }
    });

    if (staff) {
      if (staff.pin !== pin) return { error: "Invalid PIN." };
      await login(staff.id, "STAFF", staff.merchantId);
      return { success: true };
    }
    
    return { error: "User not found with this phone number." };
  } catch (error) {
    console.error(error);
    return { error: "Authentication failed." };
  }
}

export async function signupMerchant(name: string, phone: string, pin: string) {
  try {
    const existing = await db.merchant.findFirst({
      where: { phone }
    });
    
    if (existing) return { error: "Phone number already registered." };

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    
    // Check if slug exists, if so append random
    let finalSlug = slug;
    let count = 1;
    while (await db.merchant.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${slug}-${count}`;
      count++;
    }

    const merchant = await db.merchant.create({
      data: {
        name,
        slug: finalSlug,
        phone,
        pin,
      }
    });

    await login(merchant.id);
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Signup failed." };
  }
}

export async function getMerchantOrders(merchantId: string) {
  try {
    const orders = await db.order.findMany({
      where: { merchantId },
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    });
    return { orders };
  } catch (error) {
    return { error: "Failed to fetch orders" };
  }
}

