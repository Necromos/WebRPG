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
        this.drawMap(this.x,this.y);
    }

});

var Player = Class.extend({
    x: 0,
    y: 0,
    init: function(){

    },
    listen: function(){

    }
});

var Game = Class.extend({
    canvas: null,
    ctx: null,
    map: null,
    player: null,
    init: function(mapDocument){
        this.canvas = $('#mainCanvas')[0];
        this.canvas.width = 640;
        this.canvas.height = 384;
        this.ctx = this.canvas.getContext('2d');
        this.map = new Map(this.ctx,mapDocument);
    },
    listen: function(){
        var that = this;
        $('#left').click(function(){
            that.map.redrawMap(-1,0);
        });
        $('#right').click(function(){
            that.map.redrawMap(1,0);
        });
        $('#top').click(function(){
            that.map.redrawMap(0,1);
        });
        $('#bottom').click(function(){
            that.map.redrawMap(0,-1);
        });
        $('#mainCanvas').click(function(e){
            var x = Math.floor((e.pageX - $(this).offset().left)/128);
            var y = Math.floor((e.pageY - $(this).offset().top)/128);
        });
    },
    start: function(){
        this.listen();
    }
});