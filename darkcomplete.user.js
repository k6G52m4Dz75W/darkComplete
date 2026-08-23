// ==UserScript==
// @name         darkComplete
// @namespace    https://github.com/k6G52m4Dz75W/darkComplete
// @version      1.1.14
// @description  专为暗色模式扩展 (如 Dark Reader) 锦上添花。把占位图 (imgloading.gif / blank.png 等) 替换为暗色背景 + "正在载入……" 的 SVG, 不破坏真实图加载。The icing on the dark mode cake for existing extensions.
// @author       darkComplete Contributors
// @match        *://*/*
// @run-at       document-start
// @icon         data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+CiAgICA8IS0tIOaal+iJsuWchuinkuaWueWdl+W6lSAo5pqX6Imy5qih5byPKSAtLT4KICAgIDxyZWN0IHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgcng9IjE0IiBmaWxsPSIjMGEwYTBhIi8+CgogICAgPCEtLSDmnIjniZk6IOmAmui/hyBtYXNrIOaKiueZveiJsuaciOmdouaMluaIkOW8r+aciCAtLT4KICAgIDxkZWZzPgogICAgICAgIDxtYXNrIGlkPSJtb29uLW1hc2siPgogICAgICAgICAgICA8cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIGZpbGw9IndoaXRlIi8+CiAgICAgICAgICAgIDxjaXJjbGUgY3g9IjQyIiBjeT0iMjYiIHI9IjE1IiBmaWxsPSJibGFjayIvPgogICAgICAgIDwvbWFzaz4KICAgIDwvZGVmcz4KCiAgICA8IS0tIOaciOmdouS4u+S9kyAobWFzayDkuYvlkI7lkYjnjrDlvK/mnIgpIC0tPgogICAgPGNpcmNsZSBjeD0iMzQiIGN5PSIzMiIgcj0iMTciIGZpbGw9IiNlZGVkZWQiIG1hc2s9InVybCgjbW9vbi1tYXNrKSIvPgoKICAgIDwhLS0g5Y+z5LiL6KeS5bCP5pif5pifOiDmmpfnpLoi5a6M5oiQL+aKm+WFiSIgLS0+CiAgICA8cGF0aCBkPSJNIDUwIDQyIEwgNTEuNSA0NS41IEwgNTUgNDcgTCA1MS41IDQ4LjUgTCA1MCA1MiBMIDQ4LjUgNDguNSBMIDQ1IDQ3IEwgNDguNSA0NS41IFoiIGZpbGw9IiNlZGVkZWQiLz4KPC9zdmc+Cg==
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // ============ v1.1.11: 替换占位图为暗色 SVG (含 loading 文字) ============
    //
    // 思路 (来自用户洞察):
    //   把占位图 (imgloading.gif / blank.png 等) **替换**为暗色背景 + "正在载入……" 的 SVG.
    //   img 元素本身显示这个暗色 SVG, 不需要 cover div, 不需要 inline visibility/opacity 隐藏.
    //   物理上占位图永远不可见 (因为 src 已经被替换), 物理上永不漆黑 (img 元素有暗色 + 文字内容).
    //
    // 历史翻车 (v1.1.5 ~ v1.1.10):
    //   - v1.1.5:  visibility:hidden 被 page CSS 抢回
    //   - v1.1.7:  1×1 transparent data URL → 永久占位图漆黑 (img 元素变成"看不见的小像素")
    //   - v1.1.8:  inline visibility + cover div → stacking context 失效 / 永远黑框
    //   - v1.1.9:  5s 兜底 → "跟没装一样"
    //   - v1.1.10: 退回白闪保护 → 仍 "跟没装一样" (占位图交回 Dark Reader)
    //
    // v1.1.11 优势:
    //   - img 元素本身有内容 (暗色 SVG), 永远不漆黑
    //   - 永久占位图永远显示 "正在载入……" + 暗背景 (用户期望的体验)
    //   - 真实图来时, page JS 改 src → 暗色 SVG 被替换 → 真实图显示
    //   - 不需要 cover div, 不依赖 stacking context
    //   - 不需要 inline visibility/opacity (page CSS 抢不回来, 因为是 src 改变了)
    //   - 不需要 5s 兜底 (暗色 SVG 永远 complete, 永远不卡)

    const PLACEHOLDER_PATTERNS = [
        /^data:image\//i,                                       // data URI 一律视为占位
        /imgloading|loading\.(gif|png|jpg|webp)|blank|placeholder|transparent|spacer|spinner/i
    ];

    function isPlaceholder(src) {
        if (!src) return true;
        return PLACEHOLDER_PATTERNS.some(pattern => pattern.test(src));
    }

    // 暗色 SVG data URL: 暗背景 (#1a1a1a) + "正在载入……" + "Loading..." 文字
    // 5:3 viewBox 适合大多数横向占位图, preserveAspectRatio="xMidYMid meet" 居中显示
    // 当占位图 src 被替换为这个 SVG, img 元素自身就显示暗色 + loading 文字
    const DARK_LOADING_SVG =
        'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgNjAiIHByZXNlcnZlQXNwZWN0UmF0aW89InhNaWRZTWlkIG1lZXQiPjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iNjAiIGZpbGw9IiMxYTFhMWEiLz48dGV4dCB4PSI1MCIgeT0iMzAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSItYXBwbGUtc3lzdGVtLCBCbGlua01hY1N5c3RlbUZvbnQsICdQaW5nRmFuZyBTQycsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iNyIgZm9udC13ZWlnaHQ9IjUwMCIgZmlsbD0iI2MwYzBjMCI+5q2j5Zyo6L295YWl4oCm4oCmPC90ZXh0Pjx0ZXh0IHg9IjUwIiB5PSI0MiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgZm9udC1mYW1pbHk9Ii1hcHBsZS1zeXN0ZW0sIEJsaW5rTWFjU3lzdGVtRm9udCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSI1IiBmaWxsPSIjODA4MDgwIj5Mb2FkaW5nLi4uPC90ZXh0Pjwvc3ZnPg==';

    // ============ CSS Fast Path (跟 v1.1.11 主逻辑不冲突, 仅补充) ============

    const styleNode = document.createElement('style');
    styleNode.textContent = `
        /* 占位图 src 模式: 给 img 加暗背景色, 避免白闪窗口 (在 JS 跑前生效) */
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

    // ============ 核心: 替换占位图为暗色 SVG ============

    function applyDarkPlaceholder(img) {
        if (!img || img.tagName !== 'IMG') return;
        if (img.dataset.dcHandled) return;

        const currentSrc = img.currentSrc || img.src;
        if (!isPlaceholder(currentSrc)) return;     // 不是占位图, 不处理
        if (img.complete && !isPlaceholder(img.currentSrc || img.src)) return;  // 已加载真实图

        img.dataset.dcHandled = '1';

        // 关键: 改 src 为暗色 SVG. img 元素自身显示暗色 + loading 文字.
        // 浏览器立刻 fetch 暗色 SVG (data URL 同步), img 元素渲染暗色 SVG.
        // 原占位图 src 永不被 fetch (除非 page JS 后续改 src).
        img.dataset.dcOriginalSrc = img.src;
        img.src = DARK_LOADING_SVG;

        // cleanup: 真实图加载完成时清理 dcHandled, 让 darkComplete 不再干预
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

    // ============ 启动 ============

    const observer = new MutationObserver((mutations) => {
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

    // @run-at document-start 时 documentElement 已存在
    if (document.documentElement) {
        observer.observe(document.documentElement, { childList: true, subtree: true });
    }

    // readyState 兼容
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            document.querySelectorAll('img').forEach(applyDarkPlaceholder);
        });
    } else {
        document.querySelectorAll('img').forEach(applyDarkPlaceholder);
    }
})();
