const express = require('express');
const axios = require('axios');
const https = require('https');
const cors = require('cors')

const app = express();
const port = process.env.PORT || 3000; // Порт, на котором будет запущен ваш сервер
app.use(cors({
    credentials:true,
    origin: [process.env.CLIENT_URL, 'http://localhost:5173']
}))

// Создаем экземпляр Axios с настройками для отправки POST запроса
const instance = axios.create({
    httpsAgent: new https.Agent({
        rejectUnauthorized: false, // Отключаем проверку сертификата (небезопасно!)
    }),
});

async function fetchContractData(id) {
    try {
        const response = await instance.get(`https://www.gias.by/purchase/api/v1/purchase/${id}`);

        return response.data.oneSourcePurchase; // Возвращаем данные из запроса
    } catch (error) {
        console.error('Error fetching data:', error.message);
        throw error; // Пробрасываем ошибку для дальнейшей обработки
    }
}

// Функция для выполнения POST-запроса к сайту gias.by и возврата данных
async function fetchPurchasesData(textSearch) {
    try {
        const response = await instance.post('https://www.gias.by/search/api/v1/search/purchases', {
            page: 0,
            pageSize: 100,
            contextTextSearch: textSearch,
            sortField: 'dtCreate',
            sortOrder: 'DESC',
        });
        const contractsId = response.data.content
            .filter(e => e.stateName === 'Договор подписан')
            .map(e => e.purchaseGiasId);

        // Создаем массив промисов для каждого запроса на данные по договору
        const contractPromises = contractsId.map(e => fetchContractData(e));

        // Ждем завершения всех запросов с помощью Promise.all
        const contractData = await Promise.all(contractPromises);

        return contractData;
    } catch (error) {
        console.error('Error fetching data:', error.message);
        throw error; // Пробрасываем ошибку для дальнейшей обработки
    }
}

// Обработчик GET запроса на сервере для получения данных и их отправки клиенту
app.get('/api/getData', async (req, res) => {
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
});

// Запускаем сервер на указанном порту
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
