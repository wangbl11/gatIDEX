/////////////////////////////////////////////////////////////////////////
//
//  The implementation of generating the generic element locator
//  Reference: https://confluence.oraclecorp.com/confluence/display/GAT/Generic+Element+Locator+based+on+Visual+Contexts
//
/////////////////////////////////////////////////////////////////////////

var GenericLocators = function() {
};
/**
 * The main API to generate the generic locator
 */
GenericLocators.prototype.gl_genGenericLocator = function(element){
  console.log('[DEBUG]    innerText: ' + element.innerText);
  var genericLocator = {
    gatfind_elements: [],
    gatfind_peer: {
      preceding: {},
      following: {}
    },
    gatfind_location: {}
  };
  // We just check visible element
  if(bot.dom.isShown(element)==false)
    return genericLocator;
  // 1. Generate element objects into gatfind_elements array
  // 1.1 Generate element object for current found element
  genericLocator['gatfind_elements'].push(this.gl_genObject(element));
  // 1.2 Generate element object from upper elements
  this.gl_genAncestorObjects(element, element.parentNode, genericLocator);
  // 2. Generate peer element objects if having any
  this.gl_genPeerObject(element, genericLocator);
  // 3. Generate element's location - should ignore it due to upper container already generate its coordinates
  //this.gl_genLocation(element, genericLocator);
  // 4. Capture screenshot of such element
  this.gl_grabElementCanvas(element, genericLocator);
  return genericLocator;
};
/*
 * Generate customized object based on specified element node
 *
 * Fetch all text node by using Document.createTreeWalker()
 * https://developer.mozilla.org/en-US/docs/Web/API/Document/createTreeWalker
 *   const NodeFilter.SHOW_ELEMENT = 1
 *   const NodeFilter.SHOW_TEXT    = 4
 * Constants returned by acceptNode
 *   const short     FILTER_ACCEPT = 1;
 *   const short     FILTER_REJECT = 2;
 *   const short     FILTER_SKIP   = 3;
 */
GenericLocators.prototype.gl_genObject = function(element){
  var elemObj = {
    name: this.gl_getNodeName(element),
    types: [],
    texts: [],
    pathToAncestor: ''
  };
  this.glTextMap = new Map();
  // In case of element with "accesskey" attribute
  if(element.hasAttribute('accesskey')){
    // Should be enough to capture element.innerText
    elemObj['types'].push('innerText');
    elemObj['texts'].push(element.innerText.trim());
    elemObj['types'].push('accesskey');
    elemObj['texts'].push(element.getAttribute('accesskey'));
    this.glTextMap.set(element.innerText.trim(), 1);
  }
  else{
    var nodeFilter = {
      acceptNode: function(node){
        if(node.parentNode.nodeName.match(/^(script|style)$/i)) return 2;
        if(!node.data.match(/^\s*$/)) return 1;
      }
    };
    var textNodes = document.createTreeWalker(element, 4, nodeFilter, false);
    while(textNodes.nextNode()){
      var nodetext = textNodes.currentNode.data.trim();
      console.log('[DEBUG] Getting text: ' + nodetext);
      this.glTextMap.has(nodetext) ? this.glTextMap.set(nodetext, this.glTextMap.get(nodetext)+1) : this.glTextMap.set(nodetext, 1);
      elemObj['types'].push('textContent');
      elemObj['texts'].push(nodetext);
    }
    // Note down the element.innerText for reference
    if(element.innerText && elemObj['types'].length<=10){
      elemObj['types'].push('innerText');
      elemObj['texts'].push(element.innerText);
    }
  }
  // Handle attribute value which is text-based
  var attrs = ['placeholder', 'title', 'aria-label'];
  for(var i=0; i<attrs.length; i++){
    if(element.hasAttribute(attrs[i])){
      elemObj['types'].push(attrs[i]);
      elemObj['texts'].push(element.getAttribute(attrs[i]));
    }
  }
  // Handle <input> or <textarea> element which has related <label>
  if(element.id && element.localName.match(/^(input|textarea)$/i)){
    var labelElem = bot.locators.findElement({xpath: "//label[@for='"+element.id+"']"}, document);
    console.log('[DEBUG] id: ' + element.id + ', label: ' + (labelElem?labelElem.innerText:'No Related Label'));
    if(labelElem){
      elemObj['types'].push('label');
      elemObj['texts'].push(labelElem.innerText);
    }
  }
  return elemObj;
};
/**
 * The recursive function to generate object from ancestor node
 */
