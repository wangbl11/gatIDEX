function compositeDisplayName(json) {
  let command = json["command"];
  let parm = json["parameters"];
  switch (command) {
    case "open":
      json["display"] = `${json.command} ${parm.url}`;
      //console.log(json['display']);
      break;
    case "type":
      json["display"] = 'Type text \''+parm["value"]+'\' on '+compositeDescriptiveName(json);
      break;
    case "clickAt":
      json["display"] = 'Click ' + compositeDescriptiveName(json);
      break;
    case "select":
      json["display"] = 'Select \'' + parm["value"]+'\' from '+compositeDescriptiveName(json);
      break;
    case "check":
      json["display"] = `${json.command} element `;
      break;
    case "javascript":
      json["display"] = `${json.command} element `;
      break;
    case "assign":
      json["display"] = `assign `;
      break;
    case "dragAndDrop":
      json["display"] = `${json.command}`;
      break;
    case "pause":
      json["display"] = `Pause ${parm.wait} seconds`;
      break;
    default:
      json["display"] = command;
  }
}

/*
 *  Composite the descriptive element name
 *  Reference: https://jira.oraclecorp.com/jira/browse/GAT-5147 Generic Locator
 */
function compositeDescriptiveName(json) {
  let values = [];
  let elemName = 'element';
  let elemTag = json["elementAttributes"]["tag"];
  if(elemTag == 'input'){
    let elemType = json["elementAttributes"]["type"];
    if(elemType == 'checkbox') elemName = 'checkbox';
    else if(elemType == 'radio') elemName = 'radio button';
    else if(elemType == 'reset') elemName = 'reset button';
    else if(elemType == 'button') elemName = 'button';
    else if(elemType == 'submit') elemName = 'submit button';
    else if(elemType == 'image') elemName = 'image';
    else elemName = 'inputbox';
  }
  else if(elemTag == 'button' || elemTag == 'label'){
    elemName = elemTag;
  }
  else if(elemTag == 'img'){
    elemName = 'image';
  }
  else if(elemTag == 'a'){
    elemName = json["elementAttributes"]["type"];
  }
  else if(elemTag == 'select'){
    elemName = 'drop-down list';
  }
  values.push(elemName);

  let genericLocator = json["locators"]["genericLocator"];
  let gatfind_elements = genericLocator["gatfind_elements"];
  if(gatfind_elements.length == 0)
    return values.join(' ');
  let types = gatfind_elements[0]["types"];
  let texts = gatfind_elements[0]["texts"];
  if(types.length == 0)
    return values.join(' ');
  console.log('[DEBUG] types:', types, ' texts:', texts);
  // Check innerText
  let innerText   = getTextByType(types, texts, 'innerText');
  let placeholder = getTextByType(types, texts, 'placeholder');
  let label       = getTextByType(types, texts, 'label');
  let aria_label  = getTextByType(types, texts, 'aria-label');
  let title       = getTextByType(types, texts, 'title');
  if(innerText){
    if(!isNaN(innerText) && title && title.length>innerText.length)
      values.push(title.addQuotes());
    else
      values.push(innerText.addQuotes());
  }
  else if(placeholder){
    values.push(placeholder.addQuotes());
  }
  else if(label){
    values.push(label.addQuotes());
  }
  else if(aria_label){
    values.push(aria_label.addQuotes());
  }
  else if(title){
    values.push(title.addQuotes());
  }
  else {
    // Check text content if no 'innerText' type (number of TEXT_NODE nodes > 10)
    let temp = [];
    for (let i=0; i<types.length; i++){
      if(types[i]=='textContent'){
        temp.push(texts[i].addQuotes());
      }
    }
    if(temp.length>0){
      console.log('[DEBUG] Found text contents of element');
      temp = temp.slice(0,5);
      if(temp.length==1)
        values.push(temp[0]);
      else
        values.push('which contains ' + temp.join(', ') + ' etc.');
    }
  }
  return values.join(' ');
}

function getTextByType(types, texts, type) {
  let index = types.indexOf(type);
  if(index != -1 && texts[index]){
    console.log('[DEBUG] Found '+type+' of element');
    return texts[index];
  }
  return null;
}

String.prototype.addQuotes = function(){
  return '"'+this+'"';
}
