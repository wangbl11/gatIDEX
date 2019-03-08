/*
 * Copyright 2017 SideeX committers
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var typeTarget;

//????
var typeLock = 0;

Recorder.inputTypes = [
  "text",
  "password",
  "file",
  "datetime",
  "datetime-local",
  "date",
  "month",
  "time",
  "week",
  "number",
  "range",
  "email",
  "url",
  "search",
  "tel",
  "color"
];
Recorder.addEventHandler("type", "change", function(event) {
  // © Chen-Chieh Ping, SideeX Team
  console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ change");
  let target = event.target;
  if (target.tagName && !preventType && typeLock == 0 && (typeLock = 1)) {
    // END
    var tagName = target.tagName.toLowerCase();
    var type = target.type;
    let _evtType = "change";
    console.log(tagName);
    if ("input" == tagName && Recorder.inputTypes.indexOf(type) >= 0) {
      if (target.value.length > 0) {
        if (inputInExpand(target)) _evtType = "select";
        this.record(
          "type",
          this.locatorBuilders.buildAll(target),
          target.value,
          _evtType
        );

        // © Chen-Chieh Ping, SideeX Team
        // user press enter key
        if (enterTarget != null) {
          // var tempTarget = target.parentElement;
          // var formChk = tempTarget.tagName.toLowerCase();
          // while (formChk != 'form' && formChk != 'body') {
          //     tempTarget = tempTarget.parentElement;
          //     formChk = tempTarget.tagName.toLowerCase();
          // }
          // //GAT-5264
          // if (formChk == 'form' && (!tempTarget.hasAttribute("onsubmit"))) {
          //     this.record("submit", this.locatorBuilders.buildAll(tempTarget), "",_evtType);
          // } else
          this.record(
            "sendKeys",
            this.locatorBuilders.buildAll(enterTarget),
            "${KEY_ENTER}",
            _evtType
          );
          enterTarget = null;
        }
        // END
      } else {
        this.record(
          "type",
          this.locatorBuilders.buildAll(target),
          event.target.value,
          _evtType
        );
      }
    } else if ("textarea" == tagName) {
      let _codeMirror = target.closest(".CodeMirror");
      if (_codeMirror) {
        //_locators is an array, every element is a json
        let _locators = this.locatorBuilders.buildAll(_codeMirror);
        //console.log(JSON.stringify(_locators));
        if (_locators && _locators.length > 0) {
          //_locators[0] is the fist json, {'finder':'xpath','values':['','']}
          let _slocator = _locators[0];
          if (_slocator && _slocator instanceof Array && _slocator.length > 0) {
            let _locator = _slocator[0].values;
            if (_locator && _locator instanceof Array && _locator.length > 0) {
              // var _script="tags = document.evaluate(\""
              //   +_locator[0]
              //   +"\", document, null, XPathResult.ANY_TYPE, null); tag = tags.iterateNext();if (tag){tag.CodeMirror.setValue(\""+event.target.value+"\");}";
              // this cause auto-connect?
              this.record(
                "typeInCodeMirror",
                _locators,
                target.value,
                _evtType
              );
            }
          }
        }
      } else
        this.record(
          "type",
          this.locatorBuilders.buildAll(target),
          target.value,
          _evtType
        );
    }
  }
  typeLock = 0;
});

Recorder.addEventHandler("type", "input", function(event) {
  //console.log(event.target);
  typeTarget = event.target;
});

//rich editor??
/*
Recorder.addEventHandler('type1', 'input', function(event) {
	 var target=event.target;
	 var tagName = target.tagName?target.tagName.toLowerCase():'';
     var type = target.type;
     if (target.hasAttribute("contenteditable")&&target.getAttribute("contenteditable")=="true")
     {
        console.log(event.target.value);   
        this.record("type1", this.locatorBuilders.buildAll(event.target), event.target.value,'input');
     }
});
*/
//frame?? -- todo
Recorder.addEventHandler("type2", "keyup", function(event) {
  //this.clearPauseCommand();
  var tagName = event.target.tagName.toLowerCase();
  var type = event.target.type;
  if ("input" == tagName || "textarea" == tagName) {
    return;
  }
  if (tagName == "body") {
    var isInIframe =
      this.window.frameElement && this.window.frameElement.nodeName == "IFRAME";
    if (isInIframe) {
      //there is no setWindwo anymore,so here how to make it available for //html/body in a frame
      //this.record("type2", '//html/body', '','keyup');
      this.record(
        "type2",
        this.locatorBuilders.buildAll(event.target),
        null,
        "keyup"
      );
    }
  }
});

