// ==UserScript==
// @name         darkComplete
// @namespace    https://github.com/k6G52m4Dz75W/darkComplete
// @version      1.1.10
// @description  专为暗色模式扩展 (如 Dark Reader) 锦上添花。JS 接管图片未加载的白闪瞬间, 暗色模式下不再"白闪→图片"。占位图颜色反转交给 Dark Reader / Stylus 负责。The icing on the dark mode cake for existing extensions.
// @author       darkComplete Contributors
// @match        *://*/*
// @run-at       document-start
// @icon         data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+CiAgICA8IS0tIOaal+iJsuWchuinkuaWueWdl+W6lSAo5pqX6Imy5qih5byPKSAtLT4KICAgIDxyZWN0IHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgcng9IjE0IiBmaWxsPSIjMGEwYTBhIi8+CgogICAgPCEtLSDmnIjniZk6IOmAmui/hyBtYXNrIOaKiueZveiJsuaciOmdouaMluaIkOW8r+aciCAtLT4KICAgIDxkZWZzPgogICAgICAgIDxtYXNrIGlkPSJtb29uLW1hc2siPgogICAgICAgICAgICA8cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIGZpbGw9IndoaXRlIi8+CiAgICAgICAgICAgIDxjaXJjbGUgY3g9IjQyIiBjeT0iMjYiIHI9IjE1IiBmaWxsPSJibGFjayIvPgogICAgICAgIDwvbWFzaz4KICAgIDwvZGVmcz4KCiAgICA8IS0tIOaciOmdouS4u+S9kyAobWFzayDkuYvlkI7lkYjnjrDlvK/mnIgpIC0tPgogICAgPGNpcmNsZSBjeD0iMzQiIGN5PSIzMiIgcj0iMTciIGZpbGw9IiNlZGVkZWQiIG1hc2s9InVybCgjbW9vbi1tYXNrKSIvPgoKICAgIDwhLS0g5Y+z5LiL6KeS5bCP5pif5pifOiDmmpfnpLoi5a6M5oiQL+aKm+WFiSIgLS0+CiAgICA8cGF0aCBkPSJNIDUwIDQyIEwgNTEuNSA0NS41IEwgNTUgNDcgTCA1MS41IDQ4LjUgTCA1MCA1MiBMIDQ4LjUgNDguNSBMIDQ1IDQ3IEwgNDguNSA0NS41IFoiIGZpbGw9IiNlZGVkZWQiLz4KPC9zdmc+Cg==
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // ============ v1.1.10 简化设计 ============
    //
    // 历史 trade-off (v1.1.5 ~ v1.1.9):
    //   - 占位图不显示 vs 真实图显示 vs 不漆黑 vs 永远生效 → **4 选 2, 无法 4 全**
    //   - v1.1.7 改 src 翻车在永久占位图, v1.1.8 永远漆黑, v1.1.9 5s 后跟没装一样
    //   - 根因: darkComplete 抢占了本该是 Dark Reader 的职责 (占位图颜色反转)
    //
    // v1.1.10 退回正确定位:
    //   - darkComplete 只做 "白闪保护": 图片未加载时盖住, 加载完移除
    //   - 不再判定 src 是不是占位图 (之前的 PLACEHOLDER_PATTERNS / isPlaceholder 删除)
    //   - 不再 inline 隐藏 img (让 Dark Reader / Stylus 接管占位图颜色反转)
    //   - cover div z-index 2147483647 抗 stacking context (v1.1.7 的经验保留)
    //   - 5s 兜底 (v1.1.9 的经验保留)
    //   - broken 图 (404) 不立即清理, 5s 兜底后让用户看到 broken icon

    // ============ 核心: 加载期白闪保护 ============

    function applyLoadingCover(img) {
        if (!img || img.tagName !== 'IMG') return;
        if (img.dataset.dcHandled) return;
        // 已加载且有内容 → 跳过 (不盖住)
        if (img.complete && img.naturalHeight > 0) return;

        img.dataset.dcHandled = '1';

        const container = img.parentElement;
        if (!container) return;

        // 1. 父元素 inline position: relative (specificity 1,0,0,0 + !important, 覆盖 page CSS)
        container.style.setProperty('position', 'relative', 'important');

        // 2. 覆盖层 div (inline z-index 2147483647 = int32 max, 任何 stacking context 下都最上层)
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

        // 3. 文字 badge (居中, badge-sized, 双行: 中文 + 英文)
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

        // 4. cleanup: 加载完成 (有内容) 时移除 cover
        //    broken 图 (404) naturalHeight = 0, 不立即清理, 5s 兜底后用户能看到 broken icon
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
            if (img.complete && img.naturalHeight > 0) {
                doCleanup();
            }
        };
        img.addEventListener('load', cleanup);
        img.addEventListener('error', cleanup);
        const observer = new MutationObserver(cleanup);
        observer.observe(img, { attributes: true, attributeFilter: ['src', 'srcset'] });
        // 5s 兜底: 防止 broken / 卡住 / 永久 loading 永远 cover
        fallbackTimer = setTimeout(doCleanup, 5000);
    }

    // ============ 启动 ============

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === 1) {
                    if (node.tagName === 'IMG') {
                        applyLoadingCover(node);
                    } else if (node.querySelectorAll) {
                        node.querySelectorAll('img').forEach(applyLoadingCover);
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
            document.querySelectorAll('img').forEach(applyLoadingCover);
        });
    } else {
        document.querySelectorAll('img').forEach(applyLoadingCover);
    }
})();
