import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
   content: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  subcategory: {
    type: String,
    required: true
  },
  votedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  tags: [String],
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  views: { type: Number, default: 0 },
  votes: { type: Number, default: 0 },
  answers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Answer' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date,
  trending: { type: Boolean, default: false }
});

export default mongoose.model('Question', questionSchema);
