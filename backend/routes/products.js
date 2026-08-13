const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { Operation } = require('../models/index');
const { auth, authorize } = require('../middleware/auth');

// GET /api/products
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, category, warehouse, lowStock, sort = '-createdAt' } = req.query;
    const query = { isActive: true };

    if (search) query.$text = { $search: search };
    if (category) query.category = category;
    if (warehouse) query.warehouse = warehouse;
    if (lowStock === 'true') query.$expr = { $lte: ['$quantity', '$reorderPoint'] };

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('location', 'code zone aisle rack shelf')
        .populate('warehouse', 'name code')
        .populate('createdBy', 'name')
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      Product.countDocuments(query)
    ]);

    res.json({ success: true, data: products, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/products/categories
router.get('/categories', auth, async (req, res) => {
  try {
    const categories = await Product.distinct('category', { isActive: true });
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/products/low-stock
router.get('/low-stock', auth, async (req, res) => {
  try {
    const products = await Product.find({
      isActive: true,
      $expr: { $lte: ['$quantity', '$reorderPoint'] }
    }).populate('location', 'code').populate('warehouse', 'name').sort({ quantity: 1 }).limit(50);
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/products/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('location')
      .populate('warehouse', 'name code')
      .populate('createdBy', 'name email');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/products
router.post('/', auth, authorize('admin', 'manager'), async (req, res) => {
  try {
    const product = await Product.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'SKU or barcode already exists' });
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/products/:id
router.put('/:id', auth, authorize('admin', 'manager'), async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user._id },
      { new: true, runValidators: true }
    ).populate('location warehouse');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/products/:id/quantity
router.patch('/:id/quantity', auth, async (req, res) => {
  try {
    const { quantity, type, reason, notes } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const previousQuantity = product.quantity;
    const adjustment = type === 'set' ? quantity : (type === 'add' ? quantity : -quantity);
    product.quantity = type === 'set' ? quantity : Math.max(0, product.quantity + adjustment);
    await product.save();

    await Operation.create({
      type: 'adjustment',
      product: product._id,
      warehouse: product.warehouse,
      quantity: Math.abs(adjustment),
      previousQuantity,
      newQuantity: product.quantity,
      reason,
      notes,
      performedBy: req.user._id
    });

    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/products/:id
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
