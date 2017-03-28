var path = require('path');
var express = require('express');
var app = express();
var PORT = process.env.PORT || 8080
var fs = require('fs');

var googleMapsDirectionsClient = require('@google/maps').createClient({
  key: 'AIzaSyDVl65wW5zqkICh0c1UrabLIn4MV8ryIfk'
});

var googleMapsDistanceClient = require('@google/maps').createClient({
  key: 'AIzaSyA-iU4qAgyz1J6OA-JJ0_LKJxeXJTt78nU'
});

// must match App.js --- eventually change
var STAGE = {
  upcoming_stop: 0,
  current_stop: 1,
  past_stop: 2,
  future_stop: 3
}

var stops_GLOBAL = JSON.parse(fs.readFileSync('data/route.js', 'utf8')),
    first_stop = stops_GLOBAL.route[0]
first_stop['start_time'] = new Date()


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

  // console.log(request.query)

  var origin  = function(data) {
    return [request.query.lat, request.query.lng]
  }(stops_GLOBAL)


/*

The duration in traffic is returned only if all of the following are true:

The request does not include stopover waypoints. 
If the request includes waypoints, they must be prefixed with via: to avoid stopovers.


If you'd like to influence the route using waypoints without adding a stopover, 
prefix the waypoint with via:. Waypoints prefixed with via: will not add an entry to the legs
 array, but will instead route the journey through the provided waypoint.

*/


  var waypoints  = function(data) {
    var stops = []
    // iterate through route stops skipping first and last stop
    for(var i=0; i < data.route.length-1; i++) {
      var stop_obj = data.route[i],
          lat = stop_obj.lat,
          lng = stop_obj.lng

      stops.push([lat, lng])    
    }
    return stops
  }(stops_GLOBAL)

  var destination  = function(data) {
    var destination_obj = data.route[data.route.length-1],
        lat = destination_obj.lat,
        lng = destination_obj.lng
   
    return [lat, lng]
  }(stops_GLOBAL)


  var arrivedToStops = function(directions_data) {
    // iterate through stops chronologically
    var all_stops = waypoints.concat([destination]),
        upcoming_distance = 100
        arrived_to_distance = 40

    googleMapsDistanceClient.distanceMatrix({
        origins: [origin],
        destinations: all_stops
      }, function(err, res) {
        if (!err) {
          directions_data['stops'] = updateStageOfStops(res.json)
          response.json(directions_data);
        } else {
          console.log('err-' + err);
        }
    })

    /*
        stop stage persists because were updating stops_GLOBAL
        ideally we would be storing this info in a database in a server
    */
    var updateStageOfStops = function(distance_data) {
      var distances_to_stops = distance_data.rows[0].elements,
          num_stops = distances_to_stops.length

      for(var i=0; i<num_stops; i++) {
        var stop_distance = distances_to_stops[i].distance.value,
            stop_obj = stops_GLOBAL.route[i] // in meters

        if (stop_distance < arrived_to_distance) {              // currently at this stop

          if (stop_obj['stage'] === STAGE.upcoming_stop) {
            stop_obj['stage'] = STAGE.current_stop   
          }

        } else if (stop_distance < upcoming_distance) {         // upcoming at this stop
          if (stop_obj['stage'] === STAGE.future_stop) {
            stop_obj['stage'] = STAGE.upcoming_stop   

          } else if (stop_obj['stage'] === STAGE.current_stop) {  
            stop_obj['stage'] = STAGE.past_stop       //leaving this spot
            var next_stop_obj = stops_GLOBAL.route[i+1]
            if (next_stop_obj) {
              next_stop_obj['start_time'] = new Date()
            }
          } 

        } else {                                                 // out of range
          if (stop_obj['stage'] === STAGE.current_stop) {
             // probably never gets here since we move to upcoming distance before out of range, unless we jump out really quickly
             // safety check 
            stop_obj['stage'] = STAGE.past_stop   // leaving  this stop
          } 
        }

        stop_obj['distance'] = stop_distance
      }
      return stops_GLOBAL
    }
  }

  // var date5pm = new Date()
  // date5pm.setHours(17)
  // console.log(date5pm)
  // var secondsDate5pm = Math.round(date5pm.getTime()/1000)
  // console.log(secondsDate5pm)

  // free version doesnt factor in traffic...
  googleMapsDirectionsClient.directions({
    origin: origin,
    waypoints: waypoints,
    destination: destination, 
    departure_time: 'now', //leave at 5 
    traffic_model: 'best_guess'
  }, function(err, res) {    
    if (!err) {
      arrivedToStops(res.json)
    } else {
      console.log('err-' + err);
    }
  });
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


