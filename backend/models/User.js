const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
      lowercase: true,
    },
    phone: {
      type: String,
      // Optional: Google users won't have a phone initially (prompted after sign-in)
      default: '',
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // allows multiple docs without a googleId
    },
    password: {
      type: String,
      // Required only for accounts that did not sign up via Google
      required: [
        function () {
          return !this.googleId;
        },
        'Please add a password',
      ],
      minlength: 6,
      select: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  // Skip if password unchanged or not set (e.g. Google accounts)
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false; // Google-only account, no password set
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
