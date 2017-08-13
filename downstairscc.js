var ccplaying = 0;
var roompower = 0;
var timerrunning = 0;
var volume_mult = 1.6;

var ccname = 'Downstairs Speakers';

var timeoutObj;

subscribe('chromecast/' + ccname + '/player_state', function(topic, val) {
    log.info(topic + ':' + val);


    if (val == "PLAYING" || val == "BUFFERING") {
        ccplaying = 1;
        if (roompower == 0) {
            var volume = 62;
            setValue('chromecast/' + ccname + '/command/volume_level', volume);
            setValue('MusicCast/family_room/volume/set', volume * volume_mult);
            setValue('MusicCast/family_room/input/set', 'audio2');
            setValue('MusicCast/family_room/power/set', 'on');
            setValue('MusicCast/dining_room/volume/set', volume * volume_mult);
            setValue('MusicCast/dining_room/input/set', 'audio3');
            setValue('MusicCast/dining_room/power/set', 'on');
            setValue('MusicCast/kitchen/volume/set', volume * volume_mult);
            setValue('MusicCast/kitchen/input/set', 'av1');
            setValue('MusicCast/kitchen/power/set', 'on');
            roompower = 1;
        }

        log.info("Clearing timeout");
        clearTimeout(timeoutObj);
    } else {
        if (ccplaying == 1) {
            // Chromecast was playing, start timer before shutting off

            log.info("Chromecast stopped starting timer");
            timeoutObj = setTimeout(function() {
                log.info("Time out, turning off");
                roompower = 0;
                setValue('MusicCast/family_room/power/set', 'standby');
                setValue('MusicCast/dining_room/power/set', 'standby');
                setValue('MusicCast/kitchen/power/set', 'standby');
            }, 300000);

            ccplaying = 0;
        }
    }
});

subscribe('chromecast/' + ccname + '/volume_level', function(topic, val) {
    log.info(topic + ':' + val);

    setValue('MusicCast/family_room/volume/set', val * volume_mult);
    setValue('MusicCast/dining_room/volume/set', val * volume_mult);
    setValue('MusicCast/kitchen/volume/set', val * volume_mult);
});