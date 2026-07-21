import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");
  
  // Create Platform Settings
  await prisma.platformSettings.upsert({
    where: { id: "global" },
    update: {},
    create: {
      id: "global",
      broadcastMessage: "Welcome to the new WhatsApp Store!"
    }
  });

  // Create Ali Biryani Merchant
  const merchant = await prisma.merchant.upsert({
    where: { slug: "ali-biryani" },
    update: {},
    create: {
      name: "Ali Biryani",
      slug: "ali-biryani",
      phone: "923001234567",
      theme: "light",
      layout: "grid",
      isOpen: true,
      subscriptionTier: "Pro",
      coverImageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=1000&auto=format&fit=crop",
      welcomeMessage: "Best Biryani in Town! Order now on WhatsApp.",
      products: {
        create: [
          {
            name: "Chicken Biryani (Single)",
            description: "Delicious spicy chicken biryani.",
            price: 250,
            imageUrl: "https://images.unsplash.com/photo-1589302168068-964664d93cb0?q=80&w=500&auto=format&fit=crop",
            category: "Main Course",
            isFeatured: true,
          },
          {
            name: "Beef Pulao",
            description: "Traditional beef pulao with raita.",
            price: 350,
            imageUrl: "https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?q=80&w=500&auto=format&fit=crop",
            category: "Main Course",
            isFeatured: false,
          }
        ]
      }
    }
  });

  console.log("Seeding complete:", merchant.name);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
