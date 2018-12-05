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

var selenium = new Selenium(BrowserBot.createForWindow(window));
var locatorBuilders = new LocatorBuilders(window);

function doCommands(request, sender, sendResponse, type) {
    if (request.commands) {
        //console.log("indoCommands: " + request.commands);
        if (request.commands == "waitPreparation") {
            selenium["doWaitPreparation"]("", selenium.preprocessParameter(""));
            sendResponse({});
        } else if (request.commands == "prePageWait") {
            selenium["doPrePageWait"]("", selenium.preprocessParameter(""));
            sendResponse({ new_page: window.sideex_new_page });
        } else if (request.commands == "pageWait") {
            selenium["doPageWait"]("", selenium.preprocessParameter(""));
            sendResponse({ page_done: window.sideex_page_done });
        } else if (request.commands == "ajaxWait") {
            selenium["doAjaxWait"]("", selenium.preprocessParameter(""));
            sendResponse({ ajax_done: window.sideex_ajax_done });
        } else if (request.commands == "domWait") {
            selenium["doDomWait"]("", selenium.preprocessParameter(""));
            sendResponse({ dom_time: window.sideex_new_page });
        } else {
            var upperCase = request.commands.charAt(0).toUpperCase() + request.commands.slice(1);
            if (selenium["do" + upperCase] != null) {
                try {
                    document.body.setAttribute("SideeXPlayingFlag", true);
                    let returnValue = selenium["do"+upperCase](request.target,selenium.preprocessParameter(request.value));                  
                    if (returnValue instanceof Promise) {
                        // The command is a asynchronous function
                        returnValue.then(function(value) {
                            // Asynchronous command completed successfully
                            document.body.removeAttribute("SideeXPlayingFlag");
                            sendResponse({result: "success"});
                        }).catch(function(reason) {
                            // Asynchronous command failed
                            document.body.removeAttribute("SideeXPlayingFlag");
                            sendResponse({result: reason});
                        });
                    } else {
                        // Synchronous command completed successfully
                        document.body.removeAttribute("SideeXPlayingFlag");
                        sendResponse({result: "success"});
                    }
                } catch(e) {
                    // Synchronous command failed
                    document.body.removeAttribute("SideeXPlayingFlag");
                    sendResponse({result: e.message});
                }
            } else {
                sendResponse({ result: "Unknown command: " + request.commands });
            }
        }

        return true;
    }
    // TODO: refactoring
    if (request.selectMode) {
        if (request.selecting) {
            console.log('choosing...');
            let targetCmd=request['targetCmd'];
            targetSelecter = new TargetSelecter(function (element, win) {
                if (element && win) {
                    
                    var target = locatorBuilders.buildAll(element);
                    //locatorBuilders.detach();
                    if (target != null && target instanceof Array) {
                          if (target) {
                            //composite a command using targetCmd
                            let _json=compositeCommand(targetCmd, target);
                            browser.runtime.sendMessage({
                                finishSelect:true,
                                selectTarget: true,
                                step: _json
                            })
                        } else {
                            //alert("LOCATOR_DETECTION_FAILED");
                        }
                    }

                }
                //targetSelecter = null;
            });

        } else {
            if (targetSelecter) {
                locatorBuilders.detach();
                targetSelecter.cleanup();
                targetSelecter = null;
                return;
            }
        }
    }
    // TODO: code refactoring
    if (request.attachRecorder) {
        console.log('attach...');
        recorder.attach();
        return;
    } else if (request.detachRecorder) {
        recorder.detach();
        return;
    }

}
function compositeCommand(targetCmd, target) {
    let _json = {};
    _json['command'] = targetCmd;
    _json["locators"] = {
        "seleniumLocators": target && target.length > 0 ? target[0] : [],
        "genericLocator": target && target.length > 3 ? target[3] : {}
    };
    _json['coordinates'] = target && target.length > 1 ? target[2] : {};
    _json['elementAttributes'] = target && target.length > 1 ? target[1] : {};
    _json['winInfo'] = recorder.getWinInfo();
    switch (targetCmd) {
        case 'check':
        case 'javascript':
            _json["optional"]= false;
            _json["strategy"]="element";
            _json['loop']= {
                "enabled": false,
                "negate": false,
                "maxTime": 300000,
                "maxIteration": 5,
                "variable": "iter",
                "size": 1
            };
            _json["value"]= "";
            break;
        default: //all other steps
    }
    return _json;
}
browser.runtime.onMessage.addListener(doCommands);
