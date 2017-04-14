// TODO
// decouple from REACT




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









/*--------------- Request Helper Functions ----------------*/


var getParameters = function(request) {
  var keys = Object.keys(request.query),
      params = keys.map(function(key){
        var param_obj = {}
        param_obj[key] = request.query[key]
        return param_obj
      })

  return  params
}

var findParameterByKey = function(params, key) {
  return params.find(function(param_obj) { return Object.keys(param_obj)[0] === key })
}



/*--------------- Load Local JSON ----------------*/

app.get('/local_data', function(request, response) {
  var local_data = JSON.parse(fs.readFileSync('data/local_data.js', 'utf8'))
  response.json(local_data)
})


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











/*--------------- Get Google Directions ----------------

  Google Directions API blocks your key if it is called too much
  Also, modify algorithm to get simple A->B directions for next stop and B->C->...->X for the rest of stops
  Traffic data is only available for A->B queries

  If cloning, get your own key for any of these services https://developers.google.com/maps/web-services/overview 

            ------ from Google Directions API Docs -----------
The duration in traffic is returned only if all of the following are true:

The request does not include stopover waypoints. 
If the request includes waypoints, they must be prefixed with via: to avoid stopovers.

If you'd like to influence the route using waypoints without adding a stopover, 
prefix the waypoint with via:. Waypoints prefixed with via: will not add an entry to the legs
 array, but will instead route the journey through the provided waypoint.

*/
var googleMapsDirectionsClient = require('@google/maps').createClient({
  key: 'AIzaSyDhYQs3y6neWPf1TIX_Y8IgjTtOcpSe7X0'//'AIzaSyDVl65wW5zqkICh0c1UrabLIn4MV8ryIfk'
});


app.get('/googleDirections', function(request, response) {

  var params = getParameters(request),
      origin = findParameterByKey(params, 'origin'),
      destination = findParameterByKey(params, 'destination')

  googleMapsDirectionsClient.directions({
    origin: origin,
    // waypoints: waypoints,
    destination: destination, 
    departure_time: 'now', 
    traffic_model: 'best_guess'
  }, function(err, data) {    
    if (!err) {

      response.json(data.json)

    } else {
      console.log('google direction api err-' + err);
    }
  });

});

