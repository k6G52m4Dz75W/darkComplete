# Changelog

All notable changes to **darkComplete** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- 视频 / `<video>` poster 闪白处理
- 背景图 `background-image: url(...)` 兜底
- `prefers-color-scheme` 联动（仅 dark 模式注入）
- `localStorage` 开关
- 暴露覆盖层颜色 / 透明度配置项
- 占位图大小上限（避免大图下文字过大）— `background-size: clamp(32px, 50%, 96px)` 候选

## [1.1.0] - 2026-08-22

### Added
- **真正的占位图**：新增 `placeholder.svg` —— 深色"图片占位"图标（**双行文字版**：上"正在载入……" / 下"Loading..."），作 `background-image` 挂在 `<img>` 自身。比纯黑覆盖更语义、更友好、不破坏交互
- **占位模式变量化**：`PLACEHOLDER_PATTERNS` 常量统一管理识别正则（含 `data:image/*` 和常见命名），CSS 同步硬编码 5 个 fast path 子串选择器（`loading/blank/placeholder/transparent/spacer`）消除闪白窗口
- **双层保险机制**：
  1. CSS Fast Path —— 常见命名占位图，stylesheet 注入即生效
  2. Class-based —— JS 给漏掉（data URI 等）的占位图加 class
  3. 父元素 `::after` 黑底兜底 —— 任何机制失效时仍有遮挡
- **`@run-at document-start`** —— stylesheet 在 HTML 解析前注入，最大化压缩"闪白→覆盖"窗口
- **`background-size: contain`** —— 占位图随图片实际尺寸缩放，小图文字小、大图文字大
- `README.md`：新增"双层保险机制"小节，更新工作原理图与配置项表

### Changed
- 占位图设计迭代：v1.1.0 最初版本是图形图标（相框+太阳+山），现在改为**双行文字版**（用户反馈"告知用户这里实际有图片"），更直接传达"加载中"语义
- `background-size`：从固定 `32px 32px` 改为 `contain`，让占位图与图片同尺度
- 移除原 `img[src*="imgloading.gif"] { visibility: hidden }` 硬编码规则 —— 它是更通用问题的特例，现在通过通用机制覆盖
- 移除 `naturalWidth > 10` 残留判定（v1.0.0 已修，v1.0.2 确认无回归）
- 调整 overlay 淡出过渡从 `0.1s` → `0.15s` 与新背景图过渡对齐

### Fixed
- **占位图闪白** —— 原方案即使匹配硬编码 gif，仍会有一帧白闪（CSS 注入时机晚于首次 paint）。现在 fast path 配合 `document-start` 注入，从源头消除
- **硬编码命名** —— 原方案只覆盖 `imgloading.gif` 一个文件名，无法应对 `loading.gif` / `blank.png` / `placeholder.jpg` / `white.png` 等同类占位图

## [1.0.2] - 2026-08-22

### Added
- 真实图标：黑色圆角方块 + 弯月 + 四角星，源文件 `icon.svg`（64×64 viewBox，免版税 SVG）
- `@icon` 字段从 1×1 透明 GIF 占位符更新为 SVG data URI base64
- 脚本内注释说明 `@icon` 跟 `icon.svg` 的关联及重新生成 base64 的方法

### Note
本次更新**无任何代码行为变化**，纯图标 + 元数据。代码逻辑与 1.0.1 完全一致。

## [1.0.1] - 2026-08-22

### Changed
- **项目定位正式确立**：darkComplete 不是 Dark Reader / 暗色模式扩展的**替代品**，而是**叠加在它们之上的增强层**。Layer 1（CSS 颜色反演、变量替换、图片滤镜）由现有暗色模式扩展负责；darkComplete 接管 Layer 1 看不见的瞬间（图片未加载、懒加载、占位图、加载失败）。
- **重写 README**：去掉"补完最后一公里"的竞争性表达，改为"锦上添花 / The icing on the dark mode cake"的协作性表达。新增"与暗色模式扩展协作图"、"互补对比表"、"适用人群 / 不适用人群"明确边界。
- **重写 `@description`**：强调"专为暗色模式扩展锦上添花"，并在 description 里点明 Layer 2 的职责。
- **新增贡献原则**：明确"永远不要做成颜色反演功能，那是 Layer 1 的事"。

### Note
本次更新**无任何代码行为变化**，纯定位校正 + 文档同步。代码逻辑与 1.0.0 完全一致。

## [1.0.0] - 2026-08-22

### Added
- 首版发布
- 通过 `MutationObserver` 监听新插入图片并附加黑色覆盖层
- 监听 `src` / `data-src` / `srcset` 属性变化，兼容懒加载
- 监听 `load` / `error` 事件，错误图片也正确移除覆盖层
- 容器父元素定位自适应，不破坏原站 `position: relative / absolute` 布局
- 注入时机兼容 `document-idle` 与更早阶段，首屏图片不漏处理
- 完整 README（中文 + English）
- MIT License

### Fixed
- 修复 `error` 事件触发时 `naturalWidth=0` 导致覆盖层永远不消失的 bug
- 修复 `DOMContentLoaded` 已过导致首屏图片不被处理的 bug
- 修复 `onCheck` 递归注册 `load` 监听器的潜在 listener 累积
- 修复 `position: relative !important` 覆盖原站定位的问题

### Changed
- 移除 `naturalWidth > 10` 判定，避免误伤 16~32px 的小图标
- 替换 `@description` 占位文本为实际描述
