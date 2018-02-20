var net = require('net');
var command;
var devices = [];
var topics = [];
var lights = [];
var socket;
var command_q = [];

connect();

function connect() {
  socket = net.createConnection(11000, 'mqtt.lan');
  log.info('Socket created.');

  socket.on('data', function(data) {
    //parse data from response
    log.info("Data:"+data);

    if (data == "ok\r\n") {
      var processed = command_q.shift();
      log.info("Command:" + processed + " OK");

      if (processed == "au,default,default\r\n") {
        addCommand("gs");
      }

//       if (command_q.length > 0) {
//         log.info("Writing command to socket:"+command_q[0]);
//         socket.write(command_q[0]);
//       }
    } else {
      if (command_q[0] == "gs\r\n") {
        // process gs
        command_q.shift();

        data = data + "|";
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
        for (var light_topic in lights) {
          setValue(light_topic, lights[light_topic]);
        }


        // end process gs
      } else {
        // process DC status messages
        var fields = data.toString().split(",");
        if (fields[0] == "DC") {
          var topic = devices[fields[1]];
          var value = fields[2];
          log.info("Event from homeseer:" + topic + ":" + value);
          setValue(topic, value);
          // end process DC status messages
        } else {
          log.info("!! Unknown message:" + data);
          log.info("Current command:"+command_q[0]);
        }
      }
    }
    
    if (command_q.length > 0) {
        log.info("Writing command to socket:"+command_q[0]);
        socket.write(command_q[0]);
    }
    
  }).on('connect', function() {
    log.info('CONNECTED');
    command = "au,default,default";
    addCommand(command);
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
  addCommand(command);
});

subscribe('homeseer/+/+/+/set', function(topic, val) {
  log.info(topic + ':' + val);

  var deviceid = topics[topic];
  command = "cv," + deviceid + "," + val;
  log.info("Writing Command:" + command);
  addCommand(command);
});

function addCommand(command) {
  command_q.push(command + "\r\n");
  if (command_q.length == 1) {
    socket.write(command_q[0]);
  }
}