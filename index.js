var express = require('express');

// Constants
var PORT = process.env.PORT || 8080;

// App
var app = express();

app.get('/hello', function (req, res) {
    res.send('hello world!');
});

app.listen(PORT);
console.log('Running on http://localhost:' + PORT);