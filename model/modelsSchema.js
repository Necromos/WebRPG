/* This file is only for schema purpose */
var  mongoose = require('mongoose')
    , Schema = mongoose.Schema;

mongoose.connect("");

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

exports.User = mongoose.model('User', userSchema);

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

exports.Tile = mongoose.model('Tile', tileSchema);

var roomSchema = new Schema({
    _id: Number,
    roomId: Number,
    users: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    _admin: { type: Number, ref: 'User' },
    _mapPack: { type: Number, ref: 'Map' },
    _currentMove: { type: Number, ref: 'User' }
});

exports.Room = mongoose.model('Room', roomSchema);

var mapSchema = new Schema({
    _id: Number,
    x: Number,
    y: Number,
    tiles: [{ type: Schema.Types.ObjectId, ref: 'Tile' }]
});

exports.Map = mongoose.model('Map', mapSchema);

var CounterSchema = new Schema({
    _id: String,
    next: {type: Number, default: 1}
});

CounterSchema.statics.increment = function (counter, callback) {
    return this.findByIdAndUpdate(counter, { $inc: { next: 1 } }, {new: true, upsert: true, select: {next: 1}}, callback);
};

exports.Counter = mongoose.model('Counter', CounterSchema);