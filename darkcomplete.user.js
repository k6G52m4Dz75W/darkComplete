// ==UserScript==
// @name         darkComplete
// @namespace    https://github.com/k6G52m4Dz75W/darkComplete
// @version      1.1.1
// @description  专为暗色模式扩展 (如 Dark Reader) 锦上添花。JS 接管 CSS 看不见的瞬间——未加载图片、懒加载、占位图——把暗色模式体验从 99% 推到 100%。The icing on the dark mode cake for existing extensions.
// @author       darkComplete Contributors
// @match        *://*/*
// @run-at       document-start
// @icon         data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+CiAgICA8IS0tIOaal+iJsuWchuinkuaWueWdl+W6lSAo5pqX6Imy5qih5byPKSAtLT4KICAgIDxyZWN0IHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgcng9IjE0IiBmaWxsPSIjMGEwYTBhIi8+CgogICAgPCEtLSDmnIjniZk6IOmAmui/hyBtYXNrIOaKiueZveiJsuaciOmdouaMluaIkOW8r+aciCAtLT4KICAgIDxkZWZzPgogICAgICAgIDxtYXNrIGlkPSJtb29uLW1hc2siPgogICAgICAgICAgICA8cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIGZpbGw9IndoaXRlIi8+CiAgICAgICAgICAgIDxjaXJjbGUgY3g9IjQyIiBjeT0iMjYiIHI9IjE1IiBmaWxsPSJibGFjayIvPgogICAgICAgIDwvbWFzaz4KICAgIDwvZGVmcz4KCiAgICA8IS0tIOaciOmdouS4u+S9kyAobWFzayDkuYvlkI7lkYjnjrDlvK/mnIgpIC0tPgogICAgPGNpcmNsZSBjeD0iMzQiIGN5PSIzMiIgcj0iMTciIGZpbGw9IiNlZGVkZWQiIG1hc2s9InVybCgjbW9vbi1tYXNrKSIvPgoKICAgIDwhLS0g5Y+z5LiL6KeS5bCP5pif5pifOiDmmpfnpLoi5a6M5oiQL+aKm+WFiSIgLS0+CiAgICA8cGF0aCBkPSJNIDUwIDQyIEwgNTEuNSA0NS41IEwgNTUgNDcgTCA1MS41IDQ4LjUgTCA1MCA1MiBMIDQ4LjUgNDguNSBMIDQ1IDQ3IEwgNDguNSA0NS41IFoiIGZpbGw9IiNlZGVkZWQiLz4KPC9zdmc+Cg==
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // @icon 字段的 base64 是 ./icon.svg 的内嵌版本。
    // 改图标 → 编辑 icon.svg → 用 PowerShell 重新生成 base64:
    //   $b = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((Get-Content icon.svg -Raw)));
    //   "data:image/svg+xml;base64,$b"
    // 替换上方 @icon 行后提交。
    //
    // @icon 占位符 background-image 的 data URI 是 ./placeholder.svg 的内嵌版本。
    // 改占位图 → 编辑 placeholder.svg → 用同一 PowerShell 重新生成 → 替换下方 PLACEHOLDER_DATA_URI。

    // ============ 配置常量 ============

    // 占位符 src 识别模式 (顺序敏感, 先匹配先赢; 可按需扩展)
    const PLACEHOLDER_PATTERNS = [
        /^data:image\//i,                                       // data URI 一律视为占位
        /imgloading|loading\.(gif|png|jpg|webp)|blank|placeholder|transparent|spacer|spinner/i
    ];

    // CSS 注入的 class 前缀, 避免与原站 class 冲突
    const STYLE_CLASS = 'tm-image-dark-placeholder';
    const LOADING_CLASS = `${STYLE_CLASS}-loading`;

    // 跟踪图片处理状态
    const PROCESS_ATTR = 'data-dark-processed';

    // 占位符背景图 (双行文字: "正在载入……" / "Loading...", 见 ./placeholder.svg)
    const PLACEHOLDER_DATA_URI =
        'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+CiAgICA8IS0tIOa3seiJsuWchuinkuW6lSAtLT4KICAgIDxyZWN0IHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgcng9IjYiIGZpbGw9IiMxYTFhMWEiLz4KCiAgICA8IS0tIOS4u+ihjDog5q2j5Zyo6L295YWl4oCm4oCmICjkuK0sIGZvbnQtc3RhY2sg5ZCrIENKSyBmYWxsYmFjaykgLS0+CiAgICA8dGV4dCB4PSIzMiIgeT0iMjgiIHRleHQtYW5jaG9yPSJtaWRkbGUiCiAgICAgICAgICBmb250LWZhbWlseT0iLWFwcGxlLXN5c3RlbSwgQmxpbmtNYWNTeXN0ZW1Gb250LCAnU2Vnb2UgVUknLCAnUGluZ0ZhbmcgU0MnLCAnTWljcm9zb2Z0IFlhSGVpJywgJ0hpcmFnaW5vIFNhbnMgR0InLCAnTm90byBTYW5zIENKSyBTQycsIHNhbnMtc2VyaWYiCiAgICAgICAgICBmb250LXNpemU9IjEwIiBmb250LXdlaWdodD0iNTAwIiBmaWxsPSIjYzBjMGMwIj7mraPlnKjovb3lhaXigKbigKY8L3RleHQ+CgogICAgPCEtLSDlia/ooYw6IExvYWRpbmcuLi4gKOiLsSkgLS0+CiAgICA8dGV4dCB4PSIzMiIgeT0iNDQiIHRleHQtYW5jaG9yPSJtaWRkbGUiCiAgICAgICAgICBmb250LWZhbWlseT0iLWFwcGxlLXN5c3RlbSwgQmxpbmtNYWNTeXN0ZW1Gb250LCAnU2Vnb2UgVUknLCBzYW5zLXNlcmlmIgogICAgICAgICAgZm9udC1zaXplPSI3IiBmaWxsPSIjODA4MDgwIj5Mb2FkaW5nLi4uPC90ZXh0Pgo8L3N2Zz4K';

    // ============ 注入 CSS ============

    const styleNode = document.createElement('style');
    styleNode.textContent = `
        /* === Fast path: 常见占位图 src 模式 ===
           这几条规则在 stylesheet 注入即生效, 不需要 JS 运行, 大幅压缩"闪白→覆盖"窗口.
           若想添加新模式, 同步在 JS 的 PLACEHOLDER_PATTERNS 里加正则即可.
           filter: none 防止 Dark Reader 等扩展反转我们的深色占位. */
        img[src*="loading"],
        img[src*="blank"],
        img[src*="placeholder"],
        img[src*="transparent"],
        img[src*="spacer"] {
            background-color: #1a1a1a !important;
            background-image: url("${PLACEHOLDER_DATA_URI}") !important;
            background-repeat: no-repeat !important;
            background-position: center center !important;
            background-size: contain !important;
            filter: none !important;
        }

        /* === Class-based: JS 检测到占位图时加到 <img> 上 ===
           覆盖 fast path 漏掉的 (例如 data:image/* URI)
           filter: none 防止 Dark Reader 等扩展反转我们的深色占位 (但仅限 loading 期间) */
        img.${LOADING_CLASS} {
            background-color: #1a1a1a !important;
            background-image: url("${PLACEHOLDER_DATA_URI}") !important;
            background-repeat: no-repeat !important;
            background-position: center center !important;
            background-size: contain !important;
            filter: none !important;
            transition: background-color 0.15s ease;
        }

        /* === 父元素 ::after 兜底: 任何机制失效时仍有黑色覆盖 ===
           例如浏览器对 background-image 渲染失败, 或图片 src 在 CSS 注入后才变化 */
        .${STYLE_CLASS}-container:not([data-dark-parent-rel]) {
            position: relative !important;
        }

        .${STYLE_CLASS}-container::after {
            content: "" !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            background-color: #000000 !important;
            z-index: 999999 !important;
            pointer-events: none !important;
            display: block !important;
            filter: none !important;
            transition: opacity 0.15s ease !important;
        }

        .${STYLE_CLASS}-container.${STYLE_CLASS}-done::after {
            opacity: 0 !important;
            pointer-events: none !important;
        }
    `;
    (document.head || document.documentElement).appendChild(styleNode);

    // ============ 工具函数 ============

    function isPlaceholder(src) {
        if (!src) return true;
        return PLACEHOLDER_PATTERNS.some(pattern => pattern.test(src));
    }

    // ============ 核心逻辑 ============

    function applyCssDarkPlaceholder(img) {
        if (!img || img.tagName !== 'IMG' || img.getAttribute(PROCESS_ATTR) || !img.parentElement) return;

        const currentSrc = img.currentSrc || img.src;
        const placeholder = isPlaceholder(currentSrc);

        // 已加载完成 + 非占位符 → 放过 (不依赖 naturalWidth > 10, 避免误伤小图标)
        if (img.complete && !placeholder) {
            return;
        }

        img.setAttribute(PROCESS_ATTR, 'processing');

        // 如果是占位图, 给 <img> 加 loading class (CSS 提供 background-image 占位图)
        if (placeholder) {
            img.classList.add(LOADING_CLASS);
        }

        // 同时给父元素加 ::after 黑色覆盖作为兜底
        const container = img.parentElement;
        const parentPosition = getComputedStyle(container).position;
        if (parentPosition === 'static') {
            container.removeAttribute('data-dark-parent-rel');
        } else {
            container.setAttribute('data-dark-parent-rel', '');
        }
        container.classList.add(`${STYLE_CLASS}-container`);

        const tryRemoveOverlay = () => {
            const nowSrc = img.currentSrc || img.src;
            if (img.complete && !isPlaceholder(nowSrc)) {
                // 真实图加载完成: 移除 loading class (背景图过渡消失) + 标记 done (::after 淡出)
                img.classList.remove(LOADING_CLASS);
                container.classList.add(`${STYLE_CLASS}-done`);
                img.setAttribute(PROCESS_ATTR, 'done');

                setTimeout(() => {
                    container.classList.remove(`${STYLE_CLASS}-container`, `${STYLE_CLASS}-done`);
                    container.removeAttribute('data-dark-parent-rel');
                }, 150);
                return true;
            }
            return false;
        };

        // load 监听器只注册一次, 后续由 attrObserver 兜底 (避免递归累积)
        const onCheck = () => tryRemoveOverlay();
        img.addEventListener('load', onCheck, { once: true });

        // 加载失败时 naturalWidth=0, tryRemoveOverlay 永远不通过, 必须直接收尾
        img.addEventListener('error', () => {
            container.classList.add(`${STYLE_CLASS}-done`);
            img.setAttribute(PROCESS_ATTR, 'done');
            attrObserver.disconnect();
            setTimeout(() => {
                container.classList.remove(`${STYLE_CLASS}-container`, `${STYLE_CLASS}-done`);
                container.removeAttribute('data-dark-parent-rel');
            }, 150);
        }, { once: true });

        const attrObserver = new MutationObserver(() => {
            if (tryRemoveOverlay()) {
                attrObserver.disconnect();
            }
        });
        attrObserver.observe(img, { attributes: true, attributeFilter: ['src', 'data-src', 'srcset'] });
    }

    // ============ 启动 ============

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === 1) {
                    if (node.tagName === 'IMG') {
                        applyCssDarkPlaceholder(node);
                    } else if (node.querySelectorAll) {
                        node.querySelectorAll('img').forEach(applyCssDarkPlaceholder);
                    }
                }
            }
        }
    });

    // @run-at document-start 时 documentElement 已存在, 可立即 observe
    if (document.documentElement) {
        observer.observe(document.documentElement, { childList: true, subtree: true });
    }

    // readyState 兼容: 'loading' 时等 DOMContentLoaded, 其他情况立即扫一次
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            document.querySelectorAll('img').forEach(applyCssDarkPlaceholder);
        });
    } else {
        document.querySelectorAll('img').forEach(applyCssDarkPlaceholder);
    }
})();
