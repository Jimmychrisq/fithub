let activeQrPayload = '';

// Purchase Membership & Generate Unique ID
async function buyMembership(cardType, price) {
    if (!currentUser) return alert('Please login first to purchase a membership!');

    const uniqueMemberId = 'MEM-' + Math.floor(100000 + Math.random() * 900000);
    const expiresAt = new Date();
    if (cardType.includes('Annual')) expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    else expiresAt.setMonth(expiresAt.getMonth() + 1);

    const { error } = await supabaseClient.from('memberships').insert([
        {
            user_id: currentUser.id,
            member_id: uniqueMemberId,
            card_type: cardType,
            expires_at: expiresAt.toISOString()
        }
    ]);

    if (error) {
        alert('Purchase processed or membership already active: ' + error.message);
    } else {
        alert(`Payment of $${price} via Apple/Google Pay successful! Membership activated.`);
        loadMembership();
    }
}

// Load Membership Status (Card info only; QR is rendered lazily on modal open)
async function loadMembership() {
    if (!currentUser) return;
    const { data } = await supabaseClient
        .from('memberships')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();

    if (data) {
        const displayIdEl = document.getElementById('display-member-id');
        const typeLabelEl = document.getElementById('card-type-label');
        const expiryEl = document.getElementById('display-expiry');
        const cardBoxEl = document.getElementById('member-card-box');
        const modalIdEl = document.getElementById('qr-modal-member-id');

        if (displayIdEl) displayIdEl.innerText = data.member_id;
        if (typeLabelEl) typeLabelEl.innerText = data.card_type;
        if (expiryEl) expiryEl.innerText = `Expires: ${new Date(data.expires_at).toLocaleDateString()}`;
        if (modalIdEl) modalIdEl.innerText = data.member_id;
        if (cardBoxEl) cardBoxEl.classList.remove('hidden');

        activeQrPayload = `FitHub-CheckIn-${data.member_id}`;
    }
}

// Open QR Code Modal & Generate QR Code on demand
function openQrCodeModal() {
    if (!activeQrPayload) {
        return alert('No active membership QR code available.');
    }

    const qrContainer = document.getElementById('qrcode');
    if (!qrContainer) return;

    qrContainer.innerHTML = '';

    if (typeof QRCode === 'function') {
        new QRCode(qrContainer, {
            text: activeQrPayload,
            width: 168,
            height: 168,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });
    }

    if (typeof openModal === 'function') {
        openModal('qrcode-modal');
    } else {
        document.getElementById('qrcode-modal')?.classList.remove('hidden');
    }
}

// Close QR Code Modal
function closeQrCodeModal() {
    if (typeof closeModal === 'function') {
        closeModal('qrcode-modal');
    } else {
        document.getElementById('qrcode-modal')?.classList.add('hidden');
    }

    const qrContainer = document.getElementById('qrcode');
    if (qrContainer) qrContainer.innerHTML = '';
}

// Simulate Front Desk QR Scan Check-in
function simulateCheckIn() {
    const memberId = document.getElementById('display-member-id')?.innerText || 'MEM-XXXXXX';
    alert(`✅ Front-Desk Check-in Successful!\nMember ID: ${memberId}\nTimestamp: ${new Date().toLocaleString()}`);
}

// Toggle animated expansion/collapse of membership plan cards and update button accessibility & arrow state
function toggleMembershipOptions() {
    const panel = document.getElementById('membership-options-panel');
    const btn = document.getElementById('toggle-membership-options-btn');
    const chevron = document.getElementById('membership-options-chevron');
    if (!panel) return;

    // Switch grid-rows transition class and read the resulting open state
    const isOpen = panel.classList.toggle('is-open');

    // Sync ARIA state for screen readers / accessibility
    if (btn) btn.setAttribute('aria-expanded', String(isOpen));

    // Rotate chevron icon to indicate expanded (down/up flip) or collapsed state
    if (chevron) chevron.classList.toggle('rotate-180', isOpen);
}