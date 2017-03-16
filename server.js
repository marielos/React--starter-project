var path = require('path');
var express = require('express');
var app = express();
var PORT = process.env.PORT || 8080
// var http = require('http');
var fs = require('fs');

// ---- breaks in Heroku -----------//
var googleMapsDirectionsClient = require('@google/maps').createClient({
  key: 'AIzaSyBC-uIPCkcqeaI5idN5rKgyx8JO2N8DLI0'
});

var googleMapsDistanceClient = require('@google/maps').createClient({
  key: 'AIzaSyCE4T96JV56kgXvQy54VqtTfKAUwOUOIew'
});

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



app.get('/route/etas', function(request, response) {

  // console.log(request.query)
  var stops = JSON.parse(fs.readFileSync('data/route.js', 'utf8'));


  var origin  = function(data) {
    return [request.query.lat, request.query.lng]
  }(stops)

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
  }(stops)

  var destination  = function(data) {
    var destination_obj = data.route[data.route.length-1],
        lat = destination_obj.lat,
        lng = destination_obj.lng
   
    return [lat, lng]
  }(stops)


  var arrivedToStops = function(directions_data) {
    // iterate through stops chronologically
    var all_stops = waypoints.concat([destination]),
        min_distance = 25 // arrived to stop if 50 meters away

    var updateArrivedToStops = function(distance_data) {
      var distances_to_stops = distance_data.rows[0].elements,
          num_stops = distances_to_stops.length

      for(var i=0; i<num_stops; i++) {
        var stop_distance = distances_to_stops[i].distance.value // in meters

        if (stop_distance < min_distance) {
            stops.route[i]['arrived'] = true
        } else {
            stops.route[i]['arrived'] = false
        }
      }
      return stops
    }

    googleMapsDistanceClient.distanceMatrix({
        origins: [origin],
        destinations: all_stops
      }, function(err, res) {
        if (!err) {
          directions_data['stops'] = updateArrivedToStops(res.json)
          response.json(directions_data);
        } else {
          console.log('err-' + err);
        }
    })
  }


  // free version doesnt factor in traffic...
  googleMapsDirectionsClient.directions({
    origin: origin,
    waypoints: waypoints,
    destination: destination,
    departure_time: 'now'
  }, function(err, res) {
    
    if (!err) {
      arrivedToStops(res.json)
    } else {
      console.log('err-' + err);
    }
  });
});




app.get('/', function(request, response) {
  console.log('here');
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


