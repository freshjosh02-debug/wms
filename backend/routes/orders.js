const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { Operation, Notification } = require('../models/index');
const { auth, authorize } = require('../middleware/auth');

// GET /api/orders
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, type, assignedTo, sort = '-createdAt', search } = req.query;
    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    if (assignedTo) query.assignedTo = assignedTo;
    if (search) query.$or = [
      { orderNumber: { $regex: search, $options: 'i' } },
      { 'customer.name': { $regex: search, $options: 'i' } }
    ];

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name')
        .populate('warehouse', 'name')
        .populate('items.product', 'name sku')
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      Order.countDocuments(query)
    ]);

    res.json({ success: true, data: orders, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/orders/stats
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, value: { $sum: '$totalValue' } } }
    ]);
    const typeStats = await Order.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    res.json({ success: true, data: { byStatus: stats, byType: typeStats } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/orders/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('assignedTo', 'name email role')
      .populate('createdBy', 'name email')
      .populate('warehouse', 'name code address')
      .populate('items.product', 'name sku barcode images')
      .populate('items.location', 'code zone aisle rack shelf');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/orders
router.post('/', auth, async (req, res) => {
  try {
    const order = await Order.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/orders/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('assignedTo', 'name email')
      .populate('items.product', 'name sku');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/orders/:id/status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status, note } = req.body;
    const order = await Order.findById(req.params.id).populate('items.product');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const previousStatus = order.status;
    order.status = status;
    order.statusHistory.push({ status, changedBy: req.user._id, note });

    // Update stock on key transitions
    if (status === 'delivered' && order.type === 'inbound') {
      for (const item of order.items) {
        const product = await Product.findById(item.product._id || item.product);
        if (product) {
          const prev = product.quantity;
          product.quantity += item.quantity;
          product.lastRestocked = new Date();
          await product.save();
          await Operation.create({
            type: 'goods_in', order: order._id, product: product._id,
            quantity: item.quantity, previousQuantity: prev, newQuantity: product.quantity,
            performedBy: req.user._id, warehouse: order.warehouse
          });
        }
      }
    } else if (status === 'shipped' && order.type === 'outbound') {
      for (const item of order.items) {
        const product = await Product.findById(item.product._id || item.product);
        if (product) {
          const prev = product.quantity;
          product.quantity = Math.max(0, product.quantity - item.quantity);
          await product.save();
          await Operation.create({
            type: 'goods_out', order: order._id, product: product._id,
            quantity: item.quantity, previousQuantity: prev, newQuantity: product.quantity,
            performedBy: req.user._id, warehouse: order.warehouse
          });
        }
      }
      order.shippedAt = new Date();
    }

    if (status === 'delivered') order.actualDelivery = new Date();
    if (status === 'confirmed') order.confirmedAt = new Date();

    await order.save();
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/orders/:id
router.delete('/:id', auth, authorize('admin', 'manager'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (['shipped', 'delivered'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Cannot delete completed orders' });
    }
    order.status = 'cancelled';
    order.statusHistory.push({ status: 'cancelled', changedBy: req.user._id });
    await order.save();
    res.json({ success: true, message: 'Order cancelled' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
