// js/i18n.js
let isZh = localStorage.getItem('fithub_lang') === 'zh';

// 调用免费翻译接口并缓存到 localStorage
async function translateTextToZh(text) {
    if (!text) return text;
    const cacheKey = 'zh_cache_' + text;
    const cached = localStorage.getItem(cacheKey);
    if (cached) return cached;

    try {
        const res = await fetch(
            `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|zh-CN`
        );
        const data = await res.json();
        const translated = data?.responseData?.translatedText || text;
        localStorage.setItem(cacheKey, translated);
        return translated;
    } catch (error) {
        console.warn('Translation fallback to English:', error);
        return text;
    }
}

// 应用当前语言到整个页面
async function applyLanguage() {
    localStorage.setItem('fithub_lang', isZh ? 'zh' : 'en');
    document.documentElement.lang = isZh ? 'zh' : 'en';

    // 更新右上角按钮文字
    const btnLabel = document.getElementById('lang-label');
    if (btnLabel) {
        btnLabel.textContent = isZh ? 'EN' : '中文';
    }

    // 1. 并发翻译所有带 data-i18n 的文本节点
    const textNodes = Array.from(document.querySelectorAll('[data-i18n]'));
    await Promise.all(textNodes.map(async (el) => {
        if (!el.dataset.enText) {
            el.dataset.enText = el.textContent.trim();
        }
        const enText = el.dataset.enText;
        el.textContent = isZh ? await translateTextToZh(enText) : enText;
    }));

    // 2. 并发翻译所有带 data-i18n-placeholder 的输入框提示词
    const inputNodes = Array.from(document.querySelectorAll('[data-i18n-placeholder]'));
    await Promise.all(inputNodes.map(async (el) => {
        if (!el.dataset.enPlaceholder) {
            el.dataset.enPlaceholder = el.placeholder.trim();
        }
        const enPlaceholder = el.dataset.enPlaceholder;
        el.placeholder = isZh ? await translateTextToZh(enPlaceholder) : enPlaceholder;
    }));
}

// 绑定到右上角按钮的点击事件
function toggleLanguage() {
    isZh = !isZh;
    applyLanguage();
}

// 页面加载时恢复用户上次选择的语言
document.addEventListener('DOMContentLoaded', () => {
    if (isZh) {
        applyLanguage();
    }
});