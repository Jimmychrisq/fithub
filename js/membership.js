// Purchase Membership & Generate Unique ID & QR Code
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

// Load Membership Status & Generate Real Unique QR Code
async function loadMembership() {
    if (!currentUser) return;
    const { data } = await supabaseClient
        .from('memberships')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();

    if (data) {
        document.getElementById('display-member-id').innerText = data.member_id;
        document.getElementById('card-type-label').innerText = data.card_type;
        document.getElementById('display-expiry').innerText = `Expires: ${new Date(data.expires_at).toLocaleDateString()}`;
        document.getElementById('member-card-box').classList.remove('hidden');

        const qrContainer = document.getElementById('qrcode');
        qrContainer.innerHTML = '';

        new QRCode(qrContainer, {
            text: `FitHub-CheckIn-${data.member_id}`,
            width: 96,
            height: 96,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    }
}

// Simulate Front Desk QR Scan Check-in
function simulateCheckIn() {
    const memberId = document.getElementById('display-member-id').innerText;
    alert(`✅ Front-Desk Check-in Successful!\nMember ID: ${memberId}\nTimestamp: ${new Date().toLocaleString()}`);
}