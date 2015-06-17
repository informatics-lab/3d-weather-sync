var Channels = function () {

    var _ = require('lodash');

    const MAX_PARTICIPANTS = 2;

    var _states = ["sleepy", "happy", "grumpy", "bashful", "dopey", "tired", "joyus", "hairy", "porky", "wet"];
    var _animals = ["cat", "dog", "horse", "sheep", "cow", "goat", "pig", "owl", "snake", "rabbit"];
    var _channels = {};

    var getChannels = function () {
        return _channels;
    };

    var isChannel = function (channel) {
        return _channels.hasOwnProperty(channel);
    };

    var getNumParticipants = function (channel) {
        return _channels[channel].length;
    };

    /**
     * Initialises and returns a new unique channel
     *
     * @returns {String} a unique identifier in the form of state-animal
     */
    var getNewChannel = function () {
        var state = _states[_.random(0, 9)];
        var animal = _animals[_.random(0, 9)];
        var channel = state + "-" + animal;
        if (!isChannel(channel)) {
            _channels[channel] = [];
            return channel;
        } else {
            return getNewChannel();
        }
    };

    /**
     * Adds the given participant to the channel specified
     *
     * @param channel uuid of channel
     * @param participantId ID of participant to add to channel
     * @returns {boolean} true if successfully added otherwise false
     */
    var addParticipantToChannel = function (channel, participantId) {
        if (isChannel(channel) && getNumParticipants(channel) < MAX_PARTICIPANTS) {
            _channels[channel][_channels[channel].length] = participantId;
            return true;
        }
        return false;
    };

    /**
     * Removes the specified participant from the given channel.
     * If number of participants is 0 after removal, channel will be removed altogether.
     *
     * @param channel uuid of channel to decrement
     * @param participantId ID of participant to remove
     * @returns {boolean} true if successfully removed otherwise false
     */
    var removeParticipantFromChannel = function (channel, participantId) {
        if (channel && isChannel(channel)) {

            _.remove(_channels[channel], function (id) {
                return id == participantId;
            });

            if (getNumParticipants(channel) <= 0) {
                delete _channels[channel];
            }
            return true;
        }
        return false;
    };

    return {
        getChannels: getChannels,
        getNewChannel: getNewChannel,
        getNumParticipants: getNumParticipants,
        addParticipantToChannel: addParticipantToChannel,
        removeParticipantFromChannel: removeParticipantFromChannel
    };

};

/*
 * self executing annon function.
 */
(function () {
    var express = require('express');

    var app = express();

    var http = require('http').Server(app);
    var io = require('socket.io')(http);

    var channels = Channels();

    app.use(express.static('src'));

    io.on('connection', function (socket) {

        var room = null;
        console.log('a user connected');

        socket.on('subscribe', function (roomId) {
            console.log("subscribing...");
            if (roomId && roomId != "") {
                console.log("attempting to connect to %s...", roomId);
                if (channels.addParticipantToChannel(roomId, socket.id)) {
                    console.log("joining %s...", roomId);
                    socket.join(roomId);
                    io.sockets.in(roomId).emit('subscription', {
                        'roomId': roomId,
                        'participants': channels.getNumParticipants(roomId)
                    });
                    console.log("subscription sent, channels : " + JSON.stringify(channels.getChannels()));
                    room = roomId;
                }
            } else {
                console.log("creating a new room...");
                roomId = channels.getNewChannel();
                console.log("created room %s...", roomId);
                if (channels.addParticipantToChannel(roomId, socket.id)) {
                    console.log("joining %s...", roomId);
                    socket.join(roomId);
                    io.sockets.in(roomId).emit('subscription', {
                        'roomId': roomId,
                        'participants': channels.getNumParticipants(roomId)
                    });
                    console.log("subscription sent, channels : " + JSON.stringify(channels.getChannels()));
                    room = roomId;
                }
            }
        });

        socket.on('send message', function (data) {
            console.log('sending %s message : %s', data.room, data.message);
            socket.broadcast.to(data.room).emit('pm', {
                message: data.message
            });
        });

        socket.on('disconnect', function () {
            console.log("disconnecting %s", socket.id);
            channels.removeParticipantFromChannel(room, socket.id);
            console.log("after disconnect, channels : " + JSON.stringify(channels.getChannels()));
        });

    });

    var server = http.listen(3000, function () {
        var host = server.address().address;
        var port = server.address().port;
        console.log('App listening at http://%s:%s', host, port);
    });

})();