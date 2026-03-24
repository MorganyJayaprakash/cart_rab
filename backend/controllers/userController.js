const User = require('../models/User');

exports.getUsers = async (req, res) => {
  try {
    const loggedInUserId = req.user.id;
    const users = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
