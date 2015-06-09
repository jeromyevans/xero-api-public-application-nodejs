var Path = require('path');
var Hapi = require('hapi');
var XeroClient = require('./xeroclient');

// Create a server with a host and port
var server = new Hapi.Server();

server.views({
  engines: {
    'html': require('handlebars')
  },
  path: Path.join(__dirname, 'templates')
});

server.connection({
  host: 'localhost',
  port: 8001
});

var sessionOptions = {
  cookieOptions: {
    // password for encryption of the session cookie
    password: 'v7Cjqoxsmmp8RGCJ',
    isSecure: false  // todo: using http at the moment
  }
};

// register yar plugin to enable session management
server.register({
  register: require('yar'),
  options: sessionOptions
}, function(err) {});

// Add the route
server.route({
  method: 'GET',
  path: '/',
  handler: function(request, reply) {
    reply.view('index')
  }
});

server.route({
  method: 'GET',
  path: '/authenticate',
  handler: function(request, reply) {
    XeroClient.requestXeroAccess(request, reply);
  }
});

server.route({
  method: 'GET',
  path: '/callback',
  handler: function(request, reply) {
    XeroClient.requestXeroAccessToken(request, reply);
  }
});


// Start the server
server.start();
