var count = {
  "Downstairs": 0,
  "Upstairs": 0,
  "Basement": 0,
  "Outside": 0,
};

var alloffstatus = {};

var status = {};

function setStatus(path, value) {
  if (path in alloffstatus) {
    if (value != alloffstatus[path]) {
      alloffstatus[path] = value;
      setValue(path, value);
    }
  } else {
    alloffstatus[path] = value;
    setValue(path, value);
  }
}



subscribe('homeseer/Lights/#', function(topic, val) {
  log.info(topic + ':' + val)

  var fields = topic.split("/");

  if (fields[2] in count) {

    if (topic in status) {

      if (status[topic] === 0) {
        status[topic] = val;
        if (val > 0) {
          count[fields[2]] = count[fields[2]] + 1;
          log.info(fields[2] + ' lights on: ' + count[fields[2]]);
          setStatus('homeseer/House/House/All Off ' + fields[2] + '/set', 100);
          setStatus('homeseer/House/House/All Off House/set', 100);

          // count total lights on
          var totalOn = 0;
          for (var i in count) {
            totalOn = totalOn + count[i];
          }
          log.info('Total lights on:' + totalOn)
        }
      } else {
        // val was > 0 before 
        status[topic] = val;
        if (val === 0) {
          count[fields[2]] = count[fields[2]] - 1;
          log.info(fields[2] + ' lights on: ' + count[fields[2]]);

          // count total lights on
          var totalOn = 0;
          for (var i in count) {
            totalOn = totalOn + count[i];
          }
          log.info('Total lights on:' + totalOn)

          // insert logic here 
          if (count[fields[2]] === 0) {
            setStatus('homeseer/House/House/All Off ' + fields[2] + '/set', 0);

            // count total lights on
            //                         var totalOn = 0;
            //                         for (var i in count) {
            //                             totalOn = totalOn + count[i];
            //                         }
            //                         log.info('Total lights on:' + totalOn)

          }

          if (totalOn === 0) {
            setStatus('homeseer/House/House/All Off House/set', 0);
          }
        } else {
          log.info('No change' + fields[2] + '\n' + 'lights on: ' + count[fields[2]]);
        }
      }

    } else {
      // topic doesn't exist, so create it
      status[topic] = val;
      if (val > 0) {
        count[fields[2]] = count[fields[2]] + 1;
        log.info(fields[2] + ' lights on: ' + count[fields[2]]);
        setStatus('homeseer/House/House/All Off ' + fields[2] + '/set', 100);
        setStatus('homeseer/House/House/All Off House/set', 100);
        // count total lights on
        var totalOn = 0;
        for (var i in count) {
          totalOn = totalOn + count[i];
        }
        log.info('Total lights on:' + totalOn)
      }
    }
  }

});

// Need to add a status mode perhaps every hour where status is checked and totals reset
// This should also update overall counts

subscribe('homeseer/status', function(topic, val) {
  log.info(topic + ':' + val);
  log.info("Resetting counters for full status");
  count = {
    "Downstairs": 0,
    "Upstairs": 0,
    "Basement": 0,
    "Outside": 0,
  };

  alloffstatus = {};
  status = {};

});

subscribe('homeseer/House/House/All Off House/set', function(topic, val) {
  log.info(topic + ':' + val);
  setValue('homeseer/-/Bedroom/Master Bedroom Cans - Button D/set', val);
});

function switchoff(path) {
  log.info("Switching off:" + path);
  setValue(path + '/set', 0);
}

subscribe('homeseer/-/Bedroom/Master Bedroom Cans - Button D', function(topic, val) {
  log.info(topic + ':' + val);
  if (val === 0) {
    log.info("All off lights pressed, switching off all on lights");
    var pause = 100;
    for (var i in status) {
      if (status[i] > 0) {
        log.info("Scheduling off for:" + i);
        setTimeout(switchoff, pause, i);
        pause = pause + 100;
      }
    }
  }
});