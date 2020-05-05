var socket = io();
socket.on('message', function(data) {
  console.log(data);
});

var movement = {
  up: false,
  down: false,
  left: false,
  right: false
}

var mouseLoc = {
	x: 0,
	y: 0
}
document.addEventListener('keydown', function(event) {
  switch (event.keyCode) {
    case 65: // A
      movement.left = true;
      break;
    case 87: // W
      movement.up = true;
      break;
    case 68: // D
      movement.right = true;
      break;
    case 83: // S
      movement.down = true;
      break;
  }
});
document.addEventListener('keyup', function(event) {
  switch (event.keyCode) {
    case 65: // A
      movement.left = false;
      break;
    case 87: // W
      movement.up = false;
      break;
    case 68: // D
      movement.right = false;
      break;
    case 83: // S
      movement.down = false;
      break;
  }
});


var playerName = prompt("Please enter your name", "");
if (playerName.length > 140){
	playerName = "Name too long";
}
socket.emit('new player', playerName);
setInterval(function() {
  socket.emit('movement', movement);
}, 1000 / 60);


var canvas = document.getElementById('canvas');
canvas.width = 800;
canvas.height = 600;
var context = canvas.getContext('2d');
socket.on('state', function(players) {
  context.clearRect(0, 0, 800, 600);
  context.font = "10px Arial";
  let leaderboardInput = "";
  for (var id in players) {
    var player = players[id];
    context.beginPath();
	context.fillStyle = player.color;
    context.arc(player.x, player.y, player.radius, 0, 2 * Math.PI);
	//context.fillRect(player.clickX, player.clickY, 5, 5);
	//console.log(player.bullets);
	context.fill();
	/*
	if (player.bullets.length > 0){
		let bullet = player.bullets[0];
		context.arc(Math.floor(bullet.x), Math.floor(bullet.y), bullet.radius, 0, 2*Math.PI);
	}
	*/
	
	for (let i = 0; i < player.bullets.length; i++){
		let bullet = player.bullets[i];
		context.beginPath();
		context.arc(Math.floor(bullet.x), Math.floor(bullet.y), bullet.radius, 0, 2*Math.PI);
		context.fill();
	}
	
	context.textAlign = "center";
	context.fillText(player.name, player.x, player.y + 20);
	context.fill();
	
	leaderboardInput += player.name + ": " + player.kills + "<br />";
	
	
  }
  
  document.getElementById("leaderBoard").innerHTML = leaderboardInput;
});

socket.on('lose', function(){
	alert("You lose!");
});

canvas.addEventListener('click', (e) => {
	mouseLoc.x = e.offsetX;
	mouseLoc.y = e.offsetY;
	socket.emit('click', mouseLoc);


});

