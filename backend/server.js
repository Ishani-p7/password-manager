const express = require('express')
const dotenv = require('dotenv')
const { MongoClient } = require('mongodb'); 
const bodyparser = require('body-parser')
const cors = require('cors')
const path = require('path') // (ADD THIS)

dotenv.config()

// Connecting to the MongoDB Client
const url = process.env.MONGO_URI;
const client = new MongoClient(url);
client.connect();

// App & Database
const dbName = process.env.DB_NAME 
const app = express()
const port = 3000 

// Middleware
app.use(bodyparser.json())
app.use(cors())

// (ADD THIS) Serve frontend static files from dist folder
app.use(express.static(path.join(__dirname, '..', 'dist')))

// Your existing backend routes

// Get all the passwords
app.get('/api/passwords', async (req, res) => {  // changed to /api/passwords to avoid conflict with frontend route
    const db = client.db(dbName);
    const collection = db.collection('passwords');
    const findResult = await collection.find({}).toArray();
    res.json(findResult)
})

// Save a password
app.post('/api/passwords', async (req, res) => {  // changed to /api/passwords
    const password = req.body
    const db = client.db(dbName);
    const collection = db.collection('passwords');
    const findResult = await collection.insertOne(password);
    res.send({success: true, result: findResult})
})

// Delete a password by id
app.delete('/api/passwords', async (req, res) => {  // changed to /api/passwords
    const password = req.body
    const db = client.db(dbName);
    const collection = db.collection('passwords');
    const findResult = await collection.deleteOne(password);
    res.send({success: true, result: findResult})
})

// (ADD THIS) For all other routes, serve index.html so React router works
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
})

app.listen(port, () => {
    console.log(`Example app listening on  http://localhost:${port}`)
})
