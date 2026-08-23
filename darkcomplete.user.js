// ==UserScript==
// @name         darkComplete
// @namespace    https://github.com/k6G52m4Dz75W/darkComplete
// @version      1.1.13
// @description  专为暗色模式扩展 (如 Dark Reader) 锦上添花。把占位图 (imgloading.gif / blank.png 等) 替换为暗色 SVG, blob URL 慢加载图加白闪保护 (独立模块)。The icing on the dark mode cake for existing extensions.
// @author       darkComplete Contributors
// @match        *://*/*
// @run-at       document-start
// @icon         data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+CiAgICA8IS0tIOaal+iJsuWchuinkuaWueWdl+W6lSAo5pqX6Imy5qih5byPKSAtLT4KICAgIDxyZWN0IHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgcng9IjE0IiBmaWxsPSIjMGEwYTBhIi8+CgogICAgPCEtLSDmnIjniZk6IOmAmui/hyBtYXNrIOaKiueZveiJsuaciOmdouaMluaIkOW8r+aciCAtLT4KICAgIDxkZWZzPgogICAgICAgIDxtYXNrIGlkPSJtb29uLW1hc2siPgogICAgICAgICAgICA8cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIGZpbGw9IndoaXRlIi8+CiAgICAgICAgICAgIDxjaXJjbGUgY3g9IjQyIiBjeT0iMjYiIHI9IjE1IiBmaWxsPSJibGFjayIvPgogICAgICAgIDwvbWFzaz4KICAgIDwvZGVmcz4KCiAgICA8IS0tIOaciOmdouS4u+S9kyAobWFzayDkuYvlkI7lkYjnjrDlvK/mnIgpIC0tPgogICAgPGNpcmNsZSBjeD0iMzQiIGN5PSIzMiIgcj0iMTciIGZpbGw9IiNlZGVkZWQiIG1hc2s9InVybCgjbW9vbi1tYXNrKSIvPgoKICAgIDwhLS0g5Y+z5LiL6KeS5bCP5pif5pifOiDmmpfnpLoi5a6M5oiQL+aKm+WFiSIgLS0+CiAgICA8cGF0aCBkPSJNIDUwIDQyIEwgNTEuNSA0NS41IEwgNTUgNDcgTCA1MS41IDQ4LjUgTCA1MCA1MiBMIDQ4LjUgNDguNSBMIDQ1IDQ3IEwgNDguNSA0NS41IFoiIGZpbGw9IiNlZGVkZWQiLz4KPC9zdmc+Cg==
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // ============ v1.1.13: v1.1.11 主体回退 + blob URL 独立模块 ============
    //
    // v1.1.12 把"统一入口 applyDarkOrLoadingCover"引入, 但跟 v1.1.11 的 applyDarkPlaceholder
    // 共享 dataset.dcHandled 标记, 实际行为有 corner case (用户反馈"占位符逻辑破坏了").
    //
    // v1.1.13 回退到 v1.1.11 完整主体, blob URL 作为**完全独立**的模块:
    //   - 独立的 dataset.dcBlobHandled 标记 (不跟 dcHandled 冲突)
    //   - 独立的 MutationObserver (不跟 main observer 冲突)
    //   - 独立的 attrObserver (每个 blob URL img 单独 observe src 变化)
    //   - blob URL 模块出问题不影响占位图逻辑
    //
    // "blob 至少目前最好单独处理, 能稳定了才融入主线" - 用户 2026-08-23 反馈

    const PLACEHOLDER_PATTERNS = [
        /^data:image\//i,
        /imgloading|loading\.(gif|png|jpg|webp)|blank|placeholder|transparent|spacer|spinner/i
    ];

    function isPlaceholder(src) {
        if (!src) return true;
        return PLACEHOLDER_PATTERNS.some(pattern => pattern.test(src));
    }

    // 暗色 SVG data URL: 暗背景 (#1a1a1a) + "正在载入……" + "Loading..." 文字
    const DARK_LOADING_SVG =
        'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgNjAiIHByZXNlcnZlQXNwZWN0UmF0aW89InhNaWRZTWlkIG1lZXQiPjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iNjAiIGZpbGw9IiMxYTFhMWEiLz48dGV4dCB4PSI1MCIgeT0iMzAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSItYXBwbGUtc3lzdGVtLCBCbGlua01hY1N5c3RlbUZvbnQsICdQaW5nRmFuZyBTQycsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iNyIgZm9udC13ZWlnaHQ9IjUwMCIgZmlsbD0iI2MwYzBjMCI+5q2j5Zyo6L295YWl4oCm4oCmPC90ZXh0Pjx0ZXh0IHg9IjUwIiB5PSI0MiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgZm9udC1mYW1pbHk9Ii1hcHBsZS1zeXN0ZW0sIEJsaW5rTWFjU3lzdGVtRm9udCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSI1IiBmaWxsPSIjODA4MDgwIj5Mb2FkaW5nLi4uPC90ZXh0Pjwvc3ZnPg==';

    // ============ CSS Fast Path (v1.1.11 保留) ============
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

    // ============================================================
    //  模块 1: 占位图 → 暗色 SVG (v1.1.11 完整保留, 一个字不改)
    // ============================================================

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

    // ============================================================
    //  模块 2: blob URL 慢加载 → cover 盖住 (独立模块, 不与模块 1 共享状态)
    // ============================================================

    function applyBlobLoadingCover(img) {
        if (!img || img.tagName !== 'IMG') return;
        if (img.dataset.dcBlobHandled) return;

        const src = img.currentSrc || img.src;
        if (!src || !src.startsWith('blob:')) return;  // 只处理 blob URL
        if (img.complete && img.naturalHeight > 0) return;  // 已加载完成, 不处理

        img.dataset.dcBlobHandled = '1';

        const container = img.parentElement;
        if (!container) return;

        // 父元素 inline position: relative
        container.style.setProperty('position', 'relative', 'important');

        // 覆盖层 div (inline z-index 2147483647 = int32 max)
        const cover = document.createElement('div');
        cover.className = 'tm-dc-blob-cover';
        cover.setAttribute('data-dc-blob-cover', '1');
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

        // cleanup: 加载完成时移除 cover + 5s 兜底
        let cleaned = false;
        let fallbackTimer = null;
        const doCleanup = () => {
            if (cleaned) return;
            cleaned = true;
            if (cover.parentNode) cover.parentNode.removeChild(cover);
            delete img.dataset.dcBlobHandled;
            img.removeEventListener('load', onLoadOrError);
            img.removeEventListener('error', onLoadOrError);
            if (fallbackTimer) { clearTimeout(fallbackTimer); fallbackTimer = null; }
        };
        const onLoadOrError = () => {
            if (img.complete && img.naturalHeight > 0) doCleanup();
        };
        img.addEventListener('load', onLoadOrError);
        img.addEventListener('error', onLoadOrError);
        fallbackTimer = setTimeout(doCleanup, 5000);
    }

    // ============================================================
    //  启动
    // ============================================================

    // 模块 1 启动: 监听 DOM 树 (跟 v1.1.11 一样)
    const mainObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === 1) {
                    if (node.tagName === 'IMG') {
                        applyDarkPlaceholder(node);
                    } else if (node.querySelectorAll) {
                        node.querySelectorAll('img').forEach(applyDarkPlaceholder);
                    }
                }
            }
        }
    });
    if (document.documentElement) {
        mainObserver.observe(document.documentElement, { childList: true, subtree: true });
    }
    document.querySelectorAll('img').forEach(applyDarkPlaceholder);

    // 模块 2 启动: blob URL 独立处理
    // - 独立 MutationObserver 监听 DOM 树
    // - 独立 attrObserver 监听每个 img 的 src/srcset 变化 (捕获 page JS 改 src 为 blob URL)
    const blobAttrObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'attributes' && mutation.target.tagName === 'IMG') {
                const img = mutation.target;
                const src = img.currentSrc || img.src;
                if (src && src.startsWith('blob:')) {
                    applyBlobLoadingCover(img);
                }
            }
        }
    });

    const blobObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === 1) {
                    if (node.tagName === 'IMG') {
                        attachBlobHandler(node);
                    } else if (node.querySelectorAll) {
                        node.querySelectorAll('img').forEach(attachBlobHandler);
                    }
                }
            }
        }
    });

    function attachBlobHandler(img) {
        if (!img || img.tagName !== 'IMG') return;
        // 立即检查
        const src = img.currentSrc || img.src;
        if (src && src.startsWith('blob:')) {
            applyBlobLoadingCover(img);
        }
        // 监听 src/srcset 变化 (捕获 page JS 改 src 为 blob URL)
        blobAttrObserver.observe(img, { attributes: true, attributeFilter: ['src', 'srcset'] });
    }

    if (document.documentElement) {
        blobObserver.observe(document.documentElement, { childList: true, subtree: true });
    }
    document.querySelectorAll('img').forEach(attachBlobHandler);
})();
