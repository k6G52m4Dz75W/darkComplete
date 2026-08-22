// ==UserScript==
// @name         darkComplete
// @namespace    https://github.com/k6G52m4Dz75W/darkComplete
// @version      1.1.8
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

    // ============ 核心: 真 DOM 覆盖层 (v1.1.8 重写) ============
    //
    // v1.1.7 的 "改 src 为 1×1 transparent data URL" 思路在 **永久占位图场景**下翻车:
    //   很多网站 img src 直接设为占位图 (如 imgloading.gif), 没有 data-src 之类的
    //   lazy-load 触发机制, 占位图就是永久的. v1.1.7 改 src 之后, 真实图永远不来,
    //   cover 永远在, **图片永远不显示**.
    //
    // v1.1.8 退回去: 完全不碰 src, 只用三重保险隐藏 img:
    //   1. inline visibility: hidden (page JS 抢回 visible 也 OK)
    //   2. inline opacity: 0 (双保险, 即使 visibility 被抢回仍隐藏)
    //   3. 真 <div> 覆盖层 (z-index 2147483647, 物理上覆盖 img, 任何 stacking context 下都最上层)
    //
    // 真实图加载完成时 cleanup 移除全部 inline style + 移除 cover, img 正常显示.

    function applyDarkCover(img) {
        if (!img || img.tagName !== 'IMG') return;
        if (img.dataset.dcHandled) return;

        const currentSrc = img.currentSrc || img.src;
        if (!isPlaceholder(currentSrc)) return;     // 不是占位图, 不处理
        if (img.complete && !isPlaceholder(img.currentSrc || img.src)) return;  // 已加载真实图

        img.dataset.dcHandled = '1';

        const container = img.parentElement;
        if (!container) return;

        // 1. 隐藏 img (三保险: visibility + opacity + pointer-events)
        //    关键: 不改 img.src! 占位图正常 fetch, 真实图替换时也能正常 load
        img.style.setProperty('visibility', 'hidden', 'important');
        img.style.setProperty('opacity', '0', 'important');
        img.style.setProperty('pointer-events', 'none', 'important');

        // 2. 父元素 inline position: relative (specificity 1,0,0,0 + !important, 覆盖 page CSS)
        container.style.setProperty('position', 'relative', 'important');

        // 3. 真 DOM 覆盖层 (inline z-index: 2147483647, 任何 stacking context 下都最上层)
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

        // 4. 文字 badge (居中, badge-sized, 双行: 中文 + 英文)
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

        // 5. cleanup: 真实图加载完成时移除 inline 隐藏 style + 移除 cover
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
