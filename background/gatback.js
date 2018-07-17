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

/*
 *  Sample script
   {
    "id":"WrMDFKdE5mMgval_xym_ovy071qT4ls8",
    "name":"tina_test01",
     "productName":"ias",
     "releaseName":"1.0",
     "componentName":"odi",
     "createTime":1524019749585,
     "updateTime":1524019749585,
     "insertedBy":"tina.wang@oracle.com",
     "updatedBy":"tina.wang@oracle.com",
     "shared":false,
     "tags":[
        "manual",
        "home"
     ],
     "seleniumVersion":"2"
   }
 */

/*
async function test(){
  try{
 const tmpFiles = await IDBFiles.getFileStorage({
    name: "tmpFiles"
  });
const file = await tmpFiles.createMutableFile("filename.txt");
const fh = file.open("readwrite");

await fh.append("new file content");

await fh.close();

await file.persist();
console.log('%%%%%%%%%%%%%%%%%%%')
const fileNames = await tmpFiles.list();
 console.log(fileNames);
  await tmpFiles.put('/Users/songjian/t.txt', file);

}catch(err){
  console.log(err);
}
}
*/
var recordingWindows = [];
var isRecording = true;
var recordingArray = [];
var steps = [];

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

/*Read data from storage */
function getStorage() {
  var gettingAllStorageItems = browser.storage.local.get();
  gettingAllStorageItems.then((results) => {
    gat_runner_vncport = results["gat.runner.vncport"];
    gat_runner_url = results["gat.runner.url"];
    gat_runner_datafile = results["gat.runner.datafile"];
    gat_runner_sSocketid = results["gat.runner.sSocketid"];
    console.log(results);
  }, onError);
};

function setStorage(key, val) {
  if (key == 1)
    browser.storage.local.set({
      "steps": val
    });
  else if (key == 2) {
    browser.storage.local.set({
      "windows": val
    });
  }
}

function beautifyLocators(locators) {

}

function costume() {
  let _cloth = "";
  return _cloth;
}
var valueCommands = ["type", "clickAt"];

function addWindow(winInfo) {
  var father;
  var oneself = -1;
  try {
    //check whether duplicate
    console.log(winInfo)
    if (winInfo.type == 'frame') {
      for (var i = 0; i < recordingWindows.length; i++) {
        let _one = recordingWindows[i];
        if (_one.tabId == winInfo.tabId && _one.windowId == winInfo.windowId && _one.type == 'top') {
          father = i;
          break;
        }
      }
      if (father) {
        winInfo.topWindowIdx = father;
        //winInfo.frameLocation = father + winInfo.frameLocation;
      }
    }

    for (var i = 0; i < recordingWindows.length; i++) {
      let _one = recordingWindows[i];
      if (_one.tabId == winInfo.tabId && _one.windowId == winInfo.windowId) {
        console.log('^^^^^^^^')
        if (winInfo.type == 'top' || (winInfo.type == 'frame' && _one.frameLocation == winInfo.frameLocation)) {
          oneself = i;
          console.log('%%%%%%%%%%%%%%%%%-'+i);
          break;
        }
      } else {
        console.log('@@@@@@@@')
      }
    }
    console.log(oneself)
    if (oneself > -1) return oneself;

    console.log(winInfo);
    recordingWindows.push(winInfo);
    oneself = recordingWindows.length - 1;
    console.log(oneself);
    setStorage(2, recordingWindows);

    return oneself;
  } catch (err) {
    console.log(err);
  }
  return -1;
}

function addCommand(command_name, command_target_array, command_value, auto, insertCommand, frameLocation) {
  // create default test suite and case if necessary
  var s_suite = getSelectedSuite(),
    s_case = getSelectedCase();

  // var _frames = [];
  // if (frameLocation)
  //   _frames = frameLocation.split(":");

  recordingArray.push({
    "command": command_name,
    "target": command_target_array,
    "value": command_value
  });
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
      "locators": command_target_array && command_target_array.length > 0 ? command_target_array[0] : {},
      "elementAttributes": command_target_array && command_target_array.length > 1 ? command_target_array[1] : {},
      "coordinates": command_target_array && command_target_array.length > 2 ? command_target_array[2] : {},
      "upperElements": [],
      "path": frameLocation,
      //"path": _frames.length == 0 ? "" : _frames[0],
      "value": "",
      "optional": false
    }
    if (valueCommands.indexOf(command_name) >= 0) {
      _json['value'] = command_value;
    }
  }
  steps.push(_json);
  //let _changed=JSON.stringify(steps);
  //console.log(_changed);
  setStorage(1, steps);
}

// add command automatically (append upward)
function addCommandAuto(command_name, command_target_array, command_value, frameLocation) {
  addCommand(command_name, command_target_array, command_value, 1, false, frameLocation);
}

//initialize background recorder
console.log('~~~~~~~~~~~~~~~~~~~~~~~');
recorder = new BackgroundRecorder();
console.log('~~~~~~~~~~~~~~~~~~~~~~~');
recorder.attach();

//loop all existing tab to send attachRecorder info
