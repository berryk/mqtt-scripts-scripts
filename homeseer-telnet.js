var net = require('net');
var command;
var devices = [];
var topics = [];
var lights = [];
var socket;

connect();

function connect() {
  socket = net.createConnection(11000, 'mqtt.lan');
  log.info('Socket created.');

  socket.on('data', function(data) {
    //parse data from response
//    log.info("Data:"+data);
    
    if (command == "au,default,default" && data == "ok\r\n")
    {
       if (data == "ok\r\n"){
          log.info("Logged in successfully");
          command = "gs";
          socket.write(command + "\r\n");
       } else {
         log.info("Log in failed, command:" + command + " Data: " + data);
         setTimeout(socket.write, 5000, command + "\r\n");
       }
    }
    
    if (command == "gs" && data != "ok\r\n") {
      command = "";
      //send a message to reset counters

      var devicedefns = data.toString().split("|");
      var len = devicedefns.length; 
      
      
      var light_count = 0; 
      
      for (var i = 0; i < len; i++) {
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
          light_count = light_count + 1; 
          lights[topic] = value;
          //setValue(topic, value);
        }
        topics[topic + '/set'] = fields[0];
        log.info('Device:' + fields[0] + " Topic:" + topic)
      }
      
      setValue("homeseer/status", lights);
      for (var light_topic in lights ){
        setValue( light_topic, lights[light_topic]);
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
    socket.write(command + "\r\n");
    log.info("Logging In");
  }).on('end', function() {
    log.info('DONE, reconnecting');
    setTimeout(connect, 5000);
  }).on('error', function(msg) {
    log.error('Error:', msg);
    log.info('Reconnecting');
    setTimeout(connect, 5000);
  });

}

// Every hour rerun the gs command
schedule('*/30 * * * *', function() {
  log.info('Getting full homeseer status');
  command = "gs";
  socket.write(command + "\r\n", function() {
    log.info("gs\n");
  });
});

subscribe('homeseer/+/+/+/set', function(topic, val) {
  log.info(topic + ':' + val);

  var deviceid = topics[topic];
  command = "cv," + deviceid + "," + val;
  log.info("Writing Command:" + command);
  socket.write(command + "\r\n");

});