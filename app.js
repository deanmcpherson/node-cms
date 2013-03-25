var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path');
  
var app = express();

function checkAuth(req, res, next) {
  if (!req.session.user_id) {
    res.send({isAdmin:false});
  } 
  else 
  {  
    next();
  }
}

/**CONNECT TO DB**/
app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/_api/list', routes.list);
app.get('/_api/remove/:id', checkAuth, routes.remove);
app.get('/_api/drop_entire_db', checkAuth, routes.drop);
app.post('/_api/update', checkAuth, routes.update);
app.post('/_api/add', checkAuth, routes.add);
app.get('/_api/:id', routes.get);
app.post('/upload', routes.upload);
app.get('/auth', routes.auth);
app.get('/login', routes.loginForm);
app.post('/login', routes.login);
app.get('/logout', routes.logout);
app.get('/:id', routes.static);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});