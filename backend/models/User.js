const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['admin', 'manager', 'staff'], default: 'staff' },
  avatar: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  permissions: [{
    type: String,
    enum: ['read', 'write', 'delete', 'manage_users', 'manage_warehouse', 'view_reports', 'export_data']
  }],
  warehouseAccess: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' }],
  notifications: {
    email: { type: Boolean, default: true },
    lowStock: { type: Boolean, default: true },
    orderUpdates: { type: Boolean, default: true }
  }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Set default permissions based on role
userSchema.pre('save', function (next) {
  if (this.isModified('role')) {
    const rolePermissions = {
      admin: ['read', 'write', 'delete', 'manage_users', 'manage_warehouse', 'view_reports', 'export_data'],
      manager: ['read', 'write', 'manage_warehouse', 'view_reports', 'export_data'],
      staff: ['read', 'write']
    };
    this.permissions = rolePermissions[this.role] || ['read'];
  }
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
