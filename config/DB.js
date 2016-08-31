/**
 * Created by mudi on 20/06/16.
 */
var mongoose = require('mongoose');
var config = require('./config');
var DB = mongoose.connect('mongodb://'+config.DBHost+'/'+config.DBName);
module.exports = DB;