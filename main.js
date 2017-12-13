function signup()
{
    var username = document.getElementById('signup-usr').value;
    var password = document.getElementById('signup-psw').value;
    var userDetails = {name: username, psw: password};

    var socket = io.connect();
    console.log(username.length + " " + password.length);

    if (username.length > 0 && password.length > 0) {
        socket.emit('checkUsername', username);

        // signup if username doesnt already exist
        socket.on('isUserValid', function (usernameExists) {
            if (!usernameExists) {
                socket.emit('signup', userDetails);
                window.alert('You signed up');
            }
            else {
                window.alert("username already exists!");
            }
        });
    }
    else{
        window.alert("Enter a username and password!");
    }
}
function login()
{
    var username = document.getElementById('login-usr').value;
    var password = document.getElementById('login-psw').value;
    var userDetails = {name: username, psw: password};

    var socket = io.connect();

    socket.emit('login', userDetails);

    socket.on('loginRes', function(isLoggedin){
        if ( isLoggedin )
            window.alert("You logged in");
        else
            window.alert("wrong username or password");
    })

}