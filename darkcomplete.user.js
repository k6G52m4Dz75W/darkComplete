// ==UserScript==
// @name         darkComplete
// @namespace    https://github.com/k6G52m4Dz75W/darkComplete
// @version      1.1.5
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
           visibility: hidden 隐藏原图 (因为原图是不透明的, 会遮挡我们的占位)
           filter: none 防止 Dark Reader 等扩展反转. */
        img[src*="loading"],
        img[src*="blank"],
        img[src*="placeholder"],
        img[src*="transparent"],
        img[src*="spacer"] {
            visibility: hidden !important;
            filter: none !important;
        }

        /* === Class-based: JS 检测到占位图时加到 <img> 上 ===
           覆盖 fast path 漏掉的 (例如 data:image/* URI)
           visibility: hidden 同样隐藏原图. */
        img.${LOADING_CLASS} {
            visibility: hidden !important;
            filter: none !important;
            transition: background-color 0.15s ease;
        }

        /* === 父元素 ::after 兜底: 任何机制失效时仍有深色覆盖 ===
           所有 handled 图片 (含普通慢加载) 都加, 仅深色, 不显示文字 (避免误伤普通图)
           z-index 999999 永远在最上层, 防止白闪 */
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

        /* === 真正是占位图 (而非普通慢加载图) 时, ::after 才显示文字 ===
           clamp(24px, 50%, 64px) 让文字自适应:
             - 24px (最小, 16-48px 范围内的图都不溢出)
             - 50% (中等, 48-128px 按容器一半)
             - 64px (封顶, 大图也不会让文字铺满整个图) */
        .${STYLE_CLASS}-container.${STYLE_CLASS}-show-text::after {
            background-image: url("${PLACEHOLDER_DATA_URI}") !important;
            background-repeat: no-repeat !important;
            background-position: center center !important;
            background-size: clamp(24px, 50%, 64px) !important;
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

        // 如果是占位图, 给 <img> 加 loading class (隐藏原图)
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

        // 计数器: 记录"该父元素下还有几张图在加载"
        // 关键: 多张图共享同一父元素时 (图库/feed), 第一张加载完的 setTimeout 不会误删第二张的 class
        const prevCount = parseInt(container.dataset.dcLoadingCount || '0', 10);
        const newCount = prevCount + 1;
        container.dataset.dcLoadingCount = String(newCount);

        if (newCount === 1) {
            // 父元素下第一张加载中的图, 挂上 container
            container.classList.add(`${STYLE_CLASS}-container`);
        }
        // 关键: 任何新图进入, 都要撤销之前的 done 状态 (前一张加载完时挂的 done 会让 ::after opacity=0)
        // 否则后面来的图看不到深色占位
        container.classList.remove(`${STYLE_CLASS}-done`);
        // 仅真占位图才显示文字 (避免切下一张等普通慢加载场景被"晃瞎")
        // 注意: 任何一张当前加载中的图是 placeholder, 父元素就该 show-text
        if (placeholder) {
            container.classList.add(`${STYLE_CLASS}-show-text`);
        }

        const tryRemoveOverlay = () => {
            const nowSrc = img.currentSrc || img.src;
            if (img.complete && !isPlaceholder(nowSrc)) {
                // 真实图加载完成: 移除 loading class (背景图过渡消失)
                img.classList.remove(LOADING_CLASS);
                img.setAttribute(PROCESS_ATTR, 'done');

                // 计数器减一, 仅当所有加载图都完成时才淡出
                const remaining = Math.max(0, parseInt(container.dataset.dcLoadingCount || '1', 10) - 1);
                container.dataset.dcLoadingCount = String(remaining);

                if (remaining === 0) {
                    container.classList.add(`${STYLE_CLASS}-done`);
                    setTimeout(() => {
                        // 二次确认: 这 150ms 内可能又加了新图, count > 0 的话就别清场
                        if (parseInt(container.dataset.dcLoadingCount || '0', 10) > 0) {
                            return;
                        }
                        container.classList.remove(`${STYLE_CLASS}-container`, `${STYLE_CLASS}-done`, `${STYLE_CLASS}-show-text`);
                        container.removeAttribute('data-dark-parent-rel');
                        container.removeAttribute('data-dc-loading-count');
                    }, 150);
                }
                return true;
            }
            return false;
        };

        // load 监听器只注册一次, 后续由 attrObserver 兜底 (避免递归累积)
        const onCheck = () => tryRemoveOverlay();
        img.addEventListener('load', onCheck, { once: true });

        // 加载失败时 naturalWidth=0, tryRemoveOverlay 永远不通过, 必须直接收尾
        img.addEventListener('error', () => {
            img.setAttribute(PROCESS_ATTR, 'done');
            attrObserver.disconnect();

            const remaining = Math.max(0, parseInt(container.dataset.dcLoadingCount || '1', 10) - 1);
            container.dataset.dcLoadingCount = String(remaining);

            if (remaining === 0) {
                container.classList.add(`${STYLE_CLASS}-done`);
                setTimeout(() => {
                    // 同上: 二次确认 count
                    if (parseInt(container.dataset.dcLoadingCount || '0', 10) > 0) {
                        return;
                    }
                    container.classList.remove(`${STYLE_CLASS}-container`, `${STYLE_CLASS}-done`, `${STYLE_CLASS}-show-text`);
                    container.removeAttribute('data-dark-parent-rel');
                    container.removeAttribute('data-dc-loading-count');
                }, 150);
            }
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
