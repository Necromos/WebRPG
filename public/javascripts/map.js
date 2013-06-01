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

var Map = Class.extend({

    json: {},
    images: [],
    map: [],
    canvas: null,
    ctx: null,
    loaded: false,
    c: 0,
    tileArrayLength: 0,

    init: function(){
        this.canvas = $('#mainCanvas')[0];
        this.canvas.width = 640;
        this.canvas.height = 384;
        this.ctx = this.canvas.getContext('2d');
        this.json = {
            mapPack: "Sample",
            tiles: [
                {
                    "src": "/images/B000M800.BMP"
                },
                {
                    "src": "/images/B1S1E800.BMP"
                },
                {
                    "src": "/images/B1S1A800.BMP"
                }
            ],
            mapLoc: [
                [0,2,2,2,1,0],
                [0,0,0,0,0,0],
                [0,0,0,0,0,0]
            ]
        };
        this.tileArrayLength = this.json.tiles.length;
        this.tiles = this.loadImages(this.json.tiles);
        this.map = this.json.mapLoc;
        var checkStatus = function(that){
            if(that.loaded){
                that.drawMap(0,0);
                clearInterval(interval);
            }
        };
        var that = this;
        var interval = setInterval(function(){checkStatus(that)}, 1000);
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
            this.images.push(img);
        }
    },

    drawMap: function(x,y){
        var locX = 0, locY = 0;
        for (var i = x; i<x+3;i++){
            for(var j = y; j<y+5;j++){
                this.ctx.drawImage(this.images[this.map[i][j]],locX,locY);
                locX+=128;
            }
            locY+=128
            locX=0;
        }
    },

    redrawMap: function(){

    }

});