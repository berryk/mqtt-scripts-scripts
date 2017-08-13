var power = "standby";
var input = "av1";

var tvOn = {
    "audio1": "on",
    "av2": "on",
    "av3": "on",
    "av4": "on",
    "av5": "on"
};

subscribe('MusicCast/family_room/power', function(topic, val) {
    log.info(topic + ':' + val);

    power = val;

    checkTV();

});

subscribe('MusicCast/family_room/input', function(topic, val) {
    log.info(topic + ':' + val);

    input = val;

    checkTV();

});

function checkTV() {

    if (power == "on") {
        if (input in tvOn) {
            setValue('TV/family_room/set', 'on');
        } else {
            setValue('TV/family_room/set', 'off');
        }
    } else {
        setValue('TV/family_room/set', 'off');
    }

}