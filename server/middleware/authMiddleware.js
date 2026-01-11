const jwt = require('jsonwebtoken');
const User = require('../models/User.js');

// This is our security guard. It will protect routes that require a user to be logged in.
const protect = async (req, res, next) => {
  let token;

  // 1. Check if the request has an "Authorization" header and if it starts with "Bearer"
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // 2. Get the token from the header (it's in the format "Bearer <token>")
      token = req.headers.authorization.split(' ')[1];

      // 3. Verify the token using our secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 4. If the token is valid, find the user in the DB by the ID that was in the token.
      // We attach this user object to the request (`req.user`) so our next function can use it.
      // We exclude the password when fetching the user data.
      req.user = await User.findById(decoded.id).select('-password');

      // 5. Call `next()` to pass control to the next function in the chain (our main route logic)
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  // If there's no token at all, send an error
  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protect };
