const {Schema, model} = require('mongoose')

const ReportModel = new Schema({
    user: {type: Schema.Types.ObjectId, ref: 'User'},
    report: {
        diesel: {type: Number, required: true},
        dieselInTank: {type: Number, required: true},
        petrol80: {type: Number, required: true},
        petrol80InTank: {type: Number, required: true},
        petrol95: {type: Number, required: true},
        petrol95InTank: {type: Number, required: true},
    },
    date: {type: Date, required:true}
})

module.exports = model('Report', ReportModel)