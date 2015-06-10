var Path = require('path');
var Hapi = require('hapi');
var XeroClient = require('./xeroclient');

// Create a server with a host and port
var server = new Hapi.Server();
server.connection({
  host: 'localhost',
  port: 8001
});

// for three-legged oauth we have to provide views for the user as the *user* must initiate the authentication.
// we set up the handlebars template engine with some minimal views under /templates
server.views({
  engines: {
    'html': require('handlebars')
  },
  path: Path.join(__dirname, 'templates')
});

// configure and register yar plugin with hapi to enable session management.
// For three-legged oAuth it's essential to retain some tokens across multiple requests.
var sessionOptions = {
  cookieOptions: {
    password: 'v7Cjqoxsmmp8RGCJ',  // password for encryption of the session cookie
    isSecure: false                // todo: using http at the moment
  }
};

server.register({
  register: require('yar'),
  options: sessionOptions
}, function(err) {});

// Add the basic routes to views
server.route({
  method: 'GET',
  path: '/',
  handler: function(request, reply) {
    reply.view('index')
  }
});

server.route({
  method: 'GET',
  path: '/failed',
  handler: function(request, reply) {
    reply.view('failed')
  }
});

server.route({
  method: 'GET',
  path: '/success',
  handler: function(request, reply) {
    reply.view('success')
  }
});

// this is the user-accessed resource that initiates the authentication with xero.
// the user will eventually be redirected to Xero's authorize page
server.route({
  method: 'GET',
  path: '/authenticate',
  handler: function(request, reply) {
    XeroClient.requestXeroRequestToken(request, reply);
  }
});

// this is the xero-accessed resource that provides details of the request token
// this route is specified by the oauth_callback_url
server.route({
  method: 'GET',
  path: '/callback',
  handler: function(request, reply) {
    XeroClient.requestXeroAccessToken(request, reply);
  }
});

// Start the server
server.start();
