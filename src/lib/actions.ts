"use server";

import { db } from "./db";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

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

export async function updateMerchantSettings(id: string, formData: FormData) {
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const theme = formData.get("theme") as string || "light";
  const layout = formData.get("layout") as string || "grid";
  
  if (!name || !phone) return { error: "Name and phone are required" };

  try {
    await db.merchant.update({
      where: { id },
      data: { name, phone, theme, layout }
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
        merchantId
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
  
  if (!name || isNaN(price)) return { error: "Name and valid price are required" };

  try {
    await db.product.update({
      where: { id },
      data: { name, description, price, category }
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

export async function placeOrder(merchantId: string, customerName: string, customerAddress: string, totalAmount: number, items: {productName: string, quantity: number, price: number}[]) {
  try {
    const order = await db.order.create({
      data: {
        customerName,
        customerAddress,
        totalAmount,
        merchantId,
        items: {
          create: items.map(item => ({
            productName: item.productName,
            quantity: item.quantity,
            price: item.price
          }))
        }
      }
    });
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
