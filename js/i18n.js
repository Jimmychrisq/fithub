// js/i18n.js
const SUPPORTED_LANGS = ['en', 'zh', 'vi'];
const LANG_PAIR_MAP = {
    zh: 'en|zh-CN',
    vi: 'en|vi'
};
const NEXT_LANG_LABEL = {
    en: '中文',
    zh: 'VI',
    vi: 'EN'
};

let currentLang = localStorage.getItem('fithub_lang') || 'en';
if (!SUPPORTED_LANGS.includes(currentLang)) {
    currentLang = 'en';
}

let langRequestSeq = 0;

// 按批次执行异步任务，降低免费翻译接口并发限流概率
async function runWithConcurrency(items, limit, worker) {
    const queue = [...items];
    const runners = Array.from({ length: Math.min(limit, queue.length) }, async () => {
        while (queue.length > 0) {
            const item = queue.shift();
            if (item !== undefined) {
                await worker(item);
            }
        }
    });
    await Promise.all(runners);
}

// 调用 MyMemory 翻译接口并按目标语种缓存到 localStorage
async function translateText(text, targetLang) {
    if (!text || targetLang === 'en') return text;

    const langPair = LANG_PAIR_MAP[targetLang];
    if (!langPair) return text;

    const cacheKey = `i18n_cache_${targetLang}_${text}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) return cached;

    try {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(langPair)}`;
        const res = await fetch(url);
        if (!res.ok) return text;

        const data = await res.json();
        const rawTranslated = data?.responseData?.translatedText || '';

        if (!rawTranslated || rawTranslated.toUpperCase().includes('MYMEMORY WARNING')) {
            return text;
        }

        localStorage.setItem(cacheKey, rawTranslated);
        return rawTranslated;
    } catch (error) {
        console.warn(`Translation fallback to English (${targetLang}):`, error);
        return text;
    }
}

// 应用当前语言到整个页面
async function applyLanguage(lang = currentLang) {
    const seq = ++langRequestSeq;
    const nextLang = SUPPORTED_LANGS.includes(lang) ? lang : 'en';

    currentLang = nextLang;
    localStorage.setItem('fithub_lang', currentLang);
    document.documentElement.lang = currentLang;

    const btnLabel = document.getElementById('lang-label');
    if (btnLabel) {
        btnLabel.textContent = NEXT_LANG_LABEL[currentLang] || '中文';
    }

    const textNodes = Array.from(document.querySelectorAll('[data-i18n]'));
    const inputNodes = Array.from(document.querySelectorAll('[data-i18n-placeholder]'));

    await runWithConcurrency(textNodes, 4, async (el) => {
        if (!el.dataset.enText) {
            el.dataset.enText = el.textContent.trim();
        }
        const enText = el.dataset.enText;
        const translated = currentLang === 'en'
            ? enText
            : await translateText(enText, currentLang);

        if (seq === langRequestSeq) {
            el.textContent = translated;
        }
    });

    await runWithConcurrency(inputNodes, 4, async (el) => {
        if (!el.dataset.enPlaceholder) {
            el.dataset.enPlaceholder = (el.placeholder || '').trim();
        }
        const enPlaceholder = el.dataset.enPlaceholder;
        const translated = currentLang === 'en'
            ? enPlaceholder
            : await translateText(enPlaceholder, currentLang);

        if (seq === langRequestSeq) {
            el.placeholder = translated;
        }
    });
}

// 绑定到右上角按钮的点击事件：en -> zh -> vi -> en
function toggleLanguage() {
    const currentIndex = SUPPORTED_LANGS.indexOf(currentLang);
    const nextLang = SUPPORTED_LANGS[(currentIndex + 1) % SUPPORTED_LANGS.length];
    applyLanguage(nextLang);
}

// 兼容之前 index.html 里写的 onclick="cycleLanguage()"
function cycleLanguage() {
    toggleLanguage();
}

// 直接指定语种（如 setLanguage('vi')）
function setLanguage(lang) {
    applyLanguage(lang);
}

// 页面加载时恢复用户上次选择的语言
document.addEventListener('DOMContentLoaded', () => {
    if (currentLang !== 'en') {
        applyLanguage(currentLang);
    } else {
        const btnLabel = document.getElementById('lang-label');
        if (btnLabel) btnLabel.textContent = NEXT_LANG_LABEL.en;
    }
});