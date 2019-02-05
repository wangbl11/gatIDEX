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
var gat_socket_server = null; //'http://slc00blb.us.oracle.com:8080/ws';
var gat_targetinstance=null;
var extCommand = new ExtCommand();
var sentMessagesCnt = 0;
var elementAttributesTemplate = {

};
var recordingWindows = [];
var recordingArray = [];
var stepsCount = 0;
var steps = [];
var gat_recorder_uuid;
var stompClient;
var isRecording = false;
var isPlaying = false;
var isSelecting = false;
var _defer=false;
function delayEmit(cmd){
    return false;
}
var lastStepMillisecond=Date.now();
console.log(lastStepMillisecond);
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
console.log('~~~~~~~~~~~~~~~~~~~~~~~');
var socket = null; //new SockJS(gat_socket_server);
var stompClient = null;//Stomp.over(socket);
getStorage();
//stompClient.debug = () => {};
var uuid = UUID.generate();
var connected = false;
let _prefix='/app/chat.privateMsg.';
var chatRoomId = _prefix;
var reconInt;
function connectSocketServer() {
    if (gat_socket_server.startsWith('http')) {
        socket = new SockJS(gat_socket_server);
        stompClient = Stomp.over(socket);
    } else {
        //socket=new WebSocket(gat_socket_server);
        stompClient = Stomp.client(gat_socket_server);
    }
    stompClient.debug = () => { };
    stompClient.connect({ "id": uuid }, onConnected, onError);

}
function resend(){
    if (steps.length>0&&sentMessagesCnt<steps.length){
        
    }
}
function onConnected(frame) {
    console.log('connected');
    if (reconInt)
     clearInterval(reconInt);
    stompClient.subscribe("/topic/" + gat_recorder_uuid, onMessageReceived);
    stompClient.subscribe("/user/exchange/amq.direct/chat.message", onMessageReceived);
    chatRoomId =_prefix+ gat_recorder_uuid;

}
function onError(frame) {
    console.log(frame);
    console.log(stompClient);
    console.log(socket);
    reconInt = setTimeout(() => {
        if (stompClient.ws.readyState === WebSocket.CONNECTING) {
            return;
        }
        if (stompClient.ws.readyState === WebSocket.OPEN) {
            if (reconInt)
            clearInterval(reconInt);
            return;
        }
        connectSocketServer();
    }, 5000);
}
function onMessageReceived1(frame) {
    console.log("from /topic/" + gat_recorder_uuid);
}
function onMessageReceived(frame) {
    console.log('~~~~~~~~~ received message');
    let _body = frame.body;
    let _json = JSON.parse(_body);
    let _msg = _json['message'];
    console.log(_msg);
    if (_msg) {
        _msg = JSON.parse(_msg);
        let _command = _msg['command'];
        if (_command) {
            switch (_command) {
                case "stopRecord":
                    isRecording = false;
                    isSelecting = false;
                    disableRecording(true);
                    break;
                case "startRecord":
                    isRecording = true;
                    isSelecting = false;
                    enableRecording(true);
                    break;
                case "startSelect":
                    //isRecording=false;
                    isSelecting = true;
                    disableRecording().then(enableSelect(_msg['targetCommand']));
                    break;
                case "stopSelect":
                    //isRecording=false;
                    isSelecting = false;
                    if (isRecording)
                        disableSelect().then(enableRecording()).then(emitMessageToConsole('SYSTEM', { "command": "finishCancelSelect" }));
                    else
                        disableSelect().then(emitMessageToConsole('SYSTEM', { "command": "finishCancelSelect" }));
                    break;
                default:
                    ;
            }
        }
    }
}
function enableRecording(sendCallback) {
    return new Promise(function (resolve, reject) {
        recorder.attach();
        notificationCount = 0;
        let _tabs = [];
        //console.log(extCommand.getContentWindowId());
        browser.tabs.query({ url: "<all_urls>" })
            .then(function (tabs) {
                for (let tab of tabs) {
                    _tabs.push(
                        browser.tabs.sendMessage(tab.id, { attachRecorder: true }).then(
                            function (rst) {
                                console.log(tab.id + ' attached...');
                            }
                        ));
                }
                Promise.all(_tabs).then(function (result) {
                    console.log('fully finish attaching...');
                    if (sendCallback)
                        emitMessageToConsole('SYSTEM', { "command": "finishStart" });
                    // else {
                    //     if (nextAction == 'select') {
                    //         selectElement(param0);
                    //     }
                    // }
                    _tabs.length = 0;
                });
            });
    });
}
function disableRecording(sendCallback) {
    return new Promise(function (resolve, reject) {
        recorder.detach();
        //ensure all window(s)/frame(s) have detached.
        browser.tabs.query({ url: "<all_urls>" })
            .then(function (tabs) {
                let _tabs = [];
                for (let tab of tabs) {
                    _tabs.push(browser.tabs.sendMessage(tab.id, { detachRecorder: true })
                        .then(function (rst) {
                            console.log(tab.id + ' detached...');
                        }
                        ));
                }
                Promise.all(_tabs).then(function (result) {
                    console.log('fully finish...');
                    if (sendCallback)
                        emitMessageToConsole('SYSTEM', { "command": "finishStop" });
                    _tabs.length = 0;
                });
            });
    });
}
function enableSelect(targetCmd) {
    return new Promise(function (resolve, reject) {
        browser.tabs.query({
            active: true,
            currentWindow: true
        }).then(function (tabs) {
            if (tabs.length === 0) {
                console.log("No match tabs");
                isSelecting = false;
            } else
                browser.tabs.sendMessage(tabs[0].id,
                    {
                        "selectMode": true,
                        "selecting": true,
                        "targetCmd": targetCmd
                    });
        });
    });
}
function disableSelect() {
    return new Promise(function (resolve, reject) {
        //send unselect command to active content page script
        browser.tabs.query({
            active: true,
            currentWindow: true
        }).then(function (tabs) {
            browser.tabs.sendMessage(tabs[0].id, { selectMode: true, selecting: false });
        }).catch(function (reason) {
            console.log(reason);
        });
    });
}

