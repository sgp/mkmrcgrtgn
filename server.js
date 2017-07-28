/* Setting things up. */
var path = require('path'),
    express = require('express'),
    app = express(),   
    Twit = require('twit'),
    config = {
    /* Be sure to update the .env file with your API keys. See how to get them: https://botwiki.org/tutorials/how-to-create-a-twitter-app */      
      twitter: {
        consumer_key: process.env.CONSUMER_KEY,
        consumer_secret: process.env.CONSUMER_SECRET,
        access_token: process.env.ACCESS_TOKEN,
        access_token_secret: process.env.ACCESS_TOKEN_SECRET
      }
    },
    T = new Twit(config.twitter),
    F = {
      tweet: function(status) {
        return T.post('statuses/update', { status: status });
      },
      get_last: function(user, count) {
        return T.get('statuses/user_timeline', { screen_name: user, count: count });
      }
    };

app.use(express.static('public'));

app.all("/" + process.env.BOT_ENDPOINT, function (request, response) {
  // Get the most recent spew from our Clown in Chief.
  F.get_last("realDonaldTrump", 1)
    .catch(function (e) {
      console.log('ERROR: ' + e);
      response.setStatus(500);
      return;
    })
    .then(function(r){
      for (var i = 0; i < r.data.length; i++) {
        var mouthspew = r.data[i].text;
        var words = mouthspew.split(/\s+/);
        for (var j = 0; j < words.length; j++) {
          // We don't want to disemvowel hashtags, Twitter handles, or HTML entities,
          // nor do we want to mangle any links contained in the tweet. Skip them.
          if (words[j].match(/^[&@#]/) || words[j].startsWith("http")) {
            continue;
          }
          words[j] = words[j].replace(/[aeiou]/ig, '');
        }
        var disemvoweled = words.join(" ");
        F.tweet(disemvoweled)
          .catch(function(err) { 
            response.setStatus(500);
            return
        })
          .then(function(r) {
            console.log("INFO: Tweeted successfully: '"+ disemvoweled + "'");
        });
      }
      response.sendStatus(200);
  }); 
});

var listener = app.listen(process.env.PORT, function () {
  console.log('Your bot is running on port ' + listener.address().port);
});
