/*global require, __dirname, console*/
var express = require('express'),
    net = require('net'),
    N = require('./nuve'),
    fs = require("fs"),
    https = require("https"),
    config = require('./licode_config');

var options = {
    key: fs.readFileSync('cert/key.pem').toString(),
    cert: fs.readFileSync('cert/cert.pem').toString()
};

var app = express();


app.configure(function () {
    "use strict";
    app.use(express.bodyParser());
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    app.use(express.logger());
    app.use(express.static(__dirname));
    //app.set('views', __dirname + '/../views/');
    //disable layout
    //app.set("view options", {layout: false});
});

app.use(function (req, res, next) {
    "use strict";
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, DELETE');
    res.header('Access-Control-Allow-Headers', 'origin, content-type');
    if (req.method == 'OPTIONS') {
        res.send(200);
    }
    else {
        next();
    }
});

N.API.init(config.nuve.superserviceID, config.nuve.superserviceKey, 'http://localhost:3000/');

var myRoom;

N.API.getRooms(function (roomlist) {
    "use strict";
    var rooms = JSON.parse(roomlist);
    console.log(rooms.length);
    if (rooms.length === 0) {
        N.API.createRoom('myRoom', function (roomID) {
            myRoom = roomID._id;
            console.log('Created room ', myRoom);
        });
    } else {
        myRoom = rooms[0]._id;
        console.log('Using room ', myRoom);
    }
});

app.post('/createRoom/', function(req, res) {
    N.API.createRoom(req.body.roomname, function(roomID) {
        res.send(roomID);
    }, function(e) {
        console.log('Error: ', e);
    });
});

app.post('/createToken/', function (req, res) {
    "use strict";
    var room = req.body.roomID,
        username = 'local',
        role = req.body.role;
    console.log('createToken: ' + room + ' ' + username + ' ' + role);
    N.API.createToken(room, username, role, function (token) {
        console.log(token);
        res.send(token);
    }, function(e) {
        console.log('Error : ', e);   
    });
});

app.get('/getRooms/', function (req, res) {
    "use strict";
    N.API.getRooms(function (rooms) {
        res.send(rooms);
    });
});

app.get('/getUsers/:room', function (req, res) {
    "use strict";
    var room = req.params.room;
    N.API.getUsers(room, function (users) {
        console.log('Users request: ' + users);
        res.send(users);
    });
});

app.delete('/rooms/:room', function(req, res) {
    N.API.getUsers(req.params.room, function(users) {
        var usersList = JSON.parse(users);
        console.log('Nr of users :' + usersList.length);
        if (usersList.length === 0) {
            console.log('deleting ' + req.params.room);
            N.API.deleteRoom(req.params.room, function(result) {
                console.log('Result: ', result);
            });
        }
    });
});

app.listen(3001);

var server = https.createServer(options, app);
server.listen(3004);
