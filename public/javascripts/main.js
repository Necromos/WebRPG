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


    socket.on('mappack', function(mapPack,isAdmin,usersLength,id){
        game = new Game(mapPack,isAdmin,usersLength,id);
        game.start();
        if(game.playersLoc == null)
            game.makePlayersMap();
    });

    socket.on('userToPlace', function(id,username){
        var np = $('<div>').attr('id', id).attr('class','newPlayer').css('height','50px');
        $('<input>').attr('id','x'+id).attr('type','text').attr('class','x').css('width','50px').appendTo(np);
        $('<input>').attr('id','y'+id).attr('type','text').attr('class','y').css('width','50px').appendTo(np);
        $('<button>').attr('id','s'+id).attr('type','button').attr('class','s').css('width','50px').text(username).appendTo(np);
        np.appendTo('#adminWrapper');
    });

    socket.on('playerLocUpdate', function(data){
        game.playersLoc = data;
        game.redrawPlayers(0,0);
    });

    socket.on('adminNewPlayerAdded', function(data,id){
        if (!game.adm){
            game.players.push(new Player(id));
            game.playersLoc = data;
            game.redrawPlayers(0,0);
        }
        else
            game.redrawPlayers(0,0);
    });

    $(document).on('click','.s',function(){
        var id = $(this).parent().attr('id');
        socket.emit('adminAddNewPlayer',game.adminAddNewPlayer(id,$('#x'+id).val(),$('#y'+id).val()),id);
        game.redrawPlayers(0,0);
        $('#'+id).remove();
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