[English](./README.md) | **中文**

<p align="center">
    <a href="https://github.com/mcc108/TagCloud" rel="noopener noreferrer">
        <img width="200" src="https://github.com/mcc108/TagCloud/blob/master/examples/tagcloud.gif?raw=true" alt="TagCloud">
    </a>
</p>

<h1 align="center">TagCloud-HLS</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/tagcloud-hls"><img alt="npm" src="https://img.shields.io/npm/v/tagcloud-hls.svg?style=flat-square"></a>
  <a href="https://github.com/hoyt/tagcloud-hls/tree/master/dist"><img alt="minsize" src="https://img.shields.io/bundlephobia/min/tagcloud-hls?label=tagcloud-hls&style=flat-square"></a>
  <a href="https://www.npmjs.com/package/tagcloud-hls"><img alt="downloads" src="https://img.shields.io/npm/dt/tagcloud-hls?style=flat-square"></a>
</p>

<p align="center">
  它是随着鼠标滚动的3D<strong>标签云</strong>，只有6kb大小，不依赖任何其他类库。 <a href="http://tagcloud.congm.in/examples">例子</a>
</p>

<p align="center">
  ✨ <strong>新功能</strong>：基于权重的字体大小、HSL颜色渐变（冷色到暖色）、对象格式支持
</p>

