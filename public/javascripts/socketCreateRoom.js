var socket = io.connect('http://localhost:3000');

$(document).ready(function(){
    var info = function () {
        $("#info").text("Connected to server!");
        setTimeout(function(){$('#info').text("");}, 5000);
    };
    socket.on('connect', function(){
        info();
    });
    $('#createButton').click(function(){
        var adminName = $('#adminName').val();
        var roomId = $('#roomName').val();
        socket.emit('addroom', adminName, roomId);
    });
    var redirect = function(id){
        window.location = "/game?id="+id;
    }
    socket.on('roomcreated', function(roomId){
        redirect(roomId);
    });
});