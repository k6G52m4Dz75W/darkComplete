// ==UserScript==
// @name         darkComplete
// @namespace    https://github.com/k6G52m4Dz75W/darkComplete
// @version      1.0.2
// @description  专为暗色模式扩展 (如 Dark Reader) 锦上添花。JS 接管 CSS 看不见的瞬间——未加载图片、懒加载、占位图——把暗色模式体验从 99% 推到 100%。The icing on the dark mode cake for existing extensions.
// @author       darkComplete Contributors
// @match        *://*/*
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

    const PROCESS_ATTR = 'data-dark-processed';
    const STYLE_CLASS = 'tm-image-dark-placeholder';

    const styleNode = document.createElement('style');
    styleNode.textContent = `
        img[src*="imgloading.gif"] {
            visibility: hidden !important;
            background-color: #000000 !important;
        }

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
            transition: opacity 0.1s ease !important;
        }

        .${STYLE_CLASS}-container.${STYLE_CLASS}-done::after {
            opacity: 0 !important;
            pointer-events: none !important;
        }
    `;
    (document.head || document.documentElement).appendChild(styleNode);

    function isPlaceholder(src) {
        if (!src) return true;
        if (src.startsWith('data:image/')) return true;
        return /imgloading|loading|blank|placeholder|transparent/i.test(src);
    }

    function applyCssDarkPlaceholder(img) {
        if (!img || img.tagName !== 'IMG' || img.getAttribute(PROCESS_ATTR) || !img.parentElement) return;

        const currentSrc = img.currentSrc || img.src;
        // 已加载完成 + 非占位符 → 放过 (不依赖 naturalWidth > 10, 避免误伤小图标)
        if (img.complete && !isPlaceholder(currentSrc)) {
            return;
        }

        img.setAttribute(PROCESS_ATTR, 'processing');
        const container = img.parentElement;

        // 标记父元素是否已是非 static 定位, 决定是否给 container 加 position: relative
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
                container.classList.add(`${STYLE_CLASS}-done`);
                img.setAttribute(PROCESS_ATTR, 'done');

                setTimeout(() => {
                    container.classList.remove(`${STYLE_CLASS}-container`, `${STYLE_CLASS}-done`);
                    container.removeAttribute('data-dark-parent-rel');
                }, 120);
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
            }, 120);
        }, { once: true });

        const attrObserver = new MutationObserver(() => {
            if (tryRemoveOverlay()) {
                attrObserver.disconnect();
            }
        });
        attrObserver.observe(img, { attributes: true, attributeFilter: ['src', 'data-src', 'srcset'] });
    }

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

    if (document.documentElement) {
        observer.observe(document.documentElement, { childList: true, subtree: true });
    }

    // 不依赖 DOMContentLoaded 触发时机: readyState 已是 interactive/complete 时立即扫
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            document.querySelectorAll('img').forEach(applyCssDarkPlaceholder);
        });
    } else {
        document.querySelectorAll('img').forEach(applyCssDarkPlaceholder);
    }
})();