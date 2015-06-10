var OAuth = require("oauth");
var Xml2js = require('xml2js')

var REQUEST_URL = 'https://api.xero.com/oauth/RequestToken';
var ACCESS_URL = 'https://api.xero.com/oauth/AccessToken';
var CONSUMER_KEY = 'QXKPJMEYT4GW3SQCMMUALZAHMHNNNM';
var CONSUMER_SECRET = 'HYXKDWDLZDHFK3QUQ87DAY1DVNVXPH';
var CALLBACK_URL = 'http://localhost:8001/callback';

var oauth = new OAuth.OAuth(
    REQUEST_URL,
    ACCESS_URL,
    CONSUMER_KEY,
    CONSUMER_SECRET,
    '1.0A',
    null,
    'HMAC-SHA1',
    null,
    null
);

oauth._authorize_callback=CALLBACK_URL;

exports.requestXeroAccess = function(request, reply) {

  oauth.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results) {
    if (error) {

      console.log(error);

      reply("Authentication Failed!");

    } else {

      // store the token in the session created by hapi yar plugin
      request.session.set('oauth', {
        token: oauth_token,
        token_secret: oauth_token_secret
      });

      reply.redirect('https://api.xero.com/oauth/Authorize?oauth_token='+oauth_token)
    }
  });
};

var getXeroOrganizaton = function(accessToken) {

  oauth.get('https://api.xero.com/api.xro/2.0/Organisation',
      accessToken,
      function (error, data, res) {

        if (error) {
          console.error(error);
        }

        var xmlParser = new Xml2js.Parser();

        xmlParser.parseString(data, {'normalizeTags': true}, function(parserError, oResponse) {

          if (parserError) {
            console.error(parserError);
            return;
          }

          console.log(require('util').inspect(oResponse, false, null));
        });

        return;
      });
};


// Perform the callback leg of 3-legged oAuth.
// Given the auth_token and auth_verifiy from xero, request the access token
// Requests that request
exports.requestXeroAccessToken = function(request, reply) {

  var oAuthToken = request.query["oauth_token"];
  var oAuthVerifier = request.query["oauth_verifier"];
  var org = request.query["org"];

  var oAuthData = request.session.get('oauth');

  if (oAuthData) {
    oAuthData.verifier = oAuthVerifier;

    oauth.getOAuthAccessToken(
        oAuthData.token,
        oAuthData.token_secret,
        oAuthData.verifier,
        function (error, oauth_access_token, oauth_access_token_secret, results) {

          if (error) {
            console.log(request.params);
            console.log(oAuthData);
            console.log(error);
            console.log(results);
            return reply("Authentication Failure!");
          }

          request.session.set('oauth', {
            token: oAuthData.token,                // todo: necessary to retain?
            token_secret: oAuthData.token_secret,  // todo: necessary to retain?
            verifier: oAuthData.verifier,          // todo: necessary to retain?
            access_token: oauth_access_token,
            access_token_secret: oauth_access_token_secret
          });

          oauth.get('https://api.xero.com/api.xro/2.0/Organisation',
              oauth_access_token,
              oauth_access_token_secret,
              function (e, data, res) {
                if (e) {
                  console.error(e);
                }

                var xmlParser = new Xml2js.Parser({'normalizeTags': true});

                xmlParser.parseString(data, function(parserError, oResponse) {

                  if (parserError) {
                    console.error(parserError);
                    return;
                  }

                  console.log(require('util').inspect(oResponse, false, null));
                });

                return;
              });

          return reply("Authentication Successful");
          // res.redirect('/'); // You might actually want to redirect!
        }
    );
  }
  else {
    reply("No oauth data in session - reauthenticate");
  }
};

