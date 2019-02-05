/*
 * Copyright 2005 Shinya Kasatani
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

function LocatorBuilders(window) {
  this.window = window;
  this.doc = window.document;
  //this.log = new Log("LocatorBuilders");
  if (LocatorBuilders._dynamicIDs.length==0)
  LocatorBuilders.setDynamicIDs(
  "^list_item__.+$,^.*[0-9]+$,^.*:[0-9]+:.*$,^.*[_-][0-9]+.*$,[a-zA-Z]*[0-9]+[a-zA-Z]*_,javascript",
  "^[a-zA-Z_\-]+$");
}

LocatorBuilders.prototype.reset = function(win) {
    this.window = win;
    this.doc = win.document;
    this.detach();
}
LocatorBuilders.prototype.detach = function() {
  if (this.window._locator_pageBot) {
    //this.log.debug(this.window);
    this.window._locator_pageBot = undefined;
    // Firefox 3 (beta 5) throws "Security Manager vetoed action" when we use delete operator like this:
    // delete this.window._locator_pageBot;
  }
};


LocatorBuilders.prototype.pageBot = function() {
  var pageBot = this.window._locator_pageBot;
  if (pageBot == null) {
    //pageBot = BrowserBot.createForWindow(this.window);
    pageBot = new MozillaBrowserBot(this.window);
    var self = this;
    pageBot.getCurrentWindow = function() {
      return self.window;
    };
    this.window._locator_pageBot = pageBot;
  }
  return pageBot;
};

LocatorBuilders.prototype.buildWith = function(name, e, opt_contextNode) {
  return LocatorBuilders.builderMap[name].call(this, e, opt_contextNode);
};

LocatorBuilders.prototype.elementEquals = function(name, el, locator) {
  try{
    var e = core.firefox.unwrap(el);
    var fe = this.findElement(locator);
    //TODO: add match function to the ui locator builder, note the inverted parameters
    return (e == fe) || (LocatorBuilders.builderMap[name] && LocatorBuilders.builderMap[name].match && LocatorBuilders.builderMap[name].match(e, fe));
  }catch(ex){
    return false;
  }
  return false;
};

LocatorBuilders.prototype.build = function(e) {
  var locators = this.buildAll(e);
  if (locators.length > 0) {
    return locators[0][0];
  } else {
    return "LOCATOR_DETECTION_FAILED";
  }
};
LocatorBuilders.prototype.clickLabel=function(e){
    if (e.nodeName){
           var nodeName=e.nodeName.toLowerCase();
           if (nodeName=='label'){
                  if (e.hasAttribute && e.hasAttribute("for")) { //gat-3284
               return "//label[@for='"+e.getAttribute("for")+"']";
            }
           }
    }
    return null;
 };
 LocatorBuilders.prototype.existingCategory=function(ary,finderName,category,locator){
    for (var q = 0; q < ary.length; q++) {
        let one = ary[q];
        //eg: locators which start with xpath:(xpath:img,xpath:link,etc)
        //if (finderName.startsWith(one.finder)) {
        if (category==one['finder']) {
            //check whether the locator contains dynamic id
            if (locator.search(/\[\d+\]/g)>0)
            {
                one.values.push(locator);
                return true;
            }
            if (category.startsWith('txt:')){
              one.values._main.unshift({
                //"finder": finderName,
                "finder": _category,
                "values": [locator]
              });
              return true;
            }
            one.values.push(locator);
            return true;
        }
    }
    return false;
 }
 LocatorBuilders.prototype.lastConfirm=function(e,_main,locator,coreLocatorStrategies,finderName,_category,_main1){
    if (finderName != 'tac') {
        //console.log(finderName);
        //console.log(locator);
        var fe = this.findElement(locator);
        //console.log(e == fe);
        
        if ((e == fe) || (coreLocatorStrategies[finderName] && coreLocatorStrategies[finderName].is_fuzzy_match && coreLocatorStrategies[finderName].is_fuzzy_match(fe, e))) {
          
          //remove header from locator
          switch (_category){
              case "css":
                locator=locator.replace(/css=/,'');
                break;
              case "link":
                locator=locator.replace(/link=/,'');
              case "xpath":
                locator=locator.replace(/xpath=/,'');
              default:
          }
          let _found = this.existingCategory(_main,finderName,_category,locator);
        //   if (!_found)
        //       _found = this.existingCategory(_main1,finderName,_category,locator);
          if (!_found) {
            // let _idx = finderName.indexOf(":");
            // if (_idx <= 0) _idx = finderName.length;

            //check sequence
            let _new={
                //"finder": finderName,
                "finder": _category,
                "values": [locator]
            };
            // if (finderName.indexOf(':text')<0){
            //     if (locator.search(/\[\d+\]/g)>0)
            //     {
            //       _main1.push(_new);
            //       return;
            //     }
            if (finderName.indexOf('link')>=0){
                     _main.unshift(_new);
                     return;
            }
            // }
            _main.push(_new);
          }
        }
      } else {
        _main.splice(0, 0, {
          //"finder": finderName,
          "finder": _category,
          "values": [locator]
        });
      }
}

LocatorBuilders.prototype.buildAll = function(el) {
  //var e = core.firefox.unwrap(el); //Samit: Fix: Do the magic to get it to work in Firefox 4
  var e=el;
  var xpathLevel = 0;
  var maxLevel = 10;
  var locator;
  var locators = [];
  if (!e) return locators;
  var _main = [];
  var _main1 = [];
  
  //this.log.debug("getLocator for element " + e);
  var coreLocatorStrategies = this.pageBot().locationStrategies;
  var _seq = 0;
  for (var i = 0; i < LocatorBuilders.order.length; i++) {
    var finderName = LocatorBuilders.order[i];
    //this.log.debug("trying " + finderName);
    try {
        locator = this.buildWith(finderName, e);
        // if (locator!=null&&e.nodeName&&e.nodeName.toLowerCase().indexOf('frame')>0)
        // {  
        //    console.log(finderName);
        //    console.log(locator);
        // }
        let _category=LocatorBuilders.builderCategory[finderName];
        if (locator)
            if (locator instanceof Array) {
                var len = locator.length;
                for (var j = 0; j < len; j++) {
                    var _locator = String(locator[j]);
                    this.lastConfirm(e, _main, _locator, coreLocatorStrategies, finderName,_category, _main1);
                }
            } else {
                this.lastConfirm(e, _main, String(locator), coreLocatorStrategies, finderName,_category, _main1);
            }
        
        //this.log.debug("locator=" + locator);
        // test the locator. If a is_fuzzy_match() heuristic function is
        // defined for the location strategy, use it to determine the
        // validity of the locator's results. Otherwise, maintain existing
        // behavior.
        //      try {
        //        //alert(PageBot.prototype.locateElementByUIElement);
        //        //Samit: The is_fuzzy_match stuff is buggy - comparing builder name with a locator name usually results in an exception :(
        //        var is_fuzzy_match = this.pageBot().locationStrategies[finderName].is_fuzzy_match;
        //        if (is_fuzzy_match) {
        //          if (is_fuzzy_match(this.findElement(locator), e)) {
        //            locators.push([ locator, finderName ]);
        //          }
        //        }
        //        else {
        //          if (e == this.findElement(locator)) {
        //            locators.push([ locator, finderName ]);
        //          }
        //        }
        //      }
        //      catch (exception) {
        //        if (e == this.findElement(locator)) {
        //          locators.push([ locator, finderName ]);
        //        }
        //      }

        //Samit: The following is a quickfix for above commented code to stop exceptions on almost every locator builder
        //TODO: the builderName should NOT be used as a strategy name, create a feature to allow locatorBuilders to specify this kind of behaviour
        //TODO: Useful if a builder wants to capture a different element like a parent. Use the this.elementEquals

    } catch (ex) {
      console.log('error in buildAll: '+ex.message);
    }
  }
  locators.push(_main);
 
  if (e.nodeName&&e.nodeName.toLowerCase().indexOf('frame')<0)
  {
      try {
          let _json = this.computeElementAttrs(e, el);
          locators.push(_json);
      }catch(err){
        locators.push([]);
        console.log(err.message);
      }
  }
//   else{
//     locators.push([]);
//   }
  try{
        let _coords = this.getNodeCoords(e);
        locators.push(_coords);
      }catch(err){
        locators.push({});
        console.log(err.message);
  }
  if (e.nodeName&&e.nodeName.toLowerCase().indexOf('frame')<0)
  {    
      try{
          let genericLocator = new GenericLocators().gl_genGenericLocator(e);
          locators.push(genericLocator);
      }
      catch (err) {
          //when get error push {} not []
        locators.push({});
        console.log(err.message);
      }
  }
  return locators;
};

var elementsAttrs = ["placeholder","type"];
LocatorBuilders.prototype.computeElementAttrs = function(e,el) {
  var ele=e?e:el
  var _json = {};
  if (ele.tagName)
  {  
      _json['tag'] = ele.tagName.toLowerCase();
  }
  for (let i=0;i<elementsAttrs.length;i++) {
     let one=elementsAttrs[i];
    //console.log(one + ele.getAttribute(one));
    if (ele.hasAttribute && ele.hasAttribute(one)) {
      _json[one] = ele.getAttribute(one);
    }
  }
  return _json;
}

LocatorBuilders.prototype.getNodeCoords = function(node, bAdjusted, bNodeContents) {
  var coords = {};
  try {
    var doc = this.doc;
    if (doc.createRange) {
      var range = doc.createRange();
      if (bNodeContents || node.nodeType === 3) {
        //console.log('.......>');
        range.selectNodeContents(node);
      } else {
        //console.log('<.........');
        range.selectNode(node);
      }
      //console.log(range);
      var j = Math.max(doc.documentElement.scrollTop, doc.body.scrollTop);
      var k = Math.max(doc.documentElement.scrollLeft, doc.body.scrollLeft);
      if (range.getBoundingClientRect) {
        var rect = range.getBoundingClientRect();
        if (rect) {
          if (bAdjusted) {
            coords.left1=coords.left = Math.round(rect.left);
            coords.top1 =coords.top = Math.round(rect.top);
            coords.width = Math.abs(Math.round(rect.right)-coords.left);
            coords.height = Math.abs(Math.round(rect.bottom)-coords.top);
          } else {
            coords.left = Math.round(rect.left + k);
            coords.top = Math.round(rect.top + j);
            coords.width = Math.abs(Math.round(rect.right + k)-coords.left);
            coords.height = Math.abs(Math.round(rect.bottom + j)-coords.top);
            coords.left1=Math.round(rect.left);
            coords.top1 = Math.round(rect.top );
          }
        }
      }
    }
  } catch (e) {
     console.log(e.message);
  }
  return coords;
}

// LocatorBuilders.prototype.buildForFrame = function(el) {
//   var e = core.firefox.unwrap(el); //Samit: Fix: Do the magic to get it to work in Firefox 4
//   var xpathLevel = 0;
//   var maxLevel = 10;
//   var locator;
//   var locators = [];
//   var _main = [];
//   var _coords = this.getNodeCoords(e);

//   var _seq = 0;
//   for (var i = 0; i < LocatorBuilders.order1.length; i++) {
//     var finderName = LocatorBuilders.order1[i];
//     //console.log(finderName);
//     try {
//       locator = this.buildForWhat(1,finderName, e);
//       if (locator) {
//         locator = String(locator);

//         //locators.splice(0, 0, [locator, finderName]);
//         _main.splice(0, 0, {
//           "finder": finderName,
//           "values": [locator]
//         });
//       }
//     } catch (ex) {
//       // TODO ignore the buggy locator builder for now
//       //this.log.debug("locator exception: " + e);
//       console.log("error in buildFrame: "+ex.message)
//     }
//   }
//   let _json = this.computeElementAttrs(e,el);
//   locators.push(_main);
//   locators.push(_json);
//   locators.push(_coords);
//   return locators;
// };

LocatorBuilders.prototype.findElement = function(locator) {
  try {
    var _one = this.pageBot().findElement(locator);
    return _one;
  } catch (error) {
    //this.log.debug("findElement failed: " + error + ", locator=" + locator);
    return null;
  }
};

LocatorBuilders.order1 = [];
LocatorBuilders.builderMap1 = {};
LocatorBuilders.add1 = function(name, finder) {
  this.order1.push(name);
  this.builderMap1[name] = finder;
};

/*
 * Class methods
 */

