;(function (global, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['exports'], factory)
  } else if (typeof exports !== 'undefined') {
    factory(exports)
  } else {
    var mod = {
      exports: {},
    }
    factory(mod.exports)
    global.Moa = mod.exports
  }
})(this, function (exports) {
  'use strict'
  Object.defineProperty(exports, '__esModule', {
    value: true,
  })
  class App {
    constructor(dom) {
      this.canvas
      this.worker
      this.events = ['click', 'mousemove', 'mouseup', 'mousedown', 'mouseover']
      this.initCanvas(dom)
      this.initEvents()
    }

    initCanvas(dom) {
      const canvas = (this.canvas = document.createElement('canvas'))
      canvas.width = dom.getBoundingClientRect().width
      canvas.height = dom.getBoundingClientRect().height

      const worker = (this.worker = new Worker('woker.js'))
      worker.postMessage({ mark: 'size', data: { width: canvas.width, height: canvas.height } })
      dom.appendChild(canvas)

      worker.onmessage = (msg) => {
        const msg = msg.data
        const data = msg.data

        switch(data.mark) {
          case 'obj':
        }
      }
    }

    initEvents() {
      this.canvas.addEventListener('mousemove', (e) => {
        this.worker.postMessage({
          mark: 'preselect',
          data: {
            x: e.offsetX || e.clientX - global.canvas.getBoundingClientRect().left,
            y: e.offsetY || e.clientY - global.canvas.getBoundingClientRect().top,
          },
        })
      })

      for (let name of this.events) {
        this.canvas.addEventListener(name, (e) => {
          this.worker.postMessage({
            mark: 'events',
            data: {
              name,
              x: e.offsetX || e.clientX - global.canvas.getBoundingClientRect().left,
              y: e.offsetY || e.clientY - global.canvas.getBoundingClientRect().top,
            },
          })
        })
      }
    }

    obj({ x, y, w, h, r, draw, zIndex }) {
      this.worker.postMessage({ mark: 'obj', data: { x, y, w, h, r, draw: draw.toString(), zIndex } })
    }
  }

  exports.App = App
})
