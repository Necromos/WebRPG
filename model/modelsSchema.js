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

mongoose.connect("mongodb://localhost:27017", options);

var userSchema = new Schema({
//    _id: Number,
    username: String,
    isAdmin: { type: Boolean, default: false },
    isPlaced: { type: Boolean, default: false },
    currentHp: { type: Number, default: 10 },
    maxHp: { type: Number, default: 10 },
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 }
});

var tileSchema = new Schema({
    src: String,
    movable: Boolean
});

var tilePosSchema = new Schema({
    posX: Number,
    posY: Number,
    tile: Number
});

var mapSchema = new Schema({
//    _id: Number,
    mapId: Number,
    mapPack: String,
    tiles: [tilePosSchema],
    objects: [],
    objLoc: [],
    mapLoc: []
});

var roomSchema = new Schema({
//    _id: Number,
    roomId: Number,
    users: [userSchema],
    mapPack: {
        mapPack: String,
        tiles: [tileSchema],
        objects: [],
        objLoc: [],
        mapLoc: [],
        playersLoc: [Schema.Types.Mixed]
    },
    maxPlayers: { type: Number, default: 4}
});

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