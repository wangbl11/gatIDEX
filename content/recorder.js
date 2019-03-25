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
    console.log("%%%%%%%%%recorder.js%%%%%%%%%%%%%");
    this.window = window;
    this.recordingIdx = -1;
    this.attached = false;
    this.locatorBuilders = new LocatorBuilders(window);

    this.lastSlideValue = [0, 0];
    try {
      console.log(window != window.top);
      if (window != window.top) {
        if (window.frameElement) {
          let _temp = this.getFrameLocationSameOrigin();
          console.log(JSON.stringify(_temp));
          this.locators = _temp && _temp.length > 0 ? _temp[0] : [];
          this.positions = _temp && _temp.length > 1 ? _temp[1] : [];
        } else {
          //not same origin
          let _temp = this.getFrameLocationCrossOrigin();
          this.locators = _temp;
          //console.log(JSON.stringify(_temp));
        }
      }
    } catch (e) {
      console.log(e.message);
    }
    console.log("finish construct Recorder....");
    //browser.runtime.onMessage.addListener(startShowElement);
    console.log("~~~~~~~~called when every page load");
    browser.runtime
      .sendMessage({
        attachRecorderRequest: true
      })
      .catch(function(reason) {
        // Failed silently if receiveing end does not exist
        console.log(reason.message);
      });
    //console.log('~~~~~~~~called when every page load');
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
    try {
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
          };
          this.window.document.addEventListener(eventName, listener, capture);
          this.window.onpopstate = function(event) {
            //when user click goback
            console.log("onpopstate~~~~~~~user click goback~~~~~~~~~~~");
          };
          this.eventListeners[eventKey] = listener;
        }
        register.call(this);
      }
    } catch (e) {
      console.log(e.message);
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
      this.window.document.removeEventListener(
        eventName,
        this.eventListeners[eventKey],
        capture
      );
    }
    delete this.eventListeners;
  }

  getFrameLocationCrossOrigin() {
    let currentWindow = window;
    let currentParentWindow;
    let frameLocation = "";
    let _ret = [];
    while (currentWindow !== window.top) {
      console.log(JSON.stringify(currentWindow.location));
      currentParentWindow = currentWindow.parent;
      //console.log(JSON.stringify(currentParentWindow.frames.length));
      for (let idx = 0; idx < currentParentWindow.frames.length; idx++)
        if (currentParentWindow.frames[idx] === currentWindow) {
          let _idx = idx + 1;
          frameLocation = ":" + _idx + frameLocation;
          let _found = true;
          //   let _found = currentParentWindow.document.querySelector(
          //     "iframe:nth-child(" + _idx + ")"
          //   );

          let _finder =
            "(//*[local-name()='iframe' or local-name()='frame'])[" +
            _idx +
            "]";

          _ret.push({
            locators: [
              {
                finder: "xpath",
                values: [_finder]
              }
            ]
          });
          break;
        }
      currentWindow = currentParentWindow;
    }

    return _ret;
  }

  getCrossDomainFrames(locs) {
    let _ret = [];
    if (!(locs && locs.length > 0)) return _ret;

    let ss = locs.split(":");
    for (let i = ss.length - 1; i >= 0; i--) {
      let _one = {};
      _ret.push(_one);
    }
    return _ret;
  }

  getFrameLocationSameOrigin() {
    console.log("get frame information");
    let currentWindow = window;
    let currentParentWindow;
    let frameLocation = "";
    let _frames = [];
    let _positions = [];
    while (currentWindow !== window.top) {
      let currentNode = currentWindow.frameElement;
      //null if the element is either top-level or is embedded into a document with a different script origin; that is, in cross-origin situations.
      if (currentNode == null) break;
      let currentNodeName = currentNode.nodeName
        ? currentNode.nodeName.toLowerCase()
        : "*";
      currentParentWindow = currentWindow.parent;
      for (let idx = 0; idx < currentParentWindow.frames.length; idx++)
        if (currentParentWindow.frames[idx] === currentWindow) {
          frameLocation =
            "/" + currentNodeName + "[" + (idx + 1) + "]" + frameLocation;

          /////loop to its ancestor//////////////////////////////////
          this.locatorBuilders.window = currentParentWindow;
          this.locatorBuilders.doc = currentParentWindow.document;
          let _ret = this.locatorBuilders.buildAll(currentWindow.frameElement);
          let _frame = {
            locators: []
          };
          if (_ret && _ret.length > 0) {
            _frame["locators"] = _ret[0];
          }
          if (_frames.length == 0) {
            _frames.push(_frame);
            _positions.push(_ret && _ret.length > 1 ? _ret[1] : {});
          } else {
            _frames.unshift(_frame);
            _positions.unshift(_ret && _ret.length > 1 ? _ret[1] : {});
          }
          /////////////////////////////////////////

          currentWindow = currentParentWindow;
          break;
        }
    }
    this.locatorBuilders.reset(this.window);
    return [_frames, _positions];
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
          children.push(_lastone);
        } else {
          children.push({
            name: _frame.name
          });
        }
      }
      (father["name"] = currentParentWindow.name),
        (father["frames"] = children);
    }

    return father.name ? [father] : [];
  }

  getWinInfo() {
    let _json = {
      type: this.window == this.window.top ? "top" : "frame",
      title: this.window.document.title
    };
    if (this.window != this.window.top) {
      _json["frameLocators"] = this.locators ? this.locators : [];
      _json["framePositions"] = this.positions ? this.positions : [];
      console.log(JSON.stringify(_json["framePositions"]));
    }
    return _json;
  }
  record(
    command,
    target,
    value,
    evtType,
    insertBeforeLastCommand,
    actualFrameLocation
  ) {
    let self = this;
    let _value;
    if (Array.isArray(value) && value.length > 0) _value = value;
    else {
      _value = {
        value: value
      };
    }
    //console.log(JSON.stringify(_value));
    if (this.clickTextable) {
      console.log("~~~~~~~ record ~~~~~~~ ");
      let _locators = this.locatorBuilders.buildAll(this.clickTextable);
      delete this.clickTextable;
      this.record("clickAt", _locators, "0,0", "click");
    }

    var _json = {
      command: command,
      target: target,
      value: _value,
      insertBeforeLastCommand:
        insertBeforeLastCommand != undefined ? insertBeforeLastCommand : false,
      winInfo: {
        type: this.window == this.window.top ? "top" : "frame",
        title: this.window.document.title
      },
      evtType: evtType == undefined ? "" : evtType
    };
    if (this.window != this.window.top) {
      _json["winInfo"]["frameLocators"] = this.locators ? this.locators : [];
      _json["winInfo"]["framePositions"] = this.positions ? this.positions : [];
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
  let key = options ? "C_" + eventName : eventName;
  if (!this.eventHandlers[key]) {
    this.eventHandlers[key] = [];
  }
  this.eventHandlers[key].push(handler);
};

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
