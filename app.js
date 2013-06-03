
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
        var parsedRoomNumber = parseInt(roomId);
        var connect = function(id, user, room) {
            socket.user = user;
            socket.room = room.roomId;
            socket.join(socket.room);
            socket.emit('mappack', room.mapPack,user.isAdmin,id);
            socket.emit('makeCurrentUsers',room.users);
            if (user.isAdmin){
                for(var i=1;i<room.users.length;i++){
                    if(!room.users[i].isPlaced)
                        socket.emit('userToPlace',id,room.users[i].username);
                }
                socket.broadcast.to(socket.room).emit('updatechat', 'ADMIN ' + user.username,' has connected to this room');
                socket.emit('updatechat', 'SERVER', 'you have connected to '+ socket.room);
            }
            else {
                if(!user.isPlaced && !user.isAdmin){
                    socket.broadcast.to(socket.room).emit('userToPlace',id,user.username);
                }
                socket.emit('updatechat', 'SERVER', 'you have connected to '+ socket.room);
                socket.broadcast.to(socket.room).emit('updatechat',  user.username,' has connected to this room');
            }
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
                else if(room.users.length == room.maxPlayers){
                    socket.emit('roomFull');
                    socket.disconnect();
                }
                else {
                    for(var i = 0;i<room.users.length;i++){
                        if(typeof(room.users[i].username) != undefined && room.users[i].username == username){
                            connect(i, room.users[i], room);
                            break;
                        }
                        if(i==room.users.length-1){
                            console.log(username);
                            models.Room.findOneAndUpdate({roomId: roomId},{$push: {users: {username: username}}},function(err, room){
                                if(err){
                                    console.log(err);
                                }
                                else{
                                    connect(i, room.users[i], room);
                                }
                            });
                        }
                    }
                }
            });
        }
    });

    socket.on('addroom', function(adminUsername, roomId){
        socket.created = true;
        models.Room.findOne({ roomId: roomId }, function(err, room){
            if(room == null){
                var room = new models.Room();
                room.roomId = roomId;
                room.users.push({username: adminUsername, isAdmin: true});
                room.mapPack.mapPack = "Sample";
                room.mapPack.tiles.push({src: "/images/B000M800.BMP", movable: true});
                room.mapPack.tiles.push({src: "/images/B1S1E800.BMP", movable: true});
                room.mapPack.tiles.push({src: "/images/B1S1A800.BMP", movable: true});
                room.mapPack.objects = [];
                room.mapPack.objLoc = [];
                room.mapPack.mapLoc.push([0,2,2,2,1,0]);
                room.mapPack.mapLoc.push([0,0,0,0,0,0]);
                room.mapPack.mapLoc.push([0,0,0,0,0,0]);
                room.mapPack.mapLoc.push([0,2,2,2,1,0]);
                room.mapPack.playersLoc = [];
                room.save(function(err,room){
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
    });

    socket.on('adminAddNewPlayer', function(data,id,x,y,usr){
        var query = {};
        query["users."+id.toString()] = {username: usr, x: x, y: y, isPlaced: true};
        models.Room.findOneAndUpdate({roomId: socket.room}, {$unset: {"mapPack.playersLoc": []}, $set: query},function(err){if(err)console.log(err);});
        models.Room.findOneAndUpdate({roomId: socket.room}, {$set: {"mapPack.playersLoc": data}},{upsert: true}, function(err){if(err) console.log(err);});
        socket.broadcast.to(socket.room).emit('adminNewPlayerAdded', data, id, x, y);
    });

    socket.on('changePlayerPos', function(id,x,y,pm){
        var query = {};
        query["users."+id.toString()+".x"] = x;
        query["users."+id.toString()+".y"] = y;
        models.Room.findOneAndUpdate({roomId: socket.room}, {$unset: {"mapPack.playersLoc": []}, $set: query},function(err){if(err)console.log(err);});
        models.Room.findOneAndUpdate({roomId: socket.room}, {$set: {"mapPack.playersLoc": pm}},function(err){if(err)console.log(err);});
        socket.broadcast.to(socket.room).emit('playerLocUpdate', id,x,y,pm);
    });

    socket.on('givePlayerMove', function(id,moves){
        socket.broadcast.to(socket.room).emit('receiveMove',id,moves);
    });

    socket.on('movesEnded', function(){
        console.log("idzie");
        socket.broadcast.to(socket.room).emit('turnFree');
    });

    socket.on('updatedPlayersLocation', function(playerMap){
        models.Room.findOneAndUpdate({roomId: socket.room}, {$set: {"mapPack.playersLoc": playerMap}},function(err){if(err)console.log(err);});
        socket.broadcast.to(socket.room).emit('updatePlayersLocation', playerMap);
    });

    socket.on('sendchat', function (data) {
        io.sockets.in(socket.room).emit('updatechat', socket.user.username, data);
    });

    socket.on('disconnect', function(){
        if (!socket.created && socket.user.username){
            socket.broadcast.emit('updatechat',  socket.user.username, ' has disconnected');
            socket.leave(socket.room);
        }
        else {
            socket.created = false;
        }
    });
});