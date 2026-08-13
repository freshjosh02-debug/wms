const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Order = require('../models/Order');
const { Operation } = require('../models/index');
const { auth, hasPermission } = require('../middleware/auth');

const toCSV = (headers, rows) => {
  const escape = (val) => {
    if (val == null) return '';
    const str = String(val);
    return str.includes(',') || str.includes('"') || str.includes('\n')
      ? `"${str.replace(/"/g, '""')}"`
      : str;
  };
  return [headers.join(','), ...rows.map(r => r.map(escape).join(','))].join('\n');
};

// GET /api/reports/inventory
router.get('/inventory', auth, async (req, res) => {
  try {
    const { format = 'json', category, warehouse } = req.query;
    const query = { isActive: true };
    if (category) query.category = category;
    if (warehouse) query.warehouse = warehouse;

    const products = await Product.find(query)
      .populate('location', 'code zone')
      .populate('warehouse', 'name')
      .sort('name');

    if (format === 'csv') {
      const headers = ['SKU', 'Name', 'Category', 'Quantity', 'Reserved', 'Available', 'Reorder Point', 'Cost Price', 'Location', 'Warehouse', 'Status'];
      const rows = products.map(p => [
        p.sku, p.name, p.category, p.quantity, p.reservedQuantity,
        p.availableQuantity, p.reorderPoint, p.costPrice,
        p.location?.code || 'N/A', p.warehouse?.name || 'N/A',
        p.quantity === 0 ? 'Out of Stock' : p.quantity <= p.reorderPoint ? 'Low Stock' : 'In Stock'
      ]);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="inventory-report.csv"');
      return res.send(toCSV(headers, rows));
    }

    res.json({ success: true, data: products, total: products.length });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/reports/orders
router.get('/orders', auth, async (req, res) => {
  try {
    const { format = 'json', status, type, from, to } = req.query;
    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    const orders = await Order.find(query)
      .populate('assignedTo', 'name')
      .populate('createdBy', 'name')
      .sort('-createdAt');

    if (format === 'csv') {
      const headers = ['Order #', 'Type', 'Status', 'Priority', 'Customer', 'Items', 'Total Value', 'Assigned To', 'Created', 'Updated'];
      const rows = orders.map(o => [
        o.orderNumber, o.type, o.status, o.priority,
        o.customer?.name || o.supplier?.name || 'N/A',
        o.totalItems, o.totalValue,
        o.assignedTo?.name || 'Unassigned',
        new Date(o.createdAt).toLocaleDateString(),
        new Date(o.updatedAt).toLocaleDateString()
      ]);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="orders-report.csv"');
      return res.send(toCSV(headers, rows));
    }

    res.json({ success: true, data: orders, total: orders.length });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/reports/movements
router.get('/movements', auth, async (req, res) => {
  try {
    const { format = 'json', type, from, to } = req.query;
    const query = {};
    if (type) query.type = type;
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    const ops = await Operation.find(query)
      .populate('product', 'name sku')
      .populate('performedBy', 'name')
      .sort('-createdAt').limit(500);

    if (format === 'csv') {
      const headers = ['Reference', 'Type', 'Product', 'SKU', 'Quantity', 'Previous Qty', 'New Qty', 'Performed By', 'Date'];
      const rows = ops.map(o => [
        o.referenceNumber, o.type,
        o.product?.name || 'N/A', o.product?.sku || 'N/A',
        o.quantity, o.previousQuantity, o.newQuantity,
        o.performedBy?.name || 'System',
        new Date(o.createdAt).toLocaleDateString()
      ]);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="movements-report.csv"');
      return res.send(toCSV(headers, rows));
    }

    res.json({ success: true, data: ops, total: ops.length });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/reports/analytics
router.get('/analytics', auth, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [
      topMovingProducts, categoryAnalysis, dailyOrders, orderFulfillment
    ] = await Promise.all([
      Operation.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo }, type: { $in: ['goods_in', 'goods_out'] } } },
        { $group: { _id: '$product', totalMoved: { $sum: '$quantity' }, operations: { $sum: 1 } } },
        { $sort: { totalMoved: -1 } },
        { $limit: 10 },
        { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
        { $unwind: '$product' },
        { $project: { name: '$product.name', sku: '$product.sku', totalMoved: 1, operations: 1 } }
      ]),
      Product.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$category', products: { $sum: 1 }, totalQty: { $sum: '$quantity' }, avgPrice: { $avg: '$costPrice' }, totalValue: { $sum: { $multiply: ['$quantity', '$costPrice'] } } } },
        { $sort: { totalValue: -1 } }
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 }, value: { $sum: '$totalValue' } } },
        { $sort: { _id: 1 } }
      ]),
      Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    res.json({ success: true, data: { topMovingProducts, categoryAnalysis, dailyOrders, orderFulfillment } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
