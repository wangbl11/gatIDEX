function compositeDisplayName(json){
    let command=json["command"];
    let parm=json['parameters'];
    switch (command){
        case "open":
          json["display"]=`${json.command} ${parm.url}`;
          //console.log(json['display']);
          break;
        case "type":
          json["display"]=`${json.command} text '${parm.value}' on the element field`;
          break;
        case "clickAt":
          json["display"]=`${json.command} element`;
          break;
        case "select":
          json["display"]=`${json.command} '${parm.value}'`;
          break;
        case "check":
          json["display"]=`${json.command} element `;
          break;
        case "javascript":
          json["display"]=`${json.command} element `;
          break;
        case "dragAndDrop":
          json["display"]=`${json.command}`;
          break;
        default:
          json["display"]=command;
    }
 }