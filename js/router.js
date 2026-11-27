const currentPath = window.location.pathname.replace(/\/+$/, '') || '/';
const isPortalPage = /(?:^|\/)portal(?:\.html)?$/.test(currentPath);
let isRedirecting = false;

function redirectTo(targetPage) {
    if (isRedirecting) return;

    const normalizedCurrent = currentPath === '/' ? '/index.html' : currentPath;
    const normalizedTarget = targetPage.startsWith('/')
        ? targetPage.replace(/\/+$/, '') || '/index.html'
        : '/' + targetPage.replace(/^\.?\//, '');

    if (normalizedCurrent === normalizedTarget) return;

    isRedirecting = true;
    window.location.replace(targetPage);
}

// 1. login success session call
function onLoginSuccess() {
    if (!isPortalPage) {
        redirectTo('portal.html');
    }
}

// 2. logout
function onLogoutSuccess() {
    if (isPortalPage) {
        redirectTo('index.html');
    }
}

// 3. loading session call (hasSession is true/false)
function guardPageByAuth(hasSession) {
    if (isPortalPage && !hasSession) {
        redirectTo('index.html');
    }
}