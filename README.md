# Chariot Vehicle Screen



## Architecture















### Start with updating server on save
nodemon ./server.js localhost 8080


### UP & RUNNING
* `npm install`
* `npm start`
* visit `http://localhost:8080/`


### DEPLOYING TO HEROKU
This app is set up for deployment to Heroku!

Heroku will follow the `postinstall` command in your `package.json` and compile assets with `webpack.prod.config.js`. It runs the Express web server in `server.js`. You'll notice there's a special section set up for running in development.

If you've never deployed a Node app to Heroku (or just need a refresher), they have a really great walkthrough [here](https://devcenter.heroku.com/articles/getting-started-with-nodejs#introduction). 

### REDUX STARTER
If you're looking for a similar, minimalistic Redux starter, I would recommend Marc Garreau's [here](https://github.com/marcgarreau/redux-starter)

