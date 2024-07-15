const Router = require('express')
const router = new Router()
const userController = require('../controllers/user-controller')
const reportController = require('../controllers/report-controller')
const {body} = require("express-validator")
const authMiddleware = require('../middlewaree/authMiddleware')

router.post('/registration',
    body('email').isEmail(),
    body('password').isLength({min: 3, max:32}),
    userController.registration)
router.post('/login', userController.login)
router.post('/logout', userController.logout)
router.get('/activate/:link', userController.activate)
router.get('/refresh', userController.refresh)
router.get('/users', authMiddleware, userController.getUsers)
router.post('/report', authMiddleware, reportController.sendReport)
router.get('/getUserReports', authMiddleware, reportController.getUserReports)
router.get('/getAllReports', authMiddleware, reportController.getAllReports)
router.get('/getSuppliers', authMiddleware, reportController.getAllReports)

router.post('/emails', authMiddleware, reportController.getEmails)
router.post('/positions', authMiddleware, reportController.getPlanPositions)
router.post('/send-email', authMiddleware, reportController.sendMail)


module.exports = router