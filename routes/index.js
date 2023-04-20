const express = require('express')
const userRouter = require('./users')
const taskRouter = require('./tasks')
const { jwtAuth, decode } = require('../utils/user-jwt')
const router = express.router()

router.use(jwtAuth)
router.use('/api', userRouter)
router.use('/api', taskRouter)

router.use((err, req, res, next) => {
    console.log('err===', err);
    if (err && err.name === 'UnauthorizedError') {
        const {status = 401, message} = err
        res.status(status).json({
            code: status,
            msg: 'Invalid Token, please try signing in again',
            data: null
        })
    } else {
        const { output } = err || {};
        // err code and err info 
        const errCode = (output && output.statusCode) || 500;
        const errMsg = (output && output.payload && output.payload.error) || err.message
        res.status(errCode).json({
            code: errCode,
            msg: errMsg
        })
    }
})

module.exports = router