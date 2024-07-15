require('dotenv').config()
const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const mongoose = require('mongoose')
const router = require('./routes/index')
const errorMiddleware = require('./middlewaree/error-middleware')

const  PORT = process.env.PORT || 5000

const app = express()

app.use(express.json())
app.use(cookieParser())
app.use(cors({
    credentials:true,
    origin: function (origin, callback) {
        console.log('Origin:', origin); // Логирование
        if (!origin || [process.env.CLIENT_URL, process.env.CLIENT2_URL].includes(origin)) {
            callback(null, true)
        } else {
            console.log('Blocked by CORS:', origin); // Логирование
            callback(new Error('Not allowed by CORS'))
        }
    }
}))
app.use('/api', router)
app.use(errorMiddleware)

const start = async () => {
    try {
        await mongoose.connect(`mongodb+srv://mongodron1:${process.env.DB_PASS}@cluster0.59aijax.mongodb.net/petroltest?retryWrites=true&w=majority`, {
            useNewUrlParser: true,
            useUnifiedTopology: true
            // useMongoClient: true
        })
            .then(() => console.log('MongoDB has started ...'))
        app.listen(PORT, ()=>console.log(`Server started on port ${PORT}`))
    } catch (e) {
        console.log(e)
    }
}

start()