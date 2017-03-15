var path = require('path');
var express = require('express');
var app = express();
var PORT = process.env.PORT || 8080
var http = require('http');
var fs = require('fs');
var googleMapsClient = require('@google/maps').createClient({
  key: 'AIzaSyBC-uIPCkcqeaI5idN5rKgyx8JO2N8DLI0'
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


  var stops = JSON.parse(fs.readFileSync('data/route.js', 'utf8'));

  var origin  = function(data) {
    var origin_obj = data.route[0],
        lat = origin_obj.lat,
        lng = origin_obj.lng
   
    return [lat, lng]
  }(stops)

  var waypoints  = function(data) {
    var stops = []
    // iterate through route stops skipping first and last stop
    for(var i=1; i < data.route.length-1; i++) {
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


  googleMapsClient.directions({
    origin: origin,
    waypoints: waypoints,
    destination: destination
  }, function(err, res) {
    
    if (!err) {
      var json_data = res.json;
      json_data['stops'] = stops;

      response.json(json_data);
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


