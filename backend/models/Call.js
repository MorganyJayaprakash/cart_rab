const mongoose = require('mongoose');

const callSchema = new mongoose.Schema({
  callerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  callType: { type: String, enum: ['audio', 'video'], required: true },
  status: { type: String, enum: ['missed', 'completed', 'rejected'], required: true },
  duration: { type: Number, default: 0 }, // in seconds
  startedAt: { type: Date, required: true },
  endedAt: { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Call', callSchema);
