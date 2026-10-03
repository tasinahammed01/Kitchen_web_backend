import mongoose from 'mongoose';
import { Product } from './models/Product';
import { connectDB } from './config/db';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const mockProducts = [
  {
    slug: "chef-knife-set",
    name: "Professional Chef Knife Set",
    description: "Experience unparalleled precision with our Professional Chef Knife Set. Featuring high-carbon stainless steel blades and ergonomic handles, these knives are designed for those who demand excellence in every cut.",
    shortDescription: "Premium chef knives with high-carbon stainless steel blades",
    price: 189,
    salePrice: 149,
    rating: 4.9,
    reviewCount: 1284,
    images: [
      "https://images.unsplash.com/photo-1593618998160-e34014e67546?w=800&q=80",
      "https://images.unsplash.com/photo-1593618998160-e34014e67546?w=800&q=80",
      "https://images.unsplash.com/photo-1593618998160-e34014e67546?w=800&q=80",
      "https://images.unsplash.com/photo-1593618998160-e34014e67546?w=800&q=80",
    ],
    category: "Kitchen Tools" as const,
    brand: "KitchenPro",
    stock: 45,
    tags: ["knives", "premium", "stainless-steel", "professional"],
    featured: true,
    newArrival: true,
    bestSeller: true,
    colors: [
      { name: "Silver", hex: "#C0C0C0" },
      { name: "Black", hex: "#000000" },
    ],
    sizes: [
      { name: "5-Piece Set", available: true },
      { name: "7-Piece Set", available: true },
      { name: "12-Piece Set", available: true },
    ],
  },
  {
    slug: "non-stick-pan-set",
    name: "Non-Stick Cookware Set",
    description: "The Non-Stick Cookware Set combines cutting-edge technology with sophisticated design. Perfect for both everyday cooking and gourmet meals, these pans deliver exceptional performance and easy cleanup.",
    shortDescription: "Elite non-stick pans with ceramic coating",
    price: 219,
    rating: 4.8,
    reviewCount: 956,
    images: [
      "https://images.unsplash.com/photo-1584990347449-a2d4c2c044b8?w=800&q=80",
      "https://images.unsplash.com/photo-1584990347449-a2d4c2c044b8?w=800&q=80",
      "https://images.unsplash.com/photo-1584990347449-a2d4c2c044b8?w=800&q=80",
    ],
    category: "Cooking Accessories" as const,
    brand: "KitchenPro",
    stock: 32,
    tags: ["cookware", "non-stick", "ceramic", "easy-clean"],
    featured: true,
    newArrival: false,
    bestSeller: true,
    colors: [
      { name: "Gray", hex: "#6B7280" },
      { name: "Black", hex: "#000000" },
      { name: "Red", hex: "#EF4444" },
    ],
    sizes: [
      { name: "8-Piece Set", available: true },
      { name: "10-Piece Set", available: true },
      { name: "14-Piece Set", available: true },
    ],
  },
  {
    slug: "food-processor",
    name: "Multi-Function Food Processor",
    description: "Timeless efficiency meets modern convenience. Our Multi-Function Food Processor features powerful motor and multiple attachments, perfect for chopping, slicing, and mixing.",
    shortDescription: "Premium food processor with multiple attachments",
    price: 159,
    salePrice: 129,
    rating: 4.7,
    reviewCount: 743,
    images: [
      "https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=800&q=80",
      "https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=800&q=80",
      "https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=800&q=80",
    ],
    category: "Food Preparation" as const,
    brand: "KitchenPro",
    stock: 67,
    tags: ["food-processor", "chopping", "slicing", "mixing"],
    featured: false,
    newArrival: false,
    bestSeller: true,
    colors: [
      { name: "White", hex: "#FFFFFF" },
      { name: "Black", hex: "#000000" },
      { name: "Silver", hex: "#C0C0C0" },
    ],
    sizes: [
      { name: "8-Cup", available: true },
      { name: "12-Cup", available: true },
      { name: "16-Cup", available: true },
    ],
  },
  {
    slug: "storage-container-set",
    name: "Airtight Storage Container Set",
    description: "Organize your kitchen with our Airtight Storage Container Set. Engineered for maximum freshness preservation with superior sealing technology and durable construction.",
    shortDescription: "Professional airtight food storage containers",
    price: 89,
    rating: 4.9,
    reviewCount: 567,
    images: [
      "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=800&q=80",
      "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=800&q=80",
      "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=800&q=80",
    ],
    category: "Storage & Organization" as const,
    brand: "KitchenPro",
    stock: 89,
    tags: ["storage", "airtight", "organization", "freshness"],
    featured: true,
    newArrival: true,
    bestSeller: false,
    colors: [
      { name: "Clear", hex: "#FFFFFF" },
      { name: "Blue", hex: "#3B82F6" },
    ],
    sizes: [
      { name: "10-Piece Set", available: true },
      { name: "20-Piece Set", available: true },
      { name: "36-Piece Set", available: true },
    ],
  },
  {
    slug: "cutting-board-set",
    name: "Premium Cutting Board Set",
    description: "Built for serious food preparation. The Premium Cutting Board Set features durable bamboo construction, juice grooves, and superior stability for all your cutting needs.",
    shortDescription: "High-performance bamboo cutting boards",
    price: 79,
    rating: 4.6,
    reviewCount: 432,
    images: [
      "https://images.unsplash.com/photo-1594348552233-d69a80f95a10?w=800&q=80",
      "https://images.unsplash.com/photo-1594348552233-d69a80f95a10?w=800&q=80",
      "https://images.unsplash.com/photo-1594348552233-d69a80f95a10?w=800&q=80",
    ],
    category: "Food Preparation" as const,
    brand: "KitchenPro",
    stock: 54,
    tags: ["cutting-board", "bamboo", "durable", "kitchen"],
    featured: false,
    newArrival: false,
    bestSeller: false,
    colors: [
      { name: "Natural", hex: "#D2B48C" },
      { name: "Dark", hex: "#8B4513" },
    ],
    sizes: [
      { name: "Small", available: true },
      { name: "Medium", available: true },
      { name: "Large", available: true },
    ],
  },
  {
    slug: "glass-storage-jars",
    name: "Glass Storage Jar Collection",
    description: "The pinnacle of kitchen organization. Our Glass Storage Jar Collection features premium borosilicate glass, airtight lids, and elegant design for the discerning home cook.",
    shortDescription: "Handcrafted glass storage jars",
    price: 129,
    rating: 5.0,
    reviewCount: 189,
    images: [
      "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&q=80",
      "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&q=80",
      "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&q=80",
      "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&q=80",
    ],
    category: "Storage & Organization" as const,
    brand: "KitchenPro",
    stock: 42,
    tags: ["storage", "glass", "airtight", "elegant"],
    featured: true,
    newArrival: true,
    bestSeller: false,
    colors: [
      { name: "Clear", hex: "#FFFFFF" },
      { name: "Amber", hex: "#FFBF00" },
    ],
    sizes: [
      { name: "8 oz", available: true },
      { name: "16 oz", available: true },
      { name: "32 oz", available: true },
    ],
  },
  {
    slug: "drinkware-set",
    name: "Essential Drinkware Set",
    description: "Perfect for everyday use. The Essential Drinkware Set combines durability with elegance, making it ideal for water, juice, and everything in between.",
    shortDescription: "Versatile everyday drinkware",
    price: 59,
    salePrice: 45,
    rating: 4.5,
    reviewCount: 892,
    images: [
      "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80",
      "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&q=80",
    ],
    category: "Drinkware" as const,
    brand: "KitchenPro",
    stock: 120,
    tags: ["drinkware", "glass", "everyday", "versatile"],
    featured: false,
    newArrival: false,
    bestSeller: true,
    colors: [
      { name: "Clear", hex: "#FFFFFF" },
      { name: "Tinted", hex: "#E0F7FA" },
    ],
    sizes: [
      { name: "12 oz", available: true },
      { name: "16 oz", available: true },
      { name: "20 oz", available: true },
    ],
  },
  {
    slug: "coffee-maker",
    name: "Programmable Coffee Maker",
    description: "Designed for convenience. The Programmable Coffee Maker features thermal carafe, customizable brewing settings, and automatic shut-off for maximum performance.",
    shortDescription: "Programmable coffee maker with thermal carafe",
    price: 149,
    rating: 4.8,
    reviewCount: 654,
    images: [
      "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&q=80",
      "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&q=80",
      "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&q=80",
    ],
    category: "Kitchen Tools" as const,
    brand: "KitchenPro",
    stock: 38,
    tags: ["coffee", "programmable", "thermal", "convenience"],
    featured: true,
    newArrival: true,
    bestSeller: false,
    colors: [
      { name: "Black", hex: "#000000" },
      { name: "Silver", hex: "#C0C0C0" },
    ],
    sizes: [
      { name: "10-Cup", available: true },
      { name: "12-Cup", available: true },
    ],
  },
  {
    slug: "cleaning-brush-set",
    name: "Kitchen Cleaning Brush Set",
    description: "Kitchen-ready cleaning meets premium efficiency. The Kitchen Cleaning Brush Set features durable bristles, ergonomic handles, and versatile designs for all your cleaning needs.",
    shortDescription: "Multi-purpose kitchen cleaning brushes",
    price: 39,
    rating: 4.6,
    reviewCount: 478,
    images: [
      "https://images.unsplash.com/photo-1581578731117-104f2a609919?w=800&q=80",
      "https://images.unsplash.com/photo-1581578731117-104f2a609919?w=800&q=80",
    ],
    category: "Cleaning Accessories" as const,
    brand: "KitchenPro",
    stock: 95,
    tags: ["cleaning", "brushes", "kitchen", "versatile"],
    featured: false,
    newArrival: true,
    bestSeller: false,
    colors: [
      { name: "Multi", hex: "#FF6B6B" },
      { name: "White", hex: "#FFFFFF" },
    ],
    sizes: [
      { name: "5-Piece Set", available: true },
      { name: "8-Piece Set", available: true },
    ],
  },
  {
    slug: "mixing-bowl-set",
    name: "Stainless Steel Mixing Bowl Set",
    description: "Master every recipe. The Stainless Steel Mixing Bowl Set provides exceptional durability, non-slip bases, and measurement markings for baking and cooking.",
    shortDescription: "Multi-purpose mixing bowls with measurement markings",
    price: 69,
    rating: 4.7,
    reviewCount: 389,
    images: [
      "https://images.unsplash.com/photo-1584990347429-c4270c8d299e?w=800&q=80",
      "https://images.unsplash.com/photo-1584990347429-c4270c8d299e?w=800&q=80",
      "https://images.unsplash.com/photo-1584990347429-c4270c8d299e?w=800&q=80",
    ],
    category: "Food Preparation" as const,
    brand: "KitchenPro",
    stock: 72,
    tags: ["mixing-bowl", "stainless-steel", "baking", "cooking"],
    featured: false,
    newArrival: false,
    bestSeller: false,
    colors: [
      { name: "Silver", hex: "#C0C0C0" },
      { name: "Copper", hex: "#B87333" },
    ],
    sizes: [
      { name: "5-Piece Set", available: true },
      { name: "7-Piece Set", available: true },
      { name: "10-Piece Set", available: true },
    ],
  },
  {
    slug: "measuring-cup-set",
    name: "Precision Measuring Cup Set",
    description: "One set, every measurement. The Precision Measuring Cup Set is designed for accuracy, providing clear markings and comfortable grips for cooking and baking.",
    shortDescription: "Versatile measuring cups with clear markings",
    price: 29,
    rating: 4.5,
    reviewCount: 567,
    images: [
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80",
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80",
    ],
    category: "Food Preparation" as const,
    brand: "KitchenPro",
    stock: 85,
    tags: ["measuring", "cups", "accuracy", "baking"],
    featured: false,
    newArrival: false,
    bestSeller: false,
    colors: [
      { name: "Clear", hex: "#FFFFFF" },
      { name: "Blue", hex: "#3B82F6" },
      { name: "Red", hex: "#EF4444" },
    ],
    sizes: [
      { name: "5-Piece Set", available: true },
      { name: "8-Piece Set", available: true },
    ],
  },
  {
    slug: "spatula-set",
    name: "Silicone Spatula Set",
    description: "Less is more. The Silicone Spatula Set features heat-resistant silicone, ergonomic handles, and versatile designs for the modern cook.",
    shortDescription: "Heat-resistant silicone spatulas",
    price: 34,
    rating: 4.8,
    reviewCount: 423,
    images: [
      "https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=800&q=80",
      "https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=800&q=80",
      "https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=800&q=80",
    ],
    category: "Cooking Accessories" as const,
    brand: "KitchenPro",
    stock: 110,
    tags: ["spatula", "silicone", "heat-resistant", "cooking"],
    featured: true,
    newArrival: true,
    bestSeller: false,
    colors: [
      { name: "Black", hex: "#000000" },
      { name: "Red", hex: "#EF4444" },
      { name: "Blue", hex: "#3B82F6" },
    ],
    sizes: [
      { name: "4-Piece Set", available: true },
      { name: "6-Piece Set", available: true },
    ],
  },
];

async function seedDatabase() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Insert mock products
    await Product.insertMany(mockProducts);
    console.log('Inserted mock products');

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
