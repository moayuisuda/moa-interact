## :star2:只用书写canvas原生api的互动库
### 不用再去学习canvas库的黑盒语法，只需要原生api的语法，通过变异的上下文，就可以轻而易举的实现canvas的互动。 
```js
let app = new Moa.App(document.querySelector(".stage"));

let rect = app.Obj(100, 100, 100, 100, ctx => {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 100, 100);
});

rect.on("mouseenter", function(e) {
  this.draw = ctx => {
    ctx.fillStyle = "#c0ebff";
    ctx.fillRect(0, 0, 100, 100);
  };
});
```