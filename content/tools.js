var svgArray = ["path", "circle", "svg", "g", "rect", "text"];
var expandableArray = [".oj-switch", "[role='combobox']"];
var cursorClickableArray = ["pointer", "text"];
var clickableTag = ["button", "a"];
var typeClickableArray = [
  "submit",
  "button",
  "image",
  "radio",
  "checkbox",
  "reset"
];
function randomAttributes(attrsMap, attrs, from, size) {
  if (size < 1) return null;
  const len = attrs.length;
  let _ret = [];
  for (let i = from; i < len - from - size; i++) {
    let _now = attrs[i];
    let _next = randomAttributes(attrsMap, attrs, i + 1, size - 1);
    let locator = "@" + _now + "=" + attrsMap[i];
    if (_next != null && _next.length > 0) {
      for (let j = 0; j < _next.length; j++) {
        locator = locator + " and " + _next[j];
        _ret.push(locator);
      }
    } else _ret.push(locator);
  }
  return _ret;
}
function inputInExpand(elm) {
  var cls = elm.getAttribute("class");
  if (
    cls &&
    (cls.indexOf("inputListOfValues") >= 0 ||
      cls.indexOf("inputComboboxListOfValues") >= 0)
  )
    return true;
  var type = elm.getAttribute("aria-autocomplete");
  if (type && type == "list") return true;
  return false;
}
function canTrusted(event) {
  if (event.isTrusted) return true;

  //if .isTrusted can handle all cases, we should comment next judgement
  if (
    event.screenX &&
    event.screenX != 0 &&
    event.screenY &&
    event.screenY != 0
  )
    return true;

  return false;
}

function removeHTMLTag(string) {
  if (string) {
    return string.replace(/<("[^"]*"|'[^']*'|[^'">])*>/g, "");
  }
  return string;
}
function grab(window) {
  var document = window.document;
  var documentElement = document.documentElement;
  console.log(document.title);
  if (!documentElement) {
    throw new Error("Page is not loaded yet, try later");
  }

  var canvas = document.getElementById("fxdriver-screenshot-canvas");
  if (canvas == null) {
    canvas = document.createElement("canvas");
    canvas.id = "fxdriver-screenshot-canvas";
    canvas.style.display = "none";
    documentElement.appendChild(canvas);
  }

  var width = documentElement.scrollWidth;
  if (document.body && document.body.scrollWidth > width) {
    width = document.body.scrollWidth;
  }
  var height = documentElement.scrollHeight;
  if (document.body && document.body.scrollHeight > height) {
    height = document.body.scrollHeight;
  }

  var limit = 32767;
  if (width >= limit) {
    width = limit - 1;
  }
  if (height >= limit) {
    height = limit - 1;
  }

  canvas.width = width;
  canvas.height = height;
  try {
    var context = canvas.getContext("2d");
  } catch (e) {
    throw new Error("Unable to get context - " + e);
  }
  try {
    context.drawWindow(window, 0, 0, width, height, "rgb(255,255,255)");
  } catch (e) {
    throw new Error("Unable to draw window - " + e);
  }
  return canvas.toDataURL();
}
function offsetXY(event) {
  let element = event.target;
  if (element.nodeName) {
    let _nodeName = event.target.nodeName.toLowerCase();
    if (svgArray.includes(_nodeName)) return "0,0";
  }
  var top = event.pageY,
    left = event.pageX;
  try {
    do {
      let _top = element.offsetTop;
      let _left = element.offsetLeft;
      //this if is added for polygon
      /*
            if (_top == undefined || _left == undefined) {
                top = 0;
                left = 0;
                break;
            }*/
      //console.log(_top);
      if (_top == undefined) return event.offsetX + "," + event.offsetY;
      top -= _top;
      left -= _left;
      element = element.offsetParent;
    } while (element);
    left = isNaN(left) ? 0 : left;
    top = isNaN(top) ? 0 : top;
    return (left < 0 ? 0 : left) + "," + (top < 0 ? 0 : top);
  } catch (e) {
    console.log(e.message);
  }
  return "0,0";
}

var EncodeToXhtmlEntity = ["amp", "gt", "lt", "nbsp", "return"];
var XhtmlEntityFromChars = {};
for (var i = 0; i < EncodeToXhtmlEntity.length; i++) {
  var entity = EncodeToXhtmlEntity[i];
  XhtmlEntityFromChars[XhtmlEntities[entity]] = entity;
  //38 ->amp
}
var XhtmlEntityChars = "[";
for (var code in XhtmlEntityFromChars) {
  var c = parseInt(code).toString(16);
  while (c.length < 4) {
    c = "0" + c;
  }
  XhtmlEntityChars += "\\u" + c;
}
XhtmlEntityChars += "]";
function encodeText(text) {
  if (text == null) return "";
  // & -> &amp;
  // &amp; -> &amp;amp;
  // &quot; -> &amp;quot;
  // \xA0 -> &nbsp;
  text = text.replace(new RegExp(XhtmlEntityChars, "g"), function(c) {
    let _code = c.charCodeAt(c);
    if (unicodeNeeded[_code]) {
      return unicodeNeeded[_code];
    }
    var entity = XhtmlEntityFromChars[_code];

    if (entity) {
      return "&" + entity + ";";
    } else {
      throw "Failed to encode entity: " + c;
    }
  });
  text = text.replace(/ {2,}/g, function(str) {
    var result = "";
    for (var i = 0; i < str.length; i++) {
      result += "&nbsp;";
    }
    return result;
  }); // convert multiple spaces to nbsp
  //if ('true' == options.escapeDollar)
  {
    text = text.replace(/([^\$])\$\{/g, "$1\\${"); // replace [^$]${...} with \${...}
    text = text.replace(/^\$\{/g, "\\${"); // replace ^${...} with \${...}
    text = text.replace(/\$\$\{/g, "${"); // replace $${...} with ${...}
  }
  //gat-3609
  //text = text.replace(/\n/g, "<br />");
  return text;
}
