subscribe('MusicCast/#', function(topic, val) {
    log.info(topic + ':' + val)
})

subscribe('chromecast/#', function(topic, val) {
    log.info(topic + ':' + val)
})