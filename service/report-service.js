const ReportModel = require('../models/report-model')
const bcrypt = require('bcrypt')
const uuid = require('uuid')
const mailService = require('./mail-service')
const tokenService = require('./token-service')
const ApiError = require('../exeptions/api-error')
const UserDto = require("../dtos/user-dto");
const moment = require('moment');
const { fetchEmails } = require("./letters-service");

class ReportService {
    async getLetters() {
        const currentDate = new Date().toLocaleString();
        const resData = await fetchEmails();
        return { resData, date: currentDate };
    }
    async sendReport(user, report) {
        const currentDate = new Date().toLocaleString();
        const resData = await ReportModel.create({user:user.id, report, date:currentDate})

        return {user:user.id, report, date:currentDate}
    }
    async getUserReports(user) {
        const currentDate = new Date().toLocaleString();
        console.log(user.id)
        const resData = await ReportModel.find({user:user.id})
        return {resData, date:currentDate}
    }
    async getAllReports() {
        const departmentsId = ['651ab69d0f890c6038a95a5d','651ab76a0f890c6038a95a6c', '651b1a011fd0b6029e590bb5'];
        const currentDate = new Date().toLocaleString();
        const data = await ReportModel.find();
        let resData = {};

        data.forEach(e => {
            const date = new Date(e.date); // Преобразование строки в объект Date
            const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
            // console.log('e.date: ', formattedDate);
            const id = departmentsId.indexOf(e.user.toString());
            // console.log('id:', id);
            // console.log('e.user:', e.user.toString());

            if (id >= 0) {
                // Проверяем, существует ли массив для данной даты
                if (!resData[formattedDate]) {
                    resData[formattedDate] = Array.from({ length: departmentsId.length }, () => []);
                }

                // Устанавливаем значения для конкретного пользователя в массиве для данной даты
                resData[formattedDate][id] = [e.report.diesel, e.report.dieselInTank, e.report.petrol80, e.report.petrol80InTank, e.report.petrol95, e.report.petrol95InTank];
            }
        });

        console.log('resData: ', resData);
        return { resData, date: currentDate };
    }
}

module.exports = new ReportService()