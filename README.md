Camera sync for three.js using socket.io
===============

This service is a simple NodeJS server which uses [socket.io][socket] to synchronize a [three.js][three] camera position between two browser sessions.

## Running the server

Requires [nodejs][nodejs] and [npm][npm].

```shell
# Clone repository
git clone https://github.com/met-office-lab/3d-weather-sync.git
cd 3d-weather-sync

# Install dependancies
npm install

# Run server
node server
```

## Code example

Here is an example of how to use this service in a three.js application which uses one device as a viewer and another as a controller. Both render the three.js world individually but one sends its camera position to the other over the socket.

Both will need the socket.io library included in the html.

```html
<script src="https://cdn.socket.io/socket.io-1.3.x.js"></script>
```

### Viewer

The viewer will need to connect to the socket server and then await incoming camera information.

```javascript
// Init variables
var roomId = null;

// Connect to server
var socket = io.connect("http://my.sync.service:3000/");

// Create new room
socket.emit('subscribe', '');

// Retrieve roomId for new room
socket.on('subscription', function (data) {
    roomId = data.roomId;
    console.log('roomId set to : ' + roomId);
});

// Listen for cameras
socket.on('camera', function (data) {


  // Update camera position and rotation
  // We assume here that you have set up your camera as a property of a
  // three.js object called VIEW3D.
  VIEW3D.camera.position.set(
    data.message.position.x,
    data.message.position.y,
    data.message.position.z
  );

  VIEW3D.camera.setRotationFromQuaternion(
    new THREE.Quaternion(
      data.message.quaternion._x,
      data.message.quaternion._y,
      data.message.quaternion._z,
      data.message.quaternion._w
    )
  );

});
```

### Controller

The controller code will be in two parts, the first just connects to the socket server as before, the second happens within the three.js render loop and transmits the camera details on every update.

```javascript
// Init variables
var roomId = null;
var connectedToRoom = false; // Only send camera info when this is true

// Connect to server
var socket = io.connect("http://my.sync.service:3000/");

// Set roomId to equal the viewers Id. Perhaps using a prompt
roomId = prompt("Enter room number");

// Join room
socket.emit('subscribe', roomId);

// Await confirmation that we have joined the room, then allow the camera to be sent
socket.on('subscription', function (data) {
    roomId = data.roomId;
    console.log('roomId set to : ' + data.roomId);
    connectedToRoom = true;
});

```

Now within the three.js render loop you can send the camera data every tick (or less if you prefer).

```javascript
// Our three.js update loop function, assuming our camera is a property of our VIEW3D object as before
function update() {

  // Other code...

  if (connectedToRoom) {
    socket.emit('send camera', {
      room: roomId,
      message: {
        position: VIEW3D.camera.position,
        quaternion: VIEW3D.camera.quaternion
      }
    });
  }

}
```


[nodejs]: https://nodejs.org/
[npm]: https://www.npmjs.com/
[socket]: http://socket.io/
[three]: http://threejs.org/
