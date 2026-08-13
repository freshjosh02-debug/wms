const mongoose = require('mongoose');

// Warehouse Model
const warehouseSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, unique: true, uppercase: true },
  address: {
    street: String, city: String, state: String, country: String, zipCode: String
  },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  capacity: { type: Number, default: 10000 },
  usedCapacity: { type: Number, default: 0 },
  type: { type: String, enum: ['main', 'transit', 'cold_storage', 'hazmat', 'retail'], default: 'main' },
  isActive: { type: Boolean, default: true },
  phone: String,
  email: String,
  operatingHours: {
    open: { type: String, default: '08:00' },
    close: { type: String, default: '18:00' },
    workDays: [{ type: String }]
  },
  zones: [{ name: String, code: String, type: String }]
}, { timestamps: true });

// Location Model
const locationSchema = new mongoose.Schema({
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  zone: { type: String, required: true },
  aisle: { type: String, required: true },
  rack: { type: String, required: true },
  shelf: { type: String, required: true },
  bin: { type: String },
  code: { type: String, unique: true },
  capacity: { type: Number, default: 100 },
  usedCapacity: { type: Number, default: 0 },
  type: { type: String, enum: ['standard', 'bulk', 'cold', 'hazmat', 'oversize'], default: 'standard' },
  isActive: { type: Boolean, default: true },
  currentProduct: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }
}, { timestamps: true });

locationSchema.pre('save', function (next) {
  if (!this.code) {
    this.code = `${this.zone}-${this.aisle}-${this.rack}-${this.shelf}${this.bin ? '-' + this.bin : ''}`;
  }
  next();
});

// Operation/Movement Model (Goods In/Out/Transfer)
const operationSchema = new mongoose.Schema({
  type: { type: String, enum: ['goods_in', 'goods_out', 'transfer', 'adjustment', 'return', 'stocktake'], required: true },
  referenceNumber: { type: String, unique: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
  fromLocation: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
  toLocation: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
  quantity: { type: Number, required: true },
  previousQuantity: { type: Number },
  newQuantity: { type: Number },
  reason: { type: String },
  notes: { type: String },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['pending', 'completed', 'failed', 'reversed'], default: 'completed' },
  batchNumber: String,
  expiryDate: Date
}, { timestamps: true });

operationSchema.pre('save', async function (next) {
  if (!this.referenceNumber) {
    const prefixes = { goods_in: 'GI', goods_out: 'GO', transfer: 'TF', adjustment: 'ADJ', return: 'RET', stocktake: 'ST' };
    const count = await mongoose.model('Operation').countDocuments();
    this.referenceNumber = `${prefixes[this.type] || 'OP'}-${Date.now().toString().slice(-6)}-${count}`;
  }
  next();
});

// Notification Model
const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['low_stock', 'order_update', 'system', 'alert', 'info', 'success', 'warning'], default: 'info' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isRead: { type: Boolean, default: false },
  link: String,
  data: mongoose.Schema.Types.Mixed,
  readAt: Date
}, { timestamps: true });

// Audit Log Model
const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  entity: { type: String, required: true },
  entityId: { type: mongoose.Schema.Types.ObjectId },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  changes: mongoose.Schema.Types.Mixed,
  ipAddress: String,
  userAgent: String,
  timestamp: { type: Date, default: Date.now }
}, { timestamps: false });

module.exports = {
  Warehouse: mongoose.model('Warehouse', warehouseSchema),
  Location: mongoose.model('Location', locationSchema),
  Operation: mongoose.model('Operation', operationSchema),
  Notification: mongoose.model('Notification', notificationSchema),
  AuditLog: mongoose.model('AuditLog', auditLogSchema)
};
