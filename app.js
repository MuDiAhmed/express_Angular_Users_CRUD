var express = require('express');
var path = require('path');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var app = express();
var configs = require('./config/config');
var DB = require('./config/DB');
var api = require('./routes/api');
var http = require('http');
var server = http.createServer(app);
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
server.listen(configs.serverPort);
//Routing
app.use('/api', api);
app.use(express.static(path.join(__dirname, 'angular')));

module.exports = app;
