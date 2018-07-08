console.log(window.name);
document.body.style.border = "5px solid green";
console.log('~~~~~~~~~~~~~~~~~~~~~~~');
// TODO: new by another object
var recorder = new Recorder(window);
console.log('%%%%%%%%%%%%%%%%%%%%%%');
// attach directly, not trigger by UI in gatIDEX
recorder.attach();
console.log('#######################');
