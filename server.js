const express = require('express');
const app = express();
var https = require('https');
var http = require('http');
const fs = require('fs');
const crypto = require('crypto');


// tls self signed certificates, browsers will give a warning since they are not from a CA
var key = fs.readFileSync('encryption/private.key', 'utf-8');
var cert = fs.readFileSync( 'encryption/primary.crt', 'utf-8' );

var options = {
    key: key,
    cert: cert
};

var server = https.createServer(options, app);
//var server = http.createServer(app);
var io = require('socket.io')(server);
var port = 8443;

app.use(express.static(__dirname));
app.get('/', (req,res) => res.sendFile(__dirname + '/index.html'));

io.on('connection', function(socket) {
    socket.on('checkUsername', function (username) {
        fs.readFile('database.json', 'utf-8', function (err, data) {
            if (err) throw err;
            var usernameExists = false;
            var arrayOfObjects = JSON.parse(data);

            for (var i = 0; i < arrayOfObjects.users.length; i++) {
                if (arrayOfObjects.users[i].username == username) {
                    usernameExists = true;
                    break;
                }
            }

            socket.emit('isUserValid', usernameExists);
        })
    });
    socket.on('signup', function (userDetails) {
        fs.readFile('database.json', 'utf-8', function (err, data) {
            if (err) throw err;

            var arrayOfObjects = JSON.parse(data);

            //create salt with a csprng function
            crypto.randomBytes(64, function (err, buffer) {
                var salt = buffer.toString('hex');
                console.log("salt = " + salt);

                // hash salt + password with sha-512
                // key stretching algorithm used to slow down hashing
                crypto.pbkdf2(userDetails.psw, salt, 10000, 64, 'sha512', function(err, derivedKey){
                   const hashedPsw = derivedKey.toString('hex');

                    arrayOfObjects.users.push({
                        username: userDetails.name,
                        password: hashedPsw,
                        salt: salt
                    });

                    fs.writeFile('database.json', JSON.stringify(arrayOfObjects, null, 2), 'utf-8', function (err) {
                        if (err) throw err;
                        console.log("added user");
                    })
                });

            });


        })

    });
    socket.on('login', function (userDetails) {
        fs.readFile('database.json', 'utf-8', function (err, data) {
            if (err) throw err;

            var arrayOfObjects = JSON.parse(data);
            var username = userDetails.name;
            var usernameExists = false;
            var isLoggedin = false;
            console.log(username);
            var index;
            for (var i = 0; i < arrayOfObjects.users.length; i++) {
                if (arrayOfObjects.users[i].username == username) {
                    usernameExists = true;
                    index = i;
                    break;
                }
            }
            if (usernameExists)
            {
                var userDB = arrayOfObjects.users[index];

                crypto.pbkdf2(userDetails.psw, userDB.salt, 10000, 64, 'sha512', function(err, derivedKey) {
                    const hashedPsw = derivedKey.toString('hex');


                    if ( hashedPsw == userDB.password )
                    {
                        isLoggedin = true;
                        console.log("successful login");
                        socket.emit("loginRes", isLoggedin);
                    }
                    else{
                        console.log("wrong password");
                        socket.emit("loginRes", isLoggedin);
                    }

                });
            }else
            {
                console.log("wrong username");
                socket.emit("loginRes", isLoggedin);
            }

        })
    });
});

server.listen(port, function(){ console.log('Listening on port ' + port)});
