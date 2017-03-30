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

/*--------------- ^^^ Express Server Setup ^^^ ----------------*/


var googleMapsDirectionsClient = require('@google/maps').createClient({
  key: 'AIzaSyDVl65wW5zqkICh0c1UrabLIn4MV8ryIfk'
});

// must match App.js --- eventually export
var STAGE = {
  upcoming_stop: 0,
  current_stop: 1,
  past_stop: 2,
  future_stop: 3
}

var stops_GLOBAL = JSON.parse(fs.readFileSync('data/routePA.js', 'utf8'))


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


app.get('/route/etas', function(request, response) {

  var origin  = function() {
    return [request.query.lat, request.query.lng]
  }()

  var waypoints  = function() {
    var stops = []
    for(var i=0; i < stops_GLOBAL.route.length-1; i++) {
      var stop_obj = stops_GLOBAL.route[i],
          lat = stop_obj.lat,
          lng = stop_obj.lng

          // dont factor in past stops for route
      if (stop_obj.stage === STAGE.past_stop || stop_obj.stage === STAGE.current_stop ) {
        continue
      }

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
      var directions_data = res.json
      directions_data['stops'] = updateStageOfStops(directions_data)
      response.json(directions_data)
    } else {
      console.log('err-' + err);

      response.json({
        stops: stops_GLOBAL
      })
    }
  });


    var updateStageOfStops = function(directions_data) {
      var legs = directions_data.routes[0].legs,
          num_legs = legs.length,
          num_stops = stops_GLOBAL.route.length,
          upcoming_distance = 400, //----- testing values are different than driving values
          arrived_to_distance = 100,
          leg_i = 0

          // more stops than legs
      for(var stop_i=0; stop_i<num_stops; stop_i++) {

        var stop_distance = legs[leg_i].distance.value,
            stop_obj = stops_GLOBAL.route[stop_i] // in meters

        if (stop_obj.stage === STAGE.past_stop || stop_obj.stage === STAGE.current_stop ) {
          continue
        }

        if (stop_distance < arrived_to_distance) {              // currently at this stop

          if (stop_obj['stage'] === STAGE.upcoming_stop) {
            stop_obj['stage'] = STAGE.current_stop   
          }

        } else if (stop_distance < upcoming_distance) {         // upcoming at this stop
          if (stop_obj['stage'] === STAGE.future_stop) {
            stop_obj['stage'] = STAGE.upcoming_stop   

          } else if (stop_obj['stage'] === STAGE.current_stop) {  
            stop_obj['stage'] = STAGE.past_stop       //leaving this spot
    
          } 
        } else {                                                 // out of range
          if (stop_obj['stage'] === STAGE.current_stop) {
             // probably never gets here since we move to upcoming distance before out of range, unless we jump out really quickly
             // safety check 
            stop_obj['stage'] = STAGE.past_stop   // leaving  this stop
          } 
        }

        stop_obj['distance'] = stop_distance
        leg_i++
      }
      return stops_GLOBAL
    }
});


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



/* ----------------------------- Sample http request ---------------------------------

http.get(url, (res) => {
    const statusCode = res.statusCode;
    const contentType = res.headers['content-type'];

    var error;
    if (statusCode !== 200) {
      error = new Error(`Request Failed.\n` +
                        `Status Code: ${statusCode}`);
    } else if (!/^application\/json/.test(contentType)) {
      error = new Error(`Invalid content-type.\n` +
                        `Expected application/json but received ${contentType}`);
    }
    if (error) {
      console.log(error.message);
      // consume response data to free up memory
      res.resume();
      return;
    }

    res.setEncoding('utf8');
    var rawData = '';
    res.on('data', (chunk) => rawData += chunk);
    res.on('end', () => {
      try {
        var parsedData = JSON.parse(rawData);
        response.json(parsedData);
        console.log(parsedData);
      } catch (e) {
        console.log(e.message);
      }
    });
  }).on('error', (e) => {
    console.log(`Got error: ${e.message}`);
  });




  ---------------------------------------------------------------------------------------*/


