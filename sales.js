// routes/sales.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Sale = require('../models/Sale');
const Product = require('../models/Product');

// POST /api/sales
router.post('/', async (req, res) => {
  const { product, quantitySold, sellingPrice, date, soldBy } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const prod = await Product.findById(product).session(session);
    if (!prod) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Product not found' });
    }

    const qty = Number(quantitySold || 0);
    if (qty <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'quantitySold must be positive' });
    }

    // Validate stock
    if ((prod.stock || 0) < qty) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Insufficient stock', available: prod.stock });
    }

    // create sale (pre-validate hook will set totalAmount)
    const sale = new Sale({ product, quantitySold: qty, sellingPrice, date, soldBy });
    await sale.validate();
    await sale.save({ session });

    // decrease stock
    prod.stock = prod.stock - qty;
    if (prod.stock < 0) prod.stock = 0; // double safety
    await prod.save({ session });

    await session.commitTransaction();
    session.endSession();

    const populated = await Sale.findById(sale._id).populate('product soldBy');
    return res.status(201).json(populated);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error(err);
    return res.status(500).json({ message: 'Could not create sale', error: err.message });
  }
});

// GET /api/sales
router.get('/', async (req, res) => {
  try {
    const sales = await Sale.find().populate('product soldBy').sort({ date: -1 });
    return res.json(sales);
  } catch (err) {
    return res.status(500).json({ message: 'Could not fetch sales', error: err.message });
  }
});

module.exports = router;
s