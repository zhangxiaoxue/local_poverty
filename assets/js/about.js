$(function(){
    //slide
    if($('#slides').length){
        $('#slides').imagesLoaded(function(){
            $(".preloader").fadeOut('slow');
        });
    }
});
