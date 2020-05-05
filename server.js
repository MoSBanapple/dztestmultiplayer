// Dependencies
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');

var app = express();
var server = http.Server(app);
var io = socketIO(server);

var port = process.env.PORT || 5000;

app.set('port', port);
app.use('/static', express.static(__dirname + '/static'));

// Routing
app.get('/', function(request, response) {
  response.sendFile(path.join(__dirname, 'index.html'));
});

// Starts the server.
server.listen(port, function() {
  console.log('Starting server on port 5000');
});

function generateRandomColor()
{
	/*
    var randomColor = '#'+Math.floor(Math.random()*16777215).toString(16);
	return randomColor;
	*/
	var color = '#';
    for (var i = 0; i < 6; i++) {
        color += Math.floor(Math.random() * 10);
    }
    return color;
    
    //random color will be freshly served
}

function getDistance(x1, y1, x2, y2){
	if (x1 == x2 && y1 == y2){
		return 0;
	}
	let xDiff = x1 - x2;
	let yDiff = y1 - y2;
	return Math.sqrt(xDiff*xDiff + yDiff*yDiff);
}

function calcAngle(x1, y1, x2, y2){
	return Math.atan(y2 - y1, x2 - x1);
}

var players = {};
var arenaWidth = 800;
var arenaHeight = 600;
var playerWidth = 10;
//var lastTime = (new Date()).getTime();
var moveLength = 3;
var bulletSpeed = 3;
var bulletRadius = 5;
var playerRadius = 10;
io.on('connection', function(socket) {
  socket.on('new player', function(playerName) {
    players[socket.id] = {
	  radius: playerRadius,
      x: Math.floor(Math.random()*arenaWidth),
      y: Math.floor(Math.random()*arenaHeight),
	  clickX: 0,
	  clickY: 0,
	  left: false,
	  right: false,
	  up: false,
	  down: false,
	  color: generateRandomColor(),
	  name: playerName,
	  bullets: [],
    };
  });
  socket.on('movement', function(data) {
    var player = players[socket.id] || {};
	//let currentTime = (new Date()).getTime();
	player.left = data.left;
	player.right = data.right;
	player.up = data.up;
	player.down = data.down;
  });
  socket.on('disconnect', function(){
	  if (socket.id in players){  
		delete players[socket.id];
	  }
  });
  
  socket.on('click', function(data){
	  if (!(socket.id in players)){
		  return;
	  }
	  var player = players[socket.id];
	  let xDiff = data.x - player.x;
	  let yDiff = data.y - player.y;
	  let hypotnuse = 0;
	  if (xDiff != 0 || yDiff != 0){
		hypotnuse = Math.sqrt((xDiff*xDiff)+(yDiff*yDiff));
	  }
	  let divisor = hypotnuse/bulletSpeed;
	  let thisBullet = {
		  radius: bulletRadius,
		  x: player.x,
		  y: player.y,
		  xStep: xDiff/divisor,
		  yStep: yDiff/divisor,
	  };
	  player.bullets.push(thisBullet);
	  player.clickX = data.x;
	  player.clickY = data.y;
  });
});



setInterval(function() {
  io.sockets.emit('state', players);
}, 1000 / 60);

setInterval(function() {
	let playerKeys = [];
for (const[key, value] of Object.entries(players)){
	playerKeys.push(key);
	let player = players[key];
	if (player.left) {
      player.x -= moveLength;
    }
    if (player.up) {
      player.y -= moveLength;
    }
    if (player.right) {
      player.x += moveLength;
    }
    if (player.down) {
      player.y += moveLength;
    }
	if (player.x < 0 + playerWidth/2){
		player.x = 0 + playerWidth/2;
	}
	if (player.x > arenaWidth - playerWidth/2){
		player.x = arenaWidth - playerWidth/2;
	}
	if (player.y < 0 + playerWidth/2){
		player.y = 0 + playerWidth/2;
	}
	if (player.y > arenaHeight - playerWidth/2){
		player.y = arenaHeight - playerWidth/2;
	}
	for (let i = 0; i < player.bullets.length; i++){
		var thisBullet = player.bullets[i];
		thisBullet.x += thisBullet.xStep;
		thisBullet.y += thisBullet.yStep;
		if (thisBullet.x > arenaWidth || thisBullet.x < 0 || thisBullet.y > arenaHeight || thisBullet.y < 0){
			player.bullets.splice(i, 1);
			i--;
			continue;
		}
		
	}
  }
  let toDelete = [];
  for (const[key, value] of Object.entries(players)){
	  let player = players[key];
	  if (player == undefined){
		  continue;
	  }
	  for (let j = 0; j < player.bullets.length; j++){
		  let thisBullet = player.bullets[j];
		  for (let i = 0; i < playerKeys.length; i++){
			  let targetSocket = playerKeys[i];
			  if (targetSocket == key){
				  continue;
			  }
			  let targetPlayer = players[targetSocket];
			  //console.log(thisBullet.x, thisBullet.y, targetPlayer.x, targetPlayer.y);
			  let dist = getDistance(thisBullet.x, thisBullet.y, targetPlayer.x, targetPlayer.y);
			  //console.log(dist, targetPlayer.radius + thisBullet.radius);
			  if (dist < targetPlayer.radius + thisBullet.radius){
				  console.log("yeah");
				  toDelete.push(targetSocket);
			  }
		  }
	  }
  }
  for (let i = 0; i < toDelete.length; i++){
	  key = toDelete[i];
	  io.to(key).emit('lose');
	  if (key in players){
		delete players[key];
	  }
  }
  
}, 1000/60);



