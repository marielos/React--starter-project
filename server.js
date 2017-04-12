/*---------------  Express Server Setup  ----------------*/

var path = require('path');
var express = require('express');
var app = express();
var PORT = process.env.PORT || 8080
var fs = require('fs');

// using webpack-dev-server and middleware in development environment
if(process.env.NODE_ENV !== 'production') {
  var webpackDevMiddleware = require('webpack-dev-middleware');
  var webpackHotMiddleware = require('webpack-hot-middleware');
  var webpack = require('webpack');
  var config = require('./webpack.config');
  var compiler = webpack(config);
  
  app.use(webpackDevMiddleware(compiler, { noInfo: true, publicPath: config.output.publicPath }));
  app.use(webpackHotMiddleware(compiler));
}

app.use(express.static(path.join(__dirname, 'dist')));

app.get('/', function(request, response) {
  response.sendFile(__dirname + '/dist/index.html')
});


app.listen(PORT, function(error) {
  if (error) {
    console.error(error);
  } else {
    console.info("==> 🌎  Listening on port %s. Visit http://localhost:%s/ in your browser.", PORT, PORT);
  }
});


/*--------------- ^^^ Express Server Setup ^^^ ----------------*/




/*---------------  Constants  ----------------*/


// must match App.js 
var STAGE = {
  upcoming_stop: 0,
  current_stop: 1,
  past_stop: 2,
  future_stop: 3
},
  stops_GLOBAL = JSON.parse(fs.readFileSync('data/routeAM.js', 'utf8')),
  isAM = true

var googleMapsDirectionsClient = require('@google/maps').createClient({
  key: 'AIzaSyDhYQs3y6neWPf1TIX_Y8IgjTtOcpSe7X0'//'AIzaSyDVl65wW5zqkICh0c1UrabLIn4MV8ryIfk'
});





/*--------------- Load AM / PM routes ----------------*/



app.get('/reset/am', function(request, response) {
  stops_GLOBAL = JSON.parse(fs.readFileSync('data/routeAM.js', 'utf8'))
  isAM = true 
  response.send('success am')
})


app.get('/reset/pm', function(request, response) {
  stops_GLOBAL = JSON.parse(fs.readFileSync('data/routePM.js', 'utf8'))
  isAM = false 
  response.send('success pm')
})



/*--------------- Get Caltrain ETAs ----------------*/
app.get('/caltrain/etas', function(request, response) {

  var caltrainSched = JSON.parse(fs.readFileSync('data/caltrainSched.js', 'utf8'));
  var caltrains = function(data){
    var caltrain = { "caltrains":[]}
    for(var i=0; i<data.caltrainStops.length; i++){
      var caltrainInfo = data.caltrainStops[i]
      if (caltrainInfo.stop_name == "Palo Alto Caltrain")
        {caltrain.caltrains.push(caltrainInfo)}
    }     
    return caltrain
  }(caltrainSched)
  response.json(caltrains)
});


/*--------------- Get Route times/distance ----------------

  in the future, call this only once per stop. 
  Google Directions API blocks your key if it is called too much
  Also, modify algorithm to get simple A->B directions for next stop and B->C->...->X for the rest of stops
  Traffic data is only available for A->B queries
*/

app.get('/route/etas', function(request, response) {

  var origin  = function() {
    return [request.query.lat, request.query.lng]
  }()

  var waypoints  = function() {
    var stops = [],
        num_past_stops = request.query.num_past_stops
    
    for(var i=num_past_stops; i < stops_GLOBAL.route.length-1; i++) {
      var stop_obj = stops_GLOBAL.route[i],
          lat = stop_obj.lat,
          lng = stop_obj.lng

      stops.push([lat, lng])    
    }
    return stops
  }()

  var destination  = function() {
    var destination_obj = stops_GLOBAL.route[stops_GLOBAL.route.length-1],
        lat = destination_obj.lat,
        lng = destination_obj.lng
   
    return [lat, lng]
  }()


/*
          ------ from Google Directions API Docs -----------
The duration in traffic is returned only if all of the following are true:

The request does not include stopover waypoints. 
If the request includes waypoints, they must be prefixed with via: to avoid stopovers.

If you'd like to influence the route using waypoints without adding a stopover, 
prefix the waypoint with via:. Waypoints prefixed with via: will not add an entry to the legs
 array, but will instead route the journey through the provided waypoint.

*/

  googleMapsDirectionsClient.directions({
    origin: origin,
    waypoints: waypoints,
    destination: destination, 
    departure_time: 'now', //leave at 5 
    traffic_model: 'best_guess'
  }, function(err, res) {    
    if (!err) {
      // console.log('finished getting data')
      var directions_data = res.json
      directions_data['stops'] = updateDistanceOfStops(directions_data)
      directions_data['isAM'] = isAM
      response.json(directions_data)
    } else {
      console.log('google direction api err-' + err);

      response.json({
        stops: stops_GLOBAL
      })
    }
  });


    var updateDistanceOfStops = function(directions_data) {
      var legs = directions_data.routes[0].legs,
          num_legs = legs.length,
          num_stops = stops_GLOBAL.route.length,
          num_past_stops = parseInt(request.query.num_past_stops)

      for (var leg_i=0; leg_i<num_legs; leg_i++) {

        var stop_distance = legs[leg_i].distance.value,
            stop_i = leg_i+num_past_stops,
            stop_obj = stops_GLOBAL.route[stop_i] // in meters

        stop_obj['distance'] = stop_distance
      }
      return stops_GLOBAL
    }
});

