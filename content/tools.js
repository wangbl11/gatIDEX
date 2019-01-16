var svgArray=['path','circle','svg','g','rect','text'];

function inputInExpand(elm) {
    var cls=elm.getAttribute("class");
    if (cls&&(cls.indexOf("inputListOfValues")>=0||cls.indexOf("inputComboboxListOfValues")>=0))
        return true;
    var type=elm.getAttribute('aria-autocomplete');
    if (type&&type=='list')
       return true;
    return false;
}
function canTrusted(event){
    if (event.isTrusted) return true;

    //if .isTrusted can handle all cases, we should comment next judgement
    if (event.screenX && event.screenX != 0 && event.screenY && event.screenY != 0)
       return true;
    
    return false;
}

function grab(window) {
    var document = window.document;
    var documentElement = document.documentElement;
    console.log(document.title);
    if (!documentElement) {
      throw new Error('Page is not loaded yet, try later');
    }

    var canvas = document.getElementById('fxdriver-screenshot-canvas');
    if (canvas == null) {
      canvas = document.createElement('canvas');
      canvas.id = 'fxdriver-screenshot-canvas';
      canvas.style.display = 'none';
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
      var context = canvas.getContext('2d');
    } catch (e) {
      throw new Error('Unable to get context - ' + e);
    }
    try {
      context.drawWindow(window, 0, 0, width, height, 'rgb(255,255,255)');
    } catch (e) {
      throw new Error('Unable to draw window - ' + e);
    }
    return canvas.toDataURL();
  }
function offsetXY(event) {
    var top = event.pageY,
        left = event.pageX;
    var element = event.target;
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
        top -= _top;
        left -= _left;
        element = element.offsetParent;
    } while (element);
    return left+','+top;
}