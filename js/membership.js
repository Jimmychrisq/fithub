let activeQrPayload = '';

// Purchase or Renew Membership while preserving existing member_id
async function buyMembership(cardType, price) {
    if (!currentUser) return alert('Please login first to purchase a membership!');

    // 1. Check if the user already has a membership record
    const { data: existing, error: fetchError } = await supabaseClient
        .from('memberships')
        .select('*')
        .eq('user_id', currentUser.id)
        .maybeSingle();

    if (fetchError) {
        return alert('Failed to check membership status: ' + fetchError.message);
    }

    // 2. Keep existing member_id if present; extend expiry from current expiry if still active
    const memberId =
        existing?.member_id || ('MEM-' + Math.floor(100000 + Math.random() * 900000));

    const now = new Date();
    const baseDate =
        existing?.expires_at && new Date(existing.expires_at) > now
            ? new Date(existing.expires_at)
            : now;

    const expiresAt = new Date(baseDate);
    if (cardType.includes('Annual')) {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    // 3. Upsert on user_id (requires UNIQUE constraint on memberships.user_id)
    const { error: upsertError } = await supabaseClient
        .from('memberships')
        .upsert(
            [
                {
                    user_id: currentUser.id,
                    member_id: memberId,
                    card_type: cardType,
                    expires_at: expiresAt.toISOString()
                }
            ],
            { onConflict: 'user_id' }
        );

    if (upsertError) {
        alert('Membership update failed: ' + upsertError.message);
    } else {
        const actionLabel = existing ? 'renewed/updated' : 'activated';
        alert(`Payment of $${price} via Apple/Google Pay successful! Membership ${actionLabel}.`);
        await loadMembership();
    }
}

// Load Membership Status (Card info only; QR is rendered lazily on modal open)
async function loadMembership() {
    if (!currentUser) return;

    const { data, error } = await supabaseClient
        .from('memberships')
        .select('*')
        .eq('user_id', currentUser.id)
        .maybeSingle();

    if (error) {
        console.error('Error loading membership:', error.message);
        return;
    }

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
    } else {
        activeQrPayload = '';
        document.getElementById('member-card-box')?.classList.add('hidden');
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

    const isOpen = panel.classList.toggle('is-open');
    if (btn) btn.setAttribute('aria-expanded', String(isOpen));
    if (chevron) chevron.classList.toggle('rotate-180', isOpen);
}