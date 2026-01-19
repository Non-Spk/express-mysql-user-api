const express = require('express')
const userService = require('../services/user_service')

const router = express.Router()

router
    .route('/')
    .get(userService.getUsers)
    .post(userService.createUser)

router.post('/bulk-users', userService.bulkCreateUsers)

router
    .route('/:id')
    .get(userService.getUserById)
    .put(userService.updateUserById)
    .delete(userService.deleteUserById)

module.exports = router
