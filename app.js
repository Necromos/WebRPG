
/**
 * Module dependencies.
 */

var express = require('express')
    , routes = require('./routes')
    , room = require('./routes/room')
    , http = require('http')
    , path = require('path')
    , mongoose = require('mongoose')
    , Schema = mongoose.Schema;

var app = express();


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
var MapSchema = new Schema({
    _id: Number,
    x: Number,
    y: Number,
    tiles: [{ type: Number, ref: 'Tile' }]
});
var roomSchema = new Schema({
    _id: Number,
    roomId: Number,
    users: [{ type: Number, ref: 'User' }],
    _admin: { type: Number, ref: 'User' },
    _mapPack: { type: Number, ref: 'Map' },
    _currentMove: { type: Number, ref: 'User' }
});

/*

room = {
    roomId: int
    users: [user]
    admin: user
    mapPack: map
    currentMove: user
}
user = {
    username: String
    currentHP: int
    maxHP: int
    roomId: int
    moveLeft: int
    moveMax: int
    isAdmin: bool
    x: int
    y: int
}
map = {
    x: int
    y: int
    tiles: [tile]
}
tile = {
    background: String/url
    x: int
    y: int
    isVisible: bool
    movePointCost: int
    monster: monster/null
    player: user/null
    item: item/null
    moveable: bool
}
*/
GLOBAL.listOfGames = [];

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(app.router);
  app.use(require('less-middleware')({ src: __dirname + '/public' }));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/game', room.game);

var server = http.createServer(app);
var io = require('socket.io').listen(server);
server.listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});

io.sockets.on('connection', function (socket) {

    socket.on('adduser', function(username, room){
        socket.username = username;
        socket.room = room;
        socket.join(socket.room);
        socket.emit('updatechat', 'SERVER', 'you have connected to '+ socket.room);
        socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', username + ' has connected to this room');
    });

    socket.on('sendchat', function (data) {
        io.sockets.in(socket.room).emit('updatechat', socket.username, data);
    });

    socket.on('disconnect', function(){
        socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
        socket.leave(socket.room);
    });
});