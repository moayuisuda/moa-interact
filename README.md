## 仅需原生api的canvas交互库:star2:
#### 不用再去学习canvas库的黑盒语法，只需要原生api的语法，通过变异的上下文，就可以轻而易举的实现canvas的交互。 
## 仅需原生api的canvas交互库:star2:
#### 不用再去学习canvas库的黑盒语法，只需要原生api的语法，通过变异的上下文，就可以轻而易举的实现canvas的交互。 
# 起因
<b>作为一个pixi.js，p5.js等图形库的使用者，我觉得他们的上手成本体现在：</b>

1.你得先去学习它们库的语法与层级/事件概念。

2.在没读源码前它们就是一个黑盒，出了奇怪的bug难以去定位，网上的中文经验也很少，要想把它们使用好需要时间去积累经验。

3.很多时候我仅仅只是想去实现并不复杂的canvas互动效果，却要引用一个非常大的库。

<b>这个库就是为了解决这些矛盾，它的特点是：</b>

1. 完全是基于原生api来绘图，他并不是一个"图形库"，它只是一个通用的canvas的交互扩展。
2. 源码没压缩也就300多行，并不需要你去慢慢"驯服"这个库。
3. 因为第二点，所以体积非常小。

# 实例
下面是这个库的使用实例
```js
let app = new Moa.App(document.querySelector(".stage"));

let rect = app.Obj({
  x: 100,
  y: 100,
  w: 100,
  h: 100,
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
在这个库中，所有可视的东西都是由绘图对象`Obj`组成，我们调用`app.Obj`即可新生成一个绘图对象，它的参数分别是<b>此对象的起始坐标`x`，此对象的起始坐标`y`，此对象的碰撞区域宽度`width`，此对象的碰撞区域高度`height`，此对象的绘图函数`draw`，以及一个可选参数此对象的层级`zIndex`。</b>
```js
// 创造一个矩形碰撞区域的对象
let rect = app.Obj({
  x: 100,
  y: 100,
  w: 100,
  h: 100,
  draw: ctx => {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 100, 100);
  }
});

// 创建一个圆形碰撞区域的对象
let rect1 = app.Obj({
  x: 300,
  y: 300,
  r: 100,
  draw: function(ctx) {
    ctx.fillStyle = "#000000";
    ctx.arc(0, 0, this.r, 0, 2 * Math.PI);
    ctx.fill();
  }
});
```

![](https://user-gold-cdn.xitu.io/2020/1/29/16ff00df6fc7fd6a?w=559&h=504&f=gif&s=18628)
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
let ifDrag = false;
const p = {
  x: undefined,
  y: undefined
};

rect.on("mousedown", function(e) {
  ifDrag = true;
  p.x = e.x;
  p.y = e.y;
});
rect.on("mouseup", function(e) {
  ifDrag = false;
});    
rect.on("mousemove", function(e) {
  if (ifDrag) {
    this.x += e.x - p.x;
    this.y += e.y - p.y;
    p.x = e.x;
    p.y = e.y;
  }
});
```

![](https://user-gold-cdn.xitu.io/2020/1/29/16ff00f373fd4c07?w=458&h=360&f=gif&s=78978)
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
最后多了一个参数`1`作为`zIndex`，若果它大于0，则会被推入高层级，`undefined`则会推入普通层级，小于0则会推入低层级。渲染时会先根据zIndex渲染低层级，再根据普通层级的生成顺序渲染普通层级，最后再根据zIndex渲染高层级。

<b>事件</b>也同样遵循和渲染一样的先后顺序，两个`Obj`重叠，只会触发层级最高的那一个的事件。