function ignoreLastStep(_last, _json) {
    let _ignore = false;
    return _ignore;
}
function emitMessageToConsole(_type, _json) {
    try {
        //if not in recording mode, ignore all messages
        console.log('prepare to send... ' + _type);
        // if (_json['command']=='typeInCodeMirror')
        // {console.log(JSON.stringify(_json));
        // console.log(escape(JSON.stringify(_json)));
        // }
        let _send = false;
        if (_type == 'SYSTEM') _send = true;
        else
            if (_type == 'SELECT') _send = true;
            else
                if (isRecording) _send = true;
                else if (steps.length == 0) _send = true;

        if (!_send || !stompClient) return;

        console.log(_send);

        if (_json['optional'] == undefined)
            _json['optional'] = false;

        console.log(1);
        if (_json['coordinates']) {
            delete _json['coordinates'].left1;
            delete _json['coordinates'].top1;
        }
        console.log(2);
        //workaround for gat-5395
        if (stepsCount > 0) {
            console.log(3);
            let _lastCmd = steps[steps.length - 1];
            if (_lastCmd['command'] == 'type' && _json['command'] == 'type' && _lastCmd['parameters']['value'] == _json['parameters']['value']) {
                //judge whether they are same objects
                let _locators = _lastCmd['locators']['seleniumLocators'];
                let _locators1 = _json['locators']['seleniumLocators'];
                if (_locators.length > 0 && _locators1.length > 0 && JSON.stringify(_locators[0]) == JSON.stringify(_locators1[0]))
                    return;

            }

            // if (_defer == true&&_lastCmd['command'] == 'clickAt' && _json['command'] == 'type' && _json['elementAttributes']&&_lastCmd['elementAttributes']) {
            //     //judge whether they are same objects
            //     let _tag1 = _lastCmd['elementAttributes']['tag'];
            //     let _tag = _json['elementAttributes']['tag'];
            //     if (_tag == 'input' && _tag1 == 'input') {
            //         let _type1 = _lastCmd['elementAttributes']['type'];
            //         let _type = _json['elementAttributes']['type'];
            //         if (_type == 'text' && _type1 == 'text') {
            //             let _locators = _lastCmd['locators']['seleniumLocators'];
            //             let _locators1 = _json['locators']['seleniumLocators'];
            //             if (_locators.length > 0 && _locators1.length > 0 && JSON.stringify(_locators[0]) == JSON.stringify(_locators1[0])){
            //                //don't need send last command 
            //                console.log('type in input[text]');
            //                _defer = false;
            //             }
            //         }
            //     }
            // }
            // if (_defer) {
            //     console.log('send defer')
            //     try {
            //         stompClient.send(chatRoomId,
            //             {},
            //             JSON.stringify({ sender: 'ide', type: _type, content: _lastCmd })
            //         );
            //     } catch (err) {
            //         console.log(err.message);
            //     }
            //     _defer = false;
            // }
            //input defer emit
            // if (_json['command'] == 'clickAt' && _json['elementAttributes']) {
                
            //     let _tag = _json['elementAttributes']['tag'];
            //     if (_tag == 'input') {
            //         let _type = _json['elementAttributes']['type'];
            //         if (_type && _type == 'text') {
            //             console.log('defer click on input[text]')
            //             _defer = true;
            //             steps.push(_json);
            //             return;
            //         }
            //     }
            // }
            console.log(_defer);
            console.log(_lastCmd);
            

        }
        console.log(4);
        let _sleepBefore=0;
        let _tempnow=Date.now();
        console.log(_tempnow);
        try {
            if (steps.length > 0) {
                let _elapse=Math.round((_tempnow-lastStepMillisecond)/2000);
                if (_elapse>5){
                    stepsCount++;
                    let _wait={"command":"wait","parameters":{"value":_elapse}};
                    steps.push(_wait);
                    stompClient.send(chatRoomId,
                        {},
                        JSON.stringify({ sender: 'ide', type: _type, content: _wait })
                    );
                }else{
                    _sleepBefore=_elapse;
                }
                if (_json["parameters"]) {
                    _json["parameters"]["sleepBefore"] = _sleepBefore;
                } else {
                    _json["parameters"] = { "sleepBefore": _sleepBefore };
                }
            }
            lastStepMillisecond = _tempnow;
            stompClient.send(chatRoomId,
                {},
                JSON.stringify({ sender: 'ide', type: _type, content: _json })
            );
        } catch (err) {
            console.log(err.message);
        }
        stepsCount++;
        steps.push(_json);

    } catch (e) {
        console.error(e.message);
    }
    //setStorage(1, steps);
}

