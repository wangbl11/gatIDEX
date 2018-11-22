/*
 * Copyright 2018 Oracle GAT committers
 *
 *  Author: tina.wang@oracle.com
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 *
 */
var extCommand = new ExtCommand();
var sentMessagesCnt=0;
var elementAttributesTemplate={

};
var recordingWindows = [];
var isRecording = true;
var recordingArray = [];
var stepsCount=0;
var steps = [];
var gat_recorder_uuid;
var stompClient;
var isRecording = false;
var isPlaying=false;
//dummy functions, because we don't get case and suite information from recorder UI
function getSelectedCase() {
  var _json = {
    "id": "111",
    "name": "NewScript"
  }
  return _json;
}

function getSelectedSuite() {
  var _json = {

  }
  return _json;
}

function getRecordsArray() {
  return recordingArray;
}
///////////////////////////////////////////////////////////////////////////////////
var socket = new SockJS('http://slc00blb.us.oracle.com:8080/ws');
var stompClient = Stomp.over(socket);
stompClient.debug = () => {};
var uuid = UUID.generate();
var connected=false;
var chatRoomId='/app/chat.privateMsg.';
var reconInt;
function connectSocketServer() {
    stompClient.connect({ "id": uuid }, onConnected, onError);
}
function onConnected(frame) {
    console.log('connected');
    clearInterval(reconInt);
    stompClient.subscribe("/topic/" + gat_recorder_uuid, onMessageReceived);
    stompClient.subscribe("/user/exchange/amq.direct/chat.message", onMessageReceived);
    chatRoomId+=gat_recorder_uuid;
    // var _content = { "chatRoomId": gat_recorder_uuid };
    // stompClient.send('/app/chat.privateMsg.' + gat_recorder_uuid,
    //     {},
    //     JSON.stringify({ sender: 'ide', type: 'JOIN', content: JSON.stringify(_content) })
    // );
}
function onError(frame) {
    // console.log(frame);
    // console.log(stompClient);
    // console.log(socket);
    reconInt = setTimeout(() => {
        if (stompClient.ws.readyState === WebSocket.CONNECTING) {
            return;
        }
        if (stompClient.ws.readyState === WebSocket.OPEN) {
            clearInterval(reconInt);
            return;
        }
        connectSocketServer();
    }, 5000);
}
function onMessageReceived1(frame){
    console.log("from /topic/" + gat_recorder_uuid);
}
function onMessageReceived(frame){
    console.log('~~~~~~~~~ received message');
    let _body=frame.body;
    let _json=JSON.parse(_body);
    let _msg=_json['message'];
    console.log(_msg);
    if (_msg)
    {
        _msg=JSON.parse(_msg);
        let _command=_msg['command'];
        if (_command)
        {
             switch (_command){
                case "stopRecord":
                   isRecording = false;
                   recordEngine();
                   break;
                case "startRecord":
                   isRecording = true;
                   recordEngine();
                   break;
                default:
                   ;
             }
        }
    }
}
function recordEngine(){
    let _tabs=[];
    if (isRecording) {
        recorder.attach();
        notificationCount = 0;
        let _tabs=[];
        console.log(extCommand.getContentWindowId());
        browser.tabs.query({url: "<all_urls>"})
        .then(function(tabs) {
            for(let tab of tabs) {
                _tabs.push(
                browser.tabs.sendMessage(tab.id, {attachRecorder: true}).then(
                    function(rst){
                        console.log(tab.id+' attached...');
                    }
                ));
            }
            Promise.all(_tabs).then(function (result) {
                console.log('fully finish attaching...');
                emitMessageToConsole('SYSTEM',{"command":"finishStart"});
                _tabs.length=0;
            });     
        });
       
    }
    else {
        recorder.detach();
        //ensure all window(s)/frame(s) have detached.
        browser.tabs.query({url: "<all_urls>"})
        .then(function(tabs) {
            let _tabs=[];
            for(let tab of tabs) {
                _tabs.push(browser.tabs.sendMessage(tab.id, {detachRecorder: true})
                .then(function(rst){
                    console.log(tab.id+' detached...');
                }
                ));
            }
            Promise.all(_tabs).then(function (result) {
                console.log('fully finish...');
                emitMessageToConsole('SYSTEM',{"command":"finishStop"});
                _tabs.length=0;
            });            
        });
    }
}
function ignoreLastStep(_last,_json){
    let _ignore=false;
    return _ignore;
}
function emitMessageToConsole(_type,_json){
    //if not in recording mode, ignore all messages
    let _send=false;
    if (_type=='SYSTEM') _send=true;
    else
        if (isRecording) _send=true;
        else if (steps.length==0) _send=true;

    if (!_send) return;
    if (_json['optional']==undefined)
      _json['optional']=false;
    
    // if (sentMessagesCnt==0){
    //     stompClient.send(chatRoomId,
    //         {},
    //         JSON.stringify({ sender: 'ide', type: _type, content: steps[0] })
    //     );
    //     sentMessagesCnt++;
    // }
    stompClient.send(chatRoomId,
                {},
                JSON.stringify({ sender: 'ide', type: _type, content: _json })
    );
}