GenericLocators.prototype.gl_genAncestorObjects = function(current, ancestor, genericLocator){
  var name = ancestor.nodeName;
  if(name=='BODY' || name=='HTML' || name=='#document')
    return;// Ending the recursion
  var nodeFilter = {
    acceptNode: function(node){
      if(node == current)
        return 2;
      //if(node.nodeType==1 && window.getComputedStyle(node).getPropertyValue('display')=='none')
      //  return 2;
      if(node.nodeType==1 && node.hasAttribute('accesskey'))
        return 2;
      if(node.nodeType==3 && !(/^\s*$/.test(node.data)))
        return 1;
      return 3;
    }
  };
  var textNodes = document.createTreeWalker(ancestor, 1+4, nodeFilter, false);
  var textMap = new Map();
  while(textNodes.nextNode()){
    var nodetext = textNodes.currentNode.data.trim();
    //console.log('[DEBUG] Getting text: ' + nodetext);
    if(this.glTextMap.has(nodetext)) continue;
    textMap.has(nodetext) ? textMap.set(nodetext, textMap.get(nodetext)+1) : textMap.set(nodetext, 1);
  }
  if(textMap.size>0){
    // Get the first unique text string within this element node
    var iterator = textMap.keys();
    var textkey = iterator.next();
    while(textkey.value && textMap.get(textkey.value)>1){
      textkey = iterator.next();
    }
    if(textkey.value){
      var latestIndex = genericLocator['gatfind_elements'].length-1;
      genericLocator['gatfind_elements'][latestIndex]['pathToAncestor'] = this.gl_getPathToAncestor(current, ancestor);
      genericLocator['gatfind_elements'].push({
        name: this.gl_getNodeName(ancestor),
        types: ['textContent'],
        texts: [textkey.value],
        pathToAncestor: ''
      });// Generate the new object
      if(genericLocator['gatfind_elements'].length==4)
        return;// Exit since enough objects collected
      current = ancestor;
    }
    this.glTextMap = new Map([this.glTextMap, textMap]);// Combine 2 maps
  }
  // Up to 3 ancestor
  this.gl_genAncestorObjects(current, ancestor.parentNode, genericLocator);
};
GenericLocators.prototype.gl_genPeerObject = function(element, genericLocator){
  var treePath = this.gl_getTreePath(element);
  console.log('[DEBUG] Getting tree path: ' + treePath);
  var peerElems = bot.locators.findElements({xpath: treePath}, document);
  console.log('[DEBUG] Found: ' + peerElems.length);
  if(peerElems.length > 1){
    var index = peerElems.indexOf(element);
    console.log('[DEBUG] Index: ' + index);
    if(index!=0){
      genericLocator['gatfind_peer']['preceding'] = this.gl_genObject(peerElems[index-1]);
    }
    if(index!=peerElems.length-1){
      genericLocator['gatfind_peer']['following'] = this.gl_genObject(peerElems[index+1]);
    }
  }
};
GenericLocators.prototype.gl_genLocation = function(element, genericLocator){
  var rect = element.getBoundingClientRect();
  genericLocator['gatfind_location']['x'] = Math.round(rect.x);
  genericLocator['gatfind_location']['y'] = Math.round(rect.y);
  genericLocator['gatfind_location']['width'] = Math.round(rect.width);
  genericLocator['gatfind_location']['height'] = Math.round(rect.height);
};
GenericLocators.prototype.gl_getTreePath = function(element){
  var tagList = [];
  var node = element;
  while(node && node.nodeType==1){
    tagList.push(node.localName);
    node = node.parentNode;
  }
  return '/'+tagList.reverse().join('/');
};
GenericLocators.prototype.gl_getPathToAncestor = function(current, ancestor){
  var tagList = [];
  var node = current.parentNode;
  while(node && node!=ancestor){
    tagList.push(this.gl_getNodeName(node));
    node = node.parentNode;
  }
  return tagList.length==0 ? '/' : '/'+tagList.reverse().join('/')+'/';
};
GenericLocators.prototype.gl_getNodeName = function(current) {
  return current.localName+this.gl_getNodeNbr(current);
}
GenericLocators.prototype.gl_getNodeNbr = function(current) {
  var total = 0;
  var index = 0;
  var children = current.parentNode.children;
  for (var i=0; i<children.length; i++) {
    if (children[i].nodeName==current.nodeName) {
      total++;
      if (children[i]==current)
        index = total;
    }
  }
  return total>1 ? '[' + index + ']' : '';
};
/**
 * Grab canvas to PNG image for current found element
 */
GenericLocators.prototype.gl_grabElementCanvas = function(element, genericLocator) {
  genericLocator['image'] = '';
  // Getting element's rect
  var elemRect = element.getBoundingClientRect();
  // Capture visible screen
  // Logic moved to background
};
