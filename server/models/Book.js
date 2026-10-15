import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    author: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 3000 },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true, maxlength: 60 },
    coverUrl: { type: String, trim: true, default: '' },
    stock: { type: Number, required: true, min: 0, default: 0, validate: Number.isInteger },
    isbn: { type: String, trim: true, default: '' },
  },
  { timestamps: true } // createdAt is the "creation date"
);

bookSchema.index({ createdAt: -1 });
bookSchema.index({ category: 1 });

bookSchema.set('toJSON', { transform: (_d, ret) => { delete ret.__v; return ret; } });

export default mongoose.model('Book', bookSchema);