// © Jie-Lin You, SideeX Team

Recorder.prototype.callIfMeaningfulEvent = function(handler) {
  console.log("callIfMeaningfulEvent");
  this.delayedRecorder = handler;
  var self = this;
  this.domModifiedTimeout = setTimeout(function() {
    consoleo.log("clear event");
    self.delayedRecorder = null;
    self.domModifiedTimeout = null;
  }, 50); //move it back to 50 to avoid many noise, eg: 3934, keep track with it if cause other issue
};

Recorder.prototype.domModified = function() {
  if (this.delayedRecorder) {
    this.delayedRecorder.apply(this);
    this.delayedRecorder = null;
    if (this.domModifiedTimeout) {
      clearTimeout(this.domModifiedTimeout);
    }
  }
};
// Recorder.addEventHandler('attrModified', 'DOMAttrModified', function(event) {
//     this.domModified();
// }, {capture: true});

Recorder.addEventHandler(
  "nodeInserted",
  "DOMNodeInserted",
  function(event) {
    this.domModified();
  },
  { capture: true }
);

// prevent record two clicks
var preventClickTwice = false;
// event.isTrusted - whether it's user click or application logic click
Recorder.addEventHandler(
  "clickAt",
  "click",
  function(event) {
    console.log("click~~~~~~~~~~~");
    if (event.button == 0 && !preventClick && canTrusted(event)) {
      var _target = event.target;
      var tagName = _target.tagName.toLowerCase();
      if (tagName == "div" && _target.scrollWidth > _target.clientWidth) return;

      if (!preventClickTwice) {
        var clickable = this.findClickableElement(_target);
        if (!clickable) {
          this.clickLocator = true;
          // this.callIfMeaningfulEvent(function() {
          //     this.record("clickAt", this.locatorBuilders.buildAll(_target), "0,0", 'click');
          // });
          return;
        }
        // Special case of clicking element within <a>
        _target = this.lookupClickableAncestor(_target, clickable);
        var top = event.pageY,
          left = event.pageX;
        let _off;
        if (event.nodeName && event.nodeName.toLowerCase() == "polygon") {
          top = 0;
          left = 0;
          _off = "0,0";
        } else {
          _off = offsetXY(event);
        }
        //var target = event.target;
        console.log("click at~~~~~~~~~~~ ");
        console.log(_off);
        this.clickLocator = true;
        this.record(
          "clickAt",
          this.locatorBuilders.buildAll(_target),
          _off,
          "click"
        );
        //var arrayTest = this.locatorBuilders.buildAll(_target);
        preventClickTwice = true;
      }
      //30 millisecond will clear preventClickTwice
      setTimeout(function() {
        preventClickTwice = false;
      }, 30);
    }
  },
  true
);
// END

// © Chen-Chieh Ping, SideeX Team
// Recorder.addEventHandler('doubleClickAt', 'dblclick', function(event) {
//     let _off=offsetXY(event);
//     this.record("doubleClickAt", this.locatorBuilders.buildAll(event.target), _off,'dblclick');
// }, true);
// END

// © Chen-Chieh Ping, SideeX Team
var focusTarget = null;
var focusValue = null;
var tempValue = null;
var preventType = false;
var inp = document.getElementsByTagName("input");
for (var i = 0; i < inp.length; i++) {
  if (Recorder.inputTypes.indexOf(inp[i].type) >= 0) {
    inp[i].addEventListener("focus", function(event) {
      focusTarget = event.target;
      focusValue = focusTarget.value;
      tempValue = focusValue;
      preventType = false;
    });
    inp[i].addEventListener("blur", function(event) {
      focusTarget = null;
      focusValue = null;
      tempValue = null;
    });
  }
}
// END

