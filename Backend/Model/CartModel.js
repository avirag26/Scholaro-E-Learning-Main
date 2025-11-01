import mongoose from 'mongoose';

const CartItemSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'courses',
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const CartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [CartItemSchema],
  totalAmount: {
    type: Number,
    default: 0
  },
  totalItems: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Calculate totals before saving
CartSchema.pre('save', async function(next) {
  if (this.isModified('items')) {
    await this.populate('items.course');
    
    this.totalItems = this.items.length;
    this.totalAmount = this.items.reduce((total, item) => {
      const price = item.course.price;
      const discount = item.course.offer_percentage || 0;
      const finalPrice = price - (price * discount / 100);
      return total + finalPrice;
    }, 0);
  }
  next();
});

const Cart = mongoose.model('Cart', CartSchema);
export default Cart;