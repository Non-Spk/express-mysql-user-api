const bcrypt = require('bcryptjs')

exports.hashPassword = async (password) => {
    return await bcrypt.hash(password, 12)
}

exports.comparePassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword)
}