LocatorBuilders.order = [];
LocatorBuilders.builderMap = {};
LocatorBuilders.builderCategory = {};
LocatorBuilders._preferredOrder = [];
// NOTE: for some reasons we does not use this part
// classObservable(LocatorBuilders);
LocatorBuilders._dynamicIDs=[];
LocatorBuilders._validIDs=[];
LocatorBuilders.fileLog=null;
classObservable(LocatorBuilders);

LocatorBuilders.checkDynamicID=function(txt){
  for (var ii=0;ii<LocatorBuilders._dynamicIDs.length;ii++){
    if (txt.match(LocatorBuilders._dynamicIDs[ii])){return true;}
  }
  return false;
};
LocatorBuilders.setDynamicIDs=function(myids,myids1){
	var ids=myids.split(",");
	for (var ii=0;ii<ids.length;ii++){
		LocatorBuilders._dynamicIDs.push(new RegExp(ids[ii],'g'));
	}
	ids=myids1.split(",");
	for (var ii=0;ii<ids.length;ii++){
		LocatorBuilders._validIDs.push(new RegExp(ids[ii],'g'));
	}
}
LocatorBuilders.add = function(name, finder,type) {
  //console.log(name);
  this.order.push(name);
  this.builderMap[name] = finder;
  this.builderCategory[name] = type;
  this._orderChanged();
};

