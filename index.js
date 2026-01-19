const dotenv = require('dotenv')
dotenv.config({ path: './config.env' })
const morgan = require('morgan')
const express = require('express')
const userRouter = require('./routers/user_router')

const app = express()
const port = process.env.PORT || 8080

app.use(express.json())
app.use(morgan('dev'))

app.use('/users', userRouter)

app.use((err, req, res, next) => {
    res.status(500).json({
        status: 'error',
        message: err.message
    })
})

app.listen(port, () => {
    console.log(`Server running on port ${port}`)
})
