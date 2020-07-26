(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(["exports"], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports);
  } else {
    var mod = {
      exports: {},
    };
    factory(mod.exports);
    global.Moa = mod.exports;
  }
})(this, function (exports) {
  "use strict";
  Object.defineProperty(exports, "__esModule", {
    value: true,
  });
  class App {
    constructor(dom) {
      this.canvas;
      this.co;
      this.worker;
      this.uid = 0;
      this.events = ["click", "mousemove", "mouseup", "mousedown", "mouseover"];
      this.initCanvas(dom);
      this.initEvents();
      this.initWorker();
    }

    initWorker() {
      const worker = (this.worker = new Worker("src/worker.js"));
      worker.postMessage({ mark: "size", data: { width: this.canvas.width, height: this.canvas.height } });
      worker.onmessage = (msg) => {
        msg = msg.data;
        const data = msg.data;

        switch (msg.mark) {
          case "transferBuffer":
            this.getTransferBuffer(data.buffer);
        }
      };
    }

    getTransferBuffer(buffer) {
      this.co.transferFromImageBitmap(buffer);
    }

    initCanvas(dom) {
      const canvas = (this.canvas = document.createElement("canvas"));
      this.co = this.canvas.getContext("bitmaprenderer");
      canvas.width = dom.getBoundingClientRect().width;
      canvas.height = dom.getBoundingClientRect().height;

      dom.appendChild(canvas);
    }

    initEvents() {
      this.canvas.addEventListener("mousemove", (e) => {
        this.worker.postMessage({
          mark: "preselect",
          data: {
            x: e.offsetX || e.clientX - this.canvas.getBoundingClientRect().left,
            y: e.offsetY || e.clientY - this.canvas.getBoundingClientRect().top,
          },
        });
      });

      for (let name of this.events) {
        this.canvas.addEventListener(name, (e) => {
          this.worker.postMessage({
            mark: "events",
            data: {
              name,
              x: e.offsetX || e.clientX - this.canvas.getBoundingClientRect().left,
              y: e.offsetY || e.clientY - this.canvas.getBoundingClientRect().top,
            },
          });
        });
      }
    }

    obj({ x, y, w, h, r, draw, zIndex }) {
      const uid = this.uid++;
      this.worker.postMessage({ mark: "obj", data: { x, y, w, h, r, draw: draw.toString(), zIndex, uid } });
      return {
        uid,
        on: (name, cb) => {
          this.worker.postMessage({
            mark: "registEvent",
            data: {
              name,
              uid,
              cb: cb.toString(),
            },
          });
        },
      };
    }

    run() {
      this.worker.postMessage({
        mark: "run",
      });
    }
  }

  exports.App = App;
});
