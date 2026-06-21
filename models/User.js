const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  preferences: {
    categories: {
      type: [String],
      default: ['technology'],
      enum: {
        values: ['technology', 'sports', 'business', 'entertainment', 'health', 'science', 'politics'],
        message: '{VALUE} is not a valid category'
      }
    },
    language: { type: String, default: 'en' },
    country: { type: String, default: 'us' }
  },
  // Read articles (store article id + metadata)
  readArticles: [
    {
      articleId: { type: String, required: true },
      title: String,
      url: String,
      readAt: { type: Date, default: Date.now }
    }
  ],
  // Favorite articles
  favoriteArticles: [
    {
      articleId: { type: String, required: true },
      title: String,
      url: String,
      description: String,
      savedAt: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

// ─── Hash password before saving ─────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ─── Compare password method ──────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);