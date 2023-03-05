require('dotenv').config();
const mongoDB = require('mongodb');

module.exports = {
    connectToDatabase: async () => {
        try {
            const dbUrl = process.env.DB_URL
            const dbName = process.env.DB_NAME

            const client = new mongoDB.MongoClient(dbUrl);
            await client.connect();
            const db = client.db(dbName);
            console.log('Successfully connected to database');
            return db;
        } catch (e) {
            console.log('Connection error to database');
            console.error(e);
            return
        }
    },
}