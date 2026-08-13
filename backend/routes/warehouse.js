// warehouse.js
const express = require('express');
const router = express.Router();
const { Warehouse } = require('../models/index');
const { auth, authorize } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const warehouses = await Warehouse.find({ isActive: true }).populate('manager', 'name email');
    res.json({ success: true, data: warehouses });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
router.post('/', auth, authorize('admin'), async (req, res) => {
  try {
    const wh = await Warehouse.create(req.body);
    res.status(201).json({ success: true, data: wh });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
router.put('/:id', auth, authorize('admin', 'manager'), async (req, res) => {
  try {
    const wh = await Warehouse.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: wh });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    await Warehouse.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Warehouse deactivated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
