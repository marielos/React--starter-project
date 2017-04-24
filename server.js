// TODO
// decouple from REACT




/*---------------  Express Server Setup  ----------------*/

var path = require('path');
var express = require('express');
var app = express();
var PORT = process.env.PORT || 8080
var fs = require('fs');
var https = require('https');
var http = require('http');


var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

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

// params = [{key: value},...{key: value}]
var encodeParameters = function(params) {
  if (!params) return ''
  var encoded_params = '?'

  params.map(function(param_obj) {
    var key = encodeURIComponent(Object.keys(param_obj)[0]),
        value = encodeURIComponent(param_obj[key])
    encoded_params = encoded_params.concat(key +'='+ value +'&')
  })

  return encoded_params.substring(0, encoded_params.length-1)     // take out last &
}

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

var combineParameters = function(param1, param2) {
  return param1.concat(param2)
}

var sendPostRequest = function(host_name, path, data, server_response) {

 data = JSON.stringify(data)

  const options = {
    hostname: host_name,
    port: 443,
    path: '/' + path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(data)
    }
  };

  const req = https.request(options, (res) => {
    // console.log('statusCode:', res.statusCode)
    // console.log('headers:', res.headers)

    res.on('data', (d) => {
      // process.stdout.write(d)
    })

    res.on('end', () => {
      // console.log('Data sent')
      server_response.end()
    });
  })

  req.on('error', (e) => {
    console.error(e);
  })
  // write data to request body
  req.write(data)

  req.end()
}


/* ------------------------------------------------------------------------------------------ */



/* --------------- Load Local JSON ---------------- */

app.get('/local_data', function(request, response) {
  var local_data = JSON.parse(fs.readFileSync('data/local_data.js', 'utf8'))
  response.json(local_data)
})


app.post('/image', function(request, response) {
  console.log('here')

  var image_file = request.body
  console.log('request.body')
  console.log(request.body)  


  // localhost
  sendPostRequest('localhost:5000', 'storage', image_file, response)
  response.end()

})