/*Read data from storage */
function getStorage() {
  var gettingAllStorageItems = browser.storage.local.get();
  gettingAllStorageItems.then((results) => {
    gat_runner_vncport = results["gat.runner.vncport"];
    gat_runner_url = results["gat.runner.url"];
    gat_runner_datafile = results["gat.runner.datafile"];
    gat_recorder_uuid = results["gat.recorder.topicid"];
    if (!gat_recorder_uuid)
      gat_recorder_uuid ='c6ac9fd6-5550-40a5-b62b-3403f12d6c6c'
    connectSocketServer();
  }, function (message){
    console.log('get wrong with local');
    //default value or default dispose
    gat_runner_datafile='test_temporary';
  });
};

function setStorage(key, val) {
  if (key == 1) //save steps
    browser.storage.local.set({
      "steps": val
    });
  else if (key == 2) { //save windows
    browser.storage.local.set({
      "windows": val
    });
  }
}

var valueCommands = ["type", "clickAt"];

function addTopWindow(winInfo) {
    var oneself = -1;
    try {
      //check whether duplicate
      console.log(winInfo)
  
      for (var i = 0; i < recordingWindows.length; i++) {
        let _one = recordingWindows[i];
        if (_one.tabId == winInfo.tabId && _one.windowId == winInfo.windowId) {
           if (_one['hostname']==winInfo['hostname']){
                 oneself=i;
                 break;
           }
        } 
      }
      if (oneself==-1){ //new window
        recordingWindows.push(winInfo);
        let _open={
            "command":'open',
            "target":[
                [{ "finder": "url", "values": [winInfo['url']] }]
                ],
            "value":winInfo['url'],
        }
        addCommandAuto(_open);
      }
      oneself = recordingWindows.length - 1;
      return oneself;
    } catch (err) {
      console.log(err.message);
    }
    return -1;
}