// © Chen-Chieh Ping, SideeX Team
var preventClick = false;
var enterTarget = null;
var enterValue = null;
var tabCheck = null;
Recorder.addEventHandler(
  "sendKeys",
  "keydown",
  function(event) {
    if (event.target.tagName) {
      var key = event.keyCode;
      var tagName = event.target.tagName.toLowerCase();
      var type = event.target.type;
      //only for input field(s)
      if (tagName == "input" && Recorder.inputTypes.indexOf(type) >= 0) {
        //enter key
        if (key == 13) {
          enterTarget = event.target;
          enterValue = enterTarget.value;
          var tempTarget = event.target.parentElement;
          var formChk = tempTarget.tagName.toLowerCase();
          //console.log(tempValue + " " + enterTarget.value + " " + tabCheck + " " + enterTarget + " " + focusValue);
          // console.log(focusValue);
          // console.log(enterTarget.value);
          if (tempValue == enterTarget.value && tabCheck == enterTarget) {
            this.record(
              "sendKeys",
              this.locatorBuilders.buildAll(enterTarget),
              "${KEY_ENTER}",
              "keydown"
            );
            enterTarget = null;
            preventType = true;
          } else if (focusValue == enterTarget.value) {
            // while (formChk != 'form' && formChk != 'body') {
            //     tempTarget = tempTarget.parentElement;
            //     formChk = tempTarget.tagName.toLowerCase();
            // }
            // //GAT-5264
            // if (formChk == 'form' && (!tempTarget.hasAttribute("onsubmit"))) {
            //     this.record("submit", this.locatorBuilders.buildAll(tempTarget), "",'keydown');
            // } else
            this.record(
              "sendKeys",
              this.locatorBuilders.buildAll(enterTarget),
              "${KEY_ENTER}",
              "keydown"
            );
            enterTarget = null;
          }
          if (typeTarget.tagName && !preventType && (typeLock = 1)) {
            // END
            var tagName = typeTarget.tagName.toLowerCase();
            var type = typeTarget.type;
            if ("input" == tagName && Recorder.inputTypes.indexOf(type) >= 0) {
              if (typeTarget.value.length > 0) {
                this.record(
                  "type",
                  this.locatorBuilders.buildAll(typeTarget),
                  typeTarget.value
                );

                // © Chen-Chieh Ping, SideeX Team
                if (enterTarget != null) {
                  // var tempTarget = typeTarget.parentElement;
                  // var formChk = tempTarget.tagName.toLowerCase();
                  // while (formChk != 'form' && formChk != 'body') {
                  //     tempTarget = tempTarget.parentElement;
                  //     formChk = tempTarget.tagName.toLowerCase();
                  // }
                  // //GAT-5264
                  // if (formChk == 'form' && (!tempTarget.hasAttribute("onsubmit"))) {
                  //     // if (tempTarget.hasAttribute("id"))
                  //     //     this.record("submit", [
                  //     //         ["id=" + tempTarget.id, "id"]
                  //     //     ], "");
                  //     // else if (tempTarget.hasAttribute("name"))
                  //     //     this.record("submit", [
                  //     //         ["name=" + tempTarget.name, "name"]
                  //     //     ], "");
                  //     this.record("submit", this.locatorBuilders.buildAll(tempTarget), "",'keydown');
                  // } else
                  this.record(
                    "sendKeys",
                    this.locatorBuilders.buildAll(enterTarget),
                    "${KEY_ENTER}",
                    "keydown"
                  );
                  enterTarget = null;
                }
                // END
              } else {
                this.record(
                  "type",
                  this.locatorBuilders.buildAll(typeTarget),
                  typeTarget.value
                );
              }
            } else if ("textarea" == tagName) {
              this.record(
                "type",
                this.locatorBuilders.buildAll(typeTarget),
                typeTarget.value
              );
            }
          }
          preventClick = true;
          setTimeout(function() {
            preventClick = false;
          }, 500);
          setTimeout(function() {
            if (enterValue != event.target.value) enterTarget = null;
          }, 50);
        }

        //down and up key
        var tempbool = false;
        if ((key == 38 || key == 40) && event.target.value != "") {
          if (focusTarget != null && focusTarget.value != tempValue) {
            tempbool = true;
            tempValue = focusTarget.value;
          }
          if (tempbool) {
            this.record(
              "type",
              this.locatorBuilders.buildAll(event.target),
              tempValue
            );
          }

          setTimeout(function() {
            tempValue = focusTarget.value;
          }, 250);

          if (key == 38)
            this.record(
              "sendKeys",
              this.locatorBuilders.buildAll(event.target),
              "${KEY_UP}"
            );
          else
            this.record(
              "sendKeys",
              this.locatorBuilders.buildAll(event.target),
              "${KEY_DOWN}"
            );
          tabCheck = event.target;
        }
        //tab key
        if (key == 9) {
          if (tabCheck == event.target) {
            this.record(
              "sendKeys",
              this.locatorBuilders.buildAll(event.target),
              "${KEY_TAB}"
            );
            preventType = true;
          }
        }
      }
    }
  },
  true
);
// END

