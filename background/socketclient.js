console.log('savescript');

//get mesaage from content script
browser.runtime.onMessage.addListener(notify);
function notify(message) {
   console.log(message);
   //xhrRequest(message.step);
}

var _sid='35FDD05729286AB6E9D3C213CD96EA2F';
/*
socket = new SockJS('http://localhost:8080/ws');
stompClient = Stomp.over(socket);

stompClient.connect({}, onConnected, onError);
function onConnected(frame) {
  console.log('connected');
  stompClient.subscribe("/topic/private/"+_sid, onMessageReceived);
  var _content={"chatRoomId":_sid};
  stompClient.send('/app/ide.connect',
    {},
    JSON.stringify({sender: 'ide', type: 'JOIN',content: JSON.stringify(_content)})
  );
}
*/
function onError(frame) {
  console.log(frame);
  console.log('not connected');
}
function onMessageReceived(frame){
  console.log(frame);
}
//after connect
// socket.on('connect', function(msg) {
//     console.log('connected')
// 		socket.emit('/app/ide.connect', {'sid': _sid});
// });
// socket.on('/topic/private/'+namespace, function(msg) {
// 		console.log(msg);
// });
//
// socket.on('/gatchicken/api/v1.0/ide_ping', function(msg) {
// 		socket.emit('/gatchicken/api/v1.0/ide_pong', {});
// });
// socket.on('/gatchicken/api/v1.0/ide_receivecmd', function(msg) {
// 		console.log(JSON.stringify(msg))
// });

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
