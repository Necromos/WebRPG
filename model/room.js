var  mongoose = require('mongoose')
   , Schema = mongoose.Schema;

var db = mongoose.connect("");

var roomSchema = new Schema({
    _id: Number,
    roomId: Number,
    users: [{ type: Number, ref: 'User' }],
    _admin: { type: Number, ref: 'User' },
    _mapPack: { type: Number, ref: 'Map' },
    _currentMove: { type: Number, ref: 'User' }
});

module.exports = db.model('Room', roomSchema);