var volume = 62;
var step = 2;

subscribe('chromecast/Kitchen Speakers/volume_level', function(topic, val) {
    log.info(topic + ':' + val);

    volume = val;
});

subscribe('chromecast/Kitchen Speakers/player_state', function(topic, val) {
    log.info(topic + ':' + val);

    if (val == "PLAYING" || val == "BUFFERING") {
        setValue('homeseer/-/Downstairs/Kitchen Table Cans - Button B/set', 100);
    } else {
        setValue('homeseer/-/Downstairs/Kitchen Table Cans - Button B/set', 0);
    }
});

subscribe('homeseer/-/Downstairs/Kitchen Table Cans - Button B', function(topic, val) {
    log.info(topic + ':' + val);

    if (val == 0) {
        setValue('chromecast/Kitchen Speakers/command/player_state', 'stop');
    }
});

subscribe('homeseer/-/Downstairs/Kitchen Table Cans - Button H', function(topic, val) {
    log.info(topic + ':' + val);

    if (val == 100) {
        setValue('homeseer/-/Downstairs/Kitchen Table Cans - Button H/set', 0);

        setValue('chromecast/Kitchen Speakers/volume_level', volume + step);

    }
});

subscribe('homeseer/-/Downstairs/Kitchen Table Cans - Button G', function(topic, val) {
    log.info(topic + ':' + val);

    if (val == 100) {
        setValue('homeseer/-/Downstairs/Kitchen Table Cans - Button G/set', 0);

        setValue('chromecast/Kitchen Speakers/volume_level', volume - step);
    }
});