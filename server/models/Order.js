import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema(
  {
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    // Snapshot of the book at purchase time, so history survives edits and deletions.
    title: { type: String, required: true },
    author: { type: String, default: '' },
    coverUrl: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: { type: [itemSchema], validate: (v) => v.length > 0 },
    total: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['placed', 'processing', 'shipped', 'delivered', 'cancelled'], default: 'placed' },
    paymentMethod: { type: String, default: 'pay_on_delivery' }, // no online payment gateway
    shippingAddress: {
      fullName: String, phone: String, address: String, city: String, postalCode: String,
    },
  },
  { timestamps: true }
);

orderSchema.index({ createdAt: -1 });
orderSchema.set('toJSON', { transform: (_d, ret) => { delete ret.__v; return ret; } });

export default mongoose.model('Order', orderSchema);