// © Shuo-Heng Shih, SideeX Team
Recorder.addEventHandler(
  "dragAndDrop",
  "mousedown",
  function(event) {
    var self = this;
    if (
      event.clientX < window.document.documentElement.clientWidth &&
      event.clientY < window.document.documentElement.clientHeight
    ) {
      this.mousedown = event;
      this.mouseup = setTimeout(
        function() {
          delete self.mousedown;
        }.bind(this),
        200
      ); //如果200毫秒就抬起来，说明不是拖动

      this.selectMouseup = setTimeout(
        function() {
          self.selectMousedown = event;
        }.bind(this),
        200
      );
    }
    this.mouseoverQ = [];

    let target = event.target;
    if (target.nodeName) {
      let tagName = target.nodeName.toLowerCase();
      if (tagName == "span" && target.getAttribute("role") == "slider") {
        this.lastSlideValue[0] = event.clientX;
        this.lastSlideValue[1] = event.clientY;
        return;
      }

      const _draggable = target.closest("draggable");
      if (_draggable) {
        console.log(">>> have draggable");
        this._lastDrag = this.locatorBuilders.buildAll(target);
        return;
      }

      if ("option" == tagName) {
        var parent = event.target.parentNode;
        if (parent.multiple) {
          var options = parent.options;
          for (var i = 0; i < options.length; i++) {
            options[i]._wasSelected = options[i].selected;
          }
        }
      }
    }
  },
  true
);
// END

