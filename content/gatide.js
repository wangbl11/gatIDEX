document.body.style.border = "5px solid green";

var recorder = new Recorder(window);
console.log('%%%%%%%%%%%%%%%%%%%%%%');
// attach directly, not trigger by UI in gatIDEX
//recorder.attach();
//console.log('#######################');

//we dispose window info in this script
var istop=window==window.top;
if (istop) {
    var _header = document.getElementsByTagName("META");
    if (_header && _header.length > 0) {
        _header = _header[0].httpEquiv;
        if (_header && _header == 'refresh') ;
        else{
            var sending = browser.runtime.sendMessage({
                "command": "gatWindow",
                "origin": istop ? window.top.location.origin : "",
                "hostname":window.location.hostname,
                "topUrl": istop ? window.top.location.href : "",
                "url": istop ? window.top.location.href : window.location.href,
                "type": istop ? "top" : "frame",
                "frameLocation": recorder.frameLocation,
                "framePositions":recorder.framePositions,
                "locators": recorder.locators ? recorder.locators : []
            });
            sending.then(
                function (message) {
                    //recorder.recordingIdx = message.response;
                },
                function (error) {
                    console.log(`Error: ${error}`);
                }
            );
        }
    }
}
