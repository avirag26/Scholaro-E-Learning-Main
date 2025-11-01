import mongoose from 'mongoose';

const WishlistItemSchema = new mongoose.Schema({
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

const WishlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [WishlistItemSchema]
}, {
  timestamps: true
});

const Wishlist = mongoose.model('Wishlist', WishlistSchema);
export default Wishlist;