const dotenv = require('dotenv')
dotenv.config({ path: './config.env' })

const morgan = require('morgan')
const express = require('express')
const userRouter = require('./routers/user_router')

const app = express()
app.use(express.json())
app.use(morgan('dev'))

app.use('/users', userRouter)

app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' })
})

app.use((err, req, res, next) => {
    console.error(err)
    res.status(500).json({ message: err.message || 'Internal Server Error' })
})

app.listen(8080, () => console.log('Server running on port 8080'))
