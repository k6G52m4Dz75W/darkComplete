// ==UserScript==
// @name         darkComplete
// @namespace    https://github.com/k6G52m4Dz75W/darkComplete
// @version      1.0.0
// @description  try to take over the world!
// @author       darkComplete Contributors
// @match        *://*/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const PROCESS_ATTR = 'data-dark-processed';
    const STYLE_CLASS = 'tm-image-dark-placeholder';

    const styleNode = document.createElement('style');
    styleNode.textContent = `
        img[src*="imgloading.gif"] {
            visibility: hidden !important;
            background-color: #000000 !important;
        }

        .${STYLE_CLASS}-container {
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
        if (img.complete && img.naturalWidth > 10 && !isPlaceholder(currentSrc)) {
            return;
        }

        img.setAttribute(PROCESS_ATTR, 'processing');
        const container = img.parentElement;
        container.classList.add(`${STYLE_CLASS}-container`);

        const tryRemoveOverlay = () => {
            const nowSrc = img.currentSrc || img.src;
            if (img.complete && img.naturalWidth > 10 && !isPlaceholder(nowSrc)) {
                container.classList.add(`${STYLE_CLASS}-done`);
                img.setAttribute(PROCESS_ATTR, 'done');

                setTimeout(() => {
                    if (container.classList.contains(`${STYLE_CLASS}-container`)) {
                        container.classList.remove(`${STYLE_CLASS}-container`);
                        container.classList.remove(`${STYLE_CLASS}-done`);
                    }
                }, 120);
                return true;
            }
            return false;
        };

        const onCheck = () => {
            if (!tryRemoveOverlay()) {
                img.addEventListener('load', onCheck, { once: true });
            }
        };

        img.addEventListener('load', onCheck, { once: true });
        img.addEventListener('error', () => tryRemoveOverlay(), { once: true });

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

    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('img').forEach(applyCssDarkPlaceholder);
    });
})();