console.log('savescript');

//get mesaage from content script
browser.runtime.onMessage.addListener(notify);
function notify(message) {
  console.log(message.step);
	xhrRequest(message.step);
}

var _sid='632aeb7b79a74574b9ecccce49b537a8';
function getSourceId(){

}

var namespace = '/ide';
var socket = io.connect('http://localhost:5000'  + namespace);
//after connect
socket.on('connect', function(msg) {
		socket.emit('/gatchicken/api/v1.0/shakehands', {'sid': _sid});
});
socket.on('/gatchicken/api/v1.0/ide_ping', function(msg) {
		socket.emit('/gatchicken/api/v1.0/ide_pong', {});
});
socket.on('/gatchicken/api/v1.0/ide_receivecmd', function(msg) {
		console.log(JSON.stringify(msg))
});

function xhrRequest (step){
	 var url="http://127.0.0.1:5000/sendTeststep";
	 var xmlhttp = new XMLHttpRequest();
	 xmlhttp.onreadystatechange = function() {
         console.log(xmlhttp.readyState);
         console.log('fail with status: '+xmlhttp.status);

     };
	 xmlhttp.open("POST", url, true);
     xmlhttp.setRequestHeader('content-type', 'application/json');
     var newjson=JSON.stringify({"step":step,"sid":_sid});
     xmlhttp.send(newjson);
};

function initScript(){
}
function saveStep(step) {

}

function fetchCmd(){
	var xmlhttp = new XMLHttpRequest();
  var url='http://localhost:5000/getConsoleCmd';

  xmlhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
		    var myArr = JSON.parse(this.responseText);
		    alert(myArr['cmd']);
    }
  };
	xmlhttp.open("POST", url, true);
	xmlhttp.setRequestHeader('content-type', 'application/json');
	var newjson=JSON.stringify({"sid":_sid});
	xmlhttp.send(newjson);
}
