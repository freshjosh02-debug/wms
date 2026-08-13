const express = require('express');
const router = express.Router();
const { Location } = require('../models/index');
const { auth, authorize } = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const { warehouse, zone, available } = req.query;
    const query = { isActive: true };
    if (warehouse) query.warehouse = warehouse;
    if (zone) query.zone = zone;
    if (available === 'true') query.$expr = { $lt: ['$usedCapacity', '$capacity'] };
    const locations = await Location.find(query).populate('warehouse', 'name').populate('currentProduct', 'name sku');
    res.json({ success: true, data: locations });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', auth, authorize('admin', 'manager'), async (req, res) => {
  try {
    const location = await Location.create(req.body);
    res.status(201).json({ success: true, data: location });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:id', auth, authorize('admin', 'manager'), async (req, res) => {
  try {
    const location = await Location.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: location });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    await Location.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Location deactivated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