// © Shuo-Heng Shih, SideeX Team
Recorder.addEventHandler(
  "dragAndDrop",
  "mouseup",
  function(event) {
    clearTimeout(this.selectMouseup);
    // let clickable = this.findClickableElement(event.target);
    // if (!clickable) return;

    if (this.selectMousedown) {
      console.log("1");
      var x = event.clientX - this.selectMousedown.clientX;
      var y = event.clientY - this.selectMousedown.clientY;

      function getSelectionText() {
        var text = "";
        var activeEl = window.document.activeElement;
        var activeElTagName = activeEl ? activeEl.tagName.toLowerCase() : null;
        if (activeElTagName == "textarea" || activeElTagName == "input") {
          text = activeEl.value.slice(
            activeEl.selectionStart,
            activeEl.selectionEnd
          );
        } else if (window.getSelection) {
          text = window.getSelection().toString();
        }
        return text.trim();
      }

      //oj-slider
      let e = event.target;
      if (
        e.hasAttribute &&
        e.hasAttribute("class") &&
        e.getAttribute("class").indexOf("oj-slider") >= 0
      ) {
        var _container = e.closest(".oj-slider-container");
        if (_container) {
          var _thumb = _container.querySelector(".oj-slider-thumb");
          if (_thumb) {
            if (Math.abs(this.lastSlideValue[1] - event.clientY) < 5)
              this.record(
                "dragAndDrop",
                this.locatorBuilders.buildAll(_thumb),
                event.clientX - this.lastSlideValue[0] + ",0",
                "slider"
              );
            else
              this.record(
                "dragAndDrop",
                this.locatorBuilders.buildAll(_thumb),
                0 + "," + (event.clientY - this.lastSlideValue[1]),
                "slider"
              );
          }
        }
        delete this.mousedown;
        delete this.selectMousedown;
        delete this.mouseoverQ;
        return;
      }

      const _droppable = e.closest("droppable");
      if (_droppable && this._lastDrag) {
        console.log(">>> have droppable");
        this.record(
          "dragAndDrop",
          this._lastDrag,
          this.locatorBuilders.buildAll(e),
          "dragAndDropObject"
        );
        delete this._lastDrag;
        this._lastDrag = null;
      } else
        console.log(
          this.mouseoverQ ? "over: " + this.mouseoverQ.length : "undefined"
        );
      /* disable for drag/drop mouse wheel; it only check offset of mousedown and mouseup
        // it does not check whether the target itself offset change
        if (this.selectMousedown && event.button === 0 && (x + y) && (event.clientX < window.document.documentElement.clientWidth && event.clientY < window.document.documentElement.clientHeight) && getSelectionText() === '') {
            var sourceRelateX = this.selectMousedown.pageX - this.selectMousedown.target.getBoundingClientRect().left - window.scrollX;
            var sourceRelateY = this.selectMousedown.pageY - this.selectMousedown.target.getBoundingClientRect().top - window.scrollY;
            var targetRelateX, targetRelateY;
            if (!!this.mouseoverQ.length && this.mouseoverQ.length > 1 && this.mouseoverQ[1] && this.mouseoverQ[1].relatedTarget == this.mouseoverQ[0].target && this.mouseoverQ[0].target == event.target) {
                console.log('in which scenario~~~~~~~~~~~~~~~');
                targetRelateX = event.pageX - this.mouseoverQ[1].target.getBoundingClientRect().left - window.scrollX;
                targetRelateY = event.pageY - this.mouseoverQ[1].target.getBoundingClientRect().top - window.scrollY;
                this.record("mouseDownAt", this.locatorBuilders.buildAll(this.selectMousedown.target), sourceRelateX + ',' + sourceRelateY);
                this.record("mouseMoveAt", this.locatorBuilders.buildAll(this.mouseoverQ[1].target), targetRelateX + ',' + targetRelateY);
                this.record("mouseUpAt", this.locatorBuilders.buildAll(this.mouseoverQ[1].target), targetRelateX + ',' + targetRelateY);
            } else {
                targetRelateX = event.pageX - event.target.getBoundingClientRect().left - window.scrollX;
                targetRelateY = event.pageY - event.target.getBoundingClientRect().top - window.scrollY;
                this.record("mouseDownAt", this.locatorBuilders.buildAll(event.target), targetRelateX + ',' + targetRelateY);
                this.record("mouseMoveAt", this.locatorBuilders.buildAll(event.target), targetRelateX + ',' + targetRelateY);
                this.record("mouseUpAt", this.locatorBuilders.buildAll(event.target), targetRelateX + ',' + targetRelateY);                
            }
        }
        */
    } else {
      console.log("2");
      delete this.clickLocator;
      delete this.mouseup;
      var x = event.clientX - this.mousedown.clientX;
      var y = event.clientY - this.mousedown.clientY;
      let e = event.target;
      if (
        this.mousedown &&
        this.mousedown.target !== event.target &&
        !(x + y)
      ) {
        if (
          e.hasAttribute &&
          e.hasAttribute("class") &&
          e.getAttribute("class").indexOf("oj-slider") >= 0
        ) {
          this.record(
            "clickAt",
            this.locatorBuilders.buildAll(this.mousedown.target),
            offsetXY(this.mousedown)
          );
        } else {
          //GAT-5853:check mouse style, if pointer means clickable
          const e = this.mousedown.target;
          var _cursor = this.window
            .getComputedStyle(e, null)
            .getPropertyValue("cursor");
          console.log(_cursor);
          if (cursorClickableArray.indexOf(_cursor) >= 0) {
            this.record(
              "clickAt",
              this.locatorBuilders.buildAll(e),
              "mouseDown"
            );
          } else {
            console.log("3");
            this.record(
              "mouseDown",
              this.locatorBuilders.buildAll(this.mousedown.target),
              ""
            );
            this.record(
              "mouseUp",
              this.locatorBuilders.buildAll(event.target),
              ""
            );
          }
        }
      } else if (this.mousedown && this.mousedown.target === event.target) {
        /*
               sometimes, click eventhandler cannot capture all click action,
               so monitor mousedown/mouseup, if there is no click is captured in click eventhandler within 100 millisecond, 
               it means the click is already captured, here does not need capture. 
            */
        var self = this;
        var target = this.locatorBuilders.buildAll(this.mousedown.target);
        var _off = offsetXY(event);
        console.log("mouse-click...");
        setTimeout(
          function() {
            if (!self.clickLocator)
              self.record("clickAt", target, _off, "click");
          }.bind(this),
          100
        );
      }
    }
    delete this.mousedown;
    delete this.selectMousedown;
    delete this.mouseoverQ;
  },
  true
);
// END

// © Shuo-Heng Shih, SideeX Team
Recorder.addEventHandler(
  "dragAndDropToObject",
  "dragstart",
  function(event) {
    var self = this;
    console.log("dragstart");
    this.dropLocator = setTimeout(
      function() {
        self.dragstartLocator = event;
      }.bind(this),
      200
    );
  },
  true
);
// END

