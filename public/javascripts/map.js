var Map = Class.extend({

    tiles: [],

    loadImages: function(tileArray){
        var img;
        for(var image in tileArray){
            img = new Image();
            img.onload = function(){
                var tmp = {};
                //przypisanie obiektowi tmp wartości tileArray
            }
            img.src = image.src;
        }
    },

    drawMap: function(){

    },

    redrawMap: function(){

    }

});