/**
 * Call when the order or preferred order changes
 */
LocatorBuilders._orderChanged = function() {
  var changed = this._ensureAllPresent(this.order, this._preferredOrder);
  this._sortByRefOrder(this.order, this._preferredOrder);
  if (changed) {
    // NOTE: for some reasons we does not use this part
    // this.notify('preferredOrderChanged', this._preferredOrder);
  }
};

/**
 * Set the preferred order of the locator builders
 *
 * @param preferredOrder can be an array or a comma separated string of names
 */
LocatorBuilders.setPreferredOrder = function(preferredOrder) {
  if (typeof preferredOrder === 'string') {
    this._preferredOrder = preferredOrder.split(',');
  } else {
    this._preferredOrder = preferredOrder;
  }
  this._orderChanged();
};

/**
 * Returns the locator builders preferred order as an array
 */
LocatorBuilders.getPreferredOrder = function() {
  return this._preferredOrder;
};

/**
 * Sorts arrayToSort in the order of elements in sortOrderReference
 * @param arrayToSort
 * @param sortOrderReference
 */
LocatorBuilders._sortByRefOrder = function(arrayToSort, sortOrderReference) {
  var raLen = sortOrderReference.length;
  arrayToSort.sort(function(a, b) {
    var ai = sortOrderReference.indexOf(a);
    var bi = sortOrderReference.indexOf(b);
    return (ai > -1 ? ai : raLen) - (bi > -1 ? bi : raLen);
  });
};

/**
 * Function to add to the bottom of destArray elements from source array that do not exist in destArray
 * @param sourceArray
 * @param destArray
 */
LocatorBuilders._ensureAllPresent = function(sourceArray, destArray) {
  var changed = false;
  sourceArray.forEach(function(e) {
    if (destArray.indexOf(e) == -1) {
      destArray.push(e);
      changed = true;
    }
  });
  return changed;
};

LocatorBuilders.prototype.getElementDataXPath = function(element, rootNode){
    var xpaths = [];
    console.log('[DEBUG] Begin of getElementDataXPath()');
    try {
      //result is { "dataRelated": true/false, "dataRootElement": elem/null }
      var result = this.checkIfDataRelated(element, rootNode);
      if (result.dataRelated) {
        xpaths =
            this.genUniqueXPathsFromDataRoot(element, result.dataRootElement,
                                             result.dataRootClassName);
      }
    }catch(e){
      console.log("Error during getElementDataXPath: " + e.message);
    }
    return xpaths;
  }
  
  LocatorBuilders.prototype.checkIfDataRelated = function(element, rootNode){
    var ret = {"dataRelated": false, "dataRootElement": null, "dataRootClassName": null};
    //TODO in future: check if element is a candidate element contained in data section
    //eg. it's too large, it only contains inline element etc.
    //for now just check if its ancestor is a table, listView etc.
  
    //element's ancestor should be a table, listView etc.
    var parent = element.parentNode;
    var upLevel = 1;
    var found = null;
    var className = null;
    while(parent && (parent != rootNode) && upLevel < 16){
      if(parent.classList && parent.classList.length > 0){
        for(var i=0; i<LocatorBuilders.DATA_CLASSES.length; i++){
          if(parent.classList.contains(LocatorBuilders.DATA_CLASSES[i])){
            found = parent;
            className = LocatorBuilders.DATA_CLASSES[i];
            break;
          }
        }
      }
      parent = parent.parentNode;
      upLevel++;
    }
    if(found){
      ret.dataRelated = true;
      ret.dataRootElement = found;
      ret.dataRootClassName = className;
    }
    return ret;
  }
  
LocatorBuilders.DATA_CLASSES = [
    "af_listItem",
    "oj-listview-item", "oj-table-body-row"
];
LocatorBuilders.prototype.genUniqueXPathsFromDataRoot = function(element, dataRootElement, dataRootClassName){
    var nodeIterator = this.window.document.createNodeIterator(
        dataRootElement,
        4,
        {
          acceptNode: function (node) {
            if (!node.data.match(/^\s*$/)) return 1;
          }
        }
    );
    var texts = {};
    var currentNode;
    while (currentNode = nodeIterator.nextNode()) {
      if(texts[currentNode.nodeValue]){
        texts[currentNode.nodeValue] = texts[currentNode.nodeValue] + 1;
      } else {
        texts[currentNode.nodeValue] = 1;
      }
    }
    var uniqueTexts = [];
    for(var prop in texts){
      if(/^([0-9]|\/|\s)*$/.test(prop))
        continue;
      if(texts[prop] == 1){
        uniqueTexts.push(prop);
      }
    }
    var xpaths = [];
    for(var i=0; i<uniqueTexts.length; i++){
      // var xpath = "//" + element.tagName + "[@class='" + element.className + "'][ancestor::" + dataRootElement.tagName
      //           + "[contains(@class, 'af_listItem')]" + "[contains(.,'" + uniqueTexts[i] + "')]]";
      var xpath = LocatorBuilders.DATA_ROOT_XPATH.replace("DATA_ROOT_TAG", dataRootElement.tagName)
          .replace("DATA_ROOT_CLASS_NAME", dataRootClassName)
          .replace("UNIQUE_TEXT", uniqueTexts[i]);
      if(element.className){
        xpath = xpath + "//" + element.tagName + "[@class='" + element.className + "']";
      } else { //actually we can always use this branch, to check again in future
        xpath = xpath + this.getElementTreeXPathFromDataRoot(element, dataRootElement);
      }
      if(this.getElementCount("xpath", xpath) == 1){
        xpaths.push(xpath);
      }
      if(xpaths.length == 5){ //only found at most 5
        break;
      }
    }
    return xpaths;
 }

 LocatorBuilders.prototype.getElementTreeXPathFromDataRoot = function(element, dataRootElement){
    var paths = [];
    for(; element != dataRootElement && element.nodeType == 1; element = element.parentNode){
      paths.splice(0, 0, this.relativeXPathFromParent(element));
    }
    var result = paths.length ? paths.join('') : null;
    console.log("[DEBUG] getElementTreeXPathFromDataRoot: " + result);
    return result;
};

LocatorBuilders.prototype.getElementCount = function(using,locator) {
    var target = {};
    target[using] = locator;
    var elemNum = 0;
    try{
      //var elements = this.findElements(using, locator);
      var elements = this.findElement(locator);
      elemNum = elements.length;
      console.log("getElementCount: " + elemNum + " (using = " + using + ", locator = " + locator + ")");
    }catch(ex){
      console.log("[ERROR] getElementCount: Generated selector is wrong: using = " + using + ", locator = " + locator);
      console.log("[ERROR] getElementCount: Generated selector is wrong with exception: " + ex);
    }
    return elemNum;
};
/*
 * Utility function: Encode XPath attribute value.
 */
