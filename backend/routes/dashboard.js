const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Order = require('../models/Order');
const { Operation } = require('../models/index');
const { auth } = require('../middleware/auth');

router.get('/stats', auth, async (req, res) => {
  try {
    const [
      totalProducts, lowStockProducts, outOfStock,
      totalOrders, pendingOrders, processingOrders,
      recentOps, ordersByStatus, inventoryByCategory,
      stockMovement
    ] = await Promise.all([
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ isActive: true, $expr: { $lte: ['$quantity', '$reorderPoint'] } }),
      Product.countDocuments({ isActive: true, quantity: 0 }),
      Order.countDocuments({}),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: { $in: ['processing', 'picked', 'packed'] } }),
      Operation.find({}).populate('product', 'name sku').populate('performedBy', 'name').sort('-createdAt').limit(10),
      Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 }, value: { $sum: '$totalValue' } } }]),
      Product.aggregate([{ $match: { isActive: true } }, { $group: { _id: '$category', count: { $sum: 1 }, totalQty: { $sum: '$quantity' }, totalValue: { $sum: { $multiply: ['$quantity', '$costPrice'] } } } }, { $sort: { totalQty: -1 } }]),
      Operation.aggregate([
        { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
        { $group: { _id: { type: '$type', day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } } }, total: { $sum: '$quantity' } } },
        { $sort: { '_id.day': 1 } }
      ])
    ]);

    const totalInventoryValue = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, value: { $sum: { $multiply: ['$quantity', '$costPrice'] } } } }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalProducts, lowStockProducts, outOfStock,
          totalOrders, pendingOrders, processingOrders,
          inventoryValue: totalInventoryValue[0]?.value || 0
        },
        recentActivity: recentOps,
        ordersByStatus,
        inventoryByCategory,
        stockMovement
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
