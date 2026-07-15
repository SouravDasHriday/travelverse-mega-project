const express = require('express');
const router = express.Router();
const {
  getAllPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  likePost,
  getMyPosts,
} = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');

// GET /api/posts       - Get all posts (public)
// POST /api/posts      - Create a post (private)
router.route('/').get(getAllPosts).post(protect, createPost);

// GET /api/posts/my-posts - Get posts by logged-in user (private)
router.get('/my-posts', protect, getMyPosts);

// GET /api/posts/:id    - Get single post
// PUT /api/posts/:id    - Update post
// DELETE /api/posts/:id - Delete post
router.route('/:id').get(getPostById).put(protect, updatePost).delete(protect, deletePost);

// PUT /api/posts/:id/like - Like / Unlike post (private)
router.put('/:id/like', protect, likePost);

module.exports = router;