// © Shuo-Heng Shih, SideeX Team
Recorder.addEventHandler(
  "dragAndDropToObject",
  "drop",
  function(event) {
    console.log("drop");
    clearTimeout(this.dropLocator);
    if (
      this.dragstartLocator &&
      event.button == 0 &&
      this.dragstartLocator.target !== event.target
    ) {
      //value no option
      this.record(
        "dragAndDrop",
        this.locatorBuilders.buildAll(this.dragstartLocator.target),
        this.locatorBuilders.buildAll(event.target),
        "html5"
      );
    }
    delete this.dragstartLocator;
    delete this.selectMousedown;
  },
  true
);
// END

/*
//disable scroll recording temporarily
var prevTimeOut = null;
Recorder.addEventHandler('runScript', 'scroll', function(event) {
    if (pageLoaded === true) {
        var self = this;
        this.scrollDetector = event.target;
        clearTimeout(prevTimeOut);
        prevTimeOut = setTimeout(function() {
            delete self.scrollDetector;
        }.bind(self), 500);
    }
}, true);
*/

// © Shuo-Heng Shih, SideeX Team
//the first part is used for recording mouseOver, maybe performance issue
//the second part is used for recording drag/drop
var nowNode = 0;
Recorder.addEventHandler(
  "mouseOver",
  "mouseover",
  function(event) {
    // if (window.document.documentElement)
    //     nowNode = window.document.documentElement.getElementsByTagName('*').length;
    var self = this;

    if (pageLoaded === true) {
      //for Oracle FA application, it might has performance issue
      // var clickable = this.findClickableElement(event.target);
      // if (clickable) {
      //     this.nodeInsertedLocator = event.target;
      //     setTimeout(function() {
      //         delete self.nodeInsertedLocator;
      //     }.bind(self), 500);

      //     this.nodeAttrChange = this.locatorBuilders.buildAll(event.target);
      //     this.nodeAttrChangeTimeout = setTimeout(function() {
      //         delete self.nodeAttrChange;
      //     }.bind(self), 10);
      // }

      // let _newobj=false;
      // if(!self.NodeMouseOver)
      // {
      //     _newobj=true;
      //     self.nodeMouseOver=event.target;
      // }
      // else{
      //     if (self.NodeMouseOver==event.target)
      //        ;
      //     else
      //     {
      //         _newobj=true;
      //         self.nodeMouseOver=event.target;
      //     }
      // }
      // //新的mouseOver对象，先清理以前的timeour，在创建一个timer
      // if (_newobj) {
      //     if (self.lastTimeout)
      //         clearTimeout(self.lastTimeout);
      //     self.lastTimeout = setTimeout(function () {
      //         //发现lastMouseOver和mouseOver还是一样的，或者lastMouseOver为空
      //         if (self.nodeMouseOver) {
      //             console.log(self.nodeMouseOver.nodeName);
      //             self.record('mouseOver', self.locatorBuilders.buildAll(self.nodeMouseOver), null, 'mouseOver')
      //             delete self.nodeMouseOver;
      //         }
      //     }, 2000);
      // }

      //drop target overlapping
      if (this.mouseoverQ) {
        //mouse keep down
        if (this.mouseoverQ.length >= 3) this.mouseoverQ.shift();
        this.mouseoverQ.push(event);
      }
    }
  },
  true
);
// END

// © Shuo-Heng Shih, SideeX Team
Recorder.addEventHandler(
  "mouseOut",
  "mouseout",
  function(event) {
    if (
      this.mouseoutLocator !== null &&
      event.target === this.mouseoutLocator
    ) {
      this.record("mouseOut", this.locatorBuilders.buildAll(event.target), "");
    }
    delete this.mouseoutLocator;
  },
  true
);
// END

// © Shuo-Heng Shih, SideeX Team
//getElementsByTagName('*').length cause page hanging for FA, so here it should be changed.

Recorder.addEventHandler(
  "mouseOver",
  "DOMNodeInserted",
  function(event) {
    if (pageLoaded === true) {
      var self = this;
      /*
        //record window.scrollTo into script
        if (this.scrollDetector) {
            this.record("runScript", [
                [
                    ["window.scrollTo(0," + window.scrollY + ")", ]
                ]
            ], '','scroll');
            pageLoaded = false;
            setTimeout(function() {
                pageLoaded = true;
            }.bind(self), 550);
            delete this.scrollDetector;
        }
        */

      // if (this.nodeInsertedLocator) {
      //     this.record("mouseOver", this.locatorBuilders.buildAll(this.nodeInsertedLocator), '');
      //     this.mouseoutLocator = this.nodeInsertedLocator;
      //     delete this.nodeInsertedLocator;
      //     delete this.mouseoverLocator;
      // }
    }
  },
  true
);
// END

