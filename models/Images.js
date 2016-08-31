/**
 * Created by mudi on 20/06/16.
 */
var mongoose = require('../config/DB'),
    Schema = mongoose.Schema,
    ImagesSchema = new Schema({
        kind: {
            type: String,
            enum: ['thumbnail', 'catalog', 'detail', 'zoom'],
            required: true
        },
        url: { type: String, required: true }
    });

var Images = mongoose.model('Images', ImagesSchema);

module.exports = Images;