var socket = io.connect('http://localhost:3000');

$(document).ready(function(){
    socket.on('connect', function(){
        socket.emit('adduser', prompt("What's your name?"), urlTaker('id'));
    });

    socket.on('updatechat', function (username, data) {
        $('#chatBody').append('<b>'+username + ':</b> ' + data + '<br>');
        $('#chatBody').scrollTop(9999999);
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