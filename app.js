require('dotenv').config(); 

const express = require('express');
const bodyParser = require('body-parser');
require('./db'); 
const identifyRouter = require('./routes/identify');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('Identity Reconciliation Service is running! 🚀');
});

app.use('/identify', identifyRouter);

app.listen(PORT, () => {
    console.log(`Server is listening on http://localhost:${PORT}`);
});