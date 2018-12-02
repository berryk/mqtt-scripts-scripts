var ccplaying = 0;
var roompower = 0;
var timerrunning = 0;
var volume_mult = 1.6;

var ccname = 'Dining Room Speakers';
var mcname = 'dining_room';
var mcinput = 'audio3';
var timeoutObj;

subscribe('chromecast/' + ccname + '/player_state', function(topic, val) {
    log.info(topic + ':' + val);



    if (val == "PLAYING" || val == "BUFFERING") {
        ccplaying = 1;
        if (roompower == 0) {
            var volume = 62;
            setValue('chromecast/' + ccname + '/command/volume_level', volume);
            setValue('MusicCast/' + mcname + '/volume/set', 100);
            setValue('MusicCast/' + mcname + '/input/set', mcinput);
            setValue('MusicCast/' + mcname + '/power/set', 'on');
            roompower = 1;
        }

        log.info("Clearing timeout");
        clearTimeout(timeoutObj);
    } else {
        if (ccplaying == 1) {
            // Chromecast was playing, start timer before shutting off

            log.info("Chromecast stopped playing, starting timer");
            timeoutObj = setTimeout(function() {
                log.info("Time out, turning off");
                roompower = 0;
                setValue('MusicCast/' + mcname + '/power/set', 'standby');
            }, 300000);

            ccplaying = 0;
        }
    }
});

subscribe('chromecast/' + ccname + '/volume_level', function(topic, val) {
    log.info(topic + ':' + val);

    //setValue('MusicCast/' + mcname + '/volume/set', val * volume_mult);
});