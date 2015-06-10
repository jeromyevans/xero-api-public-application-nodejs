var OAuth = require("oauth");

var REQUEST_URL = 'https://api.xero.com/oauth/RequestToken';
var ACCESS_URL = 'https://api.xero.com/oauth/AccessToken';
var AUTHORIZE_URL = 'https://api.xero.com/oauth/Authorize?oauth_token=';
var CONSUMER_KEY = 'QXKPJMEYT4GW3SQCMMUALZAHMHNNNM';
var CONSUMER_SECRET = 'HYXKDWDLZDHFK3QUQ87DAY1DVNVXPH';
var CALLBACK_URL = 'http://localhost:8001/callback';

// Xero API defaults to application/xml content-type
var customHeaders = {
  "Accept" : "application/json",
  "Connection": "close"
};

var oauth = new OAuth.OAuth(
    REQUEST_URL,
    ACCESS_URL,
    CONSUMER_KEY,
    CONSUMER_SECRET,
    '1.0A',
    null,
    'HMAC-SHA1',
    null,
    customHeaders
);

oauth._authorize_callback=CALLBACK_URL;

// Initiate the request to Xero to get an oAuth Request Token.
// With the token, we can send the user to Xero's authorize page
exports.requestXeroRequestToken = function(request, reply) {

  oauth.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results) {

    if (error) {
      console.log(error);

      return reply.view('failed');
    }

    // store the token in the session created by the hapi yar plugin
    request.session.set('oauth', {
      token: oauth_token,
      token_secret: oauth_token_secret
    });

    // redirect the user to Xero's authorize url page
    return reply.redirect(AUTHORIZE_URL+oauth_token);
  });
};

// Perform the callback leg of the three-legged oAuth.
// Given the auth_token and auth_verifier from xero, request the AccessToken
exports.requestXeroAccessToken = function(request, reply) {

  var oAuthToken = request.query["oauth_token"];
  var oAuthVerifier = request.query["oauth_verifier"];
  var org = request.query["org"];

  var oAuthData = request.session.get('oauth');

  if (!oAuthData) {
    return reply.view('failed');
  }

  oAuthData.verifier = oAuthVerifier;

  oauth.getOAuthAccessToken(
      oAuthData.token,
      oAuthData.token_secret,
      oAuthData.verifier,
      function (error, oauth_access_token, oauth_access_token_secret, results) {

        if (error) {
          console.log(oAuthData);
          console.log(error);
          return reply("Authentication Failure!");
        }

        request.session.set('oauth', {
          token: oAuthData.token,                // todo: necessary to retain?
          token_secret: oAuthData.token_secret,  // todo: necessary to retain?
          verifier: oAuthData.verifier,          // todo: necessary to retain?
          access_token: oauth_access_token,
          access_token_secret: oauth_access_token_secret
        });

        // now that we have authenticated we can access restricted endpoints
        // via oauth.get() etc.

        // This is asynchronous of course - we also have to send the user somewhere useful
        // the access token and secret can be obtained from the session
        oauth.get('https://api.xero.com/api.xro/2.0/Organisation',
          oauth_access_token,
          oauth_access_token_secret,
          function (e, data, res) {
            if (e) {
              console.error(e);
              return;
            }

            var oResponse = JSON.parse(data);

            console.log(require('util').inspect(oResponse, false, null));

            return;
          });

        return reply.view('success');
      }
  );

};
