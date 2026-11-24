// js/router.js
const isPortalPage = window.location.pathname.endsWith('portal.html');
let isRedirecting = false;

function redirectTo(targetPage) {
    if (isRedirecting) return;
    const currentFile = window.location.pathname.split('/').pop() || 'index.html';
    if (currentFile === targetPage) return;

    isRedirecting = true;
    window.location.href = targetPage;
}

// 1. 登录成功后调用
function onLoginSuccess() {
    if (!isPortalPage) {
        redirectTo('portal.html');
    }
}

// 2. 退出登录后调用
function onLogoutSuccess() {
    if (isPortalPage) {
        redirectTo('index.html');
    }
}

// 3. 页面加载检查 session 时调用（hasSession 为 true/false）
function guardPageByAuth(hasSession) {
    if (isPortalPage && !hasSession) {
        redirectTo('index.html');
    }
}