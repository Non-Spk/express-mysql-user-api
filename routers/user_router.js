const express = require('express')
const userService = require('../services/user_service')
const { protect, restrictTo } = require('../middlewares/auth')

const router = express.Router()

// auth
router.post('/signup', userService.signup)
router.post('/login', userService.login)

// protected routes
router
    .route('/')
    .get(protect, restrictTo('admin'), userService.getUsers)
    .post(protect, restrictTo('admin'), userService.createUser)

router
    .route('/:id')
    .get(protect, userService.getUserById)
    .put(protect, restrictTo('admin'), userService.updateUserById)
    .delete(protect, restrictTo('admin'), userService.deleteUserById)

module.exports = router
