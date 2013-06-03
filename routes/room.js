
/*
 * GET room.
 */

exports.roomCreator = function(req, res){
    res.render('createRoom', { title: "Room creator"} );
};

exports.game = function(req, res){
    res.render('gameRoom', { title: "New Adventure!" });
};