LocatorBuilders.prototype.attributeValue = function(value) {
  if (value.indexOf("'") < 0) {
    return "'" + value + "'";
  } else if (value.indexOf('"') < 0) {
    return '"' + value + '"';
  } else {
    var result = 'concat(';
    var part = "";
    while (true) {
      var apos = value.indexOf("'");
      var quot = value.indexOf('"');
      if (apos < 0) {
        result += "'" + value + "'";
        break;
      } else if (quot < 0) {
        result += '"' + value + '"';
        break;
      } else if (quot < apos) {
        part = value.substring(0, apos);
        result += "'" + part + "'";
        value = value.substring(part.length);
      } else {
        part = value.substring(0, quot);
        result += '"' + part + '"';
        value = value.substring(part.length);
      }
      result += ',';
    }
    result += ')';
    return result;
  }
};

LocatorBuilders.prototype.xpathHtmlElement = function(name) {
  if (this.window.document.contentType == 'application/xhtml+xml') {
    // "x:" prefix is required when testing XHTML pages
    return "x:" + name;
  } else {
    //gat-3895, specific dispose of svg
    if (svgArray.includes(name)){
      name="*[local-name()='"+name+"']";
    }
    return name;
  }
};

LocatorBuilders.prototype.relativeXPathFromParent = function(current) {
  var index = this.getNodeNbr(current);
  var tagName=current.nodeName.toLowerCase();
  var currentPath = '/' + this.xpathHtmlElement(tagName);
  if (index > -1) {
    currentPath += '[' + (index + 1) + ']';
  }
  //console.log(currentPath);
  return currentPath;
};

LocatorBuilders.prototype.getNodeNbr = function(current) {
  var childNodes = current.parentNode.childNodes;
  var total = 0;
  var index = -1;
  for (var i = 0; i < childNodes.length; i++) {
    var child = childNodes[i];
    if (child.nodeName == current.nodeName) {
      if (child == current) {
        index = total;
        break;
      }
      total++;
    }
  }
  return index;
};

LocatorBuilders.prototype.getCSSSubPath = function(e) {
  if (!e.getAttribute) return;
  var css_attributes = [ 'name', 'class', 'type', 'alt', 'title', 'value','id'];
  for (var i = 0; i < css_attributes.length; i++) {
    var attr = css_attributes[i];
    var value = e.getAttribute(attr);
    if (value) {
      if (attr == 'id'){
        for (var ii=0;ii<LocatorBuilders._dynamicIDs.length;ii++){
          if (value.match(LocatorBuilders._dynamicIDs[ii])){return null;}
        }
        return '#' + value;
      }
      if (attr == 'class'){
        //3388, sometimes, highlighted is automatically added when an item is highlighted, so when rerun, it cannot find the highlighted item because it has not been highlighted
      	if (value.indexOf('highlighted')>-1) return null;

        return e.nodeName.toLowerCase() + '.' + value.replace(/\s+/ig, ".").replace("..", ".").replace(".active","").replace('.oj-focus','').replace('.CodeMirror-focused','');
      }
      return e.nodeName.toLowerCase() + '[' + attr + "='" + value + "']";
    }
  }
  if (this.getNodeNbr(e))
    return e.nodeName.toLowerCase() + ':nth-of-type(' + this.getNodeNbr(e) + ')';
  else
    return e.nodeName.toLowerCase();
};

