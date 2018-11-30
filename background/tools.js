function uuid() {
    var s = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";
 
    var uuid = s.join("");
    return uuid;
}
function sshot(request,winInfo) {
    return new Promise(function (resolve, reject) {
        chrome.tabs.captureVisibleTab(null, { format: 'jpeg' }, (dataUrl) => {
            let _section=false;
            if (request) {
                _section=true;
            }
         
            let canvas = document.createElement('canvas');
            let ctx = canvas.getContext('2d');
            let img = new Image();
            let left,top,width,height;
            console.log('converting.....');
            img.onload = () => {
                if (request&&request.left)
                {
                   left=request.left;
                   top=request.top;
                   width=request.width;
                   height=request.height;
                   if (winInfo && winInfo.type=='frame'){
                           let _positions=winInfo.framePositions;
                           if (_positions){
                              let _len=_positions.length;
                              for (let i=0;i<_len;i++){
                                left=left+_positions[i].left;
                                top=top+_positions[i].top;
                              }
                           }
                   }
                   left=left-50<0?0:left-50;
                   top=top-50<0?0:top-50;
                   if (height<200) height=200;
                   if (width<280) width=280;
                   canvas.width = 280;
                   canvas.height = 200;
                   //console.log(left+","+top+","+width+","+height);
                }
                
                if (_section) {
                    ctx.drawImage(img, left, top, width, height, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg'));
                } else {
                    //console.log(img.width);
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL('image/jpeg', 0.5));
                }
            };
            img.onerror = e => reject(e);
            img.src = dataUrl;
            
        });
    });
}
function save (url, filename) {
    chrome.storage.local.get({
      timestamp: true,
      saveAs: false
    }, prefs => {
      if (prefs.timestamp) {
        const time = new Date();
        filename = filename += ' ' + time.toLocaleDateString() + ' ' + time.toLocaleTimeString();
      }
      filename = filename
        .replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '-');
      filename += '.png';
  
      fetch(url)
      .then(res => res.blob())
      .then(blob => {
        let url = URL.createObjectURL(blob);
        chrome.downloads.download({
          url,
          filename,
          saveAs: prefs.saveAs
        }, () => {
          if (chrome.runtime.lastError) {
            let a = document.createElement('a');
            a.href = url;
            a.setAttribute('download', filename);
            a.dispatchEvent(new MouseEvent('click'));
          }
        });
      });
  
    });
}
function fetchCmd(){
	var xmlhttp = new XMLHttpRequest();
  var url='http://localhost:5000/getConsoleCmd';

  xmlhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
		    var myArr = JSON.parse(this.responseText);
		    alert(myArr['cmd']);
    }
  };
	xmlhttp.open("POST", url, true);
	xmlhttp.setRequestHeader('content-type', 'application/json');
	var newjson=JSON.stringify({"sid":_sid});
	xmlhttp.send(newjson);
}
function captureElement(rect) {
    console.log(rect);
    return new Promise(function (resolve, reject) {
      chrome.tabs.captureVisibleTab(null, { format: 'jpeg' }, (dataUrl) => {
        let canvas = document.createElement('canvas');
        let ctx = canvas.getContext('2d');
        let img = new Image();
        img.onload = () => {
          canvas.width = rect.width;
          canvas.height = rect.height;
          ctx.drawImage(img, rect.left, rect.top, rect.width, rect.height, 0, 0, rect.width, rect.height);
          resolve(canvas.toDataURL('image/jpeg'));
        };
        img.onerror = e => reject(e);
        img.src = dataUrl;
      });
    });
}