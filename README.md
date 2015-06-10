Xero PUBLIC application using API client implemented in node.js
---------------------------------------------------------------

A Xero *PUBLIC* application obtains a 30 minute access token using three-legged oAuth1.0.

This sample application uses the standard [oauth npm](https://www.npmjs.com/package/oauth) to authenticate with Xero and access the API endpoints.
 
Three-legged oAuth 1.0 requires that the application (the oAuth consumer) provides endpoints (views) for the user to initiate the authentication and redirect to and from Xero. For this example I've used [hapi.js](http://hapijs.com), but if you express or koa there's only subtle differences with the request and response arguments.
 
There's a lot of comments in the code, but for an explanation see [my blog]().

Getting started
---------------

1. Clone the repo
2. Install the packages
    npm init
    
3. Run it (defaults to localhost and port 8001
    node src/server.js
    
4. Browse to http://localhost:8001/
