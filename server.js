var path = require('path');
var express = require('express');
var app = express();
var PORT = process.env.PORT || 8080
var http = require('http');
var googleMapsClient = require('@google/maps').createClient({
  key: 'AIzaSyDQVdX_R3nPKCRok0HeBqrNfLpuNiRF-hU'
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

  console.log('new api');

  // // does this googleMaps client work????
  // googleMapsClient.geocode({
  //   address: '1600 Amphitheatre Parkway, Mountain View, CA'
  // }, function(err, response) {
  //   if (!err) {
  //     console.log(response.json.results);
  //   }
  // });



  // if not, we can craft our own http request  

  // var stop_options = 'origin=sydney,au&destination=perth,au&waypoints=via:-37.81223%2C144.96254%7Cvia:-34.92788%2C138.60008&key=AIzaSyDQVdX_R3nPKCRok0HeBqrNfLpuNiRF'

  // var options = {
  //   host: 'https://maps.googleapis.com',
  //   port: 80,
  //   path: '/maps/api/directions/json?' + stop_options
  // };


  var url = 'http://samples.openweathermap.org/data/2.5/weather?zip=94040,us&appid=b1b15e88fa797225412429c1c50c122a1';
  
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
