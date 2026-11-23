// Modal utilities
function openModal(id) {
    document.getElementById(id).classList.remove('hidden');
}

function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
}

// Toggle Navbar User Dropdown
function toggleUserDropdown() {
    const menu = document.getElementById('user-dropdown-menu');
    menu.classList.toggle('hidden');
}

// Close dropdown when clicking outside
window.addEventListener('click', function(e) {
    const container = document.getElementById('auth-dropdown-container');
    if (container && !container.contains(e.target)) {
        document.getElementById('user-dropdown-menu').classList.add('hidden');
    }
});

// Auto-initialize on load
checkUser();