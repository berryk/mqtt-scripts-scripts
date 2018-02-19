var net = require('net');
var command;
var devices = [];
var topics = [];
var socket;

connect();

socket.on('data', function(data) {
    //parse data from response
    if (command == "gs" && data != "ok\r\n") {
        command = "";
        //send a message to reset counters
        setValue("homeseer/status","reset")
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
    socket.write(command + "\r\n", function(){
        command = "gs";
        socket.write(command + "\r\n", function() {
            log.info("gs\n");
        });
    });

}).on('end', function() {
    log.info('DONE, reconnecting');
    setTimeout(connect,5000);
}).on('error',function(msg){
    log.error('Error:',msg);
    log.info('Reconnecting');
    setTimeout(connect,5000);
});


function connect() {
  socket = net.createConnection(11000, 'mqtt.lan');
  log.info('Socket created.');
}

// Every hour rerun the gs command
schedule('*/10 * * * *', function(){
  log.info('Getting full homeseer status');
  command = "gs";
  socket.write(command + "\r\n", function(err) {
    log.info("Err:" + err);
  });
});

subscribe('homeseer/+/+/+/set', function(topic, val) {
    log.info(topic + ':' + val);

    var deviceid = topics[topic];
    command = "cv," + deviceid + "," + val;
    log.info("Writing Command:" + command);
    socket.write(command + "\r\n");

});
