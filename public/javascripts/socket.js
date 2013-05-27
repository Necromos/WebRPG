var socket = io.connect('http://localhost:3000');

$(document).ready(function(){
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

    socket.on('connect', function(){
        var username = readCookie("username");
        if (username == null){
            $('#wrapper').fadeOut("fast");
            $('#popup').fadeIn("slow");
        }
        else {
            $('#wrapper').fadeIn("fast");
            socket.emit('adduser', username, urlTaker('id'));
        }
    });
    var send = function(){
        // tutaj logika sprawdzająca poprawność
        createCookie("username",$("#username").val(),30);
        socket.emit('adduser', $('#username').val(), urlTaker('id'));
        $('#popup').fadeOut("slow");
        $('#wrapper').fadeIn("slow");
    };
    $('#submit').click(send);
    $('#username').keypress(function(e){ if(e.which == 13) send(); });


    socket.on('updatechat', function (username, data) {
        $('#chatBody').append('<b>'+username + ':</b> ' + data + '<br>');
        $('#chatBody').scrollTop(9999999);
    });

    socket.on('roomnumbererror', function(){
        //tutaj kod do zaprzestania ładowania itp
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
});