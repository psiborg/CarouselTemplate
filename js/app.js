/* ===========================================================================
 * app.js
 *
 * Jim Ing (@jim_ing)
 * ===========================================================================
 *
 * Copyright 2012-2013 Research In Motion Limited.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

 var app = {
    map: null,
    carousels: [],
    scrollers: []
};

app.adjustCarousels = function () {
    console.info('adjustCarousels:');

    app.carousels['header'].modify();
    app.carousels['content'].modify();
    app.carousels['scores'].modify();
    app.carousels['navigation'].modify();
    app.carousels['communication'].modify();
};

app.debug = function (str) {
    document.getElementById('debug').innerHTML += str + '<br>';
    app.scrollers['comm_debug'].refresh();
};

app.getCities = function () {
    console.info('getCities:');

    var html = '<li><strong>Canada</strong></li>';
    for (var cd in cityData) {
        html += '<li><a href="#' + cd + '">' + cityData[cd].name + ', ' + cityData[cd].prov + '</a></li>';
    }
    document.getElementById('mapList').innerHTML = html;
};

app.getRSS = function (url, targetId, scrollerId) {
    console.info('getRSS:', url, targetId, scrollerId);

    document.getElementById(targetId).innerHTML = '<li>Loading...</li>';

    $.ajax({
        type: 'GET',
        url: url,
        dataType: 'xml',
        complete: function (data) {
            var json = $.xmlToJSON(data.responseXML),
                html = '', item;

            for (var i = 0, ii = json.channel[0].item.length; i < ii; i++) {
                item = json.channel[0].item[i];
                //console.log(i, item, item.title[0].Text, item.link[0].Text, item.pubDate[0].Text);
                html += '<li><span class="newsDate">' + item.pubDate[0].Text + '</span><br><a href="#" data-url="' + item.link[0].Text + '">' + item.title[0].Text + '</a></li>';
            }

            document.getElementById(targetId).innerHTML = html;
            app.scrollers[scrollerId].refresh();
        }
    });
};

/*
    'symbol',
    'last_trade',
    'update_date',
    'update_time',
    'change',
    'prev_close',
    'day_high',
    'day_low',
    'volume'
 */
