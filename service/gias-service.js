const https = require('https');
const axios = require('axios');

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
export async function fetchPurchasesData(textSearch) {
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