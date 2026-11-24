let isSendingCoachMsg = false;
const COACH_ENDPOINT = 'https://fcxhaxhuiuzgwvwltbhk.supabase.co/functions/v1/AI-coach';

// Send user fitness prompt and context to the Supabase Edge Function backed by Groq
async function sendCoachMessage() {
    if (isSendingCoachMsg) return;

    const inputEl = document.getElementById('ai-chat-input');
    const messagesEl = document.getElementById('ai-chat-messages');
    const sendBtn = document.getElementById('ai-chat-send-btn');
    if (!inputEl || !messagesEl) return;

    const prompt = inputEl.value.trim();
    if (!prompt) return;

    isSendingCoachMsg = true;
    if (sendBtn) sendBtn.disabled = true;

    messagesEl.innerHTML += `
        <div class="bg-indigo-600 text-white p-2.5 rounded-lg ml-8">
            ${escapeHtml(prompt)}
        </div>
    `;
    inputEl.value = '';

    const loadingId = 'coach-loading-' + Date.now();
    messagesEl.innerHTML += `
        <div id="${loadingId}" class="bg-indigo-50 text-indigo-700 p-2.5 rounded-lg mr-8 italic">
            Thinking...
        </div>
    `;
    messagesEl.scrollTop = messagesEl.scrollHeight;

    const userContext = {
        membershipPlan: document.getElementById('card-type-label')?.innerText || 'None',
        loggedIn: typeof currentUser !== 'undefined' ? Boolean(currentUser) : false,
        lang: document.documentElement.lang || 'en'
    };

    try {
        let bearerToken = typeof SUPABASE_ANON_KEY !== 'undefined' ? SUPABASE_ANON_KEY : '';
        if (typeof supabaseClient !== 'undefined' && supabaseClient?.auth?.getSession) {
            const { data } = await supabaseClient.auth.getSession();
            if (data?.session?.access_token) {
                bearerToken = data.session.access_token;
            }
        }

        const headers = {
            'Content-Type': 'application/json'
        };
        if (bearerToken) {
            headers['Authorization'] = `Bearer ${bearerToken}`;
            headers['apikey'] = bearerToken;
        }

        const res = await fetch(COACH_ENDPOINT, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                message: prompt,
                context: userContext
            })
        });

        const data = await res.json();
        document.getElementById(loadingId)?.remove();

        const textToShow = res.ok
            ? (data.reply || 'Empty response.')
            : `Coach unavailable: ${data.error || 'Please try again later.'}`;

        messagesEl.innerHTML += `
            <div class="bg-indigo-50 text-indigo-900 p-2.5 rounded-lg mr-8 whitespace-pre-line">
                ${escapeHtml(textToShow)}
            </div>
        `;
    } catch (err) {
        console.error('AI Coach request failed:', err);
        document.getElementById(loadingId)?.remove();
        const detail = err?.message ? ` (${escapeHtml(err.message)})` : '';
        messagesEl.innerHTML += `
            <div class="bg-rose-50 text-rose-700 p-2.5 rounded-lg mr-8">
                Network error while contacting AI Coach${detail}.
            </div>
        `;
    } finally {
        isSendingCoachMsg = false;
        if (sendBtn) sendBtn.disabled = false;
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}