- [如何使用](#如何使用)
  - [npm](#npm)
  - [浏览器](#浏览器)
- [构造函数](#构造函数)
  - [TagCloud(container, texts, options)](#tagcloudcontainer-texts-options)
    - [container](#container)
    - [texts](#texts)
    - [options](#options)
      - [options.radius](#optionsradius)
      - [options.maxSpeed](#optionsmaxspeed)
      - [options.initSpeed](#optionsinitspeed)
      - [options.direction](#optionsdirection)
      - [options.keep](#optionskeep)
      - [options.containerClass](#optionscontainerClass)
      - [options.itemClass](#optionsitemClass)
      - [options.useContainerInlineStyles](#optionsuseContainerInlineStyles)
      - [options.useItemInlineStyles](#optionsuseItemInlineStyles)
- [实例方法](#实例方法)
  - [tagcloud.update(texts)](#tagcloudupdatetexts)
  - [tagcloud.pause()](#tagcloudpause)
  - [tagcloud.resume()](#tagcloudresume)
  - [tagcloud.destroy()](#tagclouddestroy)
- [自定义事件](#自定义事件)
  - [使用事件委托机制来为标签云子项添加自定义事件](#使用事件委托机制来为标签云子项添加自定义事件)]
- [License](#license)
## 如何使用

### npm

```bash
$ npm i -S tagcloud-hls
```

```js
const TagCloud = require('tagcloud-hls');
// 或者使用 ES6 模块
import TagCloud from 'tagcloud-hls';

const container = '.tagcloud';

// 支持简单的字符串数组
const texts = [
    '3D', 'TagCloud', 'JavaScript',
    'CSS3', 'Animation', 'Interactive',
    'Mouse', 'Rolling', 'Sphere',
    '6KB', 'v2.x',
];

// 或者支持带权重的对象格式（新功能）
const textsWithWeight = [
    { text: '3D', pr: 5 },
    { text: 'TagCloud', pr: 3 },
    { text: 'JavaScript', pr: 4 },
    { text: 'CSS3', pr: 2 },
    { text: 'Animation', pr: 1 },
    'Interactive', // 混合使用也可以
    'Mouse',
];

const options = {
    hls: true,        // 启用HSL颜色渐变（新功能）
    minFontSize: 12,  // 最小字体大小（新功能）
    maxFontSize: 24,  // 最大字体大小（新功能）
};

TagCloud(container, textsWithWeight, options);
```


### 浏览器

```html
<!-- html -->
<script type="text/javascript" src="./dist/TagCloud.min.js"></script>
```

```js
// 基本用法
const container = '.tagcloud';
const texts = ['HTML', 'CSS', 'JavaScript', 'React', 'Vue'];
const options = {
    hls: true,        // 启用HSL颜色渐变
    minFontSize: 14,
    maxFontSize: 20,
};

TagCloud(container, texts, options);

// 使用权重功能
const textsWithWeight = [
    { text: 'React', pr: 5 },
    { text: 'Vue', pr: 4 },
    { text: 'Angular', pr: 3 },
    { text: 'jQuery', pr: 2 },
];
TagCloud(container, textsWithWeight, options);
```

## 构造函数

### TagCloud(container, texts, options)

返回 tagcloud 实例。

#### container

类型: `String` 或 `HTMLElement` 或 `Array`

用于构造标签云的容器。

#### texts

类型: `Array`

初始化时的标签文本列表。支持两种格式：

1. **字符串数组**: `['text1', 'text2', ...]`
2. **对象数组**: `[{ text: 'text1', pr: 权重值 }, ...]` （新功能）

其中 `pr` 表示权重，用于控制字体大小和颜色（当启用 `hls` 选项时）。权重值越大，字体越大，颜色越暖（偏红色）。

#### options

类型: `Object`

##### options.radius

类型: `Number`\
默认值: `100`\
单位: `px`

滚动半径。

##### options.maxSpeed

可选值: `'slow'`, `'normal'`, `'fast'`\
默认值: `'normal'`

滚动最大速度。

##### options.initSpeed

可选值: `'slow'`, `'normal'`, `'fast'`\
默认值: `'normal'`

滚动初始速度。

##### options.direction

类型: `Number`\
默认值: `135` (向右下滚动)\
单位: 顺时针角度 `deg`

滚动初始方向，例如 `0` (向上滚动) , `90` (向左滚动), `135` (向右下滚动) ...

##### options.keep

类型: `Boolean`\
默认值: `true`

鼠标移除容器区域时是否保持继续滚动。默认为是 `true`，减速至初始滚动速度，然后继续随鼠标滚动。

##### options.reverseDirection

类型: `Boolean`\
默认值: `false`

当鼠标控制方向时，是否要逆转方向。

##### options.containerClass

类型: `String`\
默认值: `tagcloud`

用于 tagcloud 容器的CSS样式 class。

##### options.itemClass

类型: `String`\
默认值: `tagcloud--item`

用于 tagcloud 标签项的CSS样式 class。

##### options.useContainerInlineStyles

Type: `Boolean`\
Default: `true`

使用正常视图的内联样式添加到 tagcloud 容器上；禁用此选项后，你必须自己添加CSS。

##### options.useItemInlineStyles

类型: `Boolean`\
默认值: `true`

使用正常视图的内联样式添加到 tagcloud 标签项上；禁用此选项后，你必须自己添加CSS。

##### options.useHTML

类型: `Boolean`\
默认值: `false`

是否允许标签项使用HTML内容而不是纯文本。

##### options.minFontSize

类型: `Number`\
默认值: `12`\
单位: `px`

最小字体大小。当使用权重功能时，权重最小的标签将使用此字体大小。

##### options.maxFontSize

类型: `Number`\
默认值: `12`\
单位: `px`

最大字体大小。当使用权重功能时，权重最大的标签将使用此字体大小。

##### options.hls

类型: `Boolean`\
默认值: `false`

是否启用基于权重的HSL颜色渐变。启用后，标签颜色将根据权重从冷色（蓝色）渐变到暖色（红色）。

## 实例方法

### tagcloud.update(texts)

更新标签文本列表。

### tagcloud.pause()

暂停标签云动画。

### tagcloud.resume()

继续标签云动画。

### tagcloud.destroy()

摧毁标签云实例。

## 自定义事件

### 使用事件委托机制来为标签云子项添加自定义事件

以下是示例，点击标签云子项跳转到 Google 去搜索关键字

```javascript
let rootEl = document.querySelector('.content');
rootEl.addEventListener('click', function clickEventHandler(e) {
    if (e.target.className === 'tagcloud--item') {
        window.open(`https://www.google.com/search?q=${e.target.innerText}`, '_blank');
        // your code here
    }
});
```

## License

MIT
