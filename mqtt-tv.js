var WebSocket = require('ws');
var wol = require('wake_on_lan');

var app_name_base64 = (new Buffer("MQTT-TV")).toString('base64');

var tv = {
    "family_room": { "ip": "family-room-tv.lan", "mac": "CC:B1:1A:56:02:17", "state": "off", "network": "off", "name": "family_room" },
    "basement": { "ip": "basement-tv.lan", "mac": "CC:B1:1A:56:02:13", "state": "off", "network": "off", "name": "basement" },
};

var ip = {
    "192.168.1.202": "family_room",
    "192.168.1.204": "basement"
};


var PORT = 1900;
var HOST = '0.0.0.0'; //This is your local IP
var dgram = require('dgram');
var client = dgram.createSocket('udp4');

client.on('listening', function() {
    var address = client.address();
    log.info('UDP Client listening on ' + address.address + ":" + address.port);
    client.setMulticastTTL(128);
    client.addMembership('239.255.255.250', HOST);
});

client.on('message', function(msg, remote) {
    var samsungurn = 'samsung.com';
    var samsungalive = 'alive';
    var samsungoff = 'byebye';

    //  " urn:samsung.com:device:SmartThingsTvDevice:1" = Network going off
    //  " urn:samsung.com:device:ScreenSharing:1" = Screen going off - network still on
    var networkoff = 'urn:samsung.com:device:SmartThingsTvDevice:1';
    var screenoff = 'urn:samsung.com:device:ScreenSharing:1';

    if (msg.indexOf(samsungurn) != -1) {
        log.info('Found samsung device ip:',remote.address);

        var tvname = ip[remote.address];

        if (msg.indexOf(samsungalive) != -1) {
            if (tv[tvname].state == "off") {
                log.info('Samsung device: ' + tvname + ' is on ');
                tv[tvname].state = "on";
                tv[tvname].network = "on";
                // publish MQTT message tv on 
                setValue('TV/' + tvname, 'on');
            }
        }
        if (msg.indexOf(samsungoff) != -1) {

            if (msg.indexOf(screenoff) != -1) {
                if (tv[tvname].state == "on") {
                    log.info('Samsung device: ' + tvname + ' is off ');
                    tv[tvname].state = "off";
                    tv[tvname].nework = "on";
                    // publish MQTT message tv off
                    setValue('TV/' + tvname, 'off');
                }

            }

            if (msg.indexOf(networkoff) != -1) {
                if (tv[tvname].network == "on") {
                    log.info('Samsung device: ' + tvname + ' network is off ');
                    tv[tvname].state = "off";
                    tv[tvname].network = "off";
                }

            }

        }


    }
});

client.bind(PORT);

subscribe('TV/+/set', function(topic, val) {
    log.info(topic + ':' + val);

    var myRe = new RegExp('TV/(.*)/set', 'm');
    var myArray = myRe.exec(topic);
    if (myArray) {
        var room = myArray[1];

        if (val == "on") {
            if (tv[room].state == "off") {
                if (tv[room].network == "off") {
                    wol.wake(tv[room].mac);
                    log.info("Waking TV:" + room);
                }

                if (tv[room].network == "on") {
                    sendkey("KEY_POWER", tv[room]);
                    log.info("Sending Power on to TV:" + room);
                }
            }
        }

        if (val == "off") {
            if (tv[room].state == "on") {
                sendkey("KEY_POWER", tv[room]);
                log.info("Sending Power off to TV:" + room);
            }
        }
    }
});

function sendkey(key, tvObj, done) {
    var ws = new WebSocket('http://' + tvObj.ip + ':8001/api/v2/channels/samsung.remote.control?name=' + app_name_base64, function(error) {
        done(new Error(error));
    });
    ws.on('error', function(e) {
        log.info('Error in sendKey WebSocket communication');
    });
    ws.on('message', function(data, flags) {
        var cmd = { "method": "ms.remote.control", "params": { "Cmd": "Click", "DataOfCmd": key, "Option": "false", "TypeOfRemote": "SendRemoteKey" } };
        data = JSON.parse(data);
        if (data.event == "ms.channel.connect") {
            log.info('websocket connect');
            ws.send(JSON.stringify(cmd));
            setTimeout(function() {
                ws.close();
                log.info('websocket closed');
            }, 1000);
        }
    });
};
