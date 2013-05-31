
/**
 * Module dependencies.
 */

var express = require('express')
    , routes = require('./routes')
    , room = require('./routes/room')
    , http = require('http')
    , path = require('path')
    , mongoose = require('mongoose')
    , models = require('./model/models')
    , cookie = require('cookie')
    , connect = require('connect');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.configure(function () {
    app.use(express.cookieParser());
    app.use(express.session({secret: 'secret', key: 'express.sid'}));
});
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

io.set('authorization', function (handshakeData, accept) {

    if (handshakeData.headers.cookie) {

        handshakeData.cookie = cookie.parse(handshakeData.headers.cookie);

        handshakeData.sessionID = connect.utils.parseSignedCookie(handshakeData.cookie['express.sid'], 'secret');

        if (handshakeData.cookie['express.sid'] == handshakeData.sessionID) {
            return accept('Cookie is invalid.', false);
        }

    } else {
        return accept('No cookie transmitted.', false);
    }
    accept(null, true);
});

io.sockets.on('connection', function (socket) {

    socket.on('adduser', function(username, roomId){
        //console.log(socket.handshake.cookie['username']);
        var parsedRoomNumber = parseInt(roomId);
        var connect = function(user, roomId) {
            socket.user = user;
            socket.room = roomId;
            socket.join(socket.room);
            socket.emit('updatechat', 'SERVER', 'you have connected to '+ socket.room);
            socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', user.username + ' has connected to this room');
        };
        if (username == null || username == "" || isNaN(parsedRoomNumber) || parsedRoomNumber < 1){
            socket.emit('roomnumbererror');
            socket.disconnect();
        }
        else {
            models.Room.findOne({ roomId: roomId }, function(err,room) {
                if (err) console.log(err);
                if (room == null){
                    socket.emit('roomdoesnotexists');
                    socket.disconnect();
                }
                else {
                    for(var i = 0;i<room.users.length;i++){
                        if(typeof(room.users[i].username) != undefined && room.users[i].username == username){
                            connect(room.users[i], room.roomId);
                            break;
                        }
                        if(i==room.users.length-1){
                            models.Room.findOneAndUpdate({roomId: roomId},{$push: {users: {username: username}}},function(err, room){
                                connect(room.users[i], room.roomId);
                            });
                        }
                    }
//                    models.User.findOne({ username: username}, function(err,user) {
//                        if(user == null){
//                            models.Counter.increment('user', function(err, result){
//                                models.User.create({username: username, cid: result.next, inRoom: room.roomId}, function(err, user){
//                                    connect(user,room.roomId);
//                                });
//                            });
//                        }
//                        else {
//                            models.User.update({username: username}, {inRoom: room.roomId});
//                            connect(user,room.roomId);
//                        }
//                    });
                }
            });
        }
    });

    socket.on('addroom', function(adminUsername, roomId){
        var rid = roomId;
        models.Room.findOne({ roomId: roomId }, function(err, room){
            if(room == null){
                var room = new models.Room();
                room.roomId = rid;
                room.users.push({username: adminUsername});
                room.save(function(err,room){
                    socket.emit('roomcreated', room.roomId);
                });
            }
//            .create({ roomId: rid , $push: {users: {username: adminUsername}}},function(err, room){
//                    if (err){
//                        console.log(err);
//                    }
//                    else {
//                        socket.emit('roomcreated', room.roomId);
//                    }
//                });
//            }
            else{
                socket.emit('roomexists');
            }
        });
//        var roomCreate = function(user, roomId){
//            models.Room.findOne({ roomId: roomId }, function(err, room){
//                if(room == null){
//                    models.Room.create({ roomId: rid },function(err, room){
//                        if (err){
//                            console.log(err);
//                        }
//                        else {
//                            socket.emit('roomcreated', room.roomId);
//                        }
//                    });
//                }
//                else{
//                    socket.emit('roomexists');
//                }
//            });
//        };
//        models.User.findOne({ username: adm}, function(err,user) {
//            if(user == null){
//                models.Counter.increment('user', function(err, result){
//                    models.User.create({username: adm, cid: result.next}, function(err, user){
//                        roomCreate(user,rid);
//                    });
//                });
//            }
//            else {
//                roomCreate(user,rid);
//            }
//        });
    });

    socket.on('sendchat', function (data) {
        io.sockets.in(socket.room).emit('updatechat', socket.user.username, data);
    });

    socket.on('disconnect', function(){
        socket.broadcast.emit('updatechat', 'SERVER', socket.user.username + ' has disconnected');
        socket.leave(socket.room);
    });
});