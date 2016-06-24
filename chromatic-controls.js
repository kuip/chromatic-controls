/* global ChromaticControls:true */
// TODO: remove() when route is changed (parent component gets unmouted without knowing)
import dat from 'dat-gui';

export const ChromaticControls = {
  gui: null,
  remove: function() {
    this.gui.domElement.parentElement.removeChild(this.gui.domElement)
    this.gui = null
  },
  show: function(obj, callback) {
    return ChromaticControlsShow(this, obj, callback)
  }
}

window.ChromaticControls = ChromaticControls


ChromaticControlsShow = function(scc, obj, callback) {

  if(scc.gui)
    scc.remove()

  if(!obj || !obj.props)
    return

  // Set dat.gui
  var doc = window.parent.document
  var customContainer = doc.body.appendChild(doc.createElement('div'))
  customContainer.setAttribute('id', 'my-gui-container')

  var props = obj.props,
    folders = {}, colors = [],
    hiddenControls = []

  if(!scc.modal) {
    scc.modal = doc.body.appendChild(doc.createElement('div'))
    scc.modal.setAttribute('id', 'controllerModal')
    scc.modal.className = "cmodal"
    scc.modal.innerHTML = '<div class="controllerModalContent"><span class="controllerModalClose">x</span><textarea id="controllerModalText">Some text in the Modal..</textarea></div>'
  }

  // json modal
  var span = doc.getElementsByClassName("controllerModalClose")[0],
    modalT = doc.getElementById('controllerModalText')

  span.onclick = function() {
    scc.modal.style.display = "none";
  }

  if(props.hiddenControls && Array.isArray(props.hiddenControls))
    hiddenControls = JSON.parse(JSON.stringify(props.hiddenControls))

  hiddenControls.push('hiddenControls')

  function buildAttr(val, k, self) {
    if(typeof val == 'function' || hiddenControls.indexOf(k) != -1)
      return

    if(Array.isArray(val)) {
      // TODO: if Array -> options with add/remove
      //self['+ ' + k] = function() {
      //  var objvals = {}
      //  folders[k].__folders[k+'$0'].__controllers.forEach(function(c) {
      //    console.log(c)
      //    objvals[c.property] = c.getValue()
      //  })
      //  buildGuiAttr(objvals, k + '$' + folders[k].__folders.length,  folders[k])
      //}
      for(i in val) {
        buildAttr(val[i], k+'$'+i, self)
        //self['- ' + k+'$'+i] = function() {console.log('-')}
      }
    }
    else if(typeof val == 'object') {
      for(k2 in val) {
        self[k + '.' + k2] = val[k2]
      }
    }
    else {
      if(isColor(val)) {
        self[k] = getGuiColor(val)
        colors.push(k)
      }
      else
        self[k] = val
    }
  }

  function guiAttrObject() {
    var self = this

    for(k in props)
      buildAttr(props[k], k, self, scc.gui)

    this.json = function() {
      var jsonn = getGuiValues(scc.gui)
      //alert(JSON.stringify(jsonn))
      modalT.value = JSON.stringify(jsonn)
      scc.modal.style.display = "block";
    }
  }

  function buildGuiAttr(val, k, fold) {
    if(typeof val == 'function' || hiddenControls.indexOf(k) != -1)
      return

    if(Array.isArray(val)) {
      folders[k] = fold = fold.addFolder(k)
      //addToGui('+ ' + k, fold)
      for(i in val) {
        var foldd = folders[k+'$'+i] = fold.addFolder(k+'$'+i)
        buildGuiAttr(val[i], k+'$'+i, foldd)
        //addToGui('- ' + k+'$'+i, foldd)
      }
    }
    else if(typeof val == 'object') {
      for(k2 in val)
        addToGui(k + '.' + k2, fold)
    }
    else
      addToGui(k, fold)
  }

  function addToGui(key, fold) {
    var added
    if(colors.indexOf(key) != -1)
      added = fold.addColor(gao, key)
    else
      added = fold.add(gao, key)

    added.onChange(function(value) {
      var k, vals = []
      if(key.indexOf('$') != -1) {
        k = key.substring(0, key.indexOf('$'))
        var objs = getGuiValues(scc.gui.__folders[k])
        for(i in objs) {
          var no = i.substring(i.indexOf('$')+1, i.indexOf('.'))
          if(!vals[no])
            vals[no] = {}
          vals[no][i.substring(i.indexOf('.')+1)] = objs[i]
        }
        obj.setParam(k, vals) 
      }
      else {
        k = key
        vals = value
      }

      if(obj.setParam)
        obj.setParam(k, vals) 
      else if(callback) {  
        var res = {}
        res[k] = vals
        callback(res)
      }
    });
  }

  // We need to cache the dat.gui instance, so we can replace it for every component
  scc.gui = new dat.GUI({ autoPlace: false })
  customContainer.appendChild(scc.gui.domElement)
  var gao = new guiAttrObject()

  // Colors first - css issue
  for(k in props)
    if(isColor(props[k]))
      buildGuiAttr(props[k], k, scc.gui)

  for(k in props)
    if(!isColor(props[k]))
      buildGuiAttr(props[k], k, scc.gui)

  scc.gui.add(gao, 'json')

  scc.gui = scc.gui
  return scc
}

function getGuiValues(folder, obj) {
  if(!obj)
    obj = {}
  var c = folder.__controllers;
  for(i in c){
    if(c[i].property == 'json' || c[i].property.indexOf('+') != -1 || c[i].property.indexOf('-') != -1)
      break
    obj[c[i].property] = c[i].getValue()
  }
  if(folder.__folders) {
    for(j in folder.__folders)
      obj = getGuiValues(folder.__folders[j], obj)
  }
  return obj
}

function isColor(color) {
  return typeof color == 'string' && (color.indexOf('#') != -1 || color.indexOf('rgb') != -1)
}

function getGuiColor(color) {
  if(color.indexOf('#') != -1)
    return color
  return color.substring(color.indexOf('(')+1, color.indexOf(')'))
    .split(',')
    .map(function(c) {
      return parseFloat(c)
    })
}
