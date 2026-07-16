const express = require('express');
const router = express.Router();
const { 
  login, 
  getProfile, 
  updateProfile, 
  changePassword, 
  logout 
} = require('../controllers/authController');
const { protect, isAdmin } = require('../middleware/auth');
const { 
  loginValidation, 
  changePasswordValidation, 
  profileUpdateValidation 
} = require('../middleware/validation');
const { authLimiter } = require('../middleware/rateLimiter');

// Public routes
router.post('/login', authLimiter, loginValidation, login);

// Protected routes (Admin only)
router.use(protect);
router.use(isAdmin);

router.get('/profile', getProfile);
router.put('/profile', profileUpdateValidation, updateProfile);
router.put('/change-password', changePasswordValidation, changePassword);
router.post('/logout', logout);

module.exports = router;