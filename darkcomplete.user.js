// ==UserScript==
// @name         darkComplete
// @namespace    https://github.com/k6G52m4Dz75W/darkComplete
// @version      1.1.12
// @description  专为暗色模式扩展 (如 Dark Reader) 锦上添花。把占位图 (imgloading.gif / blank.png 等) 替换为暗色 SVG, 同时给 blob URL 等慢加载图加白闪保护。The icing on the dark mode cake for existing extensions.
// @author       darkComplete Contributors
// @match        *://*/*
// @run-at       document-start
// @icon         data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+CiAgICA8IS0tIOaal+iJsuWchuinkuaWueWdl+W6lSAo5pqX6Imy5qih5byPKSAtLT4KICAgIDxyZWN0IHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgcng9IjE0IiBmaWxsPSIjMGEwYTBhIi8+CgogICAgPCEtLSDmnIjniZk6IOmAmui/hyBtYXNrIOaKiueZveiJsuaciOmdouaMluaIkOW8r+aciCAtLT4KICAgIDxkZWZzPgogICAgICAgIDxtYXNrIGlkPSJtb29uLW1hc2siPgogICAgICAgICAgICA8cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIGZpbGw9IndoaXRlIi8+CiAgICAgICAgICAgIDxjaXJjbGUgY3g9IjQyIiBjeT0iMjYiIHI9IjE1IiBmaWxsPSJibGFjayIvPgogICAgICAgIDwvbWFzaz4KICAgIDwvZGVmcz4KCiAgICA8IS0tIOaciOmdouS4u+S9kyAobWFzayDkuYvlkI7lkYjnjrDlvK/mnIgpIC0tPgogICAgPGNpcmNsZSBjeD0iMzQiIGN5PSIzMiIgcj0iMTciIGZpbGw9IiNlZGVkZWQiIG1hc2s9InVybCgjbW9vbi1tYXNrKSIvPgoKICAgIDwhLS0g5Y+z5LiL6KeS5bCP5pif5pifOiDmmpfnpLoi5a6M5oiQL+aKm+WFiSIgLS0+CiAgICA8cGF0aCBkPSJNIDUwIDQyIEwgNTEuNSA0NS41IEwgNTUgNDcgTCA1MS41IDQ4LjUgTCA1MCA1MiBMIDQ4LjUgNDguNSBMIDQ1IDQ3IEwgNDguNSA0NS41IFoiIGZpbGw9IiNlZGVkZWQiLz4KPC9zdmc+Cg==
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // ============ v1.1.12: 占位图替换 + blob URL 加载中保护 ============
    //
    // v1.1.11 解决了"占位图不显示"核心问题 (改 src 为暗色 SVG).
    // v1.1.12 扩展: 处理 **blob URL 慢加载图** (网站用 blob URL 防下载).
    //   - blob URL 加载中: 盖住避免白闪
    //   - blob URL 加载完成: cleanup
    //   - 5s 兜底: 卡住的图 5s 后强制清理 (img transparent 区域, 不是漆黑)
    //
    // 关键 trade-off:
    //   - 占位图永远走 v1.1.11 暗色 SVG 路径, 5s 兜底对占位图无影响
    //   - "5s 后跟没装一样" 的旧问题只影响卡住的真实图 (透明区域), 不影响占位图

    const PLACEHOLDER_PATTERNS = [
        /^data:image\//i,                                       // data URI 一律视为占位
        /imgloading|loading\.(gif|png|jpg|webp)|blank|placeholder|transparent|spacer|spinner/i
    ];

    function isPlaceholder(src) {
        if (!src) return true;
        return PLACEHOLDER_PATTERNS.some(pattern => pattern.test(src));
    }

    // 暗色 SVG data URL: 暗背景 (#1a1a1a) + "正在载入……" + "Loading..." 文字
    const DARK_LOADING_SVG =
        'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgNjAiIHByZXNlcnZlQXNwZWN0UmF0aW89InhNaWRZTWlkIG1lZXQiPjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iNjAiIGZpbGw9IiMxYTFhMWEiLz48dGV4dCB4PSI1MCIgeT0iMzAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSItYXBwbGUtc3lzdGVtLCBCbGlua01hY1N5c3RlbUZvbnQsICdQaW5nRmFuZyBTQycsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iNyIgZm9udC13ZWlnaHQ9IjUwMCIgZmlsbD0iI2MwYzBjMCI+5q2j5Zyo6L295YWl4oCm4oCmPC90ZXh0Pjx0ZXh0IHg9IjUwIiB5PSI0MiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgZm9udC1mYW1pbHk9Ii1hcHBsZS1zeXN0ZW0sIEJsaW5rTWFjU3lzdGVtRm9udCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSI1IiBmaWxsPSIjODA4MDgwIj5Mb2FkaW5nLi4uPC90ZXh0Pjwvc3ZnPg==';

    // ============ CSS Fast Path ============
    // 占位图 src 模式: 给 img 加暗背景色, 避免白闪窗口 (在 JS 跑前生效)
    const styleNode = document.createElement('style');
    styleNode.textContent = `
        img[src*="loading"],
        img[src*="blank"],
        img[src*="placeholder"],
        img[src*="transparent"],
        img[src*="spacer"] {
            background-color: #1a1a1a !important;
            filter: none !important;
        }
    `;
    (document.head || document.documentElement).appendChild(styleNode);

    // ============ 路径 1: 占位图 → 改 src 为暗色 SVG (v1.1.11) ============

    function applyDarkPlaceholder(img) {
        if (!img || img.tagName !== 'IMG') return;
        if (img.dataset.dcHandled) return;

        const currentSrc = img.currentSrc || img.src;
        if (!isPlaceholder(currentSrc)) return;
        if (img.complete && !isPlaceholder(img.currentSrc || img.src)) return;

        img.dataset.dcHandled = '1';

        // 改 src 为暗色 SVG. img 元素自身显示暗色 + loading 文字.
        img.dataset.dcOriginalSrc = img.src;
        img.src = DARK_LOADING_SVG;

        // cleanup: 真实图加载完成时清理
        let cleaned = false;
        const cleanup = () => {
            if (cleaned) return;
            const newSrc = img.currentSrc || img.src;
            if (!isPlaceholder(newSrc) && img.complete) {
                cleaned = true;
                delete img.dataset.dcOriginalSrc;
                delete img.dataset.dcHandled;
                img.removeEventListener('load', cleanup);
                img.removeEventListener('error', cleanup);
                observer.disconnect();
            }
        };
        img.addEventListener('load', cleanup);
        img.addEventListener('error', cleanup);
        const observer = new MutationObserver(cleanup);
        observer.observe(img, { attributes: true, attributeFilter: ['src', 'srcset'] });
    }

    // ============ 路径 2: 加载中 → cover 盖住 (blob URL 等慢加载图) ============

    function applyLoadingCover(img) {
        if (!img || img.tagName !== 'IMG') return;
        if (img.dataset.dcHandled) return;
        if (img.complete && img.naturalHeight > 0) return;  // 已加载完成且有内容, 不处理

        img.dataset.dcHandled = '1';

        const container = img.parentElement;
        if (!container) return;

        // 父元素 inline position: relative
        container.style.setProperty('position', 'relative', 'important');

        // 覆盖层 div (inline z-index 2147483647 = int32 max)
        const cover = document.createElement('div');
        cover.className = 'tm-dc-cover';
        cover.setAttribute('data-dc-cover', '1');
        cover.style.setProperty('position', 'absolute', 'important');
        cover.style.setProperty('top', '0', 'important');
        cover.style.setProperty('left', '0', 'important');
        cover.style.setProperty('width', '100%', 'important');
        cover.style.setProperty('height', '100%', 'important');
        cover.style.setProperty('background-color', '#000000', 'important');
        cover.style.setProperty('z-index', '2147483647', 'important');
        cover.style.setProperty('pointer-events', 'none', 'important');
        cover.style.setProperty('filter', 'none', 'important');

        // 文字 badge
        const textWrap = document.createElement('div');
        textWrap.style.setProperty('position', 'absolute', 'important');
        textWrap.style.setProperty('top', '50%', 'important');
        textWrap.style.setProperty('left', '50%', 'important');
        textWrap.style.setProperty('transform', 'translate(-50%, -50%)', 'important');
        textWrap.style.setProperty('pointer-events', 'none', 'important');
        textWrap.style.setProperty('filter', 'none', 'important');
        textWrap.style.setProperty('text-align', 'center', 'important');
        textWrap.style.setProperty('line-height', '1.2', 'important');
        textWrap.style.setProperty('white-space', 'nowrap', 'important');

        const text1 = document.createElement('div');
        text1.textContent = '正在载入……';
        text1.style.setProperty('font-size', '12px', 'important');
        text1.style.setProperty('font-weight', '500', 'important');
        text1.style.setProperty('color', '#c0c0c0', 'important');
        text1.style.setProperty('font-family', "-apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif", 'important');
        text1.style.setProperty('filter', 'none', 'important');

        const text2 = document.createElement('div');
        text2.textContent = 'Loading...';
        text2.style.setProperty('font-size', '9px', 'important');
        text2.style.setProperty('color', '#808080', 'important');
        text2.style.setProperty('font-family', "-apple-system, sans-serif", 'important');
        text2.style.setProperty('margin-top', '2px', 'important');
        text2.style.setProperty('filter', 'none', 'important');

        textWrap.appendChild(text1);
        textWrap.appendChild(text2);
        cover.appendChild(textWrap);
        container.insertBefore(cover, img);

        // cleanup: 加载完成时移除 cover
        // 5s 兜底: 卡住 / 永久 loading 时强制清理 (transparent 区域, 不是漆黑)
        let cleaned = false;
        let fallbackTimer = null;
        const doCleanup = () => {
            if (cleaned) return;
            cleaned = true;
            if (cover.parentNode) cover.parentNode.removeChild(cover);
            delete img.dataset.dcHandled;
            img.removeEventListener('load', cleanup);
            img.removeEventListener('error', cleanup);
            observer.disconnect();
            if (fallbackTimer) { clearTimeout(fallbackTimer); fallbackTimer = null; }
        };
        const cleanup = () => {
            if (img.complete && img.naturalHeight > 0) doCleanup();
        };
        img.addEventListener('load', cleanup);
        img.addEventListener('error', cleanup);
        const observer = new MutationObserver(cleanup);
        observer.observe(img, { attributes: true, attributeFilter: ['src', 'srcset'] });
        fallbackTimer = setTimeout(doCleanup, 5000);
    }

    // ============ 统一入口: 根据 src 决定走哪条路径 ============

    function applyDarkOrLoadingCover(img) {
        if (!img || img.tagName !== 'IMG') return;
        if (img.dataset.dcHandled) return;

        const currentSrc = img.currentSrc || img.src;
        const isPlaceholderSrc = isPlaceholder(currentSrc);
        const isLoading = !img.complete || img.naturalHeight === 0;

        if (isPlaceholderSrc) {
            // 已知占位模式 → 改 src 为暗色 SVG (v1.1.11)
            applyDarkPlaceholder(img);
        } else if (isLoading) {
            // blob URL 等未知 src + 加载中 → cover 盖住 (v1.1.12 新增)
            applyLoadingCover(img);
        }
        // 已加载完成的非占位图 → 不处理
    }

    // ============ 启动 ============

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === 1) {
                    if (node.tagName === 'IMG') {
                        applyDarkOrLoadingCover(node);
                    } else if (node.querySelectorAll) {
                        node.querySelectorAll('img').forEach(applyDarkOrLoadingCover);
                    }
                }
            }
        }
    });

    if (document.documentElement) {
        observer.observe(document.documentElement, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            document.querySelectorAll('img').forEach(applyDarkOrLoadingCover);
        });
    } else {
        document.querySelectorAll('img').forEach(applyDarkOrLoadingCover);
    }
})();
