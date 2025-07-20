import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // recipient
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // sender
  type: { type: String, enum: ['reply', 'like', 'follow', 'mention'] },
  content: String,
  link: String,
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Notification', notificationSchema);
