var count = {
  "Downstairs": 0,
  "Upstairs": 0,
  "Basement": 0,
  "Outside": 0,
  "Bedroom": 0,
};

var devices_off = {
  'MusicCast/basement/power': 'standby',
  'MusicCast/dining_room/power': 'standby',
  'MusicCast/kitchen/power':  'standby',
  'MusicCast/family_room/power': 'standby',
  'TV/basement': 'off',
  'TV/family_room': 'off',
  'homeseer/MeiHarmonyHub/MeiHarmonyHub/Family Room Activities': '-1',
  'homeseer/MeiHarmonyHub/MeiHarmonyHub/Basement Hub Activities': '-1',
  'homeseer/statusupdate': '1',
};

var basement_off = {
  'MusicCast/basement/power': 'standby',
  'TV/basement': 'off',
  'homeseer/MeiHarmonyHub/MeiHarmonyHub/Basement Hub Activities': '-1',
  'homeseer/statusupdate': '1',
};

var devices;
var device_count;
var alloffstatus = {};
var totalOn = 0;
var totalNoBedroom = 0;


var status = {};

function setStatus(path, value) {

  // need to trigger publishing when we first hit the device number
  //log.info("setStatus device_count:" + device_count + " devices:" + devices);
  log.info("Path:" + path + " Value:" + value);
  if (path in alloffstatus) {
    if (value != alloffstatus[path]) {
      alloffstatus[path] = value;
      if (device_count ==  devices) {
        log.info('Calling setValue:' + path + ':' + value);
        setValue(path, value);
      }
    } else {
	    log.info('No change in status for value:' + path + ' not publishing');
    }
} else {
    alloffstatus[path] = value;
    if (device_count == devices) {
      log.info('Calling setValue:' + path + ':' + value);
      setValue(path, value);
    }
  }
}

subscribe('homeseer/Lights/#', function(topic, val) {
  log.info(topic + ':' + val);

  var lastCount = {};

  Object.keys(count).forEach(function(key){
     lastCount[key] = count[key];
  });

  var fields = topic.split("/");

  if (fields[2] in count) {

    if (topic in status) {

      // If we already have a status for this light
      // If it was 0 before
      if (status[topic] === 0) {
        status[topic] = val;
        // And now it is not 0
        if (val > 0) {
          count[fields[2]] = count[fields[2]] + 1;
        }
      } else {
        // val was > 0 before 
        status[topic] = val;
        // But it is 0 now
        // Delete one and possibly update the whole house
        if (val === 0) {
          count[fields[2]] = count[fields[2]] - 1;
          log.info(fields[2] + ' lights on: ' + count[fields[2]]);

        } else {
          log.info('No change' + fields[2] + '\n' + 'lights on: ' + count[fields[2]]);
        }
      }

    } else {
      // topic doesn't exist, so cache it
     
  	  device_count = device_count + 1;
  	  log.info("Device count:" + device_count)
       status[topic] = val;
       
      if (val > 0) {
        count[fields[2]] = count[fields[2]] + 1;
      }
    }

    log.info(fields[2] + ' lights on: ' + count[fields[2]]);
    // count total lights on
    totalOn = 0;
    for (var i in count) {
	    log.info(i + ' lights on:' + count[i]);
      totalOn = totalOn + count[i];

      if (count[i] == 0) {
        setStatus('homeseer/House/House/All Off ' + i + '/set',0);
      }  
      if (count[i] > 0 ) {
        setStatus('homeseer/House/House/All Off ' + i + '/set',100);
      }
    }
      
    log.info('Total lights on:' + totalOn)
      
    // excluding bedroom 
    totalNoBedroom = totalOn - count.Bedroom;
    log.info('Total No Bedroom on:' + totalNoBedroom); 

    if (totalOn === 0) {
      setStatus('homeseer/House/House/All Off House/set', 0);
    } else {
      setStatus('homeseer/House/House/All Off House/set', 100);
    }
    
    if (totalNoBedroom === 0) {
      setStatus('homeseer/House/House/All Off No Bedroom/set', 0);
    } else {
      setStatus('homeseer/House/House/All Off No Bedroom/set', 100);
    }
  }

});

// Need to add a status mode perhaps every hour where status is checked and totals reset
// This should also update overall counts

subscribe('homeseer/status', function(topic, val) {
  log.info(topic + ':' + val);

  devices = val;
  device_count = 0;

  log.info("Resetting counters for full status");
  count = {
    "Downstairs": 0,
    "Upstairs": 0,
    "Basement": 0,
    "Outside": 0,
    "Bedroom": 0,
  };

  // could set a flag here that indicates it is a status run and only updates statuses when complete

  alloffstatus = {};
  status = {};

});

subscribe('homeseer/House/House/All Off No Bedroom/set', function(topic, val) {
  log.info(topic + ':' + val);
  setValue('homeseer/-/Bedroom/Master Bedroom Cans - Button D/set', val);
});

function switchoff(path,value) {
  log.info("Switching off:" + path);
  setValue(path + '/set', value);
}

subscribe('homeseer/-/Bedroom/Master Bedroom Cans - Button D', function(topic, val) {
  log.info(topic + ':' + val);
  if (val === 0 && totalNoBedroom > 0) {
    log.info("All off no bedroom pressed, switching off all on lights except bedroom");
    var pause = 100;
    for (var i in status) {
      if (status[i] > 0) {
        
        var fields = i.split("/");
        if (fields[2] != "Bedroom"){
        
          log.info("Scheduling off for:" + i);
          setTimeout(switchoff, pause, i, 0);
          pause = pause + 100;
        }
      }
    }

    for (var j in devices_off){
        setTimeout(switchoff, pause, j, devices_off[j]);
        pause = pause + 100;
    }
  }
});

subscribe('homeseer/House/House/All Off House', function(topic, val) {
  log.info(topic + ':' + val);
  if (val === 0 && totalOn > 0) {
    log.info("All off activated, switching off all on lights");
    var pause = 100;
    for (var i in status) {
          log.info("Scheduling off for:" + i);
          setTimeout(switchoff, pause, i, 0);
          pause = pause + 100;
    }

    for (var j in devices_off){
      setTimeout(switchoff, pause, j, devices_off[j]);
      pause = pause + 100;
    }
  }
});

subscribe('homeseer/House/House/All Off Basement', function(topic, val) {
  log.info(topic + ':' + val);
  if (val === 0 &&  count["Basement"] > 0 ) {
    log.info("All off basement pressed, switching off all basement lights");
    var pause = 100;
    for (var i in status) {
      if (status[i] > 0) {
        
        var fields = i.split("/");
        if (fields[2] == "Basement"){
        
          log.info("Scheduling off for:" + i);
          setTimeout(switchoff, pause, i, 0);
          pause = pause + 100;
        }
      }
    }

    for (var j in basement_off){
        setTimeout(switchoff, pause, j, devices_off[j]);
        pause = pause + 100;
    }
  }
});
