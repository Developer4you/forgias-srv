const giasService = require('../service/gias-service');
class GiasController {
    constructor(giasService) {
        this.giasService = giasService;
    }

    async getSuppliers(req, res, next) {
        try {
            const { contextTextSearch } = req.query;

            if (!contextTextSearch) {
                return res.status(400).json({ error: 'contextTextSearch parameter is required' });
            }
            console.log('getSuppliers')
            const dataFromGias = await this.giasService.fetchPurchasesData(contextTextSearch);
            res.json(dataFromGias);
        } catch (error) {
            res.status(500).json({ error: error.message });
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
}

module.exports = new GiasController(giasService);