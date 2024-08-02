const ApiError = require("../exeptions/api-error");
const reportService = require("../service/report-service");

const mainUserId = process.env.MAIN_USER_ID
class EmailController {
    async getLetters(req, res, next) {
        try {
            if (req.user.id !== mainUserId) {
                throw ApiError.BadRequest('Пользователь не имеет прав доступа');
            }
            const resData = await reportService.getLetters();
            res.setHeader('Content-Type', 'application/json');
            return res.json(resData);
        } catch (e) {
            next(e);
        }
    }
}

module.exports = new EmailController()