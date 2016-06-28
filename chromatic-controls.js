/* global ChromaticControls:true */
// TODO: remove() when route is changed (parent component gets unmouted without knowing)
import dat from 'dat-gui';

const {Chromatic} = Package['mdg:chromatic-api'] || {};

const {FlowRouter} = Package['kadira:flow-router'] || {};

const {Tracker} = Package['tracker'] || {};

export const ChromaticControls = {
  gui: null,
  remove: function() {
    var dom = window.parent.document.getElementById('my-gui-container');
    if(dom) {
      dom.parentElement.removeChild(dom);
      ChromaticControls.gui = null;
    }
  },
  load: function(inst, refComponent, entry, spec, meta) {
    ChromaticControlsShow(ChromaticControls, refComponent, entry, spec, meta, inst)
  },
  props: {}
}

window.ChromaticControls = ChromaticControls

Tracker.autorun(function() {
  FlowRouter.watchPathChange();
  ChromaticControls.remove();
})


ChromaticControlsShow = function(scc, obj, entry, spec, meta, inst) {
  if(! meta || meta.type != 'component' || (meta.spec && meta.spec == 'all'))
    return;

  scc.remove()

  if(!obj || !obj.props)
    return

  
  //console.log(entry)
  //console.log(spec)
  // Set dat.gui
  var doc = window.parent.document
  var customContainer = doc.body.appendChild(doc.createElement('div'))
  customContainer.setAttribute('id', 'my-gui-container')

  var props = JSON.parse(JSON.stringify(obj.props)),
    folders = {}, colors = [],
    hiddenControls = [],
    styles = Chromatic.allClasses() || {},
    styleCat = Object.keys(styles)

  if(!scc.modal) {
    scc.modal = doc.body.appendChild(doc.createElement('div'))
    scc.modal.setAttribute('id', 'controllerModal')
    scc.modal.className = "cmodal"
    scc.modal.innerHTML = '<div class="controllerModalContent"><span class="controllerModalClose">x</span><textarea id="controllerModalText">Some text in the Modal..</textarea></div>'
  }

  // info modal
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

    this.info = function() {
      var jsonn = getGuiValues(scc.gui)
      jsonn.className = getStyleVals(scc.gui).join(' ')
      modalT.value = JSON.stringify(jsonn)
      scc.modal.style.display = "block";
    }
    /*this.kombine = function() {
      Chromatic.kombine(entry.name, spec.name, JSON.stringify(getGuiValues(scc.gui)))
    }*/
    this['add class'] = ''
  }

  function buildGuiAttr(val, k, fold) {
    if(typeof val == 'function' || hiddenControls.indexOf(k) != -1)
      return
    if(k == 'className') {
      val = val.split(' ')
      //console.log('className: ' + k + ' ' + val)
      var en = entry.name.toLowerCase()
      if(styles[en])
        val.forEach(function(v) {
          addStyle(en, val)
        })
      else {
        val.forEach(function(v) {
          for(s in styles)
            if(styles[s].indexOf(v) != -1)
              addStyle(s, val)
        })
      }
      hiddenControls.push('className')
    }
    else if(Array.isArray(val)) {
      //console.log('add array: ' + k + ' ' + val)
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
    //console.log('addToGui: ' + key)
    var added
    if(colors.indexOf(key) != -1)
      added = fold.addColor(gao, key)
    else
      added = fold.add(gao, key)

    added.onChange(function(value) {
      onChange(value, key)
    });
  }

  function onChange(value, key) {
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
      if(styleCat.indexOf(k) != -1) {
        vals = getStyleVals(scc.gui).join(' ')
        k = 'className'
      }

      if(obj.setParam)
        obj.setParam(k, vals) 
      else if(inst) {  
        scc.props[k] = vals
        inst.forceUpdate()
      }
  }

  function addStyle(k, val) {
    var addClass = function() {
      addClass[k] = val
    }
    addClass()
    folders.style.add(addClass, k, [''].concat(styles[k]))
      .onChange(function(val2) {
        if(val2 == '') {
          scc.gui.removeControl(k, 'Style')
        }
        else
          onChange(val, k)
      })
  }

  // We need to cache the dat.gui instance, so we can replace it for every component
  scc.gui = new dat.GUI({ autoPlace: false })
  customContainer.appendChild(scc.gui.domElement)
  var gao = new guiAttrObject()

  // Colors first - css issue
  for(k in props)
    if(isColor(props[k]))
      buildGuiAttr(props[k], k, scc.gui)

  folders.style = scc.gui.addFolder('Style')
  folders.style.add(gao, 'add class', styleCat)
    .onChange(function(val) {
      if(!styles[val])
        return
      addStyle(val, styles[val][0])
      for(c of scc.gui.__controllers) {
        if(c.property == 'add class')
          c.setValue('')
      }
    })
  folders.style.open()

  for(k in props)
    if(!isColor(props[k]))
      buildGuiAttr(props[k], k, scc.gui)

  scc.gui.add(gao, 'info')
  //scc.gui.add(gao, 'kombine')

  scc.gui = scc.gui
}

dat.GUI.prototype.removeFolder = function(name) {
  var folder = this.__folders[name];
  if (!folder) {
    return;
  }
  folder.close();
  this.__ul.removeChild(folder.domElement.parentNode);
  delete this.__folders[name];
  this.onResize();
}

dat.GUI.prototype.removeControl = function(name, folder) {
  var self = this, cc;
  if(!folder)
    cc = this.__controllers
  else
    cc = this.__folders[folder].__controllers

  for(c in cc)
    if(cc[c].property == name) {
      cc[c].__li.parentNode.removeChild(cc[c].__li);
      cc.splice(c, 1);
      self.onResize();
    }
}

function getStyleVals(gui) {
  var cc = gui.__folders['Style'].__controllers,
    res = [];
  for(c of cc) {
    if(c.property != 'add class' && c.getValue())
      res = res.concat(c.getValue())
  }
  return res
}

function getGuiValues(folder, obj) {
  if(!obj)
    obj = {}
  var c = folder.__controllers;
  for(i in c){
    if(c[i].property == 'info' || c[i].property.indexOf('+') != -1 || c[i].property.indexOf('-') != -1)
      break
    obj[c[i].property] = c[i].getValue()
  }
  if(folder.__folders) {
    for(j in folder.__folders)
      if(j != 'Style')
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

Chromatic.addPlugin(ChromaticControls);