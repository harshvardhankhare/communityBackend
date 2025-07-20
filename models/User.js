import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: String,
  username: { type: String, unique: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  bio: String,
  location: String,
  joinDate: { type: Date, default: Date.now },
  github: String,
  twitter: String,
  linkedin: String,
  avatar: String,
  stats: {
    questions: { type: Number, default: 0 },
    answers: { type: Number, default: 0 },
    solutions: { type: Number, default: 0 },
    reputation: { type: Number, default: 0 },
  },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

export default mongoose.model('User', userSchema);