// © Shuo-Heng Shih, SideeX Team
var readyTimeOut = null;
var pageLoaded = true;
Recorder.addEventHandler(
  "checkPageLoaded",
  "readystatechange",
  function(event) {
    var self = this;
    if (window.document.readyState === "loading") {
      pageLoaded = false;
    } else {
      pageLoaded = false;
      clearTimeout(readyTimeOut);
      readyTimeOut = setTimeout(
        function() {
          pageLoaded = true;
        }.bind(self),
        1500
      ); //setReady after complete 1.5s
    }
  },
  true
);
// END

// © Ming-Hung Hsu, SideeX Team
Recorder.addEventHandler(
  "contextMenu",
  "contextmenu",
  function(event) {
    var myPort = browser.runtime.connect();
    var tmpText = this.locatorBuilders.buildAll(event.target);
    var tmpVal = getText(event.target);
    var tmpTitle = normalizeSpaces(event.target.ownerDocument.title);
    var self = this;
    myPort.onMessage.addListener(function portListener(m) {
      if (m.cmd.includes("Text")) {
        self.record(m.cmd, tmpText, tmpVal);
      } else if (m.cmd.includes("Title")) {
        self.record(m.cmd, [[tmpTitle]], "");
      } else if (m.cmd.includes("Value")) {
        self.record(m.cmd, tmpText, getInputValue(event.target));
      }
      myPort.onMessage.removeListener(portListener);
    });
  },
  true
);
// END

// © Yun-Wen Lin, SideeX Team
// https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/contenteditable
// The contenteditable is an enumerated attribute indicating if the element should be editable
// this is just one kind of richEditor
/*
<blockquote contenteditable="true">
    <p>Edit this content to add your own quote</p>
</blockquote>
*/
var getEle;
var checkFocus = 0;
Recorder.addEventHandler(
  "editContent",
  "focus",
  function(event) {
    var editable = event.target.contentEditable;
    if (editable == "true") {
      getEle = event.target;
      contentTest = getEle.innerHTML;
      checkFocus = 1;
    }
  },
  true
);
// END

// https://a9t9.com/kantu/docs/selenium-ide/editcontent
// Seems this editContent is designed for richeditor,but we are not sure whether it works.
// © Yun-Wen Lin, SideeX Team
Recorder.addEventHandler(
  "editContent",
  "blur",
  function(event) {
    if (checkFocus == 1) {
      if (event.target == getEle) {
        if (getEle.innerHTML != contentTest) {
          console.log(getEle.innerHTML);
          this.record(
            "editContent",
            this.locatorBuilders.buildAll(event.target),
            getEle.innerHTML
          );
        }
        checkFocus = 0;
      }
    }
  },
  true
);
// END

//console.log('~~~~~~~~called when every page load');
browser.runtime
  .sendMessage({
    attachRecorderRequest: true
  })
  .catch(function(reason) {
    // Failed silently if receiveing end does not exist
    console.log(reason.message);
  });
//console.log('~~~~~~~~called when every page load');

// Copyright 2005 Shinya Kasatani
Recorder.prototype.getOptionLocator = function(option) {
  var label = option.text.replace(/^ *(.*?) *$/, "$1");
  if (label.match(/\xA0/)) {
    // if the text contains &nbsp;
    //"label=regexp:" +
    return label
      .replace(/[\(\)\[\]\\\^\$\*\+\?\.\|\{\}]/g, function(str) {
        return "\\" + str;
      })
      .replace(/\s+/g, function(str) {
        if (str.match(/\xA0/)) {
          if (str.length > 1) {
            return "\\s+";
          } else {
            return "\\s";
          }
        } else {
          return str;
        }
      });
  } else {
    //"label=" +
    return label;
  }
};

//gat-2818 (record the click on the span of ojSelect
//this method can be deprecated because it can be replaced with closet method directly
Recorder.prototype.isOjectListExpand = function(e, tagName, parentNode) {
  if (tagName == "span") {
    var _parentNode = e.parentNode;
    if (_parentNode) {
      if (!_parentNode.tagName) return null;
      var tagName = _parentNode.tagName.toLowerCase();
      if (
        _parentNode.hasAttribute("role") &&
        _parentNode.getAttribute("role") == "combobox"
      )
        return e;
    }
  } else {
    if (
      tagName == "div" &&
      e.hasAttribute("role") &&
      e.getAttribute("role") == "combobox"
    )
      return e;
  }
  return null;
};

