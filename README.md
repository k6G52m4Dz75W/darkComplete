# darkComplete

> **给暗色模式扩展的锦上添花 —— 补完纯 CSS 力所不能及的最后几毫秒**
> **The Icing on the Dark Mode Cake — finish what pure CSS can't see**

你的 [Dark Reader](https://darkreader.org/) / [Stylus](https://github.com/openstyles/stylus) / 浏览器原生暗色模式已经处理了 **99%** 的工作：文字反色、图片滤镜、变量替换、CSS 注入。但有**一类瞬间**是纯 CSS 看不见的 —— 图片还在加载中、懒加载刚触发、视频 poster 还没就绪、占位图还是 data URI ……

darkComplete 用 JavaScript 接管这些"CSS 力所不能及"的 DOM 状态，在图片真正渲染之前先把那束光按下去。**不是替代品，是增强增益脚本**。

> Your Dark Reader / browser dark mode already handles 99% — text inversion, image filters, variable replacement, CSS injection. But there are moments pure CSS literally **cannot see**: an image still loading, a lazy-load just triggered, a video poster not yet fetched, a placeholder still being a `data:` URI.
>
> darkComplete uses JavaScript to intercept these instants CSS can't reach, putting a black curtain over images before they render. **Not a replacement — an enhancement layer.**

> ⚠️ **如果你的浏览器还没装 Dark Reader 或同类暗色模式扩展，请先装那个。** darkComplete 不做颜色反演 —— 它只在你已经"全黑"的底色上做最后的抛光。

## 🧩 与其他暗色模式扩展的关系

```
┌─────────────────────────────────────────────────────────┐
│  浏览器加载网页                                            │
└──────────────────────────┬──────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────┐
│  Layer 1: 暗色模式扩展 (Dark Reader / Stylus / 原生)     │
│  · 颜色反演 · CSS 变量替换 · 图片滤镜 · 主题样式注入      │
│  · 看见的是: 已加载完成的 DOM 静态样式                     │
│  · 看不见: 加载中、懒加载、占位图、未来状态                │
└──────────────────────────┬──────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────┐
│  Layer 2: darkComplete (本脚本)                          │
│  · 监听 src 切换 / load / error / MutationObserver       │
│  · 在图片真正渲染前加黑色覆盖层 (::after)                 │
│  · 接管 CSS 看不见的"那一瞬间"                            │
└──────────────────────────┬──────────────────────────────┘
                           ▼
                 完美的暗色模式体验
```

> **两层正交，互不冲突。** darkComplete 不修改颜色，只加 overlay 遮罩。它**只有**在你已经处于暗色模式的前提下才有意义。

## ✨ 解决什么具体问题

| 场景 | 没有 darkComplete | 装了 darkComplete |
|---|---|---|
| 页面刷新那一瞬间 | 全屏白光 → 慢慢暗下来 | 一开始就是黑的，平滑过渡 |
| 滚动到懒加载区域 | 图片进入视口时闪一下亮 | 黑色占位 → 真实图淡入 |
| 视频 poster 加载 | 黑屏或亮色 poster 闪一下 | 全黑背景，等 poster 来了再显 |
| 占位图 (`data:image/gif,loading...`) | 仍然可见 | 被覆盖掉，看不见 |
| 图片加载失败 | 一直亮色 broken image | 失败时也正确移除覆盖层 |

## 🎯 适用人群

✅ **你**已经在用 Dark Reader / Stylus / 浏览器原生暗色模式
✅ **你**的暗色模式整体很好，但每次刷新 / 滚动 / 切图时仍会闪一下白
✅ **你**愿意为"那几毫秒的刺眼"再装一个 0 依赖 0 权限的轻量脚本

❌ **不适用** —— 如果你还没装任何暗色模式扩展，先去装一个

## 🆚 与其他方案的角色对比

| | 暗色模式扩展 | 通用 dark mode 注入 | darkComplete |
|---|---|---|---|
| 文字反色 | ✅ | ✅ | — |
| CSS 变量替换 | ✅ | ✅ | — |
| 已加载图片滤镜 | ✅ | ✅ | — |
| 未加载图片闪白 | ❌ | ❌ | ✅ |
| 懒加载时机 | ❌ | ❌ | ✅ |
| 占位图覆盖 | ❌ | ❌ | ✅ |
| 视频 poster | 部分 | ❌ | ✅ |
| 与其他扩展冲突 | 可能 | 可能 | **不会** |
| 0 权限 | 部分 | 部分 | ✅ |

> darkComplete **不与** Layer 1 抢工作。它只做 Layer 1 做不了的事。

## 🛠️ 技术特性

- 🌑 **DOM 即现即蒙**：`<img>` 一进 DOM 立刻加黑色 `::after` overlay，杜绝"亮图先闪一下"。
- 🪶 **零依赖零权限**：纯原生 JS，不请求任何 `@grant`，不读任何数据。
- 🖼️ **全场景覆盖**：普通 `<img>`、懒加载（`data-src` / `srcset`）、占位图（`data:` URI / `loading.gif` / `placeholder`）、错误图片。
- ⚡ **零运行时开销**：已加载的图片走 fast-path 立即跳过，`MutationObserver` 仅监听新插入节点。
- 🛡️ **不破坏布局**：自动检测父元素定位，不会强行覆盖原站 `position: relative / absolute`。
- 🔌 **无冲突设计**：CSS class 前缀 `tm-image-dark-placeholder` + `data-*` 属性隔离，**不会**覆盖原站样式或被覆盖。

## 📦 安装

1. **先确认**你已装 [Dark Reader](https://darkreader.org/) 或同类暗色模式扩展。
2. 安装浏览器扩展 [Tampermonkey](https://www.tampermonkey.net/)（Chrome / Edge / Firefox / Safari 全支持）。
3. 点击本仓库的 [`darkcomplete.user.js`](./darkcomplete.user.js)，Tampermonkey 会自动弹出安装确认。
4. 完成。无需任何配置。

> 也可以从 [Greasy Fork](https://greasyfork.org/) 或 [OpenUserJS](https://openuserjs.org/) 安装镜像（待上架）。

## 🧠 工作原理

```
┌──────────────────────────────────────────────────┐
│  浏览器加载 <img>                                  │
└──────────────────┬───────────────────────────────┘
                   ▼
        darkComplete 检测图片
        ┌──────────────────────┐
        │ src 是占位符/未加载？  │
        └──────┬───────┬───────┘
              │       │
        Yes   │       │  No (fast-path, 跳过)
              ▼       ▼
   ┌────────────────────┐   直接放过
   │ 给父元素加 ::after │   无任何操作
   │ 黑色覆盖层 (0.1s)  │
   └────────┬───────────┘
            ▼
   ┌────────────────────┐
   │ 等图片 load / src  │
   │ change / error     │
   └────────┬───────────┘
            ▼
   ┌────────────────────┐
   │ 真实图片就绪 → 淡出 │
   │ 加载失败 → 立即移除  │
   │ 覆盖层            │
   └────────────────────┘
```

## 🔧 配置项

默认无需任何配置。如需调优，可编辑脚本顶部常量：

| 常量 | 默认 | 含义 |
|---|---|---|
| `STYLE_CLASS` | `tm-image-dark-placeholder` | 注入到图片容器的 class 前缀，避免与原站 CSS 冲突 |
| overlay 背景色 | `#000000` | 默认纯黑；如需更柔和可改为 `#0a0a0a` |

## 🤝 贡献

欢迎提 Issue / PR。提交前请确保：

1. **不引入第三方依赖**（保持 0 依赖特性）
2. **不请求新的 `@grant`**（保持 0 权限特性）
3. **改动覆盖主流浏览器**（Chrome / Edge / Firefox / Safari）
4. **永远不要做成颜色反演功能** —— 那是 Layer 1 的事；darkComplete 只做"看不见的瞬间"

## 📄 许可

[MIT](./LICENSE) © 2026 darkComplete Contributors
