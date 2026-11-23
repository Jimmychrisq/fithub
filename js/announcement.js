// Load Announcements for Main Page
async function loadAnnouncements() {
    const { data, error } = await supabaseClient
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

    const container = document.getElementById('announcements-list');
    if (error || !data || !data.length) return;

    container.innerHTML = data.map(item => `
        <div class="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-2">
            <p class="font-bold text-amber-800">${item.title}</p>
            <p class="text-xs text-amber-700 mt-0.5">${item.content}</p>
            <p class="text-[10px] text-amber-500 mt-1">${new Date(item.created_at).toLocaleString()}</p>
        </div>
    `).join('');
}

// Load Announcements inside Profile Modal
async function loadProfileAnnouncements() {
    const { data, error } = await supabaseClient
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

    const container = document.getElementById('profile-announcements-list');
    if (error || !data || !data.length) {
        container.innerHTML = '<p class="text-slate-400">No announcements found.</p>';
        return;
    }

    const isAdmin = currentUser && currentUser.email === ADMIN_EMAIL;

    container.innerHTML = data.map(item => `
        <div class="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-start gap-2">
            <div>
                <p class="font-bold text-slate-800">${item.title}</p>
                <p class="text-slate-600 mt-0.5">${item.content}</p>
                <p class="text-[10px] text-slate-400 mt-1">${new Date(item.created_at).toLocaleString()}</p>
            </div>
            ${isAdmin ? `
                <div class="flex gap-1 shrink-0">
                    <button onclick="editAnnouncement('${item.id}', \`${item.title.replace(/[`'\\]/g, '\\$&')}\`, \`${item.content.replace(/[`'\\]/g, '\\$&')}\`)" class="bg-amber-100 text-amber-700 px-2 py-1 rounded text-[10px] hover:bg-amber-200">Edit</button>
                    <button onclick="deleteAnnouncement('${item.id}')" class="bg-rose-100 text-rose-700 px-2 py-1 rounded text-[10px] hover:bg-rose-200">Delete</button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Admin: Save or Update Announcement
async function saveAnnouncement() {
    if (!currentUser) return alert('Please sign in first.');

    const id = document.getElementById('edit-announcement-id').value;
    const title = document.getElementById('announcement-title').value.trim();
    const content = document.getElementById('announcement-content').value.trim();

    if (!title || !content) {
        return alert('Please fill in both title and content.');
    }

    let error;
    if (id) {
        const res = await supabaseClient
            .from('announcements')
            .update({ title, content })
            .eq('id', id);
        error = res.error;
    } else {
        const res = await supabaseClient
            .from('announcements')
            .insert([{ title, content }]);
        error = res.error;
    }

    if (error) {
        alert('Operation failed: ' + error.message);
    } else {
        alert(id ? 'Announcement updated successfully!' : 'Announcement published successfully!');
        resetAnnouncementForm();
        loadProfileAnnouncements();
        loadAnnouncements();
    }
}

// Admin: Load item into form for editing
function editAnnouncement(id, title, content) {
    document.getElementById('edit-announcement-id').value = id;
    document.getElementById('announcement-title').value = title;
    document.getElementById('announcement-content').value = content;
    document.getElementById('announcement-submit-btn').innerText = 'Update Announcement';
    document.getElementById('announcement-cancel-btn').classList.remove('hidden');
}

// Admin: Reset form
function resetAnnouncementForm() {
    document.getElementById('edit-announcement-id').value = '';
    document.getElementById('announcement-title').value = '';
    document.getElementById('announcement-content').value = '';
    document.getElementById('announcement-submit-btn').innerText = 'Publish Announcement';
    document.getElementById('announcement-cancel-btn').classList.add('hidden');
}

// Admin: Delete Announcement
async function deleteAnnouncement(id) {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    const { error } = await supabaseClient
        .from('announcements')
        .delete()
        .eq('id', id);

    if (error) {
        alert('Delete failed: ' + error.message);
    } else {
        alert('Announcement deleted successfully!');
        loadProfileAnnouncements();
        loadAnnouncements();
    }
}