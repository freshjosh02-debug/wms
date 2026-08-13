const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  sku: String,
  name: String,
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, default: 0 },
  totalPrice: { type: Number, default: 0 },
  pickedQuantity: { type: Number, default: 0 },
  location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' }
});

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  type: { type: String, enum: ['inbound', 'outbound', 'transfer', 'return'], required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'picked', 'packed', 'shipped', 'delivered', 'cancelled', 'returned'],
    default: 'pending'
  },
  priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
  items: [orderItemSchema],
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  destinationWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  customer: {
    name: String,
    email: String,
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String
    }
  },
  supplier: {
    name: String,
    email: String,
    phone: String,
    reference: String
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: String,
  internalNotes: String,
  trackingNumber: String,
  carrier: String,
  totalItems: { type: Number, default: 0 },
  totalValue: { type: Number, default: 0 },
  estimatedDelivery: Date,
  actualDelivery: Date,
  shippedAt: Date,
  confirmedAt: Date,
  statusHistory: [{
    status: String,
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now },
    note: String
  }],
  attachments: [String]
}, { timestamps: true });

// Auto-generate order number
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const prefix = { inbound: 'IN', outbound: 'OUT', transfer: 'TRF', return: 'RET' }[this.type] || 'ORD';
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `${prefix}-${String(count + 1).padStart(6, '0')}`;
  }
  // Calculate totals
  this.totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
  this.totalValue = this.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  next();
});


orderSchema.index({ status: 1, type: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ assignedTo: 1, status: 1 });

module.exports = mongoose.model('Order', orderSchema);