app.getStocks = function (url, targetId, titleText) {
    console.info('getStocks:', url, targetId, titleText);

    document.getElementById(targetId).innerHTML = '<span>Loading...</span>';

    $.ajax({
        type: 'GET',
        url: url,
        dataType: 'text',
        complete: function (data) {
            var lines = data.responseText.split("\r\n"),
                parts = [],
                symb = '',
                quotes = {},
                quotePatt = /['"]/g,
                html = '';

            //console.log(data.responseText, lines.length, lines);

            html += '<span class="quote">' + titleText + ':</span>';
            for (var i = 0, ii = lines.length; i < ii; i++) {
                parts = lines[i].split(',');

                if (parts.length === 9) {
                    symb = parts[0].replace(quotePatt, '');

                    quotes[symb] = {
                        'symbol': symb,
                        'last_trade': parseFloat(parts[1], 10),
                        'update_date': parts[2].replace(quotePatt, ''),
                        'update_time': parts[3].replace(quotePatt, ''),
                        'change': parseFloat(parts[4], 10),
                        'prev_close': parseFloat(parts[5], 10),
                        'day_high': parseFloat(parts[6], 10),
                        'day_low': parseFloat(parts[7], 10),
                        'volume': parseInt(parts[8], 10)
                    };

                    console.log(symb, quotes[symb].last_trade);

                    if (quotes[symb].change < 0) {
                        quotes[symb].css = 'down';
                    }
                    else if (quotes[symb].change > 0) {
                        quotes[symb].css = 'up';
                    }
                    else {
                        quotes[symb].css = 'eq';
                    }

                    html += '<span class="' + quotes[symb].css + '" onclick="app.updateStock(event, \'content\', \'1\', \'main\', \'' + symb + '\');">';
                    html += '<span class="quote">' + symb + '</span> <span>' + quotes[symb].last_trade + ' (' + quotes[symb].change + ')</span>';
                    html += '</span>';
                }
            }

            //console.log(quotes);
            //console.log(html);

            document.getElementById(targetId).innerHTML = html;
        }
    });
};

app.handleHorz = function (ev, elem) {
    console.info('handleHorz:', elem.element.id, ev.direction, ev.distance);

    if (ev.direction == 'left') {
        elem.rotation += elem.theta * 1 * -1;
        elem.transform();
    }
    else if (ev.direction == 'right') {
        elem.rotation += elem.theta * -1 * -1;
        elem.transform();
    }
};

app.handleVert = function (ev, elem) {
    console.info('handleVert:', elem.element.id, ev.direction, ev.distance);

    if (ev.direction == 'down') {
        elem.rotation += elem.theta * 1 * -1;
        elem.transform();
    }
    else if (ev.direction == 'up') {
        elem.rotation += elem.theta * -1 * -1;
        elem.transform();
    }
};

app.init = function () {
    console.info('init:');

    if (window.blackberry) {
        document.getElementById('heading').innerHTML += ' v.' + blackberry.app.version;
    }

    app.getCities();

    app.initLocation();

    app.getRSS('http://rss.cbc.ca/lineup/sports-nhl.xml', 'scores_nhl', 'scores_nhl');
    app.getRSS('http://rss.cbc.ca/lineup/sports-nba.xml', 'scores_nba', 'scores_nba');
    app.getRSS('http://rss.cbc.ca/lineup/sports-mlb.xml', 'scores_mlb', 'scores_mlb');
    app.getRSS('http://rss.cbc.ca/lineup/sports-nfl.xml', 'scores_nfl', 'scores_nfl');

    app.getRSS('http://news.cnet.com/8300-1001_3-92.xml', 'newsList', 'comm_news');
    app.getRSS('https://api.twitter.com/1/statuses/user_timeline.rss?screen_name=BlackBerry', 'tweetList', 'comm_tweets');

    app.getStocks('http://download.finance.yahoo.com/d/quotes.csv?s=^IXIC,^DJI,^GSPC,^GSPTSE,^FTSE,^GDAXI,^FCHI,^N225,^HSI&f=sl1d1t1c1ohgv&e=.csv', 'marketTicker', 'Markets');
    app.getStocks('http://download.finance.yahoo.com/d/quotes.csv?s=RIMM,AAPL,GOOG,MSFT,IBM,ORCL&f=sl1d1t1c1ohgv&e=.csv', 'stockTicker', 'Stocks');

    // Set up Carousels

    app.carousels['header'] = new Carousel3D(document.getElementById('carousel0'));
    app.carousels['content'] = new Carousel3D(document.getElementById('carousel1'));
    app.carousels['scores'] = new Carousel3D(document.getElementById('carousel2'));
    app.carousels['navigation'] = new Carousel3D(document.getElementById('carousel3'));
    app.carousels['communication'] = new Carousel3D(document.getElementById('carousel4'));

    app.carousels['header'].backgroundColor = '#262626'; // charcoal
    app.carousels['header'].panelCount = 4;
    app.carousels['header'].isHorizontal = false;
    app.carousels['header'].modify();

    app.carousels['content'].panelCount = 4;
    app.carousels['content'].modify();

    app.carousels['scores'].panelCount = 4;
    app.carousels['scores'].modify();

    app.carousels['navigation'].panelCount = 4;
    app.carousels['navigation'].modify();

    app.carousels['communication'].panelCount = 4;
    app.carousels['communication'].modify();

    // Set up scrollers
    // TODO: automatically set up scrollers for every side?

    var hScrollOpts = {
        hScroll: true,
        vScroll: false,
        hScrollbar: true,
        vScrollbar: false
    };

    var vScrollOpts = {
        hScroll: false,
        hScrollbar: false,
        vScrollbar: true
    };

    //app.scrollers['content_home'] = new iScroll('C1S1', vScrollOpts);
    app.scrollers['content_chart'] = new iScroll('C1S2', vScrollOpts);

    app.scrollers['scores_nhl'] = new iScroll('C2S1', vScrollOpts);
    app.scrollers['scores_nba'] = new iScroll('C2S2', vScrollOpts);
    app.scrollers['scores_mlb'] = new iScroll('C2S3', vScrollOpts);
    app.scrollers['scores_nfl'] = new iScroll('C2S4', vScrollOpts);

    app.scrollers['nav_finance'] = new iScroll('C3S1', vScrollOpts);
    app.scrollers['nav_chart'] = new iScroll('C3S2', vScrollOpts);
    app.scrollers['nav_map'] = new iScroll('C3S3', vScrollOpts);
    app.scrollers['nav_video'] = new iScroll('C3S4', vScrollOpts);

    app.scrollers['comm_news'] = new iScroll('C4S1', vScrollOpts);
    app.scrollers['comm_tweets'] = new iScroll('C4S2', vScrollOpts);
    app.scrollers['comm_bbm'] = new iScroll('C4S3', vScrollOpts);
    app.scrollers['comm_debug'] = new iScroll('C4S4', vScrollOpts);

    // Set up Hammer for swipe events

    var c1style = window.getComputedStyle(document.getElementById('container1'), null);
    var c3style = window.getComputedStyle(document.getElementById('container3'), null);

    var hammer0 = new Hammer(document.getElementById('container0'), {
        drag: true,
        drag_horizontal: false,
        drag_vertical: true,
        drag_min_distance: 20
    });

    var hammer1 = new Hammer(document.getElementById('container1'), {
        drag: true,
        drag_horizontal: true,
        drag_vertical: false,
        //drag_min_distance: 40
        drag_min_distance: parseInt(c1style.width, 10) * 0.4
    });

    var hammer2 = new Hammer(document.getElementById('container2'), {
        drag: true,
        drag_horizontal: true,
        drag_vertical: false,
        drag_min_distance: 40
    });

    var hammer3 = new Hammer(document.getElementById('container3'), {
        drag: true,
        drag_horizontal: true,
        drag_vertical: false,
        drag_min_distance: parseInt(c3style.width, 10) * 0.3
        //drag_min_distance: 40
    });

    var hammer4 = new Hammer(document.getElementById('container4'), {
        drag: true,
        drag_horizontal: true,
        drag_vertical: false,
        drag_min_distance: 40
    });

/*
    var hammerVideo = new Hammer(document.getElementById('videoWindow'), {
        drag: true,
        drag_horizontal: false,
        drag_vertical: true,
        drag_min_distance: 40
    });
*/

    hammer0.ondragstart = function (ev) {
        app.handleVert(ev, app.carousels['header']);
    };
    hammer1.ondragstart = function (ev) {
        app.handleHorz(ev, app.carousels['content']);
    };
    hammer2.ondragstart = function (ev) {
        app.handleHorz(ev, app.carousels['scores']);
    };
    hammer3.ondragstart = function (ev) {
        app.handleHorz(ev, app.carousels['navigation']);
    };
    hammer4.ondragstart = function (ev) {
        app.handleHorz(ev, app.carousels['communication']);
    };

/*
    hammerVideo.ondragstart = function (ev) {
        var vidList = document.getElementById('videoList').children,
            //vidPatt = new RegExp('' + ev.originalEvent.target.children[0].src + '$'),
            vidItems = [];

        console.log(ev.direction, ev.originalEvent.target.children[0].src);

        for (var i = 0, ii = vidList.length; i < ii; i++) {
            if (vidList[i].children[0].tagName === 'A' && vidList[i].children[0].dataset['type'] === 'video') {
                //console.log(vidList[i].children[0].dataset['url']);
                vidItems.push(vidList[i].children[0].dataset['url']);
            }
        }
        console.log(vidItems);
    };
*/

    app.debug(navigator.userAgent);
    app.debug('devicePixelRatio=' + window.devicePixelRatio);
    app.debug('initialScale=' + initialScale);

    // Enable visibility AFTER setting up the carousels to reduce flicker
    $('body').css('visibility', 'visible');

    setTimeout(function () {
        document.body.addClassName('ready');
    }, 0);
};

app.initLocation = function () {
    console.info('initLocation:');

    var lat = 43.6425778753, lng = -79.3870621920, accuracy = 0;

    if (navigator.geolocation) {
        console.log('Geolocation is supported.');
        navigator.geolocation.getCurrentPosition(function (position) {
            var coords = position.coords;
            lat = coords.latitude;
            lng = coords.longitude;
            accuracy = coords.accuracy;
            app.initMap(lat, lng, accuracy);
        }, function () {
            console.warn('Position not found.');
            app.initMap(lat, lng, accuracy);
        });
    }
    else {
        console.warn('Geolocation is not supported.');
    }
};

app.initMap = function (lat, lng, accuracy) {
    console.info('initMap:');

    app.debug('lat=' + lat + ', lng=' + lng + ', accuracy=' + accuracy);

    try {
        // Set up Leaflet
        var tileUrl = "http://{s}.googleapis.com/vt?lyrs=m@174225136&src=apiv3&hl=en-US&x={x}&y={y}&z={z}&s=Galile&style=api%7Csmartmaps",
            tileAttr = "Map data &copy; 2012 Google",
            tileLayer = new L.TileLayer(tileUrl, {
                maxZoom: 22,
                subdomains: ['mt0', 'mt1'],
                attribution: tileAttr
            });

        this.map = new L.Map("map", {
            center: new L.LatLng(lat, lng),
            zoom: 6,
            dragging: true
        });

        this.map.addLayer(tileLayer);
    }
    catch (ex) {
        console.error('initMap: ' + ex.message);
        for (var p in ex) {
            console.log("\t" + p + ': ' + ex[p]);
        }
    }
};

app.maximize = function (ev, idx, carouselId) {
    console.info('maximize:', idx, carouselId);

    var cid = (carouselId) ? carouselId : 'content';

    var carousel = app.carousels[cid];

    var cids = {
        'content': 'container1',
        'scores': 'container2',
        'navigation': 'container3',
        'communication': 'container4'
    };

    if (carousel.maximized !== true) {
        var cStyle = window.getComputedStyle(document.getElementById(cids[cid]), null);

        // Save current carousel style
        carousel.prevStyle.top = cStyle.top;
        carousel.prevStyle.left = cStyle.left;
        carousel.prevStyle.width = cStyle.width;
        carousel.prevStyle.height = cStyle.height;

        // Hide all carousels
        document.getElementById('container0').style.visibility = 'hidden';
        document.getElementById('container1').style.visibility = 'hidden';
        document.getElementById('container2').style.visibility = 'hidden';
        document.getElementById('container3').style.visibility = 'hidden';
        document.getElementById('container4').style.visibility = 'hidden';

        // Maximize selected carousel
        document.getElementById(cids[cid]).style.top = '0';
        document.getElementById(cids[cid]).style.left = '0';
        document.getElementById(cids[cid]).style.width = '100%';
        document.getElementById(cids[cid]).style.height = '100%';

        // Unhide selected carousel
        document.getElementById(cids[cid]).style.visibility = 'visible';

        app.carousels[cid].maximized = true;
    }
    else {
        console.log('Restoring...', carousel.prevStyle);

        // Restore carousel style
        document.getElementById(cids[cid]).style.top = carousel.prevStyle.top;
        document.getElementById(cids[cid]).style.left = carousel.prevStyle.left;
        document.getElementById(cids[cid]).style.width = carousel.prevStyle.width;
        document.getElementById(cids[cid]).style.height = carousel.prevStyle.height;

        // Unhide all carousels
        document.getElementById('container0').style.visibility = 'visible';
        document.getElementById('container1').style.visibility = 'visible';
        document.getElementById('container2').style.visibility = 'visible';
        document.getElementById('container3').style.visibility = 'visible';
        document.getElementById('container4').style.visibility = 'visible';

        app.carousels[cid].maximized = false;
    }

    app.adjustCarousels();

    var sids = {
        'content': {
            '0': 'content_home',
            '1': 'content_chart'
        },
        'scores' : {
            '0': 'scores_nhl',
            '1': 'scores_nba',
            '2': 'scores_mlb',
            '3': 'scores_nfl'
        },
        'navigation': {
            '0': 'nav_finance',
            '1': 'nav_chart',
            '2': 'nav_map',
            '3': 'nav_video'
        },
        'communication' : {
            '0': 'comm_news',
            '1': 'comm_tweets',
            '2': 'comm_bbm',
            '3': 'comm_debug'
        }
    };

    // Refresh iScroll
    if (sids[cid]) {
        for (var i in sids[cid]) {
            if (app.scrollers[sids[cid][i]]) {
                console.log('Refreshing iScroll for ' + sids[cid][i]);
                app.scrollers[sids[cid][i]].refresh();
            }
        }
    }

    if (cid == 'content') {
        // Resize Leaflet Map
        this.map.invalidateSize();

        // Resize Highcharts
        if (chart) {
            console.log('Redrawing chart...');
            console.log(chart);
            chart.redraw(this); // TODO:
        }
    }
};

app.turnCarousel = function (carouselId, side) {
    var rotation = {
        1: 0,
        2: -90,
        3: -180,
        4: 90
    };

    app.carousels[carouselId].rotation = rotation[side];
    app.carousels[carouselId].transform();
};

app.updateChart = function (ev, carouselId, side, targetPrefixId, scrollerId) {
    console.info('updateChart:', ev, carouselId, side, targetPrefixId, scrollerId);

    try {
        var subtitleText = '';
        if (ev.target.nodeName == 'A') {
            subtitleText = ev.target.text;
        }
        // else if (ev.target.nodeName == 'LI' && ev.target.childNodes[0].nodeName == 'A') {
        //  subtitleText = ev.target.childNodes[0].text;
        // }
        else {
            return;
        }

        app.turnCarousel(carouselId, side);

        var title = document.getElementById(targetPrefixId + 'Title');
        title.innerHTML = subtitleText;

        var chartId = targetPrefixId + 'Window';
        if (ev.target.dataset['charttype'] == 'line') {
            app.charts.drawLineChart(chartId);
        }
        else if (ev.target.dataset['charttype'] == 'area') {
            app.charts.drawAreaChart(chartId);
        }
        else if (ev.target.dataset['charttype'] == 'bar') {
            app.charts.drawBarChart(chartId);
        }
        else if (ev.target.dataset['charttype'] == 'pie') {
            app.charts.drawPieChart(chartId);
        }
        else if (ev.target.dataset['charttype'] == 'live') {
            app.charts.drawLiveRandomChart(chartId);
        }
        else if (ev.target.dataset['charttype'] == 'combo') {
            app.charts.drawComboChart(chartId);
        }
        else if (ev.target.dataset['charttype'] == 'gauge') {
            app.charts.drawGauge(chartId);
        }

        // Scroll to the top
        app.scrollers[scrollerId].refresh();
        app.scrollers[scrollerId].scrollTo(0, 0, 200, false);
    }
    catch (ex) {
        console.error('updateChart: ' + ex.message);
        for (var p in ex) {
            console.log("\t" + p + ': ' + ex[p]);
        }
    }
};

app.updateContent = function (ev, carouselId, side, targetPrefixId, scrollerId, titleText) {
    console.info('updateContent:', ev, ev.target.innerText, ev.target.dataset['url'], carouselId, side, targetPrefixId, scrollerId);

    if (!ev.target.dataset['url']) {
        return;
    }

    app.turnCarousel(carouselId, side);

    var title = document.getElementById(targetPrefixId + 'Title'),
        target = document.getElementById(targetPrefixId + 'Window'),
        t = (titleText !== undefined) ? titleText : ev.target.innerText;

    title.innerHTML = t;
    target.innerHTML = '<img src="' + ev.target.dataset['url'] + '" class="screenshot">';

    // Scroll to the top
    app.scrollers[scrollerId].refresh();
    app.scrollers[scrollerId].scrollTo(0, 0, 200, false);
};

app.updateIframe = function (ev, carouselId, side, targetPrefixId, titleText) {
    console.info('updateIframe:', ev.target.dataset.url, carouselId, side, targetPrefixId);

    if (ev.target.dataset.url === undefined) {
        return;
    }

    app.turnCarousel(carouselId, side);

    var title = document.getElementById(targetPrefixId + 'Title'),
        target = document.getElementById(targetPrefixId + 'Window');

    title.innerHTML = titleText;
    target.innerHTML = '<div class="iframeContainer"><iframe src="' + ev.target.dataset.url + '" class="iframeClip"></iframe></div>';
};

app.updateMap = function (ev, carouselId, side) {
    console.info('updateMap:', this.map);

    if (this.map === null) {
        app.initMap(43.6425778753, -79.3870621920, 0);
    }

    var cityID = '';
    if (ev.target.nodeName == 'A') {
        cityID = ev.target.hash.substr(1, ev.target.hash.length);
    }
    // else if (ev.target.nodeName == 'LI' && ev.target.childNodes[0].nodeName == 'A') {
    //  cityID = ev.target.childNodes[0].hash.substr(1, ev.target.childNodes[0].hash.length);
    // }
    else {
        return;
    }

    app.turnCarousel(carouselId, side);

    var html = cityData[cityID].name + ', ' + cityData[cityID].prov;

    // Add marker
    L.marker([cityData[cityID].lat, cityData[cityID].lng]).addTo(app.map).bindPopup(html).openPopup();
    app.map.panTo([cityData[cityID].lat, cityData[cityID].lng]);
};

app.updateStock = function (ev, carouselId, side, targetPrefixId, symb) {
    console.info('updateStock:', ev, carouselId, side, targetPrefixId, symb);

    var url = 'http://finance.yahoo.com/q/bc?s=' + symb + '+Basic+Chart';

    app.turnCarousel(carouselId, side);

    var title = document.getElementById(targetPrefixId + 'Title'),
        target = document.getElementById(targetPrefixId + 'Window');

    title.innerHTML = 'Stock Quote';
    target.innerHTML = '<div class="iframeContainer"><iframe src="' + url + '" class="iframeClip"></iframe></div>';
};

app.updateVideo = function (ev, carouselId, side, targetPrefixId) {
    console.info('updateVideo:', ev.target.dataset.url, carouselId, side, targetPrefixId);

    if (ev.target.dataset.url === undefined) {
        return;
    }

    if (ev.target.dataset.type == 'video') {
        app.turnCarousel(carouselId, side);

        var title = document.getElementById(targetPrefixId + 'Title'),
            target = document.getElementById(targetPrefixId + 'Window');

        title.innerHTML = 'Video';
        target.innerHTML = '<video class="videoClip" controls="controls"><source src="' + ev.target.dataset.url + '" type="video/mp4"></video>';
        target.children[0].play();
    }
    else {
        app.updateIframe(ev, carouselId, side, targetPrefixId, 'Video');
    }
};
