/* Simple JavaScript Inheritance
 * By John Resig http://ejohn.org/
 * MIT Licensed.
 */
// Inspired by base2 and Prototype
(function(){
    var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;

    // The base Class implementation (does nothing)
    this.Class = function(){};

    // Create a new Class that inherits from this class
    Class.extend = function(prop) {
        var _super = this.prototype;

        // Instantiate a base class (but only create the instance,
        // don't run the init constructor)
        initializing = true;
        var prototype = new this();
        initializing = false;

        // Copy the properties over onto the new prototype
        for (var name in prop) {
            // Check if we're overwriting an existing function
            prototype[name] = typeof prop[name] == "function" &&
                typeof _super[name] == "function" && fnTest.test(prop[name]) ?
                (function(name, fn){
                    return function() {
                        var tmp = this._super;

                        // Add a new ._super() method that is the same method
                        // but on the super-class
                        this._super = _super[name];

                        // The method only need to be bound temporarily, so we
                        // remove it when we're done executing
                        var ret = fn.apply(this, arguments);
                        this._super = tmp;

                        return ret;
                    };
                })(name, prop[name]) :
                prop[name];
        }

        // The dummy class constructor
        function Class() {
            // All construction is actually done in the init method
            if ( !initializing && this.init )
                this.init.apply(this, arguments);
        }

        // Populate our constructed prototype object
        Class.prototype = prototype;

        // Enforce the constructor to be what we expect
        Class.prototype.constructor = Class;

        // And make this class extendable
        Class.extend = arguments.callee;

        return Class;
    };
})();

/*
    Game declaration start

 */

var Map = Class.extend({

    json: null,
    images: [],
    map: [],
    movableMap: [],
    ctx: null,
    loaded: false,
    c: 0,
    tileArrayLength: 0,
    x: 0,
    y: 0,
    maxX: 0,
    maxY: 0,

    init: function(canvasContext,mapDocument){
        this.ctx = canvasContext;
        this.json = mapDocument;
        this.maxY = this.json.mapLoc.length;
        this.maxX = this.json.mapLoc[0].length;
        this.tileArrayLength = this.json.tiles.length;
        this.tiles = this.loadImages(this.json.tiles);
        this.map = this.json.mapLoc;
        var checkStatus = function(that){
            if(that.loaded){
                that.drawMap(0,0);
                that.makeMovableMap();
                clearInterval(interval);
            }
        };
        var that = this;
        var interval = setInterval(function(){checkStatus(that)}, 1000);
        return this;
    },

    loadImages: function(tileArray){
        var img;
        var tmpImg = [];
        for(var i = 0; i<tileArray.length;i++){
            img = new Image();
            var that = this;
            img.onload = (function(that){
                that.c++;
                if (that.c == that.tileArrayLength){
                    that.loaded = true;
                }
            }(this));
            img.src = tileArray[i].src;
            this.images.push({image: img, movable: tileArray[i].movable});
        }
    },

    makeMovableMap: function(){
        var a = [], b = [];
        for (var i = 0; i< this.maxY; i++){
            for (var j = 0; j < this.maxX; j++){
                b.push(this.images[this.map[i][j]].movable);
            }
            a.push(b);
            b=[];
        }
        this.movableMap = a;
    },

    drawMap: function(x,y){
        var locX = 0, locY = 0;
        for (var i = y; i<y+3;i++){
            for(var j = x; j<x+5;j++){
                this.ctx.drawImage(this.images[this.map[i][j]].image,locX,locY);
                locX+=128;
            }
            locY+=128
            locX=0;
        }
    },

    redrawMap: function(x,y){
        if(x == -1 && this.x == 0 || x == 1 && this.x == this.maxX-5 || y == 1 && this.y == 0 || y == -1 && this.y == this.maxY-3)
            return;
        this.x+=x;
        this.y-=y;
        this.ctx.clearRect(0, 0, 640, 384);
        this.drawMap(this.x,this.y);
    }

});

var Entities = Class.extend({

});

var Player = Class.extend({
    id: null,
    x: null,
    y: null,
    init: function(id,x,y){
        this.id = id;
        this.x = x;
        this.y = y;
    }
});

