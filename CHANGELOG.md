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
