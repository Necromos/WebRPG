var  mongoose = require('mongoose')
   , Schema = mongoose.Schema;

var db = mongoose.connect("");

var tileSchema = new Schema({
    _id: Number,
    background: String,
    x: Number,
    y: Number,
    isVisible: Boolean,
    movePointCost: Number,
//    monster: MonsterSchema,
    _player: { type: Number, ref: 'User' },
//    item: ItemSchema,
    moveable: Boolean
});

module.exports = db.model('Tile', tileSchema);