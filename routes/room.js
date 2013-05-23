
/*
 * GET room.
 */

exports.roomCreator = function(req, res){

};

exports.game = function(req, res){
    if (GLOBAL.listOfGames.indexOf(req.query['id']) == -1)
        GLOBAL.listOfGames.push(req.query['id']);
    console.log(req.query['id']);
    console.log(GLOBAL.listOfGames.length);
    res.render('gameRoom', { title: GLOBAL.listOfGames[0] });
};