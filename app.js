const bodyParser = require('body-parser');
const express = require('express')
const cors = require('cors')
const app = express();
const routes = require('./routes')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.use(cors());

app.listen(3000, () => {
    console.log('Server started at: http://localhost: 3000')
})