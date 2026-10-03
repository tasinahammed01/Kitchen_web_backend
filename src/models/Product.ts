import mongoose, { Document, Schema } from 'mongoose';

// Private supplier source information - SERVER ONLY
export interface ISupplierSource {
  platform: 'alibaba' | 'other';
  supplierName?: string;
  productUrl?: string;
  supplierProductId?: string;
  supplierVariantId?: string;
  sourceCountry?: string;
  moq?: number;
  notes?: string;
}

// Private cost information - SERVER ONLY
export interface ISupplierCost {
  unitCost?: number;
  shippingCost?: number;
  currency?: string;
}

// Private fulfillment metadata - SERVER ONLY
export interface IFulfillment {
  mode: 'manual_dropship' | 'manual_stock' | 'other';
  supplierLeadTimeMinDays?: number;
  supplierLeadTimeMaxDays?: number;
}

// Public delivery estimate - CUSTOMER FACING
export interface IDeliveryEstimate {
  minDays: number;
  maxDays: number;
}

export interface IProduct extends Document {
  // PUBLIC FIELDS
  slug: string;
  name: string;
  description: string;
  shortDescription: string;
  price: number;
  salePrice?: number;
  rating: number;
  reviewCount: number;
  images: string[];
  category: 'Kitchen Tools' | 'Cooking Accessories' | 'Food Preparation' | 'Storage & Organization' | 'Drinkware' | 'Cleaning Accessories';
  brand: string;
  stock: number;
  tags: string[];
  featured: boolean;
  newArrival: boolean;
  bestSeller: boolean;
  colors: Array<{
    name: string;
    hex: string;
    image?: string;
  }>;
  sizes: Array<{
    name: string;
    available: boolean;
  }>;
  deliveryEstimate?: IDeliveryEstimate;

  // PRIVATE FIELDS - SERVER ONLY
  supplierSource?: ISupplierSource;
  supplierCost?: ISupplierCost;
  fulfillment?: IFulfillment;
  internalNotes?: string;

  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema(
  {
    // PUBLIC FIELDS
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    shortDescription: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    salePrice: {
      type: Number,
      min: 0,
    },
    rating: {
      type: Number,
      required: true,
      min: 0,
      max: 5,
      default: 0,
    },
    reviewCount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    images: {
      type: [String],
      required: true,
      default: [],
    },
    category: {
      type: String,
      required: true,
      enum: ['Kitchen Tools', 'Cooking Accessories', 'Food Preparation', 'Storage & Organization', 'Drinkware', 'Cleaning Accessories'],
    },
    brand: {
      type: String,
      required: true,
      trim: true,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    tags: {
      type: [String],
      required: true,
      default: [],
    },
    featured: {
      type: Boolean,
      default: false,
    },
    newArrival: {
      type: Boolean,
      default: false,
    },
    bestSeller: {
      type: Boolean,
      default: false,
    },
    colors: [
      {
        name: {
          type: String,
          required: true,
        },
        hex: {
          type: String,
          required: true,
        },
        image: {
          type: String,
        },
      },
    ],
    sizes: [
      {
        name: {
          type: String,
          required: true,
        },
        available: {
          type: Boolean,
          default: true,
        },
      },
    ],
    deliveryEstimate: {
      minDays: {
        type: Number,
        min: 0,
        required: function(this: any) {
          // If deliveryEstimate is present, both minDays and maxDays should be present
          return this.deliveryEstimate?.maxDays !== undefined;
        },
        validate: {
          validator: function(this: any, value: number) {
            // Validate minDays <= maxDays when both are present
            const maxDays = this.deliveryEstimate?.maxDays;
            if (maxDays !== undefined && value !== undefined) {
              return value <= maxDays;
            }
            return true;
          },
          message: 'minDays must be less than or equal to maxDays',
        },
      },
      maxDays: {
        type: Number,
        min: 0,
        required: function(this: any) {
          // If deliveryEstimate is present, both minDays and maxDays should be present
          return this.deliveryEstimate?.minDays !== undefined;
        },
        validate: {
          validator: function(this: any, value: number) {
            // Validate maxDays >= minDays when both are present
            const minDays = this.deliveryEstimate?.minDays;
            if (minDays !== undefined && value !== undefined) {
              return value >= minDays;
            }
            return true;
          },
          message: 'maxDays must be greater than or equal to minDays',
        },
      },
    },

    // PRIVATE FIELDS - SERVER ONLY
    supplierSource: {
      platform: {
        type: String,
        enum: ['alibaba', 'other'],
      },
      supplierName: {
        type: String,
        trim: true,
      },
      productUrl: {
        type: String,
        trim: true,
        validate: {
          validator: function(v: string) {
            if (!v) return true;
            try {
              new URL(v);
              return true;
            } catch {
              return false;
            }
          },
          message: 'Invalid URL format',
        },
      },
      supplierProductId: {
        type: String,
        trim: true,
      },
      supplierVariantId: {
        type: String,
        trim: true,
      },
      sourceCountry: {
        type: String,
        trim: true,
      },
      moq: {
        type: Number,
        min: 1,
      },
      notes: {
        type: String,
        trim: true,
      },
    },
    supplierCost: {
      unitCost: {
        type: Number,
        min: 0,
      },
      shippingCost: {
        type: Number,
        min: 0,
      },
      currency: {
        type: String,
        default: 'USD',
        trim: true,
        uppercase: true,
        validate: {
          validator: function(v: string) {
            // Must be exactly 3 uppercase alphabetic characters (ISO 4217 currency code)
            return /^[A-Z]{3}$/.test(v);
          },
          message: 'Currency must be a valid 3-letter ISO 4217 code (e.g., USD, EUR, GBP)',
        },
      },
    },
    fulfillment: {
      mode: {
        type: String,
        enum: ['manual_dropship', 'manual_stock', 'other'],
        default: 'manual_dropship',
      },
      supplierLeadTimeMinDays: {
        type: Number,
        min: 0,
        validate: {
          validator: function(this: any, value: number) {
            // Validate supplierLeadTimeMinDays <= supplierLeadTimeMaxDays when both are present
            const maxDays = this.fulfillment?.supplierLeadTimeMaxDays;
            if (maxDays !== undefined && value !== undefined) {
              return value <= maxDays;
            }
            return true;
          },
          message: 'supplierLeadTimeMinDays must be less than or equal to supplierLeadTimeMaxDays',
        },
      },
      supplierLeadTimeMaxDays: {
        type: Number,
        min: 0,
        validate: {
          validator: function(this: any, value: number) {
            // Validate supplierLeadTimeMaxDays >= supplierLeadTimeMinDays when both are present
            const minDays = this.fulfillment?.supplierLeadTimeMinDays;
            if (minDays !== undefined && value !== undefined) {
              return value >= minDays;
            }
            return true;
          },
          message: 'supplierLeadTimeMaxDays must be greater than or equal to supplierLeadTimeMinDays',
        },
      },
    },
    internalNotes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      // Automatically exclude private fields when converting to JSON
      transform: function(doc: any, ret: any) {
        delete ret.supplierSource;
        delete ret.supplierCost;
        delete ret.fulfillment;
        delete ret.internalNotes;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      // Also exclude from toObject for consistency
      transform: function(doc: any, ret: any) {
        delete ret.supplierSource;
        delete ret.supplierCost;
        delete ret.fulfillment;
        delete ret.internalNotes;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Index for faster queries
ProductSchema.index({ slug: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ featured: 1, newArrival: 1, bestSeller: 1 });
ProductSchema.index({ price: 1 });

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
