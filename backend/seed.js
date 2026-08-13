require('dotenv').config();
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');
const { Warehouse, Location, Operation } = require('./models/index');

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wms');
  console.log('Connected to MongoDB');

  // Clear existing 
 await Promise.all([
    User.deleteMany({}), Product.deleteMany({}), Order.deleteMany({}),
    Warehouse.deleteMany({}), Location.deleteMany({}), Operation.deleteMany({})
  ]);
  // Drop indexes to reset auto-increment counters
  try { await mongoose.connection.collection('orders').dropIndexes(); } catch(e) {}
  console.log('Cleared existing data');

  // Create users
  const users = await User.create([
    { name: 'Admin User', email: 'admin@wms.com', password: 'admin123', role: 'admin' },
    { name: 'Sarah Johnson', email: 'manager@wms.com', password: 'manager123', role: 'manager' },
    { name: 'Mike Chen', email: 'staff@wms.com', password: 'staff123', role: 'staff' },
    { name: 'Emma Davis', email: 'emma@wms.com', password: 'staff123', role: 'staff' }
  ]);
  console.log('✅ Users created');

  // Create warehouses
  const warehouses = await Warehouse.create([
    {
      name: 'Main Distribution Center', code: 'MDC-01',
      address: { street: '123 Industrial Ave', city: 'Lagos', state: 'Lagos', country: 'Nigeria', zipCode: '100001' },
      manager: users[1]._id, capacity: 50000, type: 'main',
      zones: ['Zone A - Electronics', 'Zone B - Apparel', 'Zone C - Food & Beverage', 'Zone D - Bulk Storage']
    },
    {
      name: 'Secondary Warehouse', code: 'SW-02',
      address: { street: '456 Commerce Blvd', city: 'Abuja', state: 'FCT', country: 'Nigeria', zipCode: '900001' },
      manager: users[1]._id, capacity: 20000, type: 'transit'
    }
  ]);
  console.log('✅ Warehouses created');

  // Create locations
  const locations = [];
  const zones = ['A', 'B', 'C', 'D'];
  const aisles = ['01', '02', '03'];
  const racks = ['R1', 'R2', 'R3'];
  const shelves = ['S1', 'S2', 'S3', 'S4'];

  for (const zone of zones) {
    for (const aisle of aisles) {
      for (const rack of racks) {
        for (const shelf of shelves.slice(0, 2)) {
          locations.push({
            warehouse: warehouses[0]._id,
            zone, aisle, rack, shelf,
            code: `${zone}-${aisle}-${rack}-${shelf}`,
            capacity: 100, usedCapacity: Math.floor(Math.random() * 80)
          });
        }
      }
    }
  }
  const savedLocations = await Location.create(locations);
  console.log('✅ Locations created');

  // Create products
  const categories = ['Electronics', 'Apparel', 'Food & Beverage', 'Hardware', 'Office Supplies', 'Furniture'];
  const products = [];
  const productNames = [
    ['Laptop Pro 15"', 'Wireless Mouse', 'USB-C Hub', 'Mechanical Keyboard', 'Monitor 27"', '4K Webcam', 'Noise Cancelling Headphones', 'External SSD 1TB'],
    ['Men\'s T-Shirt', 'Women\'s Jeans', 'Running Shoes', 'Winter Jacket', 'Sports Socks (Pack of 5)', 'Baseball Cap', 'Leather Belt', 'Casual Sneakers'],
    ['Bottled Water (24pk)', 'Energy Drink (12pk)', 'Coffee Beans 1kg', 'Green Tea (50 bags)', 'Protein Bars (24pk)', 'Orange Juice 2L'],
    ['Power Drill', 'Screwdriver Set', 'Measuring Tape', 'Safety Helmet', 'Work Gloves', 'Tool Box'],
    ['A4 Paper (500 sheets)', 'Ballpoint Pens (12pk)', 'Stapler', 'Sticky Notes', 'File Folders (50pk)', 'Whiteboard Markers'],
    ['Office Chair', 'Standing Desk', 'Bookshelf', 'Filing Cabinet', 'Monitor Stand', 'Desk Lamp']
  ];

  for (let ci = 0; ci < categories.length; ci++) {
    for (const pname of productNames[ci]) {
      const qty = Math.floor(Math.random() * 500) + 5;
      const reorder = Math.floor(Math.random() * 50) + 10;
      const cost = Math.floor(Math.random() * 50000) + 500;
      products.push({
        name: pname,
        category: categories[ci],
        sku: `SKU-${categories[ci].slice(0, 3).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        barcode: `BAR${Date.now()}${Math.floor(Math.random() * 9999)}`,
        quantity: qty,
        reorderPoint: reorder,
        reorderQuantity: reorder * 3,
        maxQuantity: 1000,
        costPrice: cost,
        sellingPrice: Math.floor(cost * 1.3),
        unit: ci === 0 ? 'pcs' : ci === 2 ? 'boxes' : 'pcs',
        location: savedLocations[Math.floor(Math.random() * savedLocations.length)]._id,
        warehouse: warehouses[0]._id,
        createdBy: users[0]._id,
        supplier: {
          name: `Supplier ${Math.floor(Math.random() * 10) + 1}`,
          email: `supplier${Math.floor(Math.random() * 10) + 1}@vendor.com`,
          leadTime: Math.floor(Math.random() * 14) + 1
        }
      });
    }
  }

  const savedProducts = await Product.create(products);
  console.log('✅ Products created');

  // Create orders
  const orderTypes = ['inbound', 'outbound', 'transfer', 'return'];
  const statuses = {
    inbound: ['pending', 'confirmed', 'processing', 'delivered'],
    outbound: ['pending', 'confirmed', 'processing', 'picked', 'packed', 'shipped', 'delivered'],
    transfer: ['pending', 'processing', 'delivered'],
    return: ['pending', 'processing', 'delivered']
  };

  const orders = [];
  for (let i = 0; i < 50; i++) {
    const type = orderTypes[Math.floor(Math.random() * orderTypes.length)];
    const statusArr = statuses[type];
    const status = statusArr[Math.floor(Math.random() * statusArr.length)];
    const numItems = Math.floor(Math.random() * 4) + 1;
    const items = [];
    for (let j = 0; j < numItems; j++) {
      const prod = savedProducts[Math.floor(Math.random() * savedProducts.length)];
      const qty = Math.floor(Math.random() * 20) + 1;
      items.push({
        product: prod._id, sku: prod.sku, name: prod.name,
        quantity: qty, unitPrice: prod.sellingPrice, totalPrice: qty * prod.sellingPrice
      });
    }
    orders.push({
      type, status, items, warehouse: warehouses[0]._id,
      priority: ['low', 'normal', 'high', 'urgent'][Math.floor(Math.random() * 4)],
      customer: type === 'outbound' ? {
        name: `Customer ${i + 1}`, email: `customer${i + 1}@example.com`,
        phone: `+234${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        address: { street: `${i + 1} Main St`, city: 'Lagos', country: 'Nigeria' }
      } : undefined,
      supplier: type === 'inbound' ? {
        name: `Supplier ${i + 1}`, email: `supplier${i + 1}@vendor.com`
      } : undefined,
      assignedTo: users[2 + (i % 2)]._id,
      createdBy: users[Math.floor(Math.random() * 2)]._id,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
    });
  }
  await Order.create(orders);
  console.log('✅ Orders created');

  // Create operations
  const ops = [];
  for (let i = 0; i < 100; i++) {
    const prod = savedProducts[Math.floor(Math.random() * savedProducts.length)];
    const type = ['goods_in', 'goods_out', 'adjustment', 'transfer'][Math.floor(Math.random() * 4)];
    const qty = Math.floor(Math.random() * 50) + 1;
    ops.push({
      type, product: prod._id, warehouse: warehouses[0]._id,
      quantity: qty, previousQuantity: prod.quantity,
      newQuantity: type === 'goods_in' ? prod.quantity + qty : Math.max(0, prod.quantity - qty),
      performedBy: users[2 + (i % 2)]._id,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
    });
  }
  await Operation.create(ops);
  console.log('✅ Operations created');

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📋 Login credentials:');
  console.log('  Admin:   admin@wms.com    / admin123');
  console.log('  Manager: manager@wms.com  / manager123');
  console.log('  Staff:   staff@wms.com    / staff123');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
