var ccplaying = 0;
var roompower = 0;
var timerrunning = 0;
var volume_mult = 1.6;

var ccname = 'Family Room Speakers';
var mcname = 'family_room';
var mcinput = 'audio2';
var harmonyActivity = '36862399';
var timeoutObj;

subscribe('chromecast/' + ccname + '/player_state', function(topic, val) {
    log.info(topic + ':' + val);



    if (val == "PLAYING" || val == "BUFFERING") {
        ccplaying = 1;
        if (roompower == 0) {
            var volume = 62;
            setValue('chromecast/' + ccname + '/command/volume_level', volume);
            setValue('homeseer/MeiHarmonyHub/MeiHarmonyHub/Family Room Activities/set',harmonyActivity);
            setValue('MusicCast/' + mcname + '/volume/set', volume * volume_mult);
            //setValue('MusicCast/' + mcname + '/input/set', mcinput);
            //setValue('MusicCast/' + mcname + '/power/set', 'on');
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
                setValue('homeseer/MeiHarmonyHub/MeiHarmonyHub/Family Room Activities/set','-1');
                //setValue('MusicCast/' + mcname + '/power/set', 'standby');
            }, 300000);

            ccplaying = 0;
        }
    }
});

subscribe('chromecast/' + ccname + '/volume_level', function(topic, val) {
    log.info(topic + ':' + val);

    setValue('MusicCast/' + mcname + '/volume/set', val * volume_mult);
});

subscribe('MusicCast/' + mcname + '/power', function(topic, val) {
    log.info(topic + ':' + val);

    if (val == 'standby') {
        roompower = 0;
        log.info("Clearing timeout");
        clearTimeout(timeoutObj);
    }
});

subscribe('homeseer/MeiHarmonyHub/MeiHarmonyHub/Family Room Activities', function(topic, val){
    log.info(topic + ':' + val);

    if(val != harmonyActivity) {
        roompower = 0; 
        log.info("Clearing timeout");
        clearTimeout(timeoutObj);
    }
});

subscribe('MusicCast/' + mcname + '/input', function(topic, val) {
    log.info(topic + ':' + val);

    if (val != mcinput) {
        roompower = 0;
        log.info("Clearing timeout");
        clearTimeout(timeoutObj);
    }
});