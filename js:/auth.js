// Check Login Status on Load
async function checkUser() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    currentUser = user;

    const unauthBtns = document.getElementById('unauth-buttons');
    const authDropdown = document.getElementById('auth-dropdown-container');

    if (user) {
        const alias = user.user_metadata?.alias || user.email.split('@')[0];
        document.getElementById('nav-username').innerText = `Hi, ${alias}`;
        
        unauthBtns.classList.add('hidden');
        authDropdown.classList.remove('hidden');

        loadMembership();
        loadClasses();
        loadBookings();
    } else {
        unauthBtns.classList.remove('hidden');
        authDropdown.classList.add('hidden');
        document.getElementById('member-card-box').classList.add('hidden');
    }
    
    loadAnnouncements();
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

    const { error } = await supabaseClient.auth.signUp({
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
        alert('Sign Up Successful! You can now login.');
        closeModal('join-modal');
        checkUser();
    }
}

// Login
async function handleSignIn() {
    const email = document.getElementById('signin-email').value.trim();
    const password = document.getElementById('signin-password').value;

    if (!email || !password) return alert('Please enter email and password.');

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
        alert('Login Failed: ' + error.message);
    } else {
        alert('Login Successful!');
        closeModal('signin-modal');
        checkUser();
    }
}

// Open Profile Modal with user metadata & admin announcements control
function openProfileModal() {
    if (!currentUser) return;
    const meta = currentUser.user_metadata || {};
    document.getElementById('prof-alias').innerText = meta.alias || 'N/A';
    document.getElementById('prof-email').innerText = currentUser.email || 'N/A';
    document.getElementById('prof-dob').innerText = meta.birthdate || 'N/A';
    document.getElementById('prof-phone').innerText = meta.phone || 'N/A';
    document.getElementById('prof-uid').innerText = currentUser.id || 'N/A';

    toggleEditMode(false);
    resetAnnouncementForm();

    const adminBox = document.getElementById('admin-announcement-box');
    if (currentUser.email === ADMIN_EMAIL) {
        adminBox.classList.remove('hidden');
    } else {
        adminBox.classList.add('hidden');
    }

    loadProfileAnnouncements();

    document.getElementById('user-dropdown-menu').classList.add('hidden');
    openModal('profile-modal');
}

// Toggle between Profile View and Edit mode
function toggleEditMode(isEditing) {
    const viewMode = document.getElementById('profile-view-mode');
    const editMode = document.getElementById('profile-edit-mode');
    
    if (isEditing) {
        const meta = currentUser.user_metadata || {};
        document.getElementById('edit-alias').value = meta.alias || '';
        document.getElementById('edit-dob').value = meta.birthdate || '';
        document.getElementById('edit-phone').value = meta.phone || '';

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
        
        document.getElementById('prof-alias').innerText = newAlias;
        document.getElementById('prof-dob').innerText = newDob || 'N/A';
        document.getElementById('prof-phone').innerText = newPhone || 'N/A';
        document.getElementById('nav-username').innerText = `Hi, ${newAlias}`;

        toggleEditMode(false);
    }
}

// Logout
async function handleSignOut() {
    await supabaseClient.auth.signOut();
    alert('Logged out successfully.');
    location.reload();
}