function addWindow(winInfo) {
  var father=-1;
  var oneself = -1;
  try {
    //check whether duplicate
    console.log(winInfo)
    if (winInfo.type == 'frame') {
      winInfo['frame_locators']=winInfo['locators'];
      winInfo['locators']=[];
      for (var i = 0; i < recordingWindows.length; i++) {
        let _one = recordingWindows[i];
        if (_one.type == 'top'&&_one.tabId == winInfo.tabId && _one.windowId == winInfo.windowId) {
          father = i;
          break;
        }
      }
      if (father>-1) {
        winInfo.topWindowIdx = father;
      }
      else{
         //if no top winodow is found, create one for this top, then adjust topWindowIdx of its descendants
         //whether we should cache it
         let _winone={
            "tabId":winInfo.tabId,
            "windowId":winInfo.windowId,
            "url":winInfo.topWindowUrl,
            "origin":"",
            "type":"top",
            "topWindowIdx":-1,
            "frameLocation":"",
            "locators":[]
         };
         recordingWindows.push(_winone);
         console.log('new top window');
         emitMessageToConsole('WINDOW',_winone);
         winInfo.topWindowIdx =recordingWindows.length-1;
      }
    }

    for (var i = 0; i < recordingWindows.length; i++) {
      let _one = recordingWindows[i];
      if (_one.tabId == winInfo.tabId && _one.windowId == winInfo.windowId) {
        if (winInfo.type == 'top' || (winInfo.type == 'frame' && _one.frameLocation == winInfo.frameLocation)) {
          if (_one["origin"].length==0)
            _one["origin"]=winInfo["origin"];
          oneself = i;
          return i;
        }
      } 
    }

    delete winInfo['topWindowUrl'];
    recordingWindows.push(winInfo);
    console.log('emit '+winInfo.type);
    emitMessageToConsole('WINDOW',winInfo);
    if (winInfo['type']=='top')
      addCommandAuto("open", [
        [{ "finder": "url", "values": [winInfo['url']] }]
        ], winInfo['url']);
    oneself = recordingWindows.length - 1;
    return oneself;

  } catch (err) {
    console.log(err.message);
  }
  return -1;
}


function addCommand(msg, auto, insertCommand) {
  if (!isRecording&&steps.length>0) return;
  // create default test suite and case if necessary
  var s_suite = getSelectedSuite(),
    s_case = getSelectedCase();

  let command_name=msg['command'];
  let command_target_array=msg['target'];
  let command_value=msg['value'];
  let _json;
  if (command_name == 'open') {
    _json = {
      "command": command_name,
      "url": command_value,
      "parametrize": {
        "urlParam": "url"
      }
    };
  } else {
    _json = {
      "command": command_name,
      "locators": {
          "seleniumLocators":command_target_array && command_target_array.length > 0 ? command_target_array[0] : [],
          "genericLocator":command_target_array && command_target_array.length > 3 ? command_target_array[3] : {}
      },
      "elementAttributes": command_target_array && command_target_array.length > 1 ? command_target_array[1] : {},
      "coordinates": command_target_array && command_target_array.length > 2 ? command_target_array[2] : {},
      "value": "",
      "winInfo":msg['winInfo'],
      "optional": false
    }
    if (valueCommands.indexOf(command_name) >= 0) {
      _json['value'] = command_value;
    }
  }
  //composite display name
  compositeDisplayName(_json);

  //capture screenshot
    sshot(_json["coordinates"]).then(function (d) {
        _json['img'] = d; 
        if (stompClient){
            stepsCount++;
            emitMessageToConsole('STEP',_json);
        }
        steps.push(_json);
        setStorage(1, steps); 
    });
}

// add command automatically (before last command upward)
function addCommandBeforeLastCommand(msg) {
    addCommand(msg, 1, true);
}

// add command automatically (append upward)
function addCommandAuto(msg) {
  addCommand(msg, 1, false);
}
function fromContentScript(message, sender, sendResponse) {
    console.log('in background/gatback.js');
    if (message.attachRecorderRequest) {
        if (isRecording && !isPlaying) {
            console.log(sender.tab.id);
            browser.tabs.sendMessage(sender.tab.id, { attachRecorder: true });
        }
        else{
            console.log("not in recording mode");
        }

    }else{
        if (message.command && message.command == 'gatWindow' && stepsCount == 0) {
            message['command'] = 'open';
            message['tabId'] = sender.tab.id;
            message['windowId'] = sender.tab.windowId;
            if (message.type == 'top') {
                addTopWindow(message);
            }
        }
    }
}
browser.runtime.onMessage.addListener(fromContentScript);

//initialize background recorder
console.log('~~~~~~~~~~~~~~~~~~~~~~~');
getStorage();
var recorder = new BackgroundRecorder();
console.log('~~~~~~~~~~~~~~~~~~~~~~~');
//recorder.attach();

//loop all existing tab to send attachRecorder info
