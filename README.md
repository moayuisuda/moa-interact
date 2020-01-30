# 起因
<b>作为一个pixi.js，p5.js等图形库的使用者，个人觉得他们的上手成本体现在：</b>

1. 你得先去学习它们库的语法与层级/事件概念。
2. 在没读源码前它们就是一个黑盒，但是阅读图形库的源码一般难度都不小。出了奇怪的bug难以去定位，网上的中文经验也很少，要想把它们使用好需要很多时间去积累经验。
3. 很多时候我仅仅只是想去实现并不复杂的canvas互动效果，却要引用一个非常大的库。

<b>这个库就是为了解决这些矛盾，它的特点是：</b>
1. 完全是基于原生api来绘图，他并不是一个"图形库"，它只是一个通用的canvas的交互扩展。
2. 源码没压缩也就300多行，并且语法非常少，不需要你去慢慢"驯服"这个库。
4. 能完全控制绘图，而不是用像`new Cirecle(50, 50, 20)`这样的抽象语法去绘图。
5. 默认采用路径来检测鼠标碰撞，也可自行指定碰撞区域，这在一些贴图时很有用。

# 实例
下面是这个库的使用实例
```js
let app = new Moa.App(document.querySelector(".stage"));

let rect = app.Obj({
  x: 100,
  y: 100,
  draw: ctx => {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 100, 100);
  }
});

rect.on("mouseenter", function(e) {
  this.draw = ctx => {
    ctx.fillStyle = "#c0ebff";
    ctx.fillRect(0, 0, 100, 100);
  };
});

app.run()
```

![](https://user-gold-cdn.xitu.io/2020/1/29/16ff00be11e32f2b?w=265&h=204&f=gif&s=5201)
这个库所有的用法都形似上面那样，像dom一样绑定事件，接着改写`draw`函数完成视图的变换。对于一个熟悉原生canvas语法的人来说几乎没有上手成本。
# 对象
在这个库中，所有可视的东西都是由绘图对象`Obj`组成，我们调用`app.Obj`即可新生成一个绘图对象，它的参数分别是<b>此对象的起始坐标`x`，此对象的起始坐标`y`，此对象的绘图函数`draw`，默认会用`canvas`的`isPointInPath`来判断碰撞，如果要自定义碰撞区域，可以额外传参：

`w`：此对象的碰撞区域宽度

`h`：此对象的碰撞区域高度(圆形碰撞区域不需要`w`和`h`，它们被替换为半径`r`)，

接着你可以指定此对象的层级`zIndex`</b>
```js
// 创建一个绘图对象
let circle = app.obj({
  x: 250,
  y: 250,
  draw: function(ctx) {
    ctx.fillStyle = "#000000";
    ctx.arc(0, 0, 50, 0, 1 * Math.PI);
    ctx.fill();
  }
});


// 创造一个自定义矩形碰撞区域的对象
let rect = app.obj({
  x: 100,
  y: 100,
  w: 100,
  h: 100,
  draw: ctx => {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 100, 100);
  }
});

// 创建一个自定义圆形碰撞区域的对象，通常用来处理圆形的贴图
let texture = document.createElement("img");
texture.src = "./static/img.png";
texture.onload = function() {
  let img = app.obj({
    x: 400,
    y: 400,
    r: 100,
    draw: function(ctx) {
      ctx.drawImage(texture, -100, -100, 200, 200);
    }
  });
}

```

![](https://user-gold-cdn.xitu.io/2020/1/30/16ff717a94c92211?w=401&h=336&f=gif&s=95120)

<font color=red>请注意如果你是采用的默认绘图对象，请保证你的`draw`函数中没有出现`ctx.beginPath()`(每一个对象绘图前已经默认调用了)，它会影响碰撞判断。</font>
# 上下文变异
在上面的例子中，有这样一段代码
```js
ctx => {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 100, 100);
}
```
这个回调函数会被注册为此`Obj`的绘图函数`draw`，而在实际调用时，这个ctx并不是`canvas.getContext('2d')`得到的ctx，而是它的<b>变异</b>，它所有方法必要的坐标都变成了<b>相对坐标</b>。

下面展示了一段将这个对象变为可拖拽对象的代码
```js
let circle = app.obj({
  x: 250,
  y: 250,
  draw: function(ctx) {
    ctx.fillStyle = "#000000";
    ctx.arc(0, 0, 50, 0, 1 * Math.PI);
    ctx.fill();
  }
});

let ifDrag_c = false;
const p_c = {
  x: undefined,
  y: undefined
};

circle.on("mousemove", function(e) {
  if (ifDrag_c) {
    this.x += e.x - p_c.x;
    this.y += e.y - p_c.y;
    p_c.x = e.x;
    p_c.y = e.y;
  }
});

circle.on("mousedown", function(e) {
  ifDrag_c = true;
  p_c.x = e.x;
  p_c.y = e.y;
});

circle.on("mouseenter", function(e) {
  this.draw = function(ctx) {
    ctx.fillStyle = "#c0ebff";
    ctx.arc(0, 0, 50, 0, 1 * Math.PI);
    ctx.fill();
  };
});

circle.on("mouseleave", function(e) {
  this.draw = function(ctx) {
    ctx.fillStyle = "#000000";
    ctx.arc(0, 0, 50, 0, 1 * Math.PI);
    ctx.fill();
  };
});

circle.on("mouseup", function(e) {
  ifDrag_c = false;
});
```


![](https://user-gold-cdn.xitu.io/2020/1/30/16ff641e8c200010?w=278&h=235&f=gif&s=26848)
# 事件
支持`["click", "mousemove", "mouseup", "mousedown", "mouseover", "mouseenter", "mouseleave"]`
注意这里只有调用了`Obj.on("eventname", cb)`的`Obj`才会被加入下面的<b>层级比较</b>中，如果从来没有调用过`on`方法，那么这个Obj在层级中是一个可穿透的对象。
# 层级
这个库中的层级分为三个层级，低层级，普通层级，高层级。没有设置zIndex默认为普通层级。

比如这样创造一个`Obj`
```js
let rect = app.Obj({x: 200, y: 200, w: 100, h: 100, ctx => {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 100, 100);
}, 1);
```
最后多了一个参数`1`作为`zIndex`，若果它大于0，则会被推入高层级，`undefined`则会推入普通层级，小于0则会推入低层级。

<b>渲染顺序</b>: 低层级:根据zIndex来渲染 → 普通层级:按生成顺序渲染 → 高层级:根据zIndex渲染。

<b>事件</b>也同样遵循和渲染一样的先后顺序，两个`Obj`重叠，只会触发层级最高的那一个的事件。