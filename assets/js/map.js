function CensusMap(options){
    var defaults = {
        apiKey: '28c21ea4173e99b69770dab94a59ab79544572e0',
        latitude: 33.8300,
        longitude: -84.4000,
        city: 'atlanta',
        mapId: 'cd-google-map',
        tractTypes: [{
            "id": 1,
            "label": "Chronic High Poverty",
            "desp": "In 2000, these tracts had a 30% or greater poverty rate. By 2010, they were still high poverty."
        },{
            "id": 2,
            "label": "Rebounding Neighborhoods",
            "desp": "In 2000, these tracts had more than a 30% poverty rate. In 2010, they had a poverty rate of 15% or less."
        },{
            "id": 3,
            "label": "New Poor Neighborhoods",
            "desp": "In 2000, these tracts had less than a 30% poverty rate. In 2010, they had a poverty rate of 30% or more."
        },{
            "id": 4,
            "label": "Fallen Stars",
            "desp": "In 2000, these tracts had less than the average poverty rate (15%). In 2010, they had a poverty rate of 30% or more."
        }, {
            "id": 5,
            "label": "No Compared Data",
            "desp": "Data from 2000 in these tracts have no matching data from 2010 because of the continual change in geography between successive censuses."
        }],
        colors: ['#a52733', '#0a6a60', '#f46431' ,'#f39c12', '#cdcdcd', '#f2f2f2'],
        //colors: ['#8b412b', '#0a6a60', '#ef9c49' ,'#e45e2d', '#cdcdcd', '#f2f2f2'],
        activeColor: '#08AAC7',
        //activeColor: '#1C2236',
        strokeColors: ['#4f1a1f', '#0b3632', '#70341e' ,'#5c1f1f', '#1C2236', '#1C2236'],
        //strokeColors: ['#4f1a1f', '#0b3632', '#70341e' ,'#5c1f1f', '#999', '#999'],
        //strokeColors: ['#4f1a1f', '#0b3632', '#70341e' ,'#5c1f1f', '#08AAC7', '#08AAC7'],
        mapZoom: 10,
        styles:
            [{"featureType":"administrative","elementType":"labels.text.fill","stylers":[{"color":"#444444"}]},{"featureType":"landscape","elementType":"all","stylers":[{"color":"#f2f2f2"}]},{"featureType":"poi","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"poi.business","elementType":"geometry.fill","stylers":[{"visibility":"on"}]},{"featureType":"road","elementType":"all","stylers":[{"saturation":-100},{"lightness":45}]},{"featureType":"road.highway","elementType":"all","stylers":[{"visibility":"simplified"}]},{"featureType":"road.arterial","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"transit","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"water","elementType":"all","stylers":[{"color":"#b4d4e1"},{"visibility":"on"}]}]

    };

    this.opts = $.extend({}, defaults, options);
    this.data = {
        economic: {},
        demographic: {}
    };
    this.activeTracts = [];

    this.init();
    this.initListeners();
}

CensusMap.prototype = {
    constructor: CensusMap,
    init: function(){
        /*var sdk = new CitySDK();
        this.census = sdk.modules.census;
        this.census.enable(this.opts.apiKey);*/
        this.initLoading();
    },
    initListeners: function(){
        $('.panel').on('click', '.close', function(e){
            e.preventDefault();
            //$('.panel').fadeOut('fast');
            var $panel = $('.panel');
            $('.panel').animate({right: - $panel.width()}, 350);
            $('#cd-zoom-in, #cd-zoom-out, #cd-my-location').css('marginLeft', 10);
        });

        $('.modal').on('click', '.close', function(e){
            e.preventDefault();
            $('.modal').fadeOut();
        });
    },
    initMap: function(callback){
        var that = this;
        var mapOptions = {
            center: {lat: that.opts.latitude, lng: that.opts.longitude},
            zoom: that.opts.mapZoom,
            styles: that.opts.styles,
            mapTypeControl: false,
            streetViewControl: false,
            zoomControlOptions: {
                position: google.maps.ControlPosition.LEFT_TOP
            }
        };
        var map = new google.maps.Map(document.getElementById(that.opts.mapId), mapOptions);

        // global infowindow
        var infowindow = new google.maps.InfoWindow({
            maxWidth: 250
        });

        map.data.addListener('mouseover', function (event) {
            var data = {
                name: event.feature.getProperty("name"),
                povertyRate2000: event.feature.getProperty("povertyRate2000"),
                povertyRate2010: event.feature.getProperty("povertyRate2010")
            };
            //console.log(event.feature);

            infowindow.setContent(template('tpl-info-content', data));
            infowindow.setPosition(event.latLng);
            infowindow.setOptions({pixelOffset: new google.maps.Size(0, -30)});
            infowindow.open(map);

            map.data.revertStyle();
            map.data.overrideStyle(event.feature, {
                strokeWeight: 3,
                strokeOpacity: 1
            });
        });

        map.data.addListener('mouseout', function(event) {
            infowindow.close();
            map.data.revertStyle();
        });

        //show detail
        map.data.addListener('click', function(event) {
            infowindow.close();

            console.log(event.feature);

            //show details of this tract
            var geoId = event.feature.getProperty('GEOID');
            var tractTypeId = event.feature.getProperty('tractTypeId');
            var tractTypeData = {};
            var $panel = $('#panel-detail');

            if(event.feature.getProperty('isActive')){
                event.feature.setProperty('isActive', false);
                that.activeTracts = $.grep(that.activeTracts, function(value) {
                    return value.geoId !=  geoId;
                });
            }else{
                /*map.data.forEach(function(feature) {
                    feature.setProperty('isActive', false);
                });*/
                if(that.activeTracts.length === 5){
                    alert('No more than 5 tracts could be compared');
                    return false;
                }
                event.feature.setProperty('isActive', true);
                that.activeTracts.push({
                    geoId: geoId,
                    name: event.feature.getProperty('NAME'),
                    basename: event.feature.getProperty('BASENAME')
                });
            }

            //get tract type information
            $.each(that.opts.tractTypes, function(key, value){
                if(value.id == tractTypeId){
                    tractTypeData = value;
                    return;
                }
            });
            var titleStr = '';
            $.each(that.activeTracts, function(key, value){
                titleStr += key == 0? 'Census Tract: ' + value.basename : ' & ' + value.basename;
            });
            if(that.activeTracts.length > 1){
                $panel.html(template('tpl-panel-detail', {title: titleStr, tractTypeData: ''}));
            }else{
                $panel.html(template('tpl-panel-detail', {title: titleStr, tractTypeData: tractTypeData}));
            }

            var $container = $('<div></div>');

            //add container to show demographic info
            $.each(that.data.demographic.label, function(key){
                $container.append('<div id="' + key + '"></div>');
            });
            //add container to show economic info
            $.each(that.data.economic.label, function(key){
                $container.append('<div id="' + key + '"></div>');
            });

            $('#tract-charts').html($container);

            //show demographic charts
            $.each(that.data.demographic.label, function(key){
                that.showBarChart('#' + key, 'demographic', key);
            });
            //show economic charts
            $.each(that.data.economic.label, function(key){
                that.showBarChart('#' + key, 'economic', key);
            });

            //show the panel
            $panel.animate({right: 0}, 700);
        });

        var legend = document.getElementById('legend');
        var div = document.createElement('div');
        div.innerHTML = template('tpl-legend', {colors: that.opts.colors, strokeColors: that.opts.strokeColors});
        legend.appendChild(div);

        $(legend).on('click', '.help', function(e){
            e.preventDefault();
            $('#tract-type-help').html(template('tpl-tract-type-help', {data: that.opts.tractTypes})).fadeIn();
        });

        map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(
            legend);


        that.map = map;
        that.infowindow = infowindow;

        that.showTract(callback);
    },
    showTract: function(callback){
        var that = this;

        var showLayer = function(){
            var highPovertyRate = 30;
            var normalPovertyRate = 20;
            var lowPovertyRate = 15;

            //that.map.panTo(new google.maps.LatLng(that.opts.latitude, that.opts.longitude));
            $.getJSON('data/geo.json', function(geojson){

                that.map.data.addGeoJson(geojson);

                //dynamic style of the layer
                that.map.data.setStyle(function(feature) {
                    var geoId = feature.getProperty('GEOID');
                    var povertyRate2000 = that.data.economic['2000'][geoId];
                    var povertyRate2010 = that.data.economic['2010'][geoId];
                    
                    var povertyRateValue2000 = povertyRate2000 ? povertyRate2000.povertyRate[0].value : 'unknown';
                    var povertyRateValue2010 = povertyRate2010 ? povertyRate2010.povertyRate[0].value : 'unknown';
                    var colorIndex = 0;
                    var tractTypeId = 0;

                    if(povertyRate2000 && povertyRate2010){
                        colorIndex = 4;

                        /*if(povertyRateValue2010 > normalPovertyRate){
                            tractTypeId = 1;
                            colorIndex = 0;
                        }*/
                        //Chronic High Poverty
                        if(povertyRateValue2000 > highPovertyRate && povertyRateValue2010 > highPovertyRate){
                            tractTypeId = 1;
                            colorIndex = 0;
                        }
                        //Rebounding Neighborhoods
                        if(povertyRateValue2000 > highPovertyRate && povertyRateValue2010 < lowPovertyRate){
                            tractTypeId = 2;
                            colorIndex = 1;
                        }
                        //Fallen Stars
                        if(povertyRateValue2000 < highPovertyRate && povertyRateValue2010 > highPovertyRate){
                            tractTypeId = 3;
                            colorIndex = 2
                        }
                        //Fallen Stars
                        if(povertyRateValue2000 < lowPovertyRate && povertyRateValue2010 > highPovertyRate){
                            tractTypeId = 4;
                            colorIndex = 3
                        }
                    }else{
                        colorIndex = 5
                    }

                    feature.setProperty('povertyRate2000', povertyRateValue2000);
                    feature.setProperty('povertyRate2010', povertyRateValue2010);
                    feature.setProperty('tractTypeId', tractTypeId);

                    var color = that.opts.colors[colorIndex];
                    var strokeColor = feature.getProperty('isActive') ? that.opts.activeColor : that.opts.strokeColors[colorIndex];
                    var strokeWeight = feature.getProperty('isActive') ? 3: 1.5;
                    var strokeOpacity = feature.getProperty('isActive') ? 1: 0.6;
                    return {
                        fillColor: color,
                        fillOpacity: 0.7,
                        strokeColor: strokeColor,
                        strokeWeight: strokeWeight,
                        strokeOpacity: strokeOpacity
                    };

                });

                callback();
            });
        };

        var data = {
            'label': {
                income: 'Household Income',
                povertyRate: 'Poverty Rate',
                unemploymentRate: 'Unemployment Rate',
                occupation: 'Occupation',
                workerClass: 'Class of Worker',
                commuting: 'Commuting to Work'
            },
            '2000': {},
            '2010': {}
        };
        var isDone = {
            '2000': false,
            '2010': false
        };

        var demographicData = {
            'label': {
                age: "Age",
                race: "Race"
            },
            '2000': {},
            '2010': {}
        };
        var isDemographicDone = {
            '2000': false,
            '2010': false
        };

        $.getJSON('data/economic_data_2000.json', function(resp){
            resp.forEach(function(item, index){
                if(index == 0) return;

                data['2000'][item['GEO.id2']] = {
                    geoLabel: item['GEO.display-label'],
                    povertyRate: [{
                        label: 'Poverty rate',
                        value: item['HC02_VC93']
                    }],
                    unemploymentRate: [{
                        label: 'Unemployment rate',
                        value: 100 * item['HC01_VC06'] / item['HC01_VC03']
                    }],
                    commuting: [{
                            label: 'Car, truck, or van -- drove alone',
                            value: item['HC02_VC18']
                        },{
                            label: 'Car, truck, or van -- carpooled',
                            value: item['HC02_VC19']
                        },{
                            label: 'Public transportation (including taxicab)',
                            value: item['HC02_VC20']
                        },{
                            label: 'Walked',
                            value: item['HC02_VC21']
                        },{
                            label: 'Other means',
                            value: item['HC02_VC22']
                        },{
                            label: 'Worked at home',
                            value: item['HC02_VC23']
                        }],
                    occupation: [{
                            label: 'Management, professional, and related occupations',
                            value: item['HC02_VC27']
                        },{
                            label: 'Service occupations',
                            value: item['HC02_VC28']
                        },{
                            label: 'Sales and office occupations',
                            value: item['HC02_VC29']
                        },{
                            label: 'Natural resources, construction, and maintenance occupations',
                            value: item['HC02_VC30'] + item['HC02_VC31']
                        },{
                            label: 'Production, transportation, and material moving occupations',
                            value: item['HC02_VC32']
                        }],
                    workerClass: [{
                            label: 'Private wage and salary workers',
                            value: item['HC02_VC48']
                        },{
                            label: 'Government workers',
                            value: item['HC02_VC49']
                        },{
                            label: 'Self-employed workers in own not incorporated business',
                            value: item['HC02_VC50']
                        },{
                            label: 'Unpaid family workers',
                            value: item['HC02_VC51']
                        }],
                    income: [{
                            label: 'Less than $10,000',
                            value: item['HC02_VC54']
                        },{
                            label: '$10,000 to $14,999',
                            value: item['HC02_VC55']
                        },{
                            label: '$15,000 to $24,999',
                            value: item['HC02_VC56']
                        },{
                            label: '$25,000 to $34,999',
                            value: item['HC02_VC57']
                        },{
                            label: '$35,000 to $49,999',
                            value: item['HC02_VC58']
                        },{
                            label: '$50,000 to $74,999',
                            value: item['HC02_VC59']
                        },{
                            label: '$75,000 to $99,999',
                            value: item['HC02_VC60']
                        },{
                            label: '$100,000 to $149,999',
                            value: item['HC02_VC61']
                        },{
                            label: '$150,000 to $199,999',
                            value: item['HC02_VC62']
                        },{
                            label: '$200,000 or more',
                            value: item['HC02_VC63']
                        }]
                    };
            });

            isDone['2000'] = true;

            if(isDone['2010']){
                that.data.economic = data;

                showLayer();
                //console.log(data);
            }
        });

        $.getJSON('data/economic_data_2010.json', function(resp){
            resp.forEach(function(item, index){
                if(index == 0) return;

                data['2010'][item['GEO.id2']] = {
                    geoLabel: item['GEO.display-label'],
                    povertyRate: [{
                        label: 'Poverty rate',
                        value: item['HC03_VC161']
                    }],
                    unemploymentRate: [{
                        label: 'Unemployment rate',
                        value: 100 * item['HC01_VC07'] / item['HC01_VC04']
                    }],
                    commuting: [{
                        label: 'Car, truck, or van -- drove alone',
                        value: item['HC03_VC28']
                    },{
                        label: 'Car, truck, or van -- carpooled',
                        value: item['HC03_VC29']
                    },{
                        label: 'Public transportation (including taxicab)',
                        value: item['HC03_VC30']
                    },{
                        label: 'Walked',
                        value: item['HC03_VC31']
                    },{
                        label: 'Other means',
                        value: item['HC03_VC32']
                    },{
                        label: 'Worked at home',
                        value: item['HC03_VC33']
                    }],
                    occupation: [{
                        label: 'Management, professional, and related occupations',
                        value: item['HC03_VC41']
                    },{
                        label: 'Service occupations',
                        value: item['HC03_VC42']
                    },{
                        label: 'Sales and office occupations',
                        value: item['HC03_VC43']
                    },{
                        label: 'Natural resources, construction, and maintenance occupations',
                        value: item['HC03_VC44']
                    },{
                        label: 'Production, transportation, and material moving occupations',
                        value: item['HC03_VC45']
                    }],
                    workerClass: [{
                        label: 'Private wage and salary workers',
                        value: item['HC03_VC67']
                    },{
                        label: 'Government workers',
                        value: item['HC03_VC68']
                    },{
                        label: 'Self-employed workers in own not incorporated business',
                        value: item['HC03_VC69']
                    },{
                        label: 'Unpaid family workers',
                        value: item['HC03_VC70']
                    }],
                    income: [{
                        label: 'Less than $10,000',
                        value: item['HC03_VC75']
                    },{
                        label: '$10,000 to $14,999',
                        value: item['HC03_VC76']
                    },{
                        label: '$15,000 to $24,999',
                        value: item['HC03_VC77']
                    },{
                        label: '$25,000 to $34,999',
                        value: item['HC03_VC78']
                    },{
                        label: '$35,000 to $49,999',
                        value: item['HC03_VC79']
                    },{
                        label: '$50,000 to $74,999',
                        value: item['HC03_VC80']
                    },{
                        label: '$75,000 to $99,999',
                        value: item['HC03_VC81']
                    },{
                        label: '$100,000 to $149,999',
                        value: item['HC03_VC82']
                    },{
                        label: '$150,000 to $199,999',
                        value: item['HC03_VC83']
                    },{
                        label: '$200,000 or more',
                        value: item['HC03_VC84']
                    }]
                };
            });

            isDone['2010'] = true;

            if(isDone['2000']){
                that.data.economic = data;

                showLayer();
                //console.log(data);
            }
        });

        //load demographic data
        $.getJSON('data/demographic_data_2000.json', function(resp) {
            resp.forEach(function (item, index) {
                if (index == 0) return;

                demographicData['2000'][item['GEO.id2']] = {
                    age: [{
                        label: 'Median age (years)',
                        value: item['HC02_VC18']
                    }, {
                        label: 'Under 5 years',
                        value: item['HC02_VC05']
                    }, {
                        label: '5 to 14 years',
                        value: item['HC02_VC06'] + item['HC02_VC07']
                    }, {
                        label: '15 to 24 years',
                        value: item['HC02_VC08'] + item['HC02_VC09']
                    }, {
                        label: '25 to 34 years',
                        value: item['HC02_VC10']
                    }, {
                        label: '35 to 44 years',
                        value: item['HC02_VC11']
                    }, {
                        label: '45 to 54 years',
                        value: item['HC02_VC12']
                    }, {
                        label: '55 to 64 years',
                        value: item['HC02_VC13'] + item['HC02_VC14']
                    }, {
                        label: '65 years and over',
                        value: item['HC02_VC15'] + item['HC02_VC16'] + item['HC02_VC17']
                    }],
                    race: [{
                        label: 'White',
                        value: item['HC02_VC29']
                    }, {
                        label: 'Black or African American',
                        value: item['HC02_VC30']
                    }, {
                        label: 'American Indian and Alaska Native',
                        value: item['HC02_VC31']
                    }, {
                        label: 'Asian',
                        value: item['HC02_VC32']
                    }, {
                        label: 'Native Hawaiian and Other Pacific Islander',
                        value: item['HC02_VC40']
                    }, {
                        label: 'Some other race',
                        value: item['HC02_VC45']
                    }]
                };
            });

            isDemographicDone['2000'] = true;

            if(isDemographicDone['2010']){
                that.data.demographic = demographicData;

                //console.log(that.data);
            }
        });

        $.getJSON('data/demographic_data_2010.json', function(resp) {
            resp.forEach(function (item, index) {
                if (index == 0) return;

                demographicData['2010'][item['GEO.id2']] = {
                    age: [{
                        label: 'Median age (years)',
                        value: item['HD02_S020']
                    }, {
                        label: 'Under 5 years',
                        value: item['HD02_S002']
                    }, {
                        label: '5 to 14 years',
                        value: item['HD02_S003'] + item['HD02_S004']
                    }, {
                        label: '15 to 24 years',
                        value: item['HD02_S005'] + item['HD02_S006']
                    }, {
                        label: '25 to 34 years',
                        value: item['HD02_S007'] + item['HD02_S008']
                    }, {
                        label: '35 to 44 years',
                        value: item['HD02_S009'] + item['HD02_S010']
                    }, {
                        label: '45 to 54 years',
                        value: item['HD02_S011'] + item['HD02_S012']
                    }, {
                        label: '55 to 64 years',
                        value: item['HD02_S013'] + item['HD02_S014']
                    }, {
                        label: '65 years and over',
                        value: item['HD02_S015'] + item['HD02_S016'] + item['HD02_S017'] + item['HD02_S018']
                    }],
                    race: [{
                        label: 'White',
                        value: item['HD02_S078']
                    }, {
                        label: 'Black or African American',
                        value: item['HD02_S079']
                    }, {
                        label: 'American Indian and Alaska Native',
                        value: item['HD02_S080']
                    }, {
                        label: 'Asian',
                        value: item['HD02_S081']
                    }, {
                        label: 'Native Hawaiian and Other Pacific Islander',
                        value: item['HD02_S089']
                    }, {
                        label: 'Some other race',
                        value: item['HD02_S094']
                    }]
                };
            });

            isDemographicDone['2010'] = true;

            if(isDemographicDone['2000']){
                that.data.demographic = demographicData;

                //console.log(that.data);
            }
        });
    },
    initLoading: function() {
        NProgress.configure({ showSpinner: false });
        NProgress.configure({ minimum: 0.1 });
        $(document)
            .ajaxStart(function() {
                NProgress.start();
            })
            .ajaxComplete(function(event, request, settings) {
                NProgress.done();
            });
    },
    addLoading: function(){
        NProgress.start();
    },
    removeLoading: function(){
        NProgress.done();
    },
    showBarChart: function(container, type, param){
        var that = this;
        var categories = [];
        var series = [];
        var data = this.data[type];
        var title = data.label[param];

        if(that.activeTracts.length == 0){
            $('#tract-charts').html('Please choose at least one tract');
            return;
        }else if(that.activeTracts.length == 1){
            var geoId = that.activeTracts[0].geoId;

            var data2000 = [];
            var data2010 = [];

            if(data['2000'][geoId]){
                data['2000'][geoId][param].forEach(function(item){
                    categories.push(item.label);
                    data2000.push(item.value);
                });
                series.push({
                    name: 'Year 2000',
                    data: data2000
                });
            }

            if(data['2010'][geoId]){
                data['2010'][geoId][param].forEach(function(item){
                    data2010.push(item.value);
                });
                series.push({
                    name: 'Year 2010',
                    data: data2010
                });
            }

            getChart(container, title, categories, series);

        }else{
            var years = ['2000', '2010'];
            $(container).html('<div class="2000"></div><div class="2010"></div>');

            $.each(years, function(index, year){
                series = [];
                var year = year;
                var newTitle = title + ' (Year ' + year + ')';
                $.each(that.activeTracts, function(key, value){
                    var geoId = value.geoId;
                    var itemData = [];

                    if(key === 0 && index === 0){
                        if(data['2000'][geoId]){
                            data['2000'][geoId][param].forEach(function(item){
                                categories.push(item.label);
                            });
                        }
                    }

                    if(data[year][geoId]){
                        data[year][geoId][param].forEach(function(item){
                            itemData.push(item.value);
                        });
                    }

                    //edit the value to tract number
                    var temp = {
                        name: value.name,
                        data: itemData
                    };

                    series.push(temp);
                });
                var subContainer = $('.' + year, container);
                getChart(subContainer, newTitle, categories, series);
            });

        }

        function getChart(container, title, categories, series){
            $(container).highcharts({
                chart: {
                    width: 420,
                    type: 'column'
                },
                title: {
                    text: title
                },
                subtitle: {
                    text: 'Source: <a href="http://www.census.gov/" target="_blank">US Census</a>'
                },
                xAxis: {
                    categories: categories,
                    title: {
                        text: null
                    },
                    crosshair: true
                },
                yAxis: {
                    min: 0,
                    title: {
                        text: 'Percent (%)',
                        align: 'high'
                    },
                    labels: {
                        overflow: 'justify'
                    }
                },
                tooltip: {
                    pointFormat: '<span style="color:{point.color}">\u25CF</span> {series.name}: <b>{point.y:.2f}</b> %<br/>',
                    shared: true
                },
                plotOptions: {
                    bar: {
                        dataLabels: {
                            enabled: true
                        }
                    }
                },
                legend: {
                    layout: 'vertical',
                    align: 'right',
                    verticalAlign: 'top',
                    x: -2,
                    y: 40,
                    floating: true,
                    borderWidth: 1,
                    backgroundColor: ((Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF'),
                    shadow: true
                },
                credits: {
                    enabled: false
                },
                series: series
            });
        }
    }
};