var express = require('express');
var request =require('superagent');

// Constants
var PORT = process.env.PORT || 8080;

// App
var app = express();

app.get('/hello', function (req, res) {
    res.send('hello world!');
});

app.get('/assets/:id', function (req, res) {
    request
        .get('https://heimdall-ext-stage.maxdome.de/api/assets/' + req.params.id)
        .set('accept-language', 'de_DE')
        .set('accept', 'application/vnd.maxdome.im.v8+json')
        .set('clienttype', 'webportal')
        .set('content-type', 'application/json')
        .set('platform', 'web')
        //.set('mxd-session', util.getCookie('mxd-bbe-session')
        .end(function(err, response){
                res.send(response);
            }
        );
});

app.listen(PORT);
console.log('Running on http://localhost:' + PORT);