Recorder.prototype.findClickableElement = function(e) {
  if (!e.tagName) return null;
  var tagName = e.tagName.toLowerCase();
  var type = e.type;
  var _cursor = this.window
    .getComputedStyle(e, null)
    .getPropertyValue("cursor");
  if (
    e.hasAttribute("onclick") ||
    e.hasAttribute("on-click") ||
    e.hasAttribute("href") ||
    clickableTag.indexOf(tagName) >= 0 ||
    cursorClickableArray.indexOf(_cursor) >= 0 ||
    (tagName == "input" && e && typeClickableArray.indexOf(type) >= 0) ||
    (e.hasAttribute("data-bind") &&
      e.getAttribute("data-bind").indexOf("click") >= 0)
  ) {
    console.log("clickable", tagName);
    return e;
  }
  //gat3895
  if (svgArray.includes(tagName)) {
    console.log("svg.....");
    return e;
  }

  //in table
  var td = e.closest("td");
  if (td && td.childNodes.length == 1) {
    //still check whether span is the unique child of the td (4795,3167)
    return td;
  } else {
    //gat-4195
    return e;
  }
  //find upstream abstract component
  for (let m = 0; m < expandableArray.length; m++) {
    let _switch = e.closest(expandableArray[m]);
    if (_switch) return e;
  }

  if (e.parentNode != null) {
    return this.findClickableElement(e.parentNode);
  } else {
    return null;
  }
};

Recorder.prototype.lookupClickableAncestor = function(target, clickable) {
  if (clickable.localName == "a") return clickable;
  console.log("[DEBUG] isSVG:", this.locatorBuilders.isSVG(target));
  if (this.locatorBuilders.isSVG(target)) {
    let svg = this.locatorBuilders.getAncestorByTag(target, "svg");
    let rect = svg.getBoundingClientRect();
    console.log(svg, rect);
    if (
      !(
        (rect.width <= 48 && rect.height <= 48) ||
        (rect.width == 58 && rect.height == 58)
      )
    )
      return target;
  }
  let anchor = this.locatorBuilders.getAncestorByTag(target, "a");
  if (anchor) return anchor;
  return target;
};

//select / addSelect / removeSelect
//this method is for <select> to initialize, in Selenium IDE it's disposed in 'mousedown' event
Recorder.addEventHandler(
  "select",
  "focus",
  function(event) {
    if (event.target.nodeName) {
      var tagName = event.target.nodeName.toLowerCase();
      if ("select" == tagName && event.target.multiple) {
        var options = event.target.options;
        for (var i = 0; i < options.length; i++) {
          if (options[i]._wasSelected == null) {
            // if the focus was gained by mousedown event, _wasSelected would be already set
            options[i]._wasSelected = options[i].selected;
          }
        }
      }
    }
  },
  true
);

//no change, done
Recorder.addEventHandler("select", "change", function(event) {
  if (event.target.tagName) {
    var tagName = event.target.tagName.toLowerCase();
    if ("select" == tagName) {
      if (!event.target.multiple) {
        //singular
        var option = event.target.options[event.target.selectedIndex];
        let _value = option.value;
        let _ttt = {};
        if (_value && _value.length > 0) {
          _ttt["value"] = _value;
          _ttt["strategy"] = "value";
        } else {
          let _label = this.getOptionLocator(option);
          _ttt["value"] = _label;
          _ttt["strategy"] = "text";
        }

        this.record(
          "select",
          this.locatorBuilders.buildAll(event.target),
          [_ttt],
          "select",
          false
        );
      } else {
        var options = event.target.options;
        for (var i = 0; i < options.length; i++) {
          if (options[i]._wasSelected == null) {
          }
          if (options[i]._wasSelected != options[i].selected) {
            var value = this.getOptionLocator(options[i]);
            if (options[i].selected) {
              this.record(
                "addSelection",
                this.locatorBuilders.buildAll(event.target),
                value,
                "select"
              );
            } else {
              this.record(
                "removeSelection",
                this.locatorBuilders.buildAll(event.target),
                value,
                "select"
              );
            }
            options[i]._wasSelected = options[i].selected;
          }
        }
      }
    }
  }
});
