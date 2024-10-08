const ApiError = require('../exeptions/api-error')
const tokenService = require('../service/token-service')

module.exports = function (req, res, next) {
    try {
        const authorizationHeader = req.headers.authorization
        if (!authorizationHeader){
            return next(ApiError.UnautorizedError())
        }

        const accessToken = authorizationHeader.split(' ')[1]
        if (!accessToken) {
            return next(ApiError.UnautorizedError())
        }

        const userData = tokenService.validateAccessToken(accessToken)
        if (!userData) {
            return next(ApiError.UnautorizedError())
        }

        req.user = userData
        // console.log('req.user: ',req.user)
        next()
    } catch (e) {
        return next(ApiError.UnautorizedError())
    }
};