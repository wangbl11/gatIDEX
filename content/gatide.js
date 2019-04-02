var recorder = new Recorder(window);
console.log("%%%%%%%%%%gatide%%%%%%%%%%%%");

document.body.style.border = "1px solid green";

//we dispose window info in this script
var istop = window == window.top;
let _emit = true;
if (istop) {
  var _header = document.getElementsByTagName("META");
  //console.log(JSON.stringify(_header));
  if (_header && _header.length > 0) {
    _header = _header[0].httpEquiv;

    if (_header && _header == "refresh") _emit = false;
  }
  //GAT-5808, for some sites, _header is blank {}
  if (_emit == true) {
    var sending = browser.runtime.sendMessage({
      command: "gatWindow",
      origin: istop ? window.top.location.origin : "",
      hostname: window.location.hostname,
      topUrl: istop ? window.top.location.href : "",
      url: istop ? window.top.location.href : window.location.href,
      type: istop ? "top" : "frame",
      framePositions: recorder.framePositions,
      locators: recorder.locators ? recorder.locators : []
    });
    sending.then(
      function(message) {
        //recorder.recordingIdx = message.response;
      },
      function(error) {
        console.log(`Error: ${error}`);
      }
    );
  }
}
