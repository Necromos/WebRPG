var  mongoose = require('mongoose')
   , Schema = mongoose.Schema;

var db = mongoose.connect("");

var userSchema = new Schema({
    _id: Number,
    username: String,
    currentHp: Number,
    maxHp: Number,
    _room: { type: Number, ref: 'Room'},
    moveLeft: Number,
    moveMax: Number,
    x: Number,
    y: Number
});

module.exports = db.model('User', userSchema);