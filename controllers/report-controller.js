const reportService = require('../service/report-service')
const {validationResult} = require('express-validator')
const ApiError = require('../exeptions/api-error')
const ReportModel = require('../models/report-model')
const UserModel = require('../models/user-model')
const tokenService = require("../service/token-service");
const axios = require('axios');
const https = require("https");
const fetchPurchasesData = require("../service/gias-service");
const nodemailer = require('nodemailer');

const mail = process.env.SMTP_USER
const password = process.env.SMTP_PASSWORD
const mainUserId = process.env.MAIN_USER_ID

class ReportController {

    async sendMail(req, res, next) {
        try {
            const transporter = nodemailer.createTransport({
                service: 'mail.ru',
                auth: {
                    user: mail,
                    pass: password
                }
            });

// Create mail options
            const mailOptions = {
                from: mail,
                to: '101market@gomel.mchs.gov.by',
                // to: '221674@mail.ru',
                subject: 'Test Email',
                text: `Добрый день! Это тестовое письмо. Вы указали следующие адреса для отправки: ${JSON.stringify(req.body.emails)}`
                // text: `Добрый день! Это тестовое письмо. Вы указали следующие адреса для отправки: `
            };

// Send mail
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email sent: ' + info.response);
                }
            });

            console.log('end');
            return res.json('success');
        } catch (e) {
            next(e);
        }
    }
    async getPlanPositions(req, res, next) {
        try {
            const array = []
            const params = {
                'PurchasesItemsSearch[num]': '',
                'PurchasesItemsSearch[title]': req.body.productName,
                'PurchasesItemsSearch[okrb]': '',
                'PurchasesItemsSearch[unp_budget]': '',
                'PurchasesItemsSearch[is_by_organizator]': '',
            };
            // for (let i = 1; i < 46; i++) {
            //     const pageNumber = i;
            //     const itemsPerPage = 45;
            //     const apiUrl = `https://goszakupki.by/purchases/42503?page=${pageNumber}&per-page=${itemsPerPage}`;
            const apiUrl = `https://goszakupki.by/purchases/42503`;
            const response = await axios.get(apiUrl, {
                httpsAgent: new https.Agent({
                    rejectUnauthorized: false
                }),
                params
            });

            const regex = /<td>(.*?)<\/td>/g;

// Массив для хранения извлеченных значений
            const extractedValues = [];

            let match;
            while ((match = regex.exec(response.data)) !== null) {
                // match[1] содержит значение между тегами <td> и </td>
                extractedValues.push(match[1]);
            }


            const reg = /^\d{2}\.\d{2}\.\d{2}\.\d{3}$/;

            extractedValues.forEach((e, i) => {
                if (reg.test(e)) {
                    array.push({
                        position: extractedValues[i - 2],
                        position_name: extractedValues[i - 1],
                        okrb: extractedValues[i]
                    })
                }
            })
            // const responseData = array.filter(e=>e.includes('@'))
            // }
            return res.json(array);
        } catch (e) {
            next(e);
        }
    }

    async getEmails(req, res, next) {
        try {

            const apiUrl = 'https://icetrade.by/producers/search';
            const queryParams = {
                company: '',
                find_type: 1,
                type_company: {
                    1: 1,
                    2: 1
                },
                num: '',
                unp: '',
                uraddress: '',
                register_from: '',
                register_to: '',
                product: '',
                okrb_2012: req.body.okrb,
                sort: 'num:asc',
                sbm: 1,
                onPage: 100
            };

            const response = await axios.get(apiUrl, {
                params: queryParams,
                httpsAgent: new https.Agent({
                    rejectUnauthorized: false
                })

            });

            const splitData = response.data.split('table')
            if (splitData.length<33) return res.json('')
            const responseData = `<table ${splitData[31]} table>`
            // const linkMatches = response.data.match(/<a[^>]*>([^<]+)<\/a>/g);
            // console.log('linkMatches', linkMatches[0])
            // const array = response.data.split(/[<> ,]/)
            // const links = linkMatches.map(link => link.replace(/<a[^>]*>([^<]+)<\/a>/, '$1'));
            //
            // const emails = array.filter(e => e.includes('@'))
            // let companies = links.filter(e => e.includes('«'))
            // companies = companies.slice(2)
            // const responseData = []
            // companies.forEach((e,i)=>{
            //     responseData.push({company:e, emails:emails[i]})})
            // console.log('responseData', responseData[0])
            return res.json(responseData);
        } catch (e) {
            next(e);
        }
    }


    async sendReport(req, res, next) {
        try {
            const resData = await reportService.sendReport(req.user, req.body)
            return res.json(resData)
        } catch (e) {
            next(e)
        }
    }

    async getUserReports(req, res, next) {
        try {
            const resData = await reportService.getUserReports(req.user)
            return res.json(resData)
        } catch (e) {
            next(e)
        }
    }

    async getAllReports(req, res, next) {
        try {
            // console.log(req.user._id)
            if (req.user.id !== mainUserId) throw ApiError.BadRequest('Пользователь не имеет прав доступа')
            const resData = await reportService.getAllReports()
            // console.log(resData)
            return res.json(resData)
        } catch (e) {
            next(e)
        }
    }

    async getUnits(req, res, next) {
        try {
            console.log('getUnits')
            const dataFromGias = await this.giasService.fetchUnitsData();
            res.json(dataFromGias);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getSuppliers(req, res, next) {
        try {
            const { contextTextSearch } = req.query;
            if (!contextTextSearch) {
                return res.status(400).json({ error: 'contextTextSearch parameter is required' });
            }
            // Выполняем функцию fetchPurchasesData для получения данных
            const dataFromGias = await fetchPurchasesData(contextTextSearch);
            // Отправляем данные обратно клиенту
            res.json(dataFromGias);

        } catch (error) {
            // В случае ошибки отправляем статус 500 и сообщение об ошибке
            res.status(500).json({ error: error.message });
        }
    }


}

module.exports = new ReportController()