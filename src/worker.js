const global = {
  events: ['click', 'mousemove', 'mouseup', 'mousedown', 'mouseover'],
  spEvents: ['mouseenter', 'mouseleave'],
  ctxFuncs: ['rect', 'fillRect', 'strokeRect', 'clearRect', 'moveTo', 'lineTo', 'arc', 'isPointInPath'], // Which the params x,y are in the starting position
  ctxSpFuncs: [
    'createLinearGradient',
    'strokeText',
    'fillText',
    'quadraticCurveTo',
    'bezierCurveTo',
    'arcTo',
    'drawImage',
    'putImageData',
    'getImageData',
  ],
  lowObjs: [],
  objs: [],
  advancedObjs: [],
  top: undefined,
  canvas: undefined,
  co: undefined,
  ctx: undefined,
  interactiveObjs: [],
  interactiveObjsSp: [],
}

// Preselect the top obj
function preselect(e) {
  let top
  const low = []
  const advanced = []
  const normal = []
  function defLevel(i) {
    if (i.zIndex < 0) low.push(i)
    if (!i.zIndex) normal.push(i)
    if (i.zIndex > 0) advanced.push(i)
  }

  for (let i of global.interactiveObjs) {
    if (utils.ifDef(i.r)) {
      if (Math.sqrt(Math.pow(e.x - i.x, 2) + Math.pow(e.y - i.y, 2)) <= i.r) defLevel(i)
    } else if (utils.ifDef(i.w) || utils.ifDef(i.h)) {
      let b = i.getBounding()
      if (b.top <= e.y && b.bottom >= e.y && b.left <= e.x && b.right >= e.x) defLevel(i)
    } else {
      i.drawFn(i.ctx)
      console.log('draw')
      if (utils.ifHit(e.x, e.y)) defLevel(i)
    }
  }

  global.top = top = utils.caculateTop(low, normal, advanced)
  if (low.length + advanced.length + normal.length != 0) {
    if (top && top.mouseIn === false) {
      top.mouseIn = true
      for (let cb of top.mouseenter) {
        cb(e)
      }
    }
  }

  for (let i of global.interactiveObjsSp) {
    if (i !== top && i.mouseIn === true) {
      i.mouseIn = false
      for (let cb of i.mouseleave) {
        cb(e)
      }
    }
  }
}

function run() {
  global.co.clearRect(0, 0, global.canvas.width, global.canvas.height)
  for (let i of global.lowObjs.concat(global.objs, global.advancedObjs)) {
    i.drawFn()
  }

  requestAnimationFrame(this.run.bind(this))
}

function emit(obj, name, e) {
  for (let cb of obj[name]) {
    cb(e)
  }
}

function obj({ x, y, w, h, r, draw, zIndex }) {
  if ((utils.ifDef(w) || utils.ifDef(h)) && utils.ifDef(r))
    throw `[moa-interact] The 'r' and 'w、h' is mutally exclusive `
  if (zIndex === 0) throw "[moa-interact] The zIndex can't be 0"
  let obj = new Obj({ x, y, w, h, r, draw, zIndex })
  if (!zIndex) global.objs.push(obj)
  if (zIndex > 0) {
    for (let i of global.advancedObjs) {
      if (i.zIndex === zIndex) throw `[moa-interact] The index '${zIndex}' has already been used.`
    }
    global.lowObjs.push(obj)
    caculateZIndex('lowObjs')
  }
  if (zIndex < 0) {
    for (let i of global.lowObjs) {
      if (i.zIndex === zIndex) throw `[moa-interact] The index '${zIndex}' has already been used.`
    }
    global.advancedObjs.push(obj)
    caculateZIndex('advancedObjs')
  }
  return obj
}

function caculateZIndex(name) {
  global[name].sort((a, b) => {
    return a.zIndex - b.zIndex
  })
}

class Obj {
  constructor({ x, y, w, h, r, draw, zIndex }) {
    this.mouseIn = false
    this._zIndex = zIndex
    this.draw = eval(draw)
    this.x = x
    this.y = y
    this.w = w
    this.h = h
    this.r = r
    this.ctx
    this.init()
  }

  init() {
    this.initEvents()
    this.initZIndex()
    this.initCtx()
  }

  initEvents() {
    for (let i of global.events.concat(global.spEvents)) {
      this[i] = []
    }
  }

  initZIndex() {
    Object.defineProperty(this, 'zIndex', {
      get() {
        return this._zIndex
      },
    })
    if (this.zIndex > 0) App.caculateZIndex('advancedObjs')
    if (this.zIndex < 0) App.caculateZIndex('lowObjs')
  }

  getZIndex() {
    if (!this.zIndex) {
      return global.objs.indexOf(this)
    } else return this.zIndex
  }

  setZIndex(i) {
    if (this.zIndex === 0) throw "[moa-interact] The zIndex can't be 0"
    if (i > 0) {
      if (!this.zIndex) {
        utils.deleInArr(this, global.objs)
      }
      if (this.zIndex < 0) {
        utils.deleInArr(this, global.lowObjs)
      }
      if (!(this.zIndex > 0)) global.advancedObjs.push(this)
      this._zIndex = i
      App.caculateZIndex('advancedObjs')
    }
    if (i < 0) {
      if (!this.zIndex) {
        utils.deleInArr(this, global.objs)
      }
      if (this.zIndex > 0) {
        utils.deleInArr(this, global.advancedObjs)
      }
      if (!(this.zIndex < 0)) global.lowObjs.push(this)
      this._zIndex = i
      App.caculateZIndex('lowObjs')
    }
  }

