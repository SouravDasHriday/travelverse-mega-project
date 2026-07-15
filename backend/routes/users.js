const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateProfile,
  deleteUser,
} = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// GET /api/users         - Admin: get all users
router.get('/', protect, adminOnly, getAllUsers);

// GET /api/users/:id     - Get user profile (public)
router.get('/:id', getUserById);

// PUT /api/users/profile - Update own profile (private)
router.put('/profile', protect, updateProfile);

// DELETE /api/users/:id  - Admin: delete a user
router.delete('/:id', protect, adminOnly, deleteUser);

module.exports = router;
