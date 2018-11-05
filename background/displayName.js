function compositeDisplayName(json){
    let command=json["command"];
    switch (command){
        case "open":
          json["display"]=`${json.command} ${json.url}`;
          //console.log(json['display']);
          break;
        case "type":
          json["display"]=`${json.command} text '${json.value}' on the element field`;
          break;
        case "clickAt":
          json["display"]=`${json.command} element`;
          break;
        case "select":
          json["display"]=`${json.command} '${json.value}'`;
          break;
        case "check":
          json["display"]=`${json.command}`;
          break;
        case "javascript":
          json["display"]=`${json.command}`;
          break;
        case "dragAndDrop":
          json["display"]=`${json.command}`;
          break;
        default:
          json["display"]=command;
    }
 }