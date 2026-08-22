# darkComplete

> **补完暗色模式的最后一公里**
> **Finish the Last Mile of Dark Mode**

当浏览器进入深色模式，**最刺眼的不是文字，而是还没加载完的「亮色图片」** —— 闪一下白、闪一下米黄、闪一下广告 placeholder，再慢慢暗下来。darkComplete 用零依赖、零权限的 CSS 覆盖层，在图片真正渲染出来之前**先把那束光按下去**。等你真正进入暗色世界的瞬间，没有任何刺眼打扰。

适用于所有暗色模式用户：写代码的人、盯盘的人、夜里刷剧的人、保护视力的人。配合 Tampermonkey 一键安装，覆盖全网图片、懒加载、视频封面 —— 让"完美暗色"不再是屏幕一次次闪白的妥协。

> The brightest thing in dark mode isn't the text — it's every image **before it loads**. That white flash, that beige ad placeholder, that split-second of pure light stabbing your night-adapted eyes. darkComplete puts a zero-dependency, zero-permission CSS curtain over every image until it actually renders, so the moment you go dark, you stay dark.

🌓 **0 行配置 · 0 KB 依赖 · 0 数据收集 · 一开即用**
🌓 **Zero config · Zero dependencies · Zero tracking · One-click install**

---

## ✨ 特性

- 🌑 **零延迟覆盖**：DOM 一出现图片就立即蒙上黑底，杜绝"亮色图片先闪一下"的问题。
- 🪶 **零依赖零权限**：纯 CSS + 原生 JS，不请求任何 `@grant`，不读取任何数据。
- 🖼️ **覆盖全场景**：普通 `<img>`、懒加载（`data-src` / `srcset`）、占位图（`data:` URI / `loading.gif` / `placeholder`）一律适用。
- ⚡ **零运行时开销**：已加载完成的图片走 fast-path 立刻跳过，`MutationObserver` 仅监听新插入节点。
- 🛡️ **不破坏布局**：自动检测父元素定位，**不会**强行覆盖原站 `position: relative / absolute`。
- 🌓 **跨站点生效**：一次安装，全网生效 —— 微博、知乎、GitHub、YouTube、Reddit 全部 dark-friendly。

## 📦 安装

1. 安装浏览器扩展 [Tampermonkey](https://www.tampermonkey.net/)（Chrome / Edge / Firefox / Safari 全支持）。
2. 点击本仓库的 [`darkcomplete.user.js`](./darkcomplete.user.js)，Tampermonkey 会自动弹出安装确认。
3. 完成。无需任何配置。

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

默认无需任何配置。如果想调优，可以编辑脚本顶部的常量：

| 常量 | 默认 | 含义 |
|---|---|---|
| `STYLE_CLASS` | `tm-image-dark-placeholder` | 注入到图片容器的 class 前缀，避免与原站 CSS 冲突 |
| 覆盖层背景色 | `#000000` | 暗色模式下与背景融为一体；如需更柔和可改为 `#111` |

## 🆚 对比

| | 浏览器原生 dark mode | 第三方 dark reader 插件 | darkComplete |
|---|---|---|---|
| 文字变暗 | ✅ | ✅ | — |
| 图片自动反色 | ❌ | ⚠️ 经常过深/失真 | ✅ 保持原色不处理 |
| 未加载图片闪光 | ❌ 刺眼 | ❌ 刺眼 | ✅ 黑色覆盖层接管 |
| 性能开销 | 无 | 中（每张图重绘） | 极低（仅 CSS overlay） |
| 需要权限 | 无 | 大量 | 无 |

> darkComplete **不是** 替代 dark mode 方案，而是**补完** dark mode —— 让"暗"真的暗到底。

## 📝 更新日志

详见 [CHANGELOG.md](./CHANGELOG.md)。

## 🤝 贡献

欢迎提 Issue / PR。提交前请确保：

1. 不引入第三方依赖（保持 0 依赖特性）
2. 不请求新的 `@grant`（保持 0 权限特性）
3. 改动覆盖主流浏览器（Chrome / Edge / Firefox / Safari）

## 📄 许可

[MIT](./LICENSE) © 2026 darkComplete Contributors
