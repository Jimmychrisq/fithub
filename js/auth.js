// Safely set element text when the element exists
function setElementText(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
}

// Safely toggle element visibility (hidden = true hides, false shows)
function setElementHidden(id, hidden) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('hidden', hidden);
}

// Check login status on load
async function checkUser() {
    try {
        const { data: { user }, error } = await supabaseClient.auth.getUser();
        if (error) {
            console.error('获取登录状态失败:', error.message);
        }
        currentUser = user || null;
        window.currentUser = currentUser;

        if (!currentUser) {
            if (typeof currentUserRole !== 'undefined') {
                currentUserRole = 'member';
            }
            if (typeof updateCoachControlsVisibility === 'function') {
                updateCoachControlsVisibility();
            }
            setElementHidden('unauth-buttons', false);
            setElementHidden('auth-dropdown-container', true);
            setElementHidden('member-card-box', true);

            if (typeof loadAnnouncements === 'function') {
                loadAnnouncements();
            }
            if (typeof loadClasses === 'function') {
                await loadClasses();
            }
            if (typeof guardPageByAuth === 'function') {
                guardPageByAuth(false);
            }
            return;
        }

        // 先确保 portal 主体可见，避免后续子模块报错导致整页白屏/隐藏
        setElementHidden('portal-body', false);

        if (typeof guardPageByAuth === 'function') {
            guardPageByAuth(true);
        }

        const alias = currentUser.user_metadata?.alias || currentUser.email?.split('@')[0] || 'Member';
        setElementText('nav-username', `Hi, ${alias}`);

        setElementHidden('unauth-buttons', true);
        setElementHidden('auth-dropdown-container', false);

        if (typeof loadCurrentUserRole === 'function') {
            await loadCurrentUserRole();
        }
        if (typeof loadMembership === 'function') {
            await loadMembership();
        }
        if (typeof loadClasses === 'function') {
            await loadClasses();
        }
        if (typeof loadBookings === 'function') {
            await loadBookings();
        }
        if (typeof loadAnnouncements === 'function') {
            await loadAnnouncements();
        }
    } catch (err) {
        console.error('checkUser 执行异常:', err);
        if (currentUser) {
            setElementHidden('portal-body', false);
        }
    }
}

// Sign up with metadata (Alias, DOB, Phone, and Terms Consent)
async function handleSignUp() {
    const alias = document.getElementById('join-alias')?.value.trim();
    const email = document.getElementById('join-email')?.value.trim();
    const dob = document.getElementById('join-dob')?.value;
    const phone = document.getElementById('join-phone')?.value.trim();
    const password = document.getElementById('join-password')?.value;
    const agreed = document.getElementById('join-agree-terms')?.checked;

    if (!agreed) {
        return alert('Please read and agree to the Terms of Service & Privacy Policy first.');
    }

    if (!alias || !email || !password) {
        return alert('Please fill in Alias, Email, and Password.');
    }

    const acceptedAt = new Date().toISOString();

    const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
            data: {
                alias: alias,
                birthdate: dob,
                phone: phone,
                terms_accepted: true,
                terms_accepted_at: acceptedAt,
                terms_version: '2026-11'
            }
        }
    });

    if (error) {
        alert('Sign Up Failed: ' + error.message);
        return;
    }

    if (typeof closeModal === 'function') closeModal('join-modal');
    await checkUser();

    if (data?.session) {
        alert('Sign Up Successful! Welcome to FitHub.');
        if (typeof onLoginSuccess === 'function') {
            onLoginSuccess();
        }
    } else {
        alert('Sign Up Successful! Please check your email to confirm your account before signing in.');
    }
}

// Login
async function handleSignIn() {
    const email = document.getElementById('signin-email')?.value.trim();
    const password = document.getElementById('signin-password')?.value;

    if (!email || !password) return alert('Please enter email and password.');

    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
        alert('Login Failed: ' + error.message);
    } else {
        if (typeof closeModal === 'function') closeModal('signin-modal');
        await checkUser();
        if (typeof onLoginSuccess === 'function') {
            onLoginSuccess();
        }
    }
}

