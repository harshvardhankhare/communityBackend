import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Question from '../models/Question.js';
import Conversation from '../models/Conversation.js'

const router = express.Router();

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashed });
    await newUser.save();
    res.status(201).json({ message: "User Created" });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Error while creating user" });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    console.log(user._id)
    req.session.user =  user._id;
    res.status(200).json({ message: 'Login successful' });
  } catch (err) {
    res.status(500).json({ message: 'Login error' });
  }
});


// logout
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ message: 'Logout failed' });
    }
    res.clearCookie('connect.sid'); // clear the session cookie (default name)
    res.status(200).json({ message: 'Logged out successfully' });
  });
});


// GET /auth/me
router.get('/me', async (req, res) => {
  try {

    if (!req.session.user) {
      return res.status(401).json({ message: 'Not logged in' });
    }

    const user = await User.findById(req.session.user).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});
router.get('/check-session', (req, res) => {
  if (req.session.user) {
    res.json({ loggedIn: true, user: req.session.user });
  } else {
    res.json({ loggedIn: false });
  }
});

router.put('/profile', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ message: 'Not logged in' });

  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.session.user,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

router.post('/question', async (req, res) => {
  
  const { content, category, subcategory } = req.body;

  // Validate input
  if (!content || !category || !subcategory) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  // Session check
  if (!req.session.user) {
    
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const newQuestion = new Question({
      content,
      category,
      subcategory,
      user: req.session.user, // should be user._id stored during login
    });

    await newQuestion.save();

    res.status(201).json({ message: 'Question posted successfully', question: newQuestion });
  } catch (error) {
    console.error('Error posting question:', error);
    res.status(500).json({ message: 'Error posting question' });
  }
});


// routes/questions.js
router.get("/question", async (req, res) => {
  try {
    const questions = await Question.find().populate('user', 'username email avatar').sort({ createdAt: -1 });
    res.json(questions);
  } catch (err) {
    res.status(500).json({ message: "Error fetching questions" });
  }
});
router.get("/questions/popular", async (req, res) => {
  try {
    const questions = await Question.find({ votes: { $gt: 10 } })
      .populate('user', 'username')
       // optional: sort by most votes
       console.log(questions)
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});


// GET /users/:id
router.get('/users/:id', async (req, res) => {
  try {
    console.log("id is "+req.params.id)
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});





// messages 

router.post('/start', async (req, res) => {
  const { receiverId } = req.body;
  const senderId = req.session.user;
  if (!senderId) return res.status(401).json({ message: 'Not logged in' });

  try {
    let conv = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] }
    });
    if (!conv) {
      conv = await Conversation.create({
        participants: [senderId, receiverId]
      });
    }
    res.status(200).json(conv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Start conversation error' });
  }
});

// 2️⃣ Retrieve all conversations for the logged-in user
router.get('/getconvo', async (req, res) => {
  const userId = req.session.user;
  if (!userId) return res.status(401).json({ message: 'Not logged in' });

  try {
    const convs = await Conversation.find({ participants: userId })
      .populate('participants', 'username')
      .sort({ updatedAt: -1 });
    res.json(convs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Fetch conversations error' });
  }
});

// 3️⃣ Post a message in a conversation
router.post('/:conversationId/message', async (req, res) => {
  const senderId = req.session.user;
  const { conversationId } = req.params;
  const { text } = req.body;
  if (!senderId) return res.status(401).json({ message: 'Not logged in' });

  try {
    const conv = await Conversation.findById(conversationId);
    if (!conv || !conv.participants.includes(senderId)) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const msg = {
      sender: senderId,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false
    };
    conv.messages.push(msg);
    conv.lastMessage = text;
    conv.unreadCount++;
    conv.updatedAt = Date.now();
    await conv.save();

    res.status(201).json(conv.messages[conv.messages.length - 1]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Send message error' });
  }
});

// 4️⃣ Retrieve messages for a specific conversation
router.get('/:conversationId/messages', async (req, res) => {
  const userId = req.session.user;
  const { conversationId } = req.params;
  if (!userId) return res.status(401).json({ message: 'Not logged in' });

  try {
    const conv = await Conversation.findById(conversationId)
      .populate('messages.sender', 'username')
      .populate('participants', 'username avatar');
    if (!conv || !conv.participants.some(p => p._id.equals(userId))) {
      return res.status(404).json({ message: 'Not authorized' });
    }
    res.json(conv.messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Fetch messages error' });
  }
});

router.post('/question/:id/vote', async (req, res) => {
  const { id } = req.params;
  const { voteType } = req.body; // 'upvote' or 'downvote'
   const userId = req.session.user._id;

  try {

    const question = await Question.findById(id);
    if (!question) return res.status(404).json({ message: 'Question not found' });

   if (question.votedUsers.includes(userId)) {
      return res.status(400).json({ message: "You have already voted" });
    }

    if (voteType === 'upvote') {
      question.votes = (question.votes || 0) + 1;
      question.votedUsers.push(userId);
    } else if (voteType === 'downvote') {
      question.votes = (question.votes || 0) - 1;
    }


    await question.save();

    return res.json({ votes: question.votes });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to update vote' });
  }
});




export default router;
