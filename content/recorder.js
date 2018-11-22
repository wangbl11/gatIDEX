/*
 * Copyright 2017 SideeX committers
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

class Recorder {

  constructor(window) {
    this.window = window;
    this.recordingIdx = -1;
    this.attached = false;
    this.locatorBuilders = new LocatorBuilders(window);
    this.frameLocation = this.getFrameLocation();

    try {
      if (window != window.top && window.frameElement) {
        this.locators = this.getFrameLocation1();
        console.log(JSON.stringify(this.locators));
      }
    } catch (e) {
      console.log(e);
    }
    //write window[frame] info when record the first step on it.
    //if (window == window.top)
    //  this.getWindowIdxInScript(0);
  }

  buildFrameLocators(){
    let _json=this.getFrameLocation1();
    let locators= _json && _json.length > 0?_json[0]:[]
    return locators;
  }
  getWindowIdxInScript(mode,json){
    var sending = browser.runtime.sendMessage({
      "command": "gatWindow",
      "topUrl":window.top.location.href,
      "type": window == window.top ? "top" : "frame",
      "frameLocation": this.frameLocation,
      "locators": this.locators?this.locators:[]
    });

    //frames has its own frames node

    var that = this;
    sending.then(
      function(message) {
        that.recordingIdx = message.response;
        //console.log('------->' + that.recordingIdx)

        if (mode==1){
          json['windowIdx']=that.recordingIdx;
          browser.runtime.sendMessage(json).catch(function(reason) {
            // If receiving end does not exist, detach the recorder
            that.detach();
          });
        }
      },
      function(error) {
        console.log(`Error: ${error}`);
      }
    );
  }

  // This part of code is copyright by Software Freedom Conservancy(SFC)
  parseEventKey(eventKey) {
    if (eventKey.match(/^C_/)) {
      return {
        eventName: eventKey.substring(2),
        capture: true
      };
    } else {
      return {
        eventName: eventKey,
        capture: false
      };
    }
  }

  // This part of code is copyright by Software Freedom Conservancy(SFC)
  attach() {
    console.log(this.attached);
    if (this.attached) {
      return;
    }
    this.attached = true;
    this.eventListeners = {};
    var self = this;
    for (let eventKey in Recorder.eventHandlers) {
      var eventInfo = this.parseEventKey(eventKey);
      var eventName = eventInfo.eventName;
      var capture = eventInfo.capture;
      // create new function so that the variables have new scope.
      function register() {
        var handlers = Recorder.eventHandlers[eventKey];
        var listener = function(event) {
          for (var i = 0; i < handlers.length; i++) {
            handlers[i].call(self, event);
          }
        }
        this.window.document.addEventListener(eventName, listener, capture);
        this.window.onpopstate = function(event) {
            //when user click goback
            console.log('onpopstate~~~~~~~user click goback~~~~~~~~~~~');
        };
        this.eventListeners[eventKey] = listener;
      }
      register.call(this);
    }
  }

  // This part of code is copyright by Software Freedom Conservancy(SFC)
  detach() {
    if (!this.attached) {
      return;
    }
    this.attached = false;
    for (let eventKey in this.eventListeners) {
      var eventInfo = this.parseEventKey(eventKey);
      var eventName = eventInfo.eventName;
      var capture = eventInfo.capture;
      this.window.document.removeEventListener(eventName, this.eventListeners[eventKey], capture);
    }
    delete this.eventListeners;
  }

  getFrameLocation() {
    let currentWindow = window;
    let currentParentWindow;
    let frameLocation = ""
    while (currentWindow !== window.top) {
      currentParentWindow = currentWindow.parent;
      for (let idx = 0; idx < currentParentWindow.frames.length; idx++)
        if (currentParentWindow.frames[idx] === currentWindow) {
          frameLocation = ":" + idx + frameLocation;
          currentWindow = currentParentWindow;
          break;
        }
    }
    //return frameLocation = "0" + frameLocation;
    return frameLocation.length == 0 ? frameLocation : frameLocation.substring(1);
  }

  getFrameLocation1() {
    let currentWindow = window;
    let currentParentWindow;
    let frameLocation = ""
    let _frames=[];
    while (currentWindow !== window.top) {
      let currentNode=currentWindow.frameElement;
      let currentNodeName=currentNode.nodeName?currentNode.nodeName.toLowerCase():"*";
      currentParentWindow = currentWindow.parent;
      for (let idx = 0; idx < currentParentWindow.frames.length; idx++)
        if (currentParentWindow.frames[idx] === currentWindow) {
          frameLocation = "/"+currentNodeName+"[" + (idx+1) +"]"+ frameLocation;
          
          /////loop to its ancestor//////////////////////////////////
          this.locatorBuilders.window=currentParentWindow;
          this.locatorBuilders.doc=currentParentWindow.document;
          let _ret=this.locatorBuilders.buildAll(currentWindow.frameElement);
          if (_frames.length==0)
             _frames.push(_ret&&_ret.length>0?_ret[0]:[]);
          else
             _frames.unshift(_ret&&_ret.length>0?_ret[0]:[]);
          /////////////////////////////////////////

          currentWindow = currentParentWindow;
          break;
        }
    }
    this.locatorBuilders.reset(this.window);
    return _frames;
    //return frameLocation.length == 0 ? frameLocation : "/"+frameLocation;
  }

  getFrameLocations() {
    let currentWindow = window;
    let currentParentWindow;
    let frameLocation = "";
    let father = {};
    let _lastone;
    while (currentWindow !== window.top) {
      let children = [];
      if (father.name) {
        _lastone = father;
        father = {};
      }
      currentParentWindow = currentWindow.parent;
      for (let idx = 0; idx < currentParentWindow.frames.length; idx++) {
        let _frame = currentParentWindow.frames[idx];

        if (_lastone && _frame === currentWindow) {
          children.push(_lastone)
        } else {
          children.push({
            "name": _frame.name,
            "locators": []
          });
        }
      }
      father["name"] = currentParentWindow.name,
        father["frames"] = children;
    }

    return father.name ? [father] : [];
  }

  record(command, target, value,evtType, insertBeforeLastCommand, actualFrameLocation) {
    let self = this;
    var _json={
      command: command,
      target: target,
      value: value,
      insertBeforeLastCommand: (insertBeforeLastCommand!=undefined)?insertBeforeLastCommand:false,
      frameLocation: (actualFrameLocation != undefined) ? actualFrameLocation : this.frameLocation,
      winInfo: {
          type: (this.window == this.window.top)? "top" : "frame",
          title: this.window.document.title,
          "locators": []
      },
      evtType:(evtType==undefined)?'':evtType
    };
    if (this.window != this.window.top){
        _json['winInfo']['frameLocators']=this.locators?this.locators:[];
    }
    browser.runtime.sendMessage(_json).catch(function(reason) {
        // If receiving end does not exist, detach the recorder
        self.detach();
    });
  }
}

Recorder.eventHandlers = {};
Recorder.addEventHandler = function(handlerName, eventName, handler, options) {
  handler.handlerName = handlerName;
  if (!options) options = false;
  let key = options ? ('C_' + eventName) : eventName;
  if (!this.eventHandlers[key]) {
    this.eventHandlers[key] = [];
  }
  this.eventHandlers[key].push(handler);
}

// TODO: move to appropriate file
// show element
function startShowElement(message, sender, sendResponse) {
  if (message.showElement) {
    result = selenium["doShowElement"](message.targetValue);
    return Promise.resolve({
      result: result
    });
  }
}
//browser.runtime.onMessage.addListener(startShowElement);
