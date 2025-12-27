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

const app = express()

app.use(cors())
app.use(express.json())
app.use(cookieParser())



app.use('/api/auth', authRouter)
app.use('/api/finance', financeRouter)
app.use('/api/food', foodRouter)
app.use('/api/study', studyRouter)
app.use('/api/sleep', sleepRouter)
app.use('/api/other', otherRouter)

module.exports = app
