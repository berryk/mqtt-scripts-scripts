var net = require('net');
var command;
var devices = new Array();
var topics = new Array();
var socket = net.createConnection(11000, 'localhost');
log.info('Socket created.');

socket.on('data', function(data) {
    //parse data from response
    if (command == "gs" && data != "ok\r\n") {
        command = "";
        var devicedefns = data.toString().split("|");
        for (var i = 0, len = devicedefns.length; i < len; i++) {
            var device = devicedefns[i];
            device = device.replace(/\//g, '-');
            device = device.replace(/,,/g, ',-,');
            var fields = device.split(",");
            var topic = 'homeseer' + '/' + fields[4] + '/' + fields[5] + '/' + fields[3];
            devices[fields[0]] = topic;
            // fields[2] is status - if it's Off then 0 else 1 only publish if fields[4] = lights
            if (fields[4] == "Lights") {
                var value;
                if (fields[2] == "Off") {
                    value = 0;
                } else {
                    value = 100;
                }
                setValue(topic, value);
            }
            topics[topic + '/set'] = fields[0];
            log.info('Device:' + fields[0] + " Topic:" + topic)
        }
    } else {
        var fields = data.toString().split(",");
        if (fields[0] == "DC") {
            var topic = devices[fields[1]];
            var value = fields[2];
            log.info(topic + ":" + value);
            setValue(topic, value);
        }
    }
}).on('connect', function() {
    log.info('CONNECTED');
    command = "au,default,default";
    socket.write(command + "\r\n", function(err) {
        log.info("Err:" + err);
        command = "gs";
        socket.write(command + "\r\n", function(err) {
            log.info("Err:" + err);
        });
    });

}).on('end', function() {
    log.info('DONE');
});

subscribe('homeseer/+/+/+/set', function(topic, val) {
    log.info(topic + ':' + val);

    var deviceid = topics[topic];
    command = "cv," + deviceid + "," + val;
    log.info("Writing Command:" + command);
    socket.write(command + "\r\n");

});