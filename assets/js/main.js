/**
 * Created by zhangxiaoxue on 11/1/15.
 */

$(function(){

    NProgress.configure({ showSpinner: false });
    NProgress.configure({ minimum: 0.1 });
    $(document)
        .ajaxStart(function() {
            NProgress.start();
        })
        .ajaxComplete(function(event,request, settings) {
            NProgress.done();
        });

    if($('#cd-google-map').length){

        //init map
        var censusMap = new CensusMap();
        //google.maps.event.addDomListener(window, 'load', censusMap.initMap());

        google.load("maps", "3", {other_params:'libraries=places', callback: function(){

            //init
            censusMap.initMap(hideLoadingLayer);
        }});

        function hideLoadingLayer(){
            //when the map is prepared, remove loading effect and show the typing effect
            $(".preloader-icon").delay(800).fadeOut("normal", function(){

                $(".preloader").fadeOut();

            });
        }
    }

});
