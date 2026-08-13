const express = require('express');
const router = express.Router();
const { Operation } = require('../models/index');
const Product = require('../models/Product');
const { auth } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, product, warehouse } = req.query;
    const query = {};
    if (type) query.type = type;
    if (product) query.product = product;
    if (warehouse) query.warehouse = warehouse;
    const [ops, total] = await Promise.all([
      Operation.find(query)
        .populate('product', 'name sku')
        .populate('performedBy', 'name')
        .populate('fromLocation toLocation', 'code')
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      Operation.countDocuments(query)
    ]);
    res.json({ success: true, data: ops, total });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST transfer between locations
router.post('/transfer', auth, async (req, res) => {
  try {
    const { productId, fromLocationId, toLocationId, quantity, notes } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    if (product.quantity < quantity) return res.status(400).json({ success: false, message: 'Insufficient stock' });

    const prev = product.quantity;
    product.location = toLocationId;
    await product.save();

    const op = await Operation.create({
      type: 'transfer', product: productId,
      fromLocation: fromLocationId, toLocation: toLocationId,
      quantity, previousQuantity: prev, newQuantity: product.quantity,
      notes, performedBy: req.user._id
    });

    res.status(201).json({ success: true, data: op });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
