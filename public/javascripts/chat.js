/**
 * Created with IntelliJ IDEA.
 * User: Necromos
 * Date: 23.05.13
 * Time: 11:55
 * To change this template use File | Settings | File Templates.
 */
$(document).ready(function(){
    $(document).on('click','#chatHeader.down',function(){
        $('#chat').animate({bottom:'175px'}, 500);
        $('#chatHeader').removeClass('down');
        $('#chatHeader').addClass('up')
    });
    $(document).on('click','#chatHeader.up',function(){
        $('#chat').animate({bottom:'0px'}, 500);
        $('#chatHeader').removeClass('up');
        $('#chatHeader').addClass('down');
    });
});