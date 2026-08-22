// ==UserScript==
// @name         darkComplete
// @namespace    https://github.com/k6G52m4Dz75W/darkComplete
// @version      1.1.7
// @description  专为暗色模式扩展 (如 Dark Reader) 锦上添花。JS 接管 CSS 看不见的瞬间——未加载图片、懒加载、占位图——把暗色模式体验从 99% 推到 100%。The icing on the dark mode cake for existing extensions.
// @author       darkComplete Contributors
// @match        *://*/*
// @run-at       document-start
// @icon         data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+CiAgICA8IS0tIOaal+iJsuWchuinkuaWueWdl+W6lSAo5pqX6Imy5qih5byPKSAtLT4KICAgIDxyZWN0IHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgcng9IjE0IiBmaWxsPSIjMGEwYTBhIi8+CgogICAgPCEtLSDmnIjniZk6IOmAmui/hyBtYXNrIOaKiueZveiJsuaciOmdouaMluaIkOW8r+aciCAtLT4KICAgIDxkZWZzPgogICAgICAgIDxtYXNrIGlkPSJtb29uLW1hc2siPgogICAgICAgICAgICA8cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIGZpbGw9IndoaXRlIi8+CiAgICAgICAgICAgIDxjaXJjbGUgY3g9IjQyIiBjeT0iMjYiIHI9IjE1IiBmaWxsPSJibGFjayIvPgogICAgICAgIDwvbWFzaz4KICAgIDwvZGVmcz4KCiAgICA8IS0tIOaciOmdouS4u+S9kyAobWFzayDkuYvlkI7lkYjnjrDlvK/mnIgpIC0tPgogICAgPGNpcmNsZSBjeD0iMzQiIGN5PSIzMiIgcj0iMTciIGZpbGw9IiNlZGVkZWQiIG1hc2s9InVybCgjbW9vbi1tYXNrKSIvPgoKICAgIDwhLS0g5Y+z5LiL6KeS5bCP5pif5pifOiDmmpfnpLoi5a6M5oiQL+aKm+WFiSIgLS0+CiAgICA8cGF0aCBkPSJNIDUwIDQyIEwgNTEuNSA0NS41IEwgNTUgNDcgTCA1MS41IDQ4LjUgTCA1MCA1MiBMIDQ4LjUgNDguNSBMIDQ1IDQ3IEwgNDguNSA0NS41IFoiIGZpbGw9IiNlZGVkZWQiLz4KPC9zdmc+Cg==
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // ============ 配置常量 ============

    // 占位符 src 识别模式 (顺序敏感, 先匹配先赢; 可按需扩展)
    const PLACEHOLDER_PATTERNS = [
        /^data:image\//i,                                       // data URI 一律视为占位
        /imgloading|loading\.(gif|png|jpg|webp)|blank|placeholder|transparent|spacer|spinner/i
    ];

    // 1×1 transparent GIF —— 浏览器 fetch 后立即 1×1 透明, 完全不渲染原占位图
    // 这是 v1.1.7 的核心: 占位图 URL 根本不会被加载, 从源头解决问题
    const TRANSPARENT_GIF = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

    // ============ 工具函数 ============

    function isPlaceholder(src) {
        if (!src) return true;
        return PLACEHOLDER_PATTERNS.some(pattern => pattern.test(src));
    }

    // ============ CSS Fast Path ============
    // 在 JS 跑起来前先给常见占位 src 加 visibility: hidden, 压缩"白闪→黑底"窗口
    // inline style 后续会再加强, 这里只是 fast path

    const styleNode = document.createElement('style');
    styleNode.textContent = `
        /* Fast path: 常见占位 src 模式 → 立即隐藏 (在 JS 跑前) */
        img[src*="loading"],
        img[src*="blank"],
        img[src*="placeholder"],
        img[src*="transparent"],
        img[src*="spacer"] {
            visibility: hidden !important;
            filter: none !important;
        }
    `;
    (document.head || document.documentElement).appendChild(styleNode);

    // ============ 核心: 真 DOM 覆盖层 ============
    //
    // v1.1.7 架构改动:
    //   ❌ 不再用 ::after 兜底 (z-index 受 stacking context 影响, 极端场景失效)
    //   ❌ 不再用 counter/race condition 机制 (多图场景用"每图独立"替代)
    //   ✅ 改 src 为 1×1 transparent GIF (占位图根本不被 fetch)
    //   ✅ 真 <div> 覆盖层 (inline z-index: 2147483647 = int32 max)
    //   ✅ inline visibility: hidden + opacity: 0 双保险隐藏原图
    //
    // 为什么真 div 比 ::after 稳:
    //   - ::after z-index 在父元素 stacking context 内, 父元素 z-index: auto
    //     时跟其他 auto 元素按 DOM 顺序层叠, 容易被 page z-index: N 元素遮挡
    //   - 真 div 同样有 stacking 问题, 但用 z-index: 2147483647 (int32 max)
    //     在 *所有* stacking context 中都是最大值, 物理上无法被遮挡

    function applyDarkCover(img) {
        if (!img || img.tagName !== 'IMG') return;
        if (img.dataset.dcHandled) return;

        const currentSrc = img.currentSrc || img.src;
        if (!isPlaceholder(currentSrc)) return;     // 不是占位图, 不处理
        if (img.complete && !isPlaceholder(img.currentSrc || img.src)) return;  // 已加载真实图

        img.dataset.dcHandled = '1';

        const container = img.parentElement;
        if (!container) return;

        // 1. 改 src 为 1×1 transparent (从源头让占位图不渲染)
        //    data URL 浏览器立即 fetch 完, 1×1 不可见
        img.dataset.dcOriginalSrc = img.src;
        img.src = TRANSPARENT_GIF;

        // 2. 隐藏 img (inline !important 双保险: 即使 page JS 抢回原占位 src, img 也不显示)
        img.style.setProperty('visibility', 'hidden', 'important');
        img.style.setProperty('opacity', '0', 'important');
        img.style.setProperty('pointer-events', 'none', 'important');

        // 3. 父元素 inline position: relative (specificity 1,0,0,0 + !important, 覆盖 page CSS)
        container.style.setProperty('position', 'relative', 'important');

        // 4. 真 DOM 覆盖层 (inline z-index: 2147483647, 在任何 stacking context 中都最上层)
        const cover = document.createElement('div');
        cover.className = 'tm-dc-cover';
        cover.setAttribute('data-dc-cover', '1');
        cover.style.setProperty('position', 'absolute', 'important');
        cover.style.setProperty('top', '0', 'important');
        cover.style.setProperty('left', '0', 'important');
        cover.style.setProperty('width', '100%', 'important');
        cover.style.setProperty('height', '100%', 'important');
        cover.style.setProperty('background-color', '#000000', 'important');
        cover.style.setProperty('z-index', '2147483647', 'important');   // int32 max
        cover.style.setProperty('pointer-events', 'none', 'important');
        cover.style.setProperty('filter', 'none', 'important');

        // 5. 文字 badge (居中, badge-sized, 双行: 中文 + 英文)
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

        // 6. 监听 src 变化 → 真实图加载完成时清理覆盖
        let cleaned = false;
        const cleanup = () => {
            if (cleaned) return;
            const newSrc = img.currentSrc || img.src;
            if (!isPlaceholder(newSrc) && img.complete) {
                // 真实图加载完成: 还原 img + 移除覆盖
                cleaned = true;
                img.style.removeProperty('visibility');
                img.style.removeProperty('opacity');
                img.style.removeProperty('pointer-events');
                if (cover.parentNode) cover.parentNode.removeChild(cover);
                delete img.dataset.dcHandled;
                img.removeEventListener('load', cleanup);
                img.removeEventListener('error', cleanup);
                observer.disconnect();
            } else if (isPlaceholder(newSrc) && !img.dataset.dcHandled) {
                // page 后续又把 src 改回占位, 重新应用
                img.removeEventListener('load', cleanup);
                img.removeEventListener('error', cleanup);
                observer.disconnect();
                applyDarkCover(img);
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
                        applyDarkCover(node);
                    } else if (node.querySelectorAll) {
                        node.querySelectorAll('img').forEach(applyDarkCover);
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
            document.querySelectorAll('img').forEach(applyDarkCover);
        });
    } else {
        document.querySelectorAll('img').forEach(applyDarkCover);
    }
})();
