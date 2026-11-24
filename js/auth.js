// 安全设置元素文本（元素不存在时跳过，不抛 null 错误）
function setElementText(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
}

// 安全切换元素显隐（hidden = true 隐藏，false 显示）
function setElementHidden(id, hidden) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('hidden', hidden);
}

// Check Login Status on Load
async function checkUser() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    currentUser = user;

    if (typeof guardPageByAuth === 'function') {
        guardPageByAuth(Boolean(user));
    }

    if (user) {
        const alias = user.user_metadata?.alias || user.email.split('@')[0];
        setElementText('nav-username', `Hi, ${alias}`);

        setElementHidden('unauth-buttons', true);
        setElementHidden('auth-dropdown-container', false);

        if (typeof loadMembership === 'function') loadMembership();
        if (typeof loadClasses === 'function') loadClasses();
        if (typeof loadBookings === 'function') loadBookings();
    } else {
        setElementHidden('unauth-buttons', false);
        setElementHidden('auth-dropdown-container', true);
        setElementHidden('member-card-box', true);
    }

    if (typeof loadAnnouncements === 'function') {
        loadAnnouncements();
    }
}

// Sign Up with metadata (Alias, DOB, Phone)
async function handleSignUp() {
    const alias = document.getElementById('join-alias').value.trim();
    const email = document.getElementById('join-email').value.trim();
    const dob = document.getElementById('join-dob').value;
    const phone = document.getElementById('join-phone').value.trim();
    const password = document.getElementById('join-password').value;

    if (!alias || !email || !password) {
        return alert('Please fill in Alias, Email, and Password.');
    }

    const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
            data: {
                alias: alias,
                birthdate: dob,
                phone: phone
            }
        }
    });

    if (error) {
        alert('Sign Up Failed: ' + error.message);
    } else {
        alert('Sign Up Successful!');
        if (typeof closeModal === 'function') closeModal('join-modal');
        await checkUser();
        // 如果注册后直接拿到了 session，跳转到 portal.html
        if (data?.session && typeof onLoginSuccess === 'function') {
            onLoginSuccess();
        }
    }
}

// Login
async function handleSignIn() {
    const email = document.getElementById('signin-email').value.trim();
    const password = document.getElementById('signin-password').value;

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
        if (currentUser.email === ADMIN_EMAIL) {
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

// Save Edited Profile to Supabase metadata
async function saveProfile() {
    const newAlias = document.getElementById('edit-alias').value.trim();
    const newDob = document.getElementById('edit-dob').value;
    const newPhone = document.getElementById('edit-phone').value.trim();

    if (!newAlias) return alert('Alias cannot be empty.');

    const { data, error } = await supabaseClient.auth.updateUser({
        data: {
            alias: newAlias,
            birthdate: newDob,
            phone: newPhone
        }
    });

    if (error) {
        alert('Update failed: ' + error.message);
    } else {
        currentUser = data.user;
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
    if (typeof onLogoutSuccess === 'function') {
        onLogoutSuccess();
    } else {
        location.reload();
    }
}