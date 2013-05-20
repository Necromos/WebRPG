var socket = io.connect('http://localhost:3000');

socket.on('connect', function(){
    socket.emit('adduser', prompt("What's your name?"), urlTaker('id'));
});

socket.on('updatechat', function (username, data) {
    $('#conversation').append('<b>'+username + ':</b> ' + data + '<br>');
});

$(function(){
    $('#datasend').click( function() {
        var message = $('#data').val();
        $('#data').val('');
        socket.emit('sendchat', message);
    });

    $('#data').keypress(function(e) {
        if(e.which == 13) {
            $(this).blur();
            $('#datasend').focus().click();
        }
    });
});