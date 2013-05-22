var  mongoose = require('mongoose')
   , Schema = mongoose.Schema;

var db = mongoose.connect("");

var mapSchema = new Schema({
    _id: Number,
    x: Number,
    y: Number,
    tiles: [{ type: Number, ref: 'Tile' }]
});

module.exports = db.model('Map', mapSchema);