/*Read data from storage */
function getStorage() {
    var gettingAllStorageItems = browser.storage.local.get();
    gettingAllStorageItems.then((results) => {
        gat_runner_vncport = results["gat.runner.vncport"];
        gat_runner_url = results["gat.runner.url"];
        gat_runner_datafile = results["gat.runner.datafile"];
        gat_recorder_uuid = results["gat.recorder.topicid"];
        gat_socket_server = results["gat.recorder.wsServerURL"];
        gat_targetinstance=results["gat.recorder.targetInstance"];
        if (!gat_recorder_uuid) {
            console.log('gat.recorder.wsServerURL');
            gat_recorder_uuid = 'c6ac9fd6-5550-40a5-b62b-3403f12d6c6c';
        }
        if (!gat_socket_server) {
            //gat_socket_server = 'http://slc00blb.us.oracle.com:8080/ws';
            console.log('not specify gat_socket_server');
            gat_socket_server='ws://rws3510112.us.oracle.com:30010/html5';
        }

        console.log(gat_socket_server);
        console.log(gat_recorder_uuid);
        connectSocketServer();
    }, function (message) {
        console.log('get wrong with local');
        //default value or default dispose
        gat_runner_datafile = 'test_temporary';
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

var valueCommands = ["type", "clickAt","check","dragAndDrop","select"];
var typeCommands = ["type","editContent","sendKeys","typeInCodeMirror"]
function addTopWindow(winInfo) {
    var oneself = -1;
    try {
        //check whether duplicate
        console.log(winInfo)

        for (var i = 0; i < recordingWindows.length; i++) {
            let _one = recordingWindows[i];
            if (_one.tabId == winInfo.tabId && _one.windowId == winInfo.windowId) {
                //if (_one['hostname'] == winInfo['hostname']) 
                {
                    oneself = i;
                    break;
                }
            }
        }
        if (oneself == -1) { //new window
            recordingWindows.push(winInfo);
            let _open = {
                "command": 'open',
                "parameters": {                   
                    "url": winInfo['url'],
                    "sleepBefore":0
                    // "parametrize":[
                    //   {
                    //     "enabled": true,
                    //     "name": "urlParam",
                    //     "ref": "url",
                    //     "randomize": {
                    //       "enabled": true,
                    //       "type": "url"
                    //      }
                    //    }
                    // ]
                }
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
/*
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
            "frameLocation":""
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
*/

function addCommand(msg, auto, insertCommand) {
    if (!isRecording && steps.length > 0) return;
    // create default test suite and case if necessary
    var s_suite = getSelectedSuite(),
        s_case = getSelectedCase();
    console.log(msg);
    let command_name = msg['command'];
    let command_target_array = msg['target'];
    let command_value = msg['value'];
    let _json;
    if (command_name == 'open') {
        _json = {
            "command": command_name,
            "parameters": msg['parameters']
        };
    } else {
        _json = {
            "command": command_name,
            "locators": {
                "seleniumLocators": command_target_array && command_target_array.length > 0 ? command_target_array[0] : []
            },
            "elementAttributes": command_target_array && command_target_array.length > 1 ? command_target_array[1] : {},
            "coordinates": command_target_array && command_target_array.length > 2 ? command_target_array[2] : {},
            "parameters":command_value,
            "winInfo": msg['winInfo'],
            "optional": false
        }
        if (typeCommands.indexOf(command_name) >= 0) {
            _json["parameters"]['mode'] = command_name;
            _json['command']='type';
            command_name="type";
        }
        // if (valueCommands.indexOf(command_name) >= 0) {
        //         _json["parameters"]['value'] = command_value;
        // }
        //if (_json['command']!='typeInCodeMirror')
         _json["locators"]["genericLocator"]=command_target_array && command_target_array.length > 3 ? command_target_array[3] : {}

    }
    //composite display name
    compositeDisplayName(_json);

    if (_json['command'] == 'type') {
        _json["parameters"]['strategy'] = "textValue";
    }

    if (_json['command'] == 'select') {
        _json["parameters"]['strategy'] = "text";
    }
    console.log(_json['command']);
    if (_json['command'] == 'dragAndDrop') {
        if (msg['evtType']=='html5'){
            let parm=_json["parameters"];
            parm["dragType"]="html5";
            //console.log(command_value);
            parm["targetLocators"]={
                "seleniumLocators": command_value && command_value.length > 0 ? command_value[0] : [],
                "genericLocator": command_value && command_value.length > 3 ? command_value[3] : {}
            }
            
            parm["targetElementAttributes"]=command_value && command_value.length > 1 ? command_value[1] : {}           
        }else
        if (msg['evtType']=='slider')
        {
            console.log(msg['evtType']);
            let parm={};
            parm["dragType"]="slider";
            //parm['value']=command_value;

        }
    }
    //console.log(JSON.stringify(_json));
    //capture screenshot
    sshot(_json["coordinates"], _json['winInfo']).then(function (d) {
        console.log('~~~~~~~~~~~~~~~~~~~~~ shot finish');
        _json['img'] = d;
        if (_json["locators"] && _json["locators"]["genericLocator"]) {
            captureElement(_json["coordinates"]).then(function (d) {
                console.log('~~~~~~~~~~~~~~~~~~~~~ capture element finish');
                _json["locators"]["genericLocator"]["image"] = d;
                emitMessageToConsole('STEP', _json);
            }, function (d) { console.log(d); });
        } else {
            emitMessageToConsole('STEP', _json);
        }

    }, function (d) {
        console.log(d);
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
    if (message['winInfo']) {
        message['winInfo']['tabId'] = sender.tab.id;
        message['winInfo']['windowId'] = sender.tab.windowId;
    }
    if (message.attachRecorderRequest) {
        if (isRecording && !isPlaying) {
            console.log(sender.tab.id);
            browser.tabs.sendMessage(sender.tab.id, { attachRecorder: true });
        }
        else {
            console.log("not in recording mode");
        }

    } else if (message.finishSelect) {//finish select
        if (isSelecting) {

            // isSelecting=false;
            // if (isRecording)
            //   disableSelect().then(enableRecording());
            // else
            //   disableSelect();

            if (message.selectTarget) {
                let _json = message['step'];
                //console.log(JSON.stringify(_json["coordinates"]));
                compositeDisplayName(_json);
                sshot(_json["coordinates"], _json["winInfo"]).then(function (d) {
                    _json['img'] = d;
                    if (_json["locators"]["genericLocator"]) {
                        captureElement(_json["coordinates"]).then(function (d) {
                            _json["locators"]["genericLocator"]["image"] = d;
                            emitMessageToConsole('SELECT', _json);
                        });
                    }
                    else {
                        emitMessageToConsole('SELECT', _json);
                    }
                });
            }
            else {
                emitMessageToConsole('SYSTEM', { "command": "finishSelect", "found": false });
            }
        }
    } else if (message.cancelSelectTarget) {
        isSelecting = false;
        if (isRecording)
            disableSelect().then(enableRecording());
        else
            disableSelect();
    }
    else {
        if (message.command && message.command == 'gatWindow' && stepsCount == 0) {
            message['command'] = 'open';
            message['tabId'] = sender.tab.id;
            message['windowId'] = sender.tab.windowId;
            if (message.type == 'top') {
                if (gat_targetinstance)
                  message['url']=gat_targetinstance;
                addTopWindow(message);
            }
        }
    }
}

browser.runtime.onMessage.addListener(fromContentScript);

//initialize background recorder

var recorder = new BackgroundRecorder();
console.log('~~~~~~~~~~~~~~~~~~~~~~~');
//recorder.attach();

