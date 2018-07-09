/*
 * Copyright 2018 Oracle GAT committers
 *
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

var isRecording = true;
var recordingArray=[];
function getSelectedCase(){
  var _json={
    "id":"111",
    "name":"NewScript"
  }
  return _json;
}

function getSelectedSuite() {
    var _json={

    }
    return _json;
}

function getRecordsArray() {
    return recordingArray;
}

/*Read data from storage */
function getStorage(){
  var gettingAllStorageItems = browser.storage.local.get();
  gettingAllStorageItems.then((results) => {
      gat_runner_vncport=results["gat.runner.vncport"];
      gat_runner_url=results["gat.runner.url"];
      gat_runner_datafile=results["gat.runner.datafile"];
      gat_runner_sSocketid=results["gat.runner.sSocketid"];
      console.log(results);
  }, onError);
};
function setStorage(key,val){
  if (key==1)
    browser.storage.local.set({"steps":val});
}
function costume(){
   let _cloth="";
   return _cloth;
}
function addCommand(command_name, command_target_array, command_value, auto, insertCommand) {
    // create default test suite and case if necessary
    var s_suite = getSelectedSuite(),
        s_case = getSelectedCase();


   recordingArray.push({
      "command":command_name,
      "target": command_target_array,
      "value":command_value
   });
   let _json=JSON.stringify(recordingArray);
   console.log(_json);
   setStorage(1,_json);
}

// add command automatically (append upward)
function addCommandAuto(command_name, command_target_array, command_value) {
    addCommand(command_name, command_target_array, command_value, 1, false);
}

//initialize background recorder
console.log('~~~~~~~~~~~~~~~~~~~~~~~');
recorder=new BackgroundRecorder();
console.log('~~~~~~~~~~~~~~~~~~~~~~~');
recorder.attach();

//loop all existing tab to send attachRecorder info
