var power = "standby";
var input = "av1";

var tvOn = {
    "av2": "on",
    "av3": "on",
    "av4": "on",
    "av1": "on"
};

subscribe('MusicCast/basement/power', function(topic, val) {
    log.info(topic + ':' + val);

    power = val;

    checkTV();

});

subscribe('MusicCast/basement/input', function(topic, val) {
    log.info(topic + ':' + val);

    input = val;

    checkTV();

});

function checkTV() {

    if (power == "on") {
        if (input in tvOn) {
            setValue('TV/basement/set', 'on');
        } else {
            setValue('TV/basement/set', 'off');
        }
    } else {
        setValue('TV/basement/set', 'off');
    }

}
