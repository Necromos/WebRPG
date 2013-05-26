
/**
 * Module dependencies.
 */

var express = require('express')
    , routes = require('./routes')
    , room = require('./routes/room')
    , http = require('http')
    , path = require('path')
    , mongoose = require('mongoose')
    , models = require('./model/models');

var app = express();

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
app.get('/game/create', room.roomCreator);

var server = http.createServer(app);
var io = require('socket.io').listen(server);
server.listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});

io.sockets.on('connection', function (socket) {

    socket.on('adduser', function(username, roomId){
        var parsedRoomNumber = parseInt(roomId);
        var connect = function(user, roomId) {
            socket.user = user;
            socket.room = roomId;
            socket.join(socket.room);
            socket.emit('updatechat', 'SERVER', 'you have connected to '+ socket.room);
            socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', username + ' has connected to this room');
        };
        if (isNaN(parsedRoomNumber) || parsedRoomNumber < 1){
            socket.emit('roomnumbererror');
            socket.disconnect();
        }
        else {
            console.log(roomId);
            models.Room.findOne({ roomId: roomId }, function(err,room) {
                if (err) console.log(err);
                if (room == null){
                    socket.emit('roomdoesnotexists');
                    socket.disconnect();
                }
                else {
                    models.User.findOne({ username: username}, function(err,user) {
                        if(user == null){
                            models.Counter.increment('user', function(err, result){
                                models.User.create({username: username, cid: result.next}, function(err, user){
                                    connect(user,room.roomId);
                                });
                            });
                        }
                        else {
                            connect(user,room.roomId);
                        }
                    });
                }
            });
        }
    });

    socket.on('addroom', function(adminUsername, roomId){
        var adm = adminUsername;
        var rid = roomId;
        var roomCreate = function(user, roomId){
            models.Room.findOne({ roomId: roomId }, function(err, room){
                if(room == null){
                    models.Room.create({ roomId: rid, _admin: user._id},function(err, room){
                        if (err){
                            console.log(err);
                        }
                        else {
                            socket.emit('roomcreated', room.roomId);
                        }
                    });
                }
                else{
                    socket.emit('roomexists');
                }
            });
        };
        models.User.findOne({ username: adm}, function(err,user) {
            if(user == null){
                models.Counter.increment('user', function(err, result){
                    models.User.create({username: adm, cid: result.next}, function(err, user){
                        roomCreate(user,rid);
                    });
                });
            }
            else {
                roomCreate(user,rid);
            }
        });
    });

    socket.on('sendchat', function (data) {
        io.sockets.in(socket.room).emit('updatechat', socket.username, data);
    });

    socket.on('disconnect', function(){
        socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
        socket.leave(socket.room);
    });
});