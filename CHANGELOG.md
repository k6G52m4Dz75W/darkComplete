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
