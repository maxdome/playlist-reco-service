var express = require('express');
var request = require('superagent');
var neo4j = require('neo4j');

// Constants
var PORT = process.env.PORT || 8080;

var userId = 1337;

// App
var app = express();

var neodb = new neo4j.GraphDatabase(process.env.GRAPHENEDB_URL || 'http://app48677526-p1wAVN:2lN4B4uwB68amJsFo1R2@app48677526p1wavn.sb04.stations.graphenedb.com:24789');

var trakt = function(method, url) {
    return request(method, url)
        .set('content-type', 'application/json')
        .set('trakt-api-version', '2')
        .set('trakt-api-key', 'a35a0d4bcd7552c360ee43b5522d57a2f2a91bd1a97ab03c9c27188be25e1586');
};

var neo = {
    pushActor: function(actorName, movies) {
        neodb.cypher({
            query: 'MERGE (u:User {id: {userId}})' +
            'MERGE (actor:Actor {id: {actorName}})' +
            'MERGE (u)-[:INTERESTED_IN]->(actor) ' +
            'FOREACH (movieName in {movies} | ' +
            'MERGE (movie:Movie {id: movieName}) ' +
            'MERGE (actor)-[:ACTED_IN]->(movie) ' +
            ')' +
            'RETURN u',
            params: {
                userId: userId,
                actorName: actorName,
                movies: movies
            }
        }, function (err, results) {
            if (err) throw err;
            var result = results[0];
            if (!result) {
                console.log('No user found.');
            } else {
                var user = result['u'];
                console.log(user);
            }
        });
    },
    pushMovie: function(movieName, actors) {
        var actorNames = new Array();

        actors.forEach(function(actor) {
            actorNames.push(actor.actor);
        });


        neodb.cypher({
            query: 'MERGE (u:User {id: {userId}})' +
            'MERGE (movie:Movie {id: {movieName}})' +
            'MERGE (u)-[:WATCHED]->(movie) ' +
            'FOREACH (actorName in {actors} | ' +
            'MERGE (actor:Actor {id: actorName}) ' +
            'MERGE (actor)-[:ACTED_IN]->(movie) ' +
            ')' +
            'RETURN u',
            params: {
                userId: userId,
                movieName: movieName,
                actors: actorNames
            }
        }, function (err, results) {
            if (err) throw err;
            var result = results[0];
            if (!result) {
                console.log('No user found.');
            } else {
                var user = result['u'];
                console.log(user);

                actors.forEach(function(actor) {
                    neodb.cypher({
                        query:
                        'MERGE (actor:Actor {id: {actorName}}) ' +
                        'FOREACH (movieName in {movies} | ' +
                        'MERGE (movie:Movie {id: movieName}) ' +
                        'MERGE (actor)-[:ACTED_IN]->(movie) ' +
                        ')' +
                        'RETURN actor',
                        params: {
                            actorName: actor.actor,
                            movies: actor.movies
                        }
                    }, function (err, results) {
                        if (err) throw err;
                        var result = results[0];
                        if (!result) {
                            console.log('No user found.');
                        } else {
                            var user = result['u'];
                            console.log(user);
                        }
                    });
                });

            }
        });
    }
};

app.get('/hello', function (req, res) {
    res.send('hello world!');
});

app.get('/interested/:actor', function (req, res) {
    var movies = new Array();

    trakt('GET','https://api-v2launch.trakt.tv/people/' + req.params.actor + '/movies').end(function(err, response) {
        response.body.cast.forEach(function(cast) {
            movies.push(cast.movie.ids.slug);
        });
        neo.pushActor(req.params.actor, movies);
        res.send(movies);
    });
});

app.get('/watched/:movie', function (req, res) {
    var actors = new Array();

    trakt('GET','https://api-v2launch.trakt.tv/movies/' + req.params.movie + '/people').end(function(err, response) {
        response.body.cast.forEach(function(cast) {
            var movies = new Array();
            trakt('GET','https://api-v2launch.trakt.tv/people/' + cast.person.ids.slug + '/movies').end(function(err, response) {
                response.body.cast.forEach(function(cast) {
                    movies.push(cast.movie.ids.slug);
                });
            });
            actors.push({actor: cast.person.ids.slug, movies: movies});
        });
        neo.pushMovie(req.params.movie, actors);
        res.send(actors);
    });
});

app.get('/genres/:type', function (req, res) {
    request
        .get('https://api-v2launch.trakt.tv/genres/' + req.params.type)
        .set('content-type', 'application/json')
        .set('trakt-api-version', '2')
        .set('trakt-api-key', 'a35a0d4bcd7552c360ee43b5522d57a2f2a91bd1a97ab03c9c27188be25e1586')
        .end(function(err, response){
                res.send(response);
            }
        );
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