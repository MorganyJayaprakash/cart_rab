const mongoose = require('mongoose');

const statusSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true }, // can be text or image URL
  type: { type: String, enum: ['text', 'image'], default: 'text' },
  backgroundColor: { type: String, default: '#00a884' }, // for text statuses
  viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

// Auto-delete statuses after 24 hours
statusSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Status', statusSchema);