  initCtx() {
    let ifDef = utils.ifDef
    this.ctx = Object.create(null)
    for (let i in global.co) {
      if (global.ctxFuncs.includes(i) || global.ctxSpFuncs.includes(i)) continue
      Object.defineProperty(this.ctx, i, {
        get() {
          return Object.prototype.toString.call(global.co[i]) === '[object Function]'
            ? global.co[i].bind(global.co)
            : global.co[i]
        },
        set(e) {
          global.co[i] = e
        },
        configurable: true,
      })
    }
    for (let i of global.ctxFuncs) {
      this.ctx[i] = function (x, y) {
        return global.co[i](ifDef(x) && x + this.x, ifDef(y) && y + this.y, ...[...arguments].slice(2))
      }.bind(this)
    }
    this.ctx.createLinearGradient = function (x0, y0, x1, y1) {
      return global.co.createLinearGradient(x0 + this.x, y0 + this.y, x1 + this.x, y1 + this.y)
    }.bind(this)
    this.ctx.fillText = function (text, x, y, maxWidth) {
      return global.co.fillText(text, x + this.x, y + this.y, maxWidth)
    }.bind(this)
    this.ctx.strokeText = function (text, x, y, maxWidth) {
      return global.co.strokeText(text, x + this.x, y + this.y, maxWidth)
    }.bind(this)
    this.ctx.quadraticCurveTo = function (cpx, cpy, x, y) {
      return global.co.quadraticCurveTo(cpx + this.x, cpy + this.y, x + this.x, y + this.y)
    }.bind(this)
    this.ctx.bezierCurveTo = function (cp1x, cp1y, cp2x, cp2y, x, y) {
      return global.co.bezierCurveTo(cp1x + this.x, cp1y + this.y, cp2x + this.x, cp2y + this.y, x + this.x, y + this.y)
    }.bind(this)
    this.ctx.arcTo = function (x1, y1, x2, y2, r) {
      return global.co.arcTo(x1 + this.x, y1 + this.y, x2 + this.x, y2 + this.y, r)
    }.bind(this)
    this.ctx.drawImage = function (img, sx, sy, sw, sh, x, y, w, h) {
      if (arguments.length === 3) return global.co.drawImage(img, arguments[1] + this.x, arguments[2] + this.y)
      else if (arguments.length === 5)
        return global.co.drawImage(img, arguments[1] + this.x, arguments[2] + this.y, ...[...arguments].slice(3))
      else return global.co.drawImage(img, sx, sy, sw, sh, x + this.x, y + this.y, w, h)
    }.bind(this)
    this.ctx.putImageData = function (imgData, x, y, dirtyX, dirtyY, dirtyWidth, dirtyHeight) {
      return global.co.putImageData(
        imgData,
        x,
        y,
        ifDef(dirtyX) && this.x + dirtyX,
        ifDef(dirtyY) && this.y + dirtyY,
        dirtyWidth,
        dirtyHeight
      )
    }.bind(this)
    this.ctx.getImageData = function (x, y, w, h) {
      return global.co.getImageData(x + this.x, y + this.y, w, h)
    }.bind(this)
  }

  on(name, cb) {
    if (name === 'mouseenter' || name === 'mouseleave') {
      if (!global.interactiveObjsSp.includes(this)) global.interactiveObjsSp.push(this)
    } else {
      if (!this[name]) throw `[moa-interact] Can't resolve event named ${name}`
    }
    if (!global.interactiveObjs.includes(this)) global.interactiveObjs.push(this)
    this[name].push(cb.bind(this))
  }

  getBounding() {
    return {
      top: this.y,
      bottom: this.y + this.h,
      left: this.x,
      right: this.x + this.w,
    }
  }

  drawFn() {
    global.co.beginPath()
    this.draw(this.ctx)
  }
}

const utils = {
  ifHit(x, y) {
    return global.co.isPointInPath(x, y)
  },
  ifDef(e) {
    return !(Object.prototype.toString.call(e) === '[object Undefined]')
  },
  deleInArr(obj, container) {
    container.splice(container.indexOf(obj), 1)
  },
  caculateTop(low, normal, advanced) {
    if (advanced.length !== 0) {
      return advanced.sort((a, b) => b.zIndex - a.zIndex)[0]
    } else {
      if (normal.length !== 0) {
        return normal.sort((a, b) => b.getZIndex() - a.getZIndex())[0]
      } else {
        if (low.length !== 0) {
          return low.sort((a, b) => b.zIndex - a.zIndex)[0]
        }
      }
    }
  },
}

self.addEventListener('message', (msg) => {
  const msg = msg.data
  const data = msg.data

  switch (msg.mark) {
    case 'size':
      global.canvas = new OffscreenCanvas(data.w, data.h)
      global.co = global.canvas.getContext('2d')
      self.postMessage('offscreenCanvas has been initialized')
      break
    case 'preselect':
      preselect({x: data.x, y: data.y})
      break
    case 'events':
      if (global.top) {
        this.emit(global.top, data.name, {x: data.x, y: data.y})
      }
  }
})
