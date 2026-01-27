// Backend/src/app.js
const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const authRouter = require('./routes/auth.routes')
const financeRouter = require('./routes/finance.routes')
const foodRouter = require('./routes/food.routes')
const studyRouter = require('./routes/study.routes')
const sleepRouter = require('./routes/sleep.routes')
const targetRouter = require('./routes/target.routes')
const otherRouter = require('./routes/other.routes')
const path = require('path')


const app = express()

// Allow requests from frontend with credentials (cookies)
app.use(cors({ origin: true, credentials: true }))
app.use(express.json())
app.use(cookieParser())
app.use(express.static(path.join(__dirname, '../public')));



app.use('/api/auth', authRouter)
app.use('/api/finance', financeRouter)
app.use('/api/food', foodRouter)
app.use('/api/study', studyRouter)
app.use('/api/sleep', sleepRouter)
app.use('/api/other', otherRouter)
app.use('/api/target', targetRouter)

module.exports = app