var Game = Class.extend({
    canvas: null,
    playerCanvas: null,
    ctx: null,
    playerCtx: null,
    map: null,
    players: [],
    adm: null,
    playersLoc: null,
    img: new Image(),
    x: 0,
    y: 0,
    uid: null,
    moves: 0,
    isTurn: false,

    init: function(mapDocument,isAdmin,id){
        this.uid = id;
        this.canvas = $('#mainCanvas')[0];
        this.canvas.width = 640;
        this.canvas.height = 384;
        this.playerCanvas = $('#playerCanvas')[0];
        this.playerCanvas.width = 640;
        this.playerCanvas.height = 384;
        this.ctx = this.canvas.getContext('2d');
        this.playerCtx = this.playerCanvas.getContext('2d');
        this.map = new Map(this.ctx,mapDocument);
        this.adm = isAdmin;
        this.playersLoc = mapDocument.playersLoc;
        var that = this;
        this.img.onload = function(){
            that.drawPlayers(0,0);
        }
        this.img.src = "/images/char.png";
        return this;
    },

    makeLocalPlayers: function(users){
        for(var i = 0;i<users.length;i++){
            this.players.push(new Player(i,parseInt(users[i].x), parseInt(users[i].y)));
        }
    },

    makePlayersMap: function (socket) {
        var tmpA = [], tmpB = [];
        for(var i = 0;i<this.map.maxY;i++){
            for(var j = 0;j<this.map.maxX;j++){
                tmpB.push(0);
            }
            tmpA.push(tmpB);
            tmpB = [];
        }
        this.playersLoc = tmpA;
        socket.emit('updatedPlayersLocation',this.playersLoc);
    },

    rebuildPlayers: function(id,x,y,pm){
        if (id = this.uid)
            return;
        this.playersLoc = pm;
        this.players[id].x = x;
        this.players[id].y = y;
        this.playerCtx.clearRect(0, 0, 640, 384);
        this.drawPlayers(this.x,this.y);
    },

    adminAddNewPlayer: function(id,x,y) {
        if (this.playersLoc[y][x] == 0){
            this.playersLoc[y][x] = id;
            this.players.push(new Player(id,x,y));
            this.drawPlayers(this.x,this.y);
            return true
        }
        else {
            return false
        }
    },

    movePlayer: function(x,y,socket){
        var newX = this.x+x;
        var newY = this.y+y;
        this.playersLoc[this.players[this.uid].y][this.players[this.uid].x] = 0;
        this.players[this.uid].x = newX;
        this.players[this.uid].y = newY;
        this.playersLoc[newY][newX] = 1;
        this.playerCtx.clearRect(0, 0, 640, 384);
        this.drawPlayers(this.map.x,this.map.y);
        this.moves--;
        console.log(this.moves);
        console.log(this.moves == 0);
        if (this.moves == 0){
            console.log("hello?");
            socket.emit('movesEnded');
        }
        socket.emit('changePlayerPos',this.uid,newX,newY,this.playersLoc);
    },

    drawPlayers: function(x,y){
        var locX = 0, locY = 0;
        var c = this.playerCtx;
        for (var i = y; i<y+3;i++){
            for(var j = x; j<x+5;j++){
                if (this.playersLoc[i][j] != 0){
                    for (var k = 0; k<this.players.length;k++){
                        if(this.playersLoc[i][j] == this.players[k].id){
                            c.drawImage(this.img,locX,locY);
                            break;
                        }
                    }
                }
                locX+=128;
            }
            locY+=128
            locX=0;
        }
    },

    redrawPlayers: function(x,y){
        if(x == -1 && this.x == 0 || x == 1 && this.x == this.map.maxX-5 || y == 1 && this.y == 0 || y == -1 && this.y == this.map.maxY-3)
            return;
        this.x+=x;
        this.y-=y;
        this.playerCtx.clearRect(0, 0, 640, 384);
        this.drawPlayers(this.x,this.y);
    },

    listen: function(socket){
        var that = this;
        var sc = socket;
        var x;
        var y;
        $('#left').click(function(){
            that.map.redrawMap(-1,0);
            that.redrawPlayers(-1,0);
        });
        $('#right').click(function(){
            that.map.redrawMap(1,0);
            that.redrawPlayers(1,0);
        });
        $('#top').click(function(){
            that.map.redrawMap(0,1);
            that.redrawPlayers(0,1);
        });
        $('#bottom').click(function(){
            that.map.redrawMap(0,-1);
            that.redrawPlayers(0,-1);
        });
        $('#playerCanvas').click(function(e){
            x = Math.floor((e.pageX - $(this).offset().left)/128);
            y = Math.floor((e.pageY - $(this).offset().top)/128);
            $('#pop').remove();
            $('<div>').attr('id','pop').css('z-index',10000).css('background-color','white').css('position','absolute').css('left',e.pageX - $(this).offset().left).css('top',e.pageY - $(this).offset().top).appendTo("#gameWrapper");
            if (that.checkPlayerInTile(x,y))
                $('<div>').attr('id','move').css('width','200px').text("Move here").appendTo('#pop');

        });
        $(document).on('click','#move',function(e){
            that.movePlayer(x,y,sc);
            $('#pop').remove();
        });
        $(document).on('click','#giveIt',function(){
            socket.emit('givePlayerMove',parseInt($('#to').val()),parseInt($('#howMuch').val()));
            $('#giveMove').fadeOut('slow');
        });
    },

    checkPlayerInTile: function(x,y){
        var pl = this.players[this.uid];
        var tmpX = this.x+x;
        var tmpY = this.y+y;
        if (this.moves != 0 && this.map.movableMap[tmpY][tmpX] && this.playersLoc[tmpY][tmpX] ==  0 && (((tmpX+tmpY)-(pl.x+pl.y)) == -1 || ((tmpX+tmpY)-(pl.x+pl.y)) == 1) ) {
            return true;
        }
        else {
            return false;
        }
    },

    makeAdmin: function(){
        if($('#giveMove'))
            $('#giveMove').remove();
        var np = $('<div>').attr('id', "giveMove");
        $('<input>').attr('id','to').attr('type','text').appendTo($('<label>').text("UserID").appendTo(np));
        $('<input>').attr('id','howMuch').attr('type','text').appendTo($('<label>').text("Moves").appendTo(np));
        $('<button>').attr('id','giveIt').attr('type','button').text("Give move").appendTo(np);
        np.appendTo('#adminWrapper');
        $('#giveMove').fadeIn('slow');
    },

    start: function(socket){
        this.listen(socket);
        if (this.adm)
            this.makeAdmin();
        //this.drawPlayers(0,0);
    }
});