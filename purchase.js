// models/Purchase.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const PurchaseSchema = new Schema({
  supplier: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 0 },
  costPrice: { type: Number, required: true, min: 0 },
  totalCost: { type: Number, required: true, min: 0 },
  date: { type: Date, default: Date.now },
  purchasedBy: { type: Schema.Types.ObjectId, ref: 'User' } // optional
});

// Auto-calc totalCost before validation/save
PurchaseSchema.pre('validate', function(next) {
  // ensure numbers
  this.quantity = Number(this.quantity) || 0;
  this.costPrice = Number(this.costPrice) || 0;
  this.totalCost = this.quantity * this.costPrice;
  next();
});

module.exports = mongoose.model('Purchase', PurchaseSchema);
