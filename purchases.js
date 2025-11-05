// routes/purchases.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier'); // optional, for validation

// POST /api/purchases
router.post('/', async (req, res) => {
  const { supplier, product, quantity, costPrice, date, purchasedBy } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Optional: validate supplier and product exist
    const prod = await Product.findById(product).session(session);
    if (!prod) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Product not found' });
    }

    // create purchase (pre-validate hook will set totalCost)
    const purchase = new Purchase({ supplier, product, quantity, costPrice, date, purchasedBy });
    await purchase.validate(); // ensure pre-validate ran
    await purchase.save({ session });

    // increase product stock
    prod.stock = Number(prod.stock || 0) + Number(quantity || 0);
    await prod.save({ session });

    await session.commitTransaction();
    session.endSession();

    // populate references for response
    const populated = await Purchase.findById(purchase._id).populate('supplier product purchasedBy');
    return res.status(201).json(populated);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error(err);
    return res.status(500).json({ message: 'Could not create purchase', error: err.message });
  }
});

// GET /api/purchases
router.get('/', async (req, res) => {
  try {
    const purchases = await Purchase.find()
      .populate('supplier product purchasedBy')
      .sort({ date: -1 });
    return res.json(purchases);
  } catch (err) {
    return res.status(500).json({ message: 'Could not fetch purchases', error: err.message });
  }
});

module.exports = router;
