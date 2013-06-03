var socket = io.connect('http://localhost:3000');

$(document).ready(function(){
    var game;
    var id = urlTaker('id');

    var createCookie = function (name,value,days) {
        if (days) {
            var date = new Date();
            date.setTime(date.getTime()+(days*24*60*60*1000));
            var expires = "; expires="+date.toGMTString();
        }
        else var expires = "";
        document.cookie = name+"="+value+expires+"; path=/";
    };

    var readCookie = function (name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for(var i=0;i < ca.length;i++) {
            var c = ca[i];
            while (c.charAt(0)==' ') c = c.substring(1,c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
        }
        return null;
    }

    var ctxL = $('#l')[0];
    var ctxR = $('#r')[0];
    var ctxT = $('#t')[0];
    var ctxB = $('#b')[0];

    ctxL.width = 25;
    ctxL.height = 384;
    ctxL = ctxL.getContext('2d');
    ctxR.width = 25;
    ctxR.height = 384;
    ctxR = ctxR.getContext('2d');
    ctxT.width = 640;
    ctxT.height = 25;
    ctxT = ctxT.getContext('2d');
    ctxB.width = 640;
    ctxB.height = 25;
    ctxB = ctxB.getContext('2d');

    var makeL = function () {
        ctxL.beginPath();
        ctxL.moveTo(5,192);
        ctxL.lineTo(20,172);
        ctxL.lineTo(20,212);
        ctxL.closePath();
        ctxL.fillStyle = "rgba(255,150,50,0.5)";
        ctxL.fill();
        ctxL.strokeStyle = "red";
        ctxL.lineWidth = 2.0;
        ctxL.stroke();
    }();

    var makeR = function () {
        ctxR.beginPath();
        ctxR.moveTo(20,192);
        ctxR.lineTo(5,172);
        ctxR.lineTo(5,212);
        ctxR.closePath();
        ctxR.fillStyle = "rgba(255,150,50,0.5)";
        ctxR.fill();
        ctxR.strokeStyle = "red";
        ctxR.lineWidth = 2.0;
        ctxR.stroke();
    }();

    var makeT = function () {
        ctxT.beginPath();
        ctxT.moveTo(320,5);
        ctxT.lineTo(300,20);
        ctxT.lineTo(340,20);
        ctxT.closePath();
        ctxT.fillStyle = "rgba(255,150,50,0.5)";
        ctxT.fill();
        ctxT.strokeStyle = "red";
        ctxT.lineWidth = 2.0;
        ctxT.stroke();
    }();

    var makeB = function () {
        ctxB.beginPath();
        ctxB.moveTo(320,20);
        ctxB.lineTo(300,5);
        ctxB.lineTo(340,5);
        ctxB.closePath();
        ctxB.fillStyle = "rgba(255,150,50,0.5)";
        ctxB.fill();
        ctxB.strokeStyle = "red";
        ctxB.lineWidth = 2.0;
        ctxB.stroke();
    }();


// Socket listeners
    socket.on('connect', function(){
        var username = readCookie("username");
        if (username == null){
            $('#wrapper').fadeOut("fast");
            $('#popup').fadeIn("slow");
        }
        else {
            $('#wrapper').fadeIn("fast");
            socket.emit('adduser', username, id);
        }
    });

    socket.on('updatechat', function (username, data) {
        $('#chatBody').append('<b>'+username + ':</b> ' + data + '<br>');
        $('#chatBody').scrollTop(9999999);
    });

    socket.on('roomnumbererror', function(){
        //tutaj kod do zaprzestania ładowania itp
    });


    socket.on('mappack', function(mapPack,isAdmin,id){
        game = new Game(mapPack,isAdmin,id);
        game.start(socket);
        if(isAdmin && mapPack.playersLoc.length == 0)
            game.makePlayersMap(socket);
    });

    socket.on('userToPlace', function(id,username){
        var np = $('<div>').attr('id', id).attr('class','newPlayer').css('height','50px');
        $('<input>').attr('id','x'+id).attr('type','text').attr('class','x').css('width','50px').appendTo(np);
        $('<input>').attr('id','y'+id).attr('type','text').attr('class','y').css('width','50px').appendTo(np);
        $('<button>').attr('id','s'+id).attr('type','button').attr('class','s').css('width','50px').text(username).appendTo(np);
        np.appendTo('#adminWrapper');
    });

    socket.on('adminNewPlayerAdded', function(data,id,x,y){
        if (!game.adm){
            if (game.uid == id) {
                game.players[id].x = x;
                game.players[id].y = y;
            }
            else
                game.players.push(new Player(id,x,y));
            game.playersLoc = data;
            console.log(game.players);
            console.log(game.playersLoc);
            game.redrawPlayers(0,0);
        }
    });

    socket.on('turnFree', function(){
        if(game.adm)
            $('#giveMove').fadeIn('slow')
    });

    socket.on('makeCurrentUsers', function(data){
        game.makeLocalPlayers(data);
    });

    socket.on('playerLocUpdate', function(id,x,y,pm){
        game.rebuildPlayers(id,x,y,pm);
    });

    socket.on('receiveMove', function(id,moves){
        if(id == game.uid)
            game.moves = moves;
    });

    $(document).on('click','.s',function(){
        var id = parseInt($(this).parent().attr('id'));
        var x = parseInt($('#x'+id).val());
        var y = parseInt($('#y'+id).val());
        var usr = $('#s'+id).text();
        if (game.adminAddNewPlayer(id,x,y)) {
            socket.emit('adminAddNewPlayer',game.playersLoc,id,x,y,usr);
            $('#'+id).remove();
        }
            //tutaj info ze jest juz na tej pozycji ktos
    });
    $('#diceWalls').keypress(function(e){
        if(e.which == 13) {
            var message = $(this).val();
            $(this).val('');
            socket.emit('diceRolled',message);
            $(this).blur();
            $('#chatSend').focus();
        }
    });

    $('#chatSend').keypress(function(e) {
        if(e.which == 13) {
            var message = $('#chatSend').val();
            $('#chatSend').val('');
            socket.emit('sendchat', message);
            $(this).blur();
            $('#chatSend').focus();
        }
    });

    $(document).on('click','#chatHeader.down',function(){
        $('#chat').animate({bottom:'175px'}, 500);
        $('#chatHeader').removeClass('down');
        $('#chatHeader').addClass('up')
    });
    $(document).on('click','#chatHeader.up',function(){
        $('#chat').animate({bottom:'0px'}, 500);
        $('#chatHeader').removeClass('up');
        $('#chatHeader').addClass('down');
    });


    var send = function(){
        // tutaj logika sprawdzająca poprawność
        createCookie("username",$("#username").val(),30);
        socket.emit('adduser', $('#username').val(), id);
        $('#popup').fadeOut("slow");
        $('#wrapper').fadeIn("slow");
    };
    $('#submit').click(send);
    $('#username').keypress(function(e){ if(e.which == 13) send(); });

});