LocatorBuilders.prototype.preciseXPath = function(xpath, e) {
  //only create more precise xpath if needed
  //console.log(xpath);
  if (this.findElement(xpath) != e) {
    var result = e.ownerDocument.evaluate(xpath, e.ownerDocument, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    //skip first element (result:0 xpath index:1)
    for (var i = 0, len = result.snapshotLength; i < len; i++) {
      var newPath = 'xpath=(' + xpath + ')[' + (i + 1) + ']';
      if (this.findElement(newPath) == e) {
        return newPath;
      }
    }
  }
  return xpath;
}

LocatorBuilders.prototype.computePreciseXPath = function(xpath, e){
    //only create more precise xpath if needed
    if (this.findElement(xpath) != e) {
      //LocatorBuilders.fileLog.onAppendEntry(">>> check snapshot");
      var result = e.ownerDocument.evaluate(xpath, e.ownerDocument, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      //skip first element (result:0 xpath index:1)
      //LocatorBuilders.fileLog.onAppendEntry(">>> "+result.snapshotLength);
      for (var i=0, len=result.snapshotLength; i < len; i++) {
        var newPath = 'xpath=(' +  xpath + ')[' + (i +1 )+']';
        if ( this.findElement(newPath) == e ) {
            return newPath ;
        }
      }
    }else
      return xpath;
    return null;
  }
  
  LocatorBuilders.prototype.descendantText= function(e,parentNodeName){
      if (e.nodeType == 3) { //text-node
            var text = e.nodeValue;
            if (!text.match(/^\s*$/)) {
              //return  ((parentNodeName==null)?'*':parentNodeName)+"[contains(text(),'"+text.replace(/^\s+/, '').replace(/\s+$/, '') + "')]";
              //gat3047
              //return  ((parentNodeName==null)?'*':parentNodeName)+"[text()='"+text+ "']";
              //gat-3167 sometime, a node is added dynamically
              //return  "*[text()='"+text+ "']";
              //gat-3323
              var _text=text.replace(/^\s+/, '').replace(/\s+$/, '');
              return  "descendant-or-self::*[normalize-space(text())='"+_text+ "']";
  
            }
    }
  
    if (e.hasAttribute && e.hasAttribute('accesskey')) {
      var _text = removeHTMLTag(e.innerHTML);
      if (_text!=null) return "text()[contains(.., '"+_text+"')]";
    }
  
    var childNodes = e.childNodes;
      for (var i = 0; i < childNodes.length; i++) {
         var ret=this.descendantText(childNodes[i],e.nodeName.toLowerCase());
         if (ret!=null) return ret;
      }
      return null;
  }
  LocatorBuilders.prototype.ancestorText= function(e){
      var _nodeName=e.nodeName.toLowerCase();
      if (!_nodeName) return null;
      var txt=this.descendantText(e,null);
    if (txt!=null) return '//'+_nodeName+(txt.indexOf('descendant')<0?'[':'[descendant::')+txt+']';
  
      var myParent = e.parentNode;
      var ret=this.ancestorText(myParent);
      if (ret!=null) return ret+'/'+_nodeName;
  
      return null;
  }
  
  LocatorBuilders.prototype.inputByLabelCheck= function(e){
    if (e.nodeName==null) return null;
    var _nodeName=e.nodeName.toLowerCase();
    if (_nodeName=='input'&& e.hasAttribute && e.hasAttribute('id')){
       var ret="";
       //find its _label
       var _label="label[for='"+e.getAttribute('id')+"']";
       var labelElement = this.window.document.querySelector(_label);
       if (labelElement){
         var txt=labelElement.textContent;
         if (txt&&txt.length>0){
           ret="//label[normalize-space(text())='" + txt + "']/following::input[1]"
           if (e == this.findElement(ret)) {
              return ret;
           }
          }
       }
    }
    return null;
  }
  
  LocatorBuilders.prototype.isSVG = function(elem){
    var isSVG = false;
    var tmpNode = elem;
    while(tmpNode){
      if(tmpNode.localName == 'svg'){
        isSVG = true;
        break;
      }
      tmpNode = tmpNode.parentNode;
    }
    return isSVG;
  }
  
  LocatorBuilders.prototype.getSVGPath = function(elem, ancestorNode){
    var isSVG = this.isSVG(elem);
    var svgPath = '';
    var tmpNode = elem;
    while(tmpNode){
      var relativeXPath = this.relativeXPathFromParent(tmpNode);
  
      svgPath = relativeXPath + svgPath;
      tmpNode = tmpNode.parentNode;
      if(tmpNode == ancestorNode)
        break;
    }
  
    return svgPath;
  }
  
  LocatorBuilders.prototype.getParentDivElement = function(elem){
     var parentTags=['div','tr'];
     var tmpNode = elem.parentNode;
     while(tmpNode){
       if(parentTags.indexOf(tmpNode.localName)>=0)
         break;
       tmpNode = tmpNode.parentNode;
     }
    //var tmpNode =elem.closest('div');
    return tmpNode;
  }
  
  LocatorBuilders.operatorPriority = ['equals', 'normalize-space', 'attrs', 'contains'];
  LocatorBuilders.TEXT_XPATH_OPERATOR_EQUALS = "equals";
  LocatorBuilders.TEXT_XPATH_OPERATOR_NORMALIZE = "normalize-space";
  LocatorBuilders.TEXT_XPATH_OPERATOR_CONTAINS = "contains";
  LocatorBuilders.TEXT_XPATH_OPERATOR_ATTRS = "attrs";
  LocatorBuilders.prototype._getTextOfElement = function(element){
    var text = null, operator = null;
    //accesskey Checking
    if (element.hasAttribute && element.hasAttribute('accesskey')){
      var _text = removeHTMLTag(element.innerHTML);
      return {
        tag: this.xpathHtmlElement(element.nodeName?element.nodeName.toLowerCase():"*"),
        text: _text,
        operator: LocatorBuilders.TEXT_XPATH_OPERATOR_CONTAINS
      };
    }
    if(element.hasChildNodes()){
      var childNodes = element.childNodes;
      if(childNodes.length == 1 && (childNodes[0].nodeType == 3) ){
        // text = String.trim(childNodes[0].nodeValue);
        text = childNodes[0].nodeValue.trim();
        operator = LocatorBuilders.TEXT_XPATH_OPERATOR_EQUALS;
      } else {
        var textNodes = [];
        for(var childNode = element.firstChild; childNode; childNode = childNode.nextSibling){
          if(childNode.nodeType == 3){
            //this.logger.fine("[DEBUG] Found text: \"" + childNode.nodeValue + "\"");
            // text = String.trim(childNode.nodeValue);
            text = childNode.nodeValue.trim();
            if(text) textNodes.push(text);
          }
        }
        if(textNodes.length>0){
          text = textNodes[0];
          if(textNodes.length==1){
            operator = LocatorBuilders.TEXT_XPATH_OPERATOR_NORMALIZE;
          } else if(textNodes.length>1){
            operator = LocatorBuilders.TEXT_XPATH_OPERATOR_CONTAINS;
          }
        }
      }
      if(text){
        return {
          tag: this.xpathHtmlElement(element.nodeName?element.nodeName.toLowerCase():"*"),
          text: text,
          operator: operator
        };
      }
    }
    return null;
  }
  
  LocatorBuilders.TEXT_XPATH_EQUALS1 = '[normalize-space(text())="TEXTVALUE"]';
  LocatorBuilders.TEXT_XPATH_EQUALS2 = "[normalize-space(text())='TEXTVALUE']";
  LocatorBuilders.TEXT_XPATH_NORMALIZE1 = '[normalize-space(.)="TEXTVALUE"]';
  LocatorBuilders.TEXT_XPATH_NORMALIZE2 = "[normalize-space(.)='TEXTVALUE']";
  LocatorBuilders.TEXT_XPATH_CONTAINS1 = '[text()[contains(., "TEXTVALUE")]]';
  LocatorBuilders.TEXT_XPATH_CONTAINS2 = "[text()[contains(., 'TEXTVALUE')]]";
  LocatorBuilders.TEXT_XPATH_ATTR1 = '@ATTR="VALUE"';
  LocatorBuilders.TEXT_XPATH_ATTR2 = "@ATTR='VALUE'";
  LocatorBuilders.prototype.genPredicateWithText = function(result,path,textItem,depth){
    //this.logger.info('[DEBUG] testItem: ' + JSON.stringify(textItem));
    var text = textItem.text, operator = textItem.operator;
    if(text.match(/\'/) && text.match(/\"/))
      return; // We skip it in case the text contains both single quote and double quote
    var predicate = '';
    if(text.match(/\'/)){
      if(operator == LocatorBuilders.TEXT_XPATH_OPERATOR_EQUALS)
        predicate = LocatorBuilders.TEXT_XPATH_EQUALS1.replace(/TEXTVALUE/g, text);
      else if(operator == LocatorBuilders.TEXT_XPATH_OPERATOR_NORMALIZE)
        predicate = LocatorBuilders.TEXT_XPATH_NORMALIZE1.replace(/TEXTVALUE/g, text);
      else
        predicate = LocatorBuilders.TEXT_XPATH_CONTAINS1.replace(/TEXTVALUE/g, text);
    }
    else {
      if(operator == LocatorBuilders.TEXT_XPATH_OPERATOR_EQUALS)
        predicate = LocatorBuilders.TEXT_XPATH_EQUALS2.replace(/TEXTVALUE/g, text);
      else if(operator == LocatorBuilders.TEXT_XPATH_OPERATOR_NORMALIZE)
        predicate = LocatorBuilders.TEXT_XPATH_NORMALIZE2.replace(/TEXTVALUE/g, text);
      else
        predicate = LocatorBuilders.TEXT_XPATH_CONTAINS2.replace(/TEXTVALUE/g, text);
    }
    //this.logger.info('[DEBUG] predicate: ' + predicate);
    var elemTag = textItem.isSVG ? "*[name()='"+textItem.tag+"']" : textItem.tag;
    var xpath = path.replace(/TAG/g, elemTag).replace(/\[PREDICATE\]/g, predicate);
    if(depth==1)
      xpath = path.replace(/AXIS/g, 'child').replace(/TAG/g, elemTag).replace(/\[PREDICATE\]/g, predicate);
    else if(depth>=2)
      xpath = path.replace(/AXIS/g, 'child').replace(/TAG/g, '*').replace(/\[PREDICATE\]/g, '[descendant::'+elemTag+predicate+']');
    var item = {
      tag: textItem.tag,
      text: text,
      operator: operator,
      predicate: predicate,
      xpath: xpath,
      depth: depth
    };
    //this.logger.info('[DEBUG] item: ' + JSON.stringify(item));
    result.push(item);
  }
  LocatorBuilders.prototype.sortTextXPathResult = function(result){
    result.sort(function(a, b){
      var opResult = LocatorBuilders.operatorPriority.indexOf(a.operator) - LocatorBuilders.operatorPriority.indexOf(b.operator);
      if(opResult > 0){
        return 1;
      } else if( opResult < 0){
        return -1;
      } else {
        return a.depth - b.depth;
      }
    });
  }
  
  LocatorBuilders.prototype.generateTextXPath = function(element){
    var result = [];
    var depth = 0;
  
    //this.logger.info('[DEBUG] Starting to generate text-based xpath ...');
    // Check if suffix is needed or not
    var nodeNbrs = this.getNodeNbr(element);
    var suffix = '';
    if(nodeNbrs>-1)
      suffix = '['+(nodeNbrs+1)+']';
    // In case current elementent has text child node directly
    var textItem = this._getTextOfElement(element);
  
    var isSVG = this.isSVG(element);
    if(textItem){
      textItem.isSVG = isSVG;
      this.genPredicateWithText(result, '//TAG'+suffix+'[PREDICATE]', textItem, 0);
    }
  
    // Traverse child elements
    var elemStack = [];
    var elemTag = isSVG?"*[name()='"+element.localName+"']":this.xpathHtmlElement(element.nodeName.toLowerCase());
    elemStack.push(
      {
        node: element,
        path: '//'+elemTag+suffix+'[AXIS::TAG[PREDICATE]]',
        isSVG: isSVG,
        depth: depth
      }
    );
    var elemItem = elemStack.shift();
  
    var enough = false;
    while(elemItem && !enough){
      depth = elemItem.depth + 1;
      var currentElem = elemItem.node;
      var currentPath = elemItem.path;
      var childResult = [];
  
      for(var childElem = currentElem.firstElementChild; childElem; childElem = childElem.nextElementSibling){
        if(childElem.nodeName.toLowerCase() == 'script') continue;
        var isSVG = elemItem.isSVG || childElem.localName == 'svg';
        textItem = this._getTextOfElement(childElem);
        if(textItem){
          textItem.isSVG = isSVG;
          this.genPredicateWithText(result, currentPath, textItem, depth);
        }
        else{
          elemStack.push(
            {
              node: childElem,
              path: currentPath,
              isSVG: isSVG,
              depth: depth
            }
          );
        }
        if(result.length == 10){
          enough = true;
          break;
        }
      }//end for
      elemItem = elemStack.shift();
    }//end while
    //this.sortTextXPathResult(result);
    var newResult = [];
    for(var i=0; i<result.length; i++){
      newResult.push(result[i].xpath);
      if(newResult.length >= 5) break;
    }
    //this.logger.info('[DEBUG] Ending to generate text-based xpath ... Found ' + newResult.length);
    return newResult;
}

LocatorBuilders.prototype.tryAncestor = function(element){
    //this.logger.info('[DEBUG] Now trying its ancestor which is <div> element');
    var results = [];
    var divNode = this.getParentDivElement(element);
    if(divNode){
      results = this.generateTextXPath(divNode);
      var count = 0;
  
      while(divNode.parentNode && count<3 && results.length==0){
        divNode = divNode.parentNode;
        if(divNode.localName == 'body') break;
        results = this.generateTextXPath(divNode);
        count++;
      }
    }
    var idx = -1;
    var _final=null;
    //LocatorBuilders.fileLog.onAppendEntry(">>> "+results.length);
    for(var m=0; m<results.length; m++){
      //LocatorBuilders.fileLog.onAppendEntry(">>> "+results[m]);
      /*
      *  gat-5077, don't need call preciseXPath method at this level,
      *  sometimes there are more than 50 childrens checed out in preciseXPath, it cause page very slow,
      *  only need to check this xpath can return at least one result
      */
      var found = this.findElement(results[m]);
      if(found){
        idx = m;
        //LocatorBuilders.fileLog.onAppendEntry(">>> "+idx);
        _final=results[m];
        break;
      }
    }
    var xpath = null;
    if(idx > -1){
      var _svg=this.getSVGPath(element, divNode);
      xpath = _final+_svg;
    }
    return xpath;
}
/*
 * ===== builders =====
 */

// LocatorBuilders.add('ui', function(pageElement) {
//   return UIMap.getInstance().getUISpecifierString(pageElement,
//     this.window.document);
// });
/*
LocatorBuilders.add('xpath:data', function(e) {
    this.getElementDataXPath(e, rootNode);
},'xpath'
);
*/
LocatorBuilders.add('txt:polygon', function(e) {
    var path = '';
    var current = e;
    var idx=-1;
    var svg=null;
    var _ret=null;
    if (e.nodeName == 'polygon') {
      idx=this.getNodeNbr(current);
      if (idx<0) return null;
       while (current != null) {
           if (current.parentNode != null) {
                 if (current.parentNode.nodeName=='svg'){
                  svg=current.parentNode;
                  break;
                 }
           }
           current = current.parentNode;
       }
       if (svg==null) return null;
       current=svg;
       while (current != null) {
            if (current.parentNode != null && current.parentNode) {
                if (1 == current.parentNode.nodeType && // ELEMENT_NODE
                  current.parentNode.getAttribute("id")){
                   _ret="//*[@id='"+current.parentNode.getAttribute("id")+"']//*[name()='svg']//*[name()='polygon']["+(idx+1)+"]";
                   return _ret;
                }
            }else
               return null;
            current = current.parentNode;
       }
       if (_ret==null) return null;
       return _ret;
    }else{
    }
    return null;
  
},'xpath');
  
LocatorBuilders.add('txt:inputByLabel', function(e) {
     return this.inputByLabelCheck(e);
  },'xpath');
  
LocatorBuilders.add('txt:uncle', function(e) {
     return this.tryAncestor(e);
},'xpath');

LocatorBuilders.add('idname', function (e) {
    var dyId = false;
    var _name = e.name;
    console.log('id');
    if (e.id) {
        var _id = e.id;
        for (var i = 0; i < LocatorBuilders._validIDs.length; i++) {
            if (_id.match(LocatorBuilders._validIDs[i])) { return 'id=' + e.id; }
        }

        for (var i = 0; i < LocatorBuilders._dynamicIDs.length; i++) {
            if (_id.match(LocatorBuilders._dynamicIDs[i])) { dyId = true; break; }
        }
        if (dyId == false)
            return 'id=' + e.id;
    }
    return null;
}, 'id');

LocatorBuilders.add('name', function(e) {
    var dyName=false;
    var _name=e.name;
    console.log('name');
    
    if (_name) {
        for (var i=0;i<LocatorBuilders._dynamicIDs.length;i++){
             if (_name.match(LocatorBuilders._dynamicIDs[i])){dyName=true;break;}
        }
        if (dyName==false)
           return 'name=' + e.name;
    }
    return null;
},'name');

LocatorBuilders.add('link', function(e) {
  if (e.nodeName==null) return null;
  var _nodeName=e.nodeName.toLowerCase();
  if (_nodeName == 'a') {
    if (e.hasAttribute && e.hasAttribute('title')) {
        var title = "//a[@title=" + this.attributeValue(e.getAttribute('title'))+"]";
        var txt=this.preciseXPath(title,e);
        return txt;
    }
    var text = e.textContent;
    if (!text.match(/^\s*$/)) {
      return "link=" + exactMatchPattern(text.replace(/\xA0/g, " ").replace(/^\s*(.*?)\s*$/, "$1"));
    }
  }
  return null;
},'link');
/*
LocatorBuilders.add('id', function(e) {
  if (e.id) {
  	var _id=e.id;
  	for (var i=0;i<LocatorBuilders._dynamicIDs.length;i++){
       if (_id.match(LocatorBuilders._dynamicIDs[i])){return null;}
    }

    return 'id=' + e.id;
  }
  return null;
});
LocatorBuilders.add('name', function(e) {
  if (e.name) {
    return 'name=' + e.name;
  }
  return null;
});
*/
LocatorBuilders.add('css', function(e) {
  //console.log('css~~~~~~~~~~~');
  var current = e;
  var level=0;
  var sub_path = this.getCSSSubPath(e);
  //console.log(sub_path);
  
  var cur_path;
  while (this.findElement("css=" + sub_path) != e && current.nodeName && current.nodeName.toLowerCase() != 'html') {
    if (level>8) {
        return null;
    }
    cur_path=this.getCSSSubPath(current.parentNode);
    if (cur_path==null) return null;
    else
       sub_path = cur_path + ' > ' + sub_path;  
    current = current.parentNode;
    level++;
  }
  //console.log(sub_path);
  return "css=" + sub_path;
},'css');

/*
 * This function is called from DOM locatorBuilders
 */
LocatorBuilders.prototype.findDomFormLocator = function(form) {
  if (form.hasAttribute && form.hasAttribute('name')) {
    var name = form.getAttribute('name');
    var locator = "document." + name;
    if (this.findElement(locator) == form) {
      return locator;
    }
    locator = "document.forms['" + name + "']";
    if (this.findElement(locator) == form) {
      return locator;
    }
  }
  var forms = this.window.document.forms;
  for (var i = 0; i < forms.length; i++) {
    if (form == forms[i]) {
      return "document.forms[" + i + "]";
    }
  }
  return null;
};

LocatorBuilders.add('dom:name', function(e) {
  if (e.form && e.name) {
    var formLocator = this.findDomFormLocator(e.form);
    if (formLocator) {
      var candidates = [formLocator + "." + e.name,
        formLocator + ".elements['" + e.name + "']"
      ];
      for (var c = 0; c < candidates.length; c++) {
        var locator = candidates[c];
        var found = this.findElement(locator);
        if (found) {
          if (found == e) {
            return locator;
          } else if (found instanceof NodeList) {
            // multiple elements with same name
            for (var i = 0; i < found.length; i++) {
              if (found[i] == e) {
                return locator + "[" + i + "]";
              }
            }
          }
        }
      }
    }
  }
  return null;
},'dom');

LocatorBuilders.add('xpath:link', function(e) {
  if (e.nodeName == 'A') {
    var text = e.textContent;
    if (!text.match(/^\s*$/)) {
      //return this.preciseXPath("//" + this.xpathHtmlElement("a") + "[contains(text(),'" + text.replace(/^\s+/, '').replace(/\s+$/, '') + "')]", e);
      //gat-3047,3609 to use normalize-space(text())
      text=text.replace(/^\s+/, '').replace(/\s+$/, '');
      return this.preciseXPath("//" + this.xpathHtmlElement("a") + "[normalize-space(text())='" + text + "']", e);
    }
  }
  return null;
},'xpath');
/*
visibleStringLoc=" and not(ancestor::div[contains(@style,'display:none')]) and not(ancestor::div[contains(@style,'display: none')])";
LocatorBuilders.add('uncle:text:back', function(e) {
  var _nodeName=e.nodeName.toLowerCase();
  if (_nodeName == 'a') {
      var _text=this.ancestorText(e.parentNode);
      if (_text!=null){
        var _idx=_text.indexOf(']');
        if (_idx>0)_idx++;
      	if (e.hasAttribute('accesskey')) {
      	  	//gat2972
            var _key = e.getAttribute('accesskey');
            var _key1=_key.toLowerCase();
            var _key2=_key.toUpperCase();
            var _txt1=_text+'/'+_nodeName+"[translate(@accesskey,'"+_key2+"','"+_key1+"')='"+_key1+"']";
            if (_idx>1){
              var _txt2=_text.insertAt(_idx,visibleStringLoc)+'/'+_nodeName+"[translate(@accesskey,'"+_key2+"','"+_key1+"')='"+_key1+"']";
              return [this.preciseXPath(_txt2,e),this.preciseXPath(_txt1,e)];
            }else {
              return this.preciseXPath(_txt1,e);
            }
        }else{
      	    var _text1=this.preciseXPath(_text+'/'+_nodeName,e);
            if (_idx>1){
               var _text2=this.preciseXPath(_text.insertAt(_idx,visibleStringLoc)+'/'+_nodeName,e);
      	       return [_text2,_text1];
            }else{
              return _text1;
            }
        }
      }
  }
  return null;
});
*/
const TEXT_TAGS = ['button', 'td','span','div'];
const ELEM_TEXT_ATTRIBUTES=['title'];
const EXTRA_ATTRS=['role'];
LocatorBuilders.add('txt:descendant', function(e) {
  if (!e.tagName) return;
  var _nodeName=e.tagName.toLowerCase();
  var _ret=null;
  //console.log(_nodeName);
  if (TEXT_TAGS.includes(_nodeName)&&e.hasAttribute) {
      var _text=this.descendantText(e,null);
      if (_text!=null){
          var _extra="";
          for (var u=0;u<EXTRA_ATTRS.length;u++){
              if (e.hasAttribute(EXTRA_ATTRS[u])){
                   _extra=_extra+"@"+EXTRA_ATTRS[u]+"='"+e.getAttribute(EXTRA_ATTRS[u])+"' and ";
              }
          }

      	  var _text1='//'+_nodeName+'['+_extra+_text+']';
          var _text2='//'+_nodeName+'['+_extra+_text+' and not(ancestor::div[contains(@style,\'display:none\')]) and not(ancestor::div[contains(@style,\'display: none\')])]';
          //gat-4132
          _ret= [this.preciseXPath(_text2,e),this.preciseXPath(_text1,e)];
      }

      //element's own text attribute
      for (var u=0;u<ELEM_TEXT_ATTRIBUTES.length;u++){
          if (e.hasAttribute(ELEM_TEXT_ATTRIBUTES[u])){
              var _e=this.preciseXPath('//'+_nodeName+"[@"+ELEM_TEXT_ATTRIBUTES[u]+"="+this.attributeValue(e.getAttribute(ELEM_TEXT_ATTRIBUTES[u]))+"]",e);
              if (_ret==null) _ret=[_e];
              else  _ret.push(_e);
          }
      }
  }

  return _ret;
},'xpath');

LocatorBuilders.add('xpath:img', function(e) {
  if (e.nodeName && e.nodeName.toLowerCase() == 'img') {
    if (e.alt != '') {
      return this.preciseXPath("//" + this.xpathHtmlElement("img") + "[@alt=" + this.attributeValue(e.alt) + "]", e);
    } else if (e.title != '') {
      return this.preciseXPath("//" + this.xpathHtmlElement("img") + "[@title=" + this.attributeValue(e.title) + "]", e);
    } else if (e.src != '') {
      return this.preciseXPath("//" + this.xpathHtmlElement("img") + "[contains(@src," + this.attributeValue(e.src) + ")]", e);
    }
  }
  return null;
},'xpath');

LocatorBuilders.add('xpath:attributes', function(e) {
  const PREFERRED_ATTRIBUTES = ['name', 'value','class','type', 'action', 'onclick','id','title'];
  var i = 0;

  function attributesXPath(name, attNames, attributes) {
    var locator = "//" + this.xpathHtmlElement(name) + "[";
    var _attrval;
    var _validCnt=0;
    for (i = 0; i < attNames.length; i++) {
      var attName = attNames[i];
      _attrval=this.attributeValue(attributes[attName]);
      if (attName=='class'){
      	  if (_attrval.indexOf(' ')>=0)
      	    continue;
      }
      if (attName=='id'){
      	  var _dyId=false;
      	  for (var j=0;j<LocatorBuilders._dynamicIDs.length;j++){
        	if (_attrval.match(LocatorBuilders._dynamicIDs[j])) {
        	  _dyId=true;
        	  break;
        	}
          }
          if (_dyId) continue;
      }
      if (_validCnt > 0) {
        locator += " and ";
      }
      var attName = attNames[i];
      locator += '@' + attName + "=" + _attrval;
      _validCnt++;
    }
    locator += "]";
    if (_validCnt==0) return null;
    return this.preciseXPath(locator, e);
  }

  if (e.attributes) {
    var atts = e.attributes;
    var attsMap = {};
    for (i = 0; i < atts.length; i++) {
      var att = atts[i];
      attsMap[att.name] = att.value;
    }
    var names = [];
    // try preferred attributes
    for (i = 0; i < PREFERRED_ATTRIBUTES.length; i++) {
      var name = PREFERRED_ATTRIBUTES[i];
      if (attsMap[name] != null) {
        names.push(name);
        var locator = attributesXPath.call(this, e.nodeName.toLowerCase(), names, attsMap);
        if (locator!=null)
        if (e == this.findElement(locator)) {
          return locator;
        }
      }
    }
  }
  return null;
},'xpath');

LocatorBuilders.add('xpath:idRelative', function(e) {
  var path = '';
  var current = e;
  var _id;
  while (current != null) {
    if (current.parentNode != null && current.parentNode.getAttribute) {
      path = this.relativeXPathFromParent(current) + path;
      _id=current.parentNode.getAttribute("id");
      if (1 == current.parentNode.nodeType && // ELEMENT_NODE
                  _id) {
        for (var i=0;i<LocatorBuilders._dynamicIDs.length;i++){
        	if (_id.match(LocatorBuilders._dynamicIDs[i])) return null;
        }
        return this.preciseXPath("//" + this.xpathHtmlElement(current.parentNode.nodeName.toLowerCase()) +
          "[@id=" + this.attributeValue(_id) + "]" +
          path, e);
      }
    } else {
      return null;
    }
    current = current.parentNode;
  }
  return null;
},'xpath');

LocatorBuilders.add('xpath:href', function(e) {
  if (e.hasAttribute && e.hasAttribute("href")) {
    var href = e.getAttribute("href");
    if (href.search(/^http?:\/\//) >= 0) {
      return this.preciseXPath("//" + this.xpathHtmlElement("a") + "[@href=" + this.attributeValue(href) + "]", e);
    } else {
      // use contains(), because in IE getAttribute("href") will return absolute path
      if (href=='#') return null;
      return this.preciseXPath("//" + this.xpathHtmlElement("a") + "[contains(@href, " + this.attributeValue(href) + ")]", e);
    }
  }
  return null;
},'xpath');

LocatorBuilders.add('dom:index', function(e) {
  if (e.form) {
    var formLocator = this.findDomFormLocator(e.form);
    if (formLocator) {
      var elements = e.form.elements;
      for (var i = 0; i < elements.length; i++) {
        if (elements[i] == e) {
          return formLocator + ".elements[" + i + "]";
        }
      }
    }
  }
  return null;
},'dom');

LocatorBuilders.add('xpath:position', function(e, opt_contextNode) {
  //this.log.debug("positionXPath: e=" + e);
  var path = '';
  var current = e;
  while (current != null && current.nodeName && current != opt_contextNode) {
    var currentPath;
    if (current.parentNode != null) {
      currentPath = this.relativeXPathFromParent(current);
    } else {
      currentPath = '/' + this.xpathHtmlElement(current.nodeName.toLowerCase());
    }
    path = currentPath + path;
    var locator = '/' + path;
    if (e == this.findElement(locator)) {
      return locator;
    }
    current = current.parentNode;
    //this.log.debug("positionXPath: current=" + current);
  }
  return null;
},'xpath');

LocatorBuilders.prototype.buildForWhat = function(type,name, e, opt_contextNode) {
  if (type==1)
    return LocatorBuilders.builderMap1[name].call(this, e, opt_contextNode);
};
LocatorBuilders.add1('xpath:position', function(e, opt_contextNode) {
  //this.log.debug("positionXPath: e=" + e);
  var path = '';
  var current = e;
  while (current != null && current != opt_contextNode) {
    var currentPath;
    if (current.parentNode != null) {
      currentPath = this.relativeXPathFromParent(current);
    } else {
      currentPath = '/' + this.xpathHtmlElement(current.nodeName.toLowerCase());
    }
    path = currentPath + path;
    var locator = '/' + path;
    //console.log(locator);
    if (e == this.findElement(locator)) {
      console.log('~~~~~equal~~~~~')
      return locator;
    }
    current = current.parentNode;
    //this.log.debug("positionXPath: current=" + current);g
  }
  return null;
},'xpath');
