var  mongoose = require('mongoose')
   , Schema = mongoose.Schema;

var db = mongoose.connect("");

var mapSchema = new Schema({
    _id: Number,
    x: Number,
    y: Number,
    tiles: [{ type: Schema.Types.ObjectId, ref: 'Tile' }]
});

module.exports = db.model('Map', mapSchema);