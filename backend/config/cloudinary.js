const { v2: cloudinary } = require('cloudinary');

// Configure Cloudinary from environment variables.
// Set these in backend/.env (locally) and in Render's environment (production).
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;
