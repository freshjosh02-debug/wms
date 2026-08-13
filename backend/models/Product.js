const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const productSchema = new mongoose.Schema({
  sku: { type: String, unique: true, default: () => `SKU-${uuidv4().slice(0, 8).toUpperCase()}` },
  barcode: { type: String, unique: true, sparse: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  category: { type: String, required: true, trim: true },
  subcategory: { type: String, trim: true },
  brand: { type: String, trim: true },
  unit: { type: String, default: 'pcs', enum: ['pcs', 'kg', 'lbs', 'liters', 'meters', 'boxes', 'pallets', 'cartons'] },
  quantity: { type: Number, default: 0, min: 0 },
  reservedQuantity: { type: Number, default: 0, min: 0 },
  availableQuantity: { type: Number, default: 0, min: 0 },
  reorderPoint: { type: Number, default: 10 },
  reorderQuantity: { type: Number, default: 50 },
  maxQuantity: { type: Number, default: 1000 },
  costPrice: { type: Number, default: 0, min: 0 },
  sellingPrice: { type: Number, default: 0, min: 0 },
  location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  images: [String],
  weight: { type: Number, default: 0 },
  dimensions: {
    length: { type: Number, default: 0 },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 }
  },
  supplier: {
    name: String,
    contact: String,
    email: String,
    leadTime: Number
  },
  tags: [String],
  isActive: { type: Boolean, default: true },
  expiryDate: { type: Date },
  batchNumber: { type: String },
  notes: { type: String },
  lastRestocked: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Auto-calculate availableQuantity
productSchema.pre('save', function (next) {
  this.availableQuantity = Math.max(0, this.quantity - this.reservedQuantity);
  next();
});

// Virtual for low stock status
productSchema.virtual('isLowStock').get(function () {
  return this.quantity <= this.reorderPoint;
});

// Virtual for out of stock
productSchema.virtual('isOutOfStock').get(function () {
  return this.quantity === 0;
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

// Indexes
productSchema.index({ name: 'text', sku: 'text', category: 'text', barcode: 'text' });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ quantity: 1, reorderPoint: 1 });

module.exports = mongoose.model('Product', productSchema);
