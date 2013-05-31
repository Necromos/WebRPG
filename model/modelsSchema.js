/* This file is only for schema purpose */
var  mongoose = require('mongoose')
    , Schema = mongoose.Schema
    , options = {
        server: {
            socketOptions: {
                keepAlive: 1
            }
        },
        replset: {
            socketOptions: {
                keepAlive: 1
            }
        }
    };

mongoose.connect("", options);

var userSchema = new Schema({
//    _id: Number,
    username: String,
    currentHp: {type: Number, default: 10 },
    maxHp: {type: Number, default: 10 },
    moveLeft: { type: Number, default: 2 },
    moveMax: { type: Number, default: 2 },
    x: Number,
    y: Number
});

var tileSchema = new Schema({
//    _id: Number,
    tid: Number,
    src: String,
    x: Number,
    y: Number,
    isVisible: Boolean,
    movePointCost: Number,
//    monster: MonsterSchema,
//    item: ItemSchema,
    moveable: Boolean
});

var mapSchema = new Schema({
//    _id: Number,
    mapId: Number,
    tilesInX: Number,
    tilesInY: Number,
    tiles: [tilePosSchema]
});

var roomSchema = new Schema({
//    _id: Number,
    roomId: Number,
    users: [userSchema],
    mapPack: {
        mapId: Number,
        tilesInX: Number,
        tilesInY: Number,
        tiles: [tilePosSchema]
    },
    currentMove: Number
});

var tilePosSchema = new Schema({
    posX: Number,
    posY: Number,
    tile: Number
})



var CounterSchema = new Schema({
    _id: String,
    next: {type: Number, default: 1}
});

CounterSchema.statics.increment = function (counter, callback) {
    return this.findByIdAndUpdate(counter, { $inc: { next: 1 } }, {new: true, upsert: true, select: {next: 1}}, callback);
};

exports.Tile = mongoose.model('Tile', tileSchema);
exports.Room = mongoose.model('Room', roomSchema);
exports.Map = mongoose.model('Map', mapSchema);
exports.Counter = mongoose.model('Counter', CounterSchema);