// js/router.js
const currentPath = window.location.pathname.replace(/\/+$/, '') || '/';
const isPortalPage = currentPath === '/portal' || currentPath.endsWith('/portal.html');
let isRedirecting = false;

function redirectTo(targetPage) {
    if (isRedirecting) return;
    const normalizedTarget = targetPage.replace(/\/+$/, '') || '/';
    if (currentPath === normalizedTarget) return;

    isRedirecting = true;
    window.location.replace(targetPage);
}

// 1. 登录成功后调用
function onLoginSuccess() {
    if (!isPortalPage) {
        redirectTo('/portal');
    }
}

// 2. 退出登录后调用
function onLogoutSuccess() {
    if (isPortalPage) {
        redirectTo('/');
    }
}

// 3. 页面加载检查 session 时调用（hasSession 为 true/false）
function guardPageByAuth(hasSession) {
    if (isPortalPage && !hasSession) {
        redirectTo('/');
    }
}