// Open Profile Modal with user metadata & admin announcements control
function openProfileModal() {
    if (!currentUser) return;
    const meta = currentUser.user_metadata || {};
    setElementText('prof-alias', meta.alias || 'N/A');
    setElementText('prof-email', currentUser.email || 'N/A');
    setElementText('prof-dob', meta.birthdate || 'N/A');
    setElementText('prof-phone', meta.phone || 'N/A');
    setElementText('prof-uid', currentUser.id || 'N/A');

    toggleEditMode(false);
    if (typeof resetAnnouncementForm === 'function') resetAnnouncementForm();

    const adminBox = document.getElementById('admin-announcement-box');
    if (adminBox) {
        if (typeof ADMIN_EMAIL !== 'undefined' && currentUser.email === ADMIN_EMAIL) {
            adminBox.classList.remove('hidden');
        } else {
            adminBox.classList.add('hidden');
        }
    }

    if (typeof loadProfileAnnouncements === 'function') loadProfileAnnouncements();

    setElementHidden('user-dropdown-menu', true);
    if (typeof openModal === 'function') openModal('profile-modal');
}

// Toggle between Profile View and Edit mode
function toggleEditMode(isEditing) {
    const viewMode = document.getElementById('profile-view-mode');
    const editMode = document.getElementById('profile-edit-mode');
    if (!viewMode || !editMode) return;

    if (isEditing) {
        const meta = currentUser.user_metadata || {};
        const aliasInput = document.getElementById('edit-alias');
        const dobInput = document.getElementById('edit-dob');
        const phoneInput = document.getElementById('edit-phone');
        if (aliasInput) aliasInput.value = meta.alias || '';
        if (dobInput) dobInput.value = meta.birthdate || '';
        if (phoneInput) phoneInput.value = meta.phone || '';

        viewMode.classList.add('hidden');
        editMode.classList.remove('hidden');
    } else {
        viewMode.classList.remove('hidden');
        editMode.classList.add('hidden');
    }
}

// Save Edited Profile to Supabase metadata while preserving terms consent metadata
async function saveProfile() {
    const newAlias = document.getElementById('edit-alias')?.value.trim();
    const newDob = document.getElementById('edit-dob')?.value;
    const newPhone = document.getElementById('edit-phone')?.value.trim();

    if (!newAlias) return alert('Alias cannot be empty.');

    const existingMeta = currentUser?.user_metadata || {};

    const { data, error } = await supabaseClient.auth.updateUser({
        data: {
            ...existingMeta,
            alias: newAlias,
            birthdate: newDob,
            phone: newPhone
        }
    });

    if (error) {
        alert('Update failed: ' + error.message);
    } else {
        currentUser = data.user;
        window.currentUser = currentUser;
        alert('Profile updated successfully!');

        setElementText('prof-alias', newAlias);
        setElementText('prof-dob', newDob || 'N/A');
        setElementText('prof-phone', newPhone || 'N/A');
        setElementText('nav-username', `Hi, ${newAlias}`);

        toggleEditMode(false);
    }
}

// Logout
async function handleSignOut() {
    await supabaseClient.auth.signOut();
    currentUser = null;
    window.currentUser = null;
    if (typeof currentUserRole !== 'undefined') {
        currentUserRole = 'member';
    }
    if (typeof updateCoachControlsVisibility === 'function') {
        updateCoachControlsVisibility();
    }
    if (typeof onLogoutSuccess === 'function') {
        onLogoutSuccess();
    } else {
        location.reload();
    }
}

// Enable or disable the Sign Up button based on the terms checkbox
function toggleSignUpButton() {
    const agreed = document.getElementById('join-agree-terms')?.checked;
    const btn = document.getElementById('join-submit-btn');
    if (btn) btn.disabled = !agreed;
}

// Check the terms checkbox and close the terms modal when confirmed
function acceptTermsFromModal() {
    const checkbox = document.getElementById('join-agree-terms');
    if (checkbox) checkbox.checked = true;
    toggleSignUpButton();
    closeModal('terms-modal');
}