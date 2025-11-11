// ===================================
// CONFIG & MOCK DATA
// ===================================

const MOCK_USERS = [
    { username: 'admin', password: '1234', fullName: 'Admin User', role: 'Admin' },
    { username: 'teacher1', password: 'teach123', fullName: 'Dr. Sarah Johnson', role: 'Teacher' },
    { username: 'student1', password: 'stud123', fullName: 'John Smith', role: 'Student' }
];

const MOCK_ATTENDANCE = [
    { name: 'John Smith', role: 'Student', subject: 'Mathematics', semester: 1, date: '2025-11-11', time: '09:15:23', status: 'Present' },
    { name: 'Emma Davis', role: 'Student', subject: 'Computer Science', semester: 1, date: '2025-11-11', time: '09:16:45', status: 'Present' },
    { name: 'Dr. Sarah Johnson', role: 'Teacher', subject: 'Mathematics', semester: 1, date: '2025-11-11', time: '09:10:12', status: 'Present' }
];

// ===================================
// STATE
// ===================================

let currentUser = null;
let usersList = [];
let attendanceRecords = [];

// ===================================
// INIT
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    setupEventListeners();
    initializeApp();
});

function initializeApp() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        try { currentUser = JSON.parse(savedUser); } catch (e) { localStorage.removeItem('currentUser'); }
    }
    if (currentUser) showDashboard();
    else showLoginPage();
}

// ===================================
// LOCAL STORAGE
// ===================================

function loadFromLocalStorage() {
    const savedUsers = localStorage.getItem('usersList');
    usersList = savedUsers ? JSON.parse(savedUsers) : [...MOCK_USERS];

    if (!usersList.some(u => u.username.toLowerCase() === 'admin')) {
        usersList.unshift(MOCK_USERS[0]);
    }

    const savedAtt = localStorage.getItem('attendanceRecords');
    attendanceRecords = savedAtt ? JSON.parse(savedAtt) : [...MOCK_ATTENDANCE];
}

function saveToLocalStorage() {
    localStorage.setItem('usersList', JSON.stringify(usersList));
    localStorage.setItem('attendanceRecords', JSON.stringify(attendanceRecords));
}

// ===================================
// EVENT LISTENERS
// ===================================

function setupEventListeners() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

    document.querySelectorAll('.nav-item').forEach(item => {
        if (!item.classList.contains('logout-btn')) {
            item.addEventListener('click', () => handleNavigation(item));
        }
    });

    const tapNfcBtn = document.getElementById('tapNfcBtn');
    if (tapNfcBtn) tapNfcBtn.addEventListener('click', () => openModal('nfcModal'));
    const closeNfc = document.getElementById('closeNfcModal');
    if (closeNfc) closeNfc.addEventListener('click', () => closeModal('nfcModal'));

    const addUserBtn = document.getElementById('addUserBtn');
    if (addUserBtn) addUserBtn.addEventListener('click', showAddUserForm);

    const cancelUserBtn = document.getElementById('cancelUserBtn');
    if (cancelUserBtn) cancelUserBtn.addEventListener('click', hideAddUserForm);

    const userForm = document.getElementById('userForm');
    if (userForm) userForm.addEventListener('submit', handleSaveUser);

    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.addEventListener('input', e => renderAttendanceTable(e.target.value));

    const cancelEdit = document.getElementById('cancelEditAttendance');
    if (cancelEdit) cancelEdit.addEventListener('click', () => closeModal('editAttendanceModal'));
    const editForm = document.getElementById('editAttendanceForm');
    if (editForm) editForm.addEventListener('submit', handleSaveEditAttendance);

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', () => {
            const modal = overlay.closest('.modal');
            if (modal) closeModal(modal.id);
        });
    });
}

// ===================================
// LOGIN / LOGOUT
// ===================================

function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const error = document.getElementById('errorMessage');
    const btn = document.getElementById('loginBtn');

    btn.classList.add('loading');
    error.classList.remove('show');

    setTimeout(() => {
        const user = usersList.find(u =>
            u.username.toLowerCase() === username.toLowerCase() && u.password === password
        );

        btn.classList.remove('loading');

        if (user) {
            currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            document.getElementById('loginForm').reset();
            showDashboard();
        } else {
            error.textContent = 'Invalid username or password.';
            error.classList.add('show');
        }
    }, 600);
}

function handleLogout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    showLoginPage();
}

// ===================================
// PAGE SWITCHING
// ===================================

function showLoginPage() {
    document.getElementById('loginPage').classList.add('active');
    document.getElementById('dashboardPage').classList.remove('active');
    window.scrollTo(0, 0);
}

function showDashboard() {
    document.getElementById('loginPage').classList.remove('active');
    document.getElementById('dashboardPage').classList.add('active');

    updateUserInfo();
    setupRoleBasedAccess();
    updateStats();
    updateUzbekistanTime();
    renderAttendanceTable();
    if (currentUser.role === 'Admin') renderUsersList();
    if (currentUser.role === 'Student') renderStudentOverview();

    window.scrollTo(0, 0);
}

function updateUserInfo() {
    if (!currentUser) return;
    document.getElementById('userName').textContent = currentUser.fullName;
    document.getElementById('userRole').textContent = currentUser.role;
    document.getElementById('userInitial').textContent = currentUser.fullName[0].toUpperCase();
}

function setupRoleBasedAccess() {
    const usersNavBtn = document.getElementById('usersNavBtn');
    if (currentUser.role === 'Admin') {
        usersNavBtn.style.display = 'flex';
    } else {
        usersNavBtn.style.display = 'none';
    }
}

function handleNavigation(navItem) {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    navItem.classList.add('active');

    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    const section = document.getElementById(`${navItem.dataset.section}Section`);
    if (section) section.classList.add('active');
}

// ===================================
// MODALS
// ===================================

function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('active');
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('active');
}

// ===================================
// ADD / EDIT USER
// ===================================

let editingUser = null;

function showAddUserForm() {
    editingUser = null;
    const form = document.getElementById('addUserForm');
    form.querySelector('h3').textContent = 'Add New User';
    form.style.display = 'block';
    document.getElementById('userForm').reset();
    document.getElementById('newUsername').focus();

    const usersNav = document.getElementById('usersNavBtn');
    if (usersNav) handleNavigation(usersNav);
}

function hideAddUserForm() {
    document.getElementById('addUserForm').style.display = 'none';
    editingUser = null;
    document.getElementById('userForm').reset();
}

function handleSaveUser(e) {
    e.preventDefault();
    const username = document.getElementById('newUsername').value.trim();
    const password = document.getElementById('newPassword').value;
    const fullName = document.getElementById('newFullName').value.trim();
    const role = document.getElementById('newRole').value;

    if (!username || !password || !fullName || !role) {
        alert('Please fill all fields.');
        return;
    }

    const exists = usersList.some(u =>
        u.username.toLowerCase() === username.toLowerCase() && u.username !== (editingUser?.username)
    );
    if (exists) {
        alert('Username already exists.');
        return;
    }

    if (editingUser) {
        if (editingUser.role === 'Admin' && role !== 'Admin' && usersList.filter(u => u.role === 'Admin').length === 1) {
            alert('Cannot remove the last Admin.');
            return;
        }
        Object.assign(editingUser, { username, password, fullName, role });
    } else {
        usersList.push({ username, password, fullName, role });
    }

    saveToLocalStorage();
    renderUsersList();
    hideAddUserForm();
    alert(editingUser ? 'User updated!' : 'User added!');
}

function editUser(username) {
    const user = usersList.find(u => u.username === username);
    if (!user) return;

    editingUser = user;
    document.getElementById('newUsername').value = user.username;
    document.getElementById('newPassword').value = user.password;
    document.getElementById('newFullName').value = user.fullName;
    document.getElementById('newRole').value = user.role;

    const form = document.getElementById('addUserForm');
    form.querySelector('h3').textContent = 'Edit User';
    form.style.display = 'block';
    document.getElementById('newUsername').focus();
}

function deleteUser(username) {
    if (username.toLowerCase() === 'admin') {
        alert('Cannot delete default admin.');
        return;
    }
    if (!confirm(`Delete "${username}"?`)) return;

    const idx = usersList.findIndex(u => u.username === username);
    if (idx === -1) return;

    if (usersList[idx].role === 'Admin' && usersList.filter(u => u.role === 'Admin').length === 1) {
        alert('Cannot delete the last Admin.');
        return;
    }

    usersList.splice(idx, 1);
    saveToLocalStorage();
    renderUsersList();
}

function renderUsersList() {
    const grid = document.getElementById('usersGrid');
    if (!grid) return;
    grid.innerHTML = '';

    usersList.forEach(user => {
        const card = document.createElement('div');
        card.className = 'user-card glass-card';
        card.innerHTML = `
            <div class="user-card-header">
                <div class="user-card-avatar">${user.fullName[0].toUpperCase()}</div>
                <div class="user-card-info">
                    <h4>${user.fullName}</h4>
                    <p><span class="role-badge ${user.role.toLowerCase()}">${user.role}</span></p>
                </div>
            </div>
            <div class="user-card-details">
                <div class="user-detail-row"><span>Username:</span><span>${user.username}</span></div>
            </div>
            <div style="margin-top:1rem;display:flex;gap:0.5rem;">
                <button class="btn-secondary edit-user">Edit</button>
                <button class="btn-secondary delete-user">Delete</button>
            </div>
        `;
        grid.appendChild(card);

        card.querySelector('.edit-user').onclick = () => editUser(user.username);
        card.querySelector('.delete-user').onclick = () => deleteUser(user.username);
    });
}

// ===================================
// ATTENDANCE TABLE
// ===================================

function renderAttendanceTable(filter = '') {
    const tbody = document.getElementById('attendanceTableBody');
    tbody.innerHTML = '';

    let records = attendanceRecords.filter(r =>
        r.name.toLowerCase().includes(filter.toLowerCase())
    );

    records.sort((a, b) => new Date(`${b.date} ${b.time}`) - new Date(`${a.date} ${a.time}`));

    if (records.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--text-secondary);">No records found</td></tr>';
        return;
    }

    const canEdit = ['Admin', 'Teacher'].includes(currentUser?.role);

    records.forEach((r, i) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${r.name}</td>
            <td><span class="role-badge ${r.role.toLowerCase()}">${r.role}</span></td>
            <td>${r.subject || ''}</td>
            <td>${r.semester || ''}</td>
            <td>${formatDate(r.date)}</td>
            <td>${r.time}</td>
            <td><span class="status-badge ${r.status === 'Present' ? 'present' : ''}">${r.status}</span></td>
            <td>${canEdit ? `<button class="btn-secondary edit-attendance" data-idx="${i}">Edit</button>` : ''}</td>
        `;
        tbody.appendChild(row);
    });

    document.querySelectorAll('.edit-attendance').forEach(btn => {
        btn.onclick = () => openEditAttendanceModal(Number(btn.dataset.idx));
    });
}

function formatDate(d) {
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ===================================
// STATS
// ===================================

function updateStats() {
    const total = attendanceRecords.length;
    const today = new Date().toISOString().slice(0, 10);
    const todayCount = attendanceRecords.filter(r => r.date === today).length;
    const last = attendanceRecords[0];

    document.getElementById('totalRecords').textContent = total;
    document.getElementById('todayRecords').textContent = todayCount;
    document.getElementById('lastCheckIn').textContent = last ? last.time : '--:--';
}

// ===================================
// STUDENT OVERVIEW
// ===================================

function renderStudentOverview() {
    const overview = document.getElementById('studentOverview');
    if (currentUser.role !== 'Student') {
        overview.style.display = 'none';
        return;
    }
    overview.style.display = 'block';

    const records = attendanceRecords.filter(r => r.name === currentUser.fullName);
    const bySubject = {};

    records.forEach(r => {
        const key = `${r.subject || 'Unknown'} (S${r.semester || 1})`;
        if (!bySubject[key]) bySubject[key] = { total: 0, absent: 0 };
        bySubject[key].total++;
        if (r.status !== 'Present') bySubject[key].absent++;
    });

    let html = '<ul style="margin:0;padding-left:1.2rem;">';
    for (const [key, data] of Object.entries(bySubject)) {
        const rate = ((data.absent / data.total) * 100).toFixed(1);
        const status = rate > 15 ? '<strong style="color:var(--error);">At risk</strong>' : '<span style="color:var(--accent-blue);">OK</span>';
        html += `<li><strong>${key}:</strong> ${rate}% absent — ${status}</li>`;
    }
    html += '</ul>';
    document.getElementById('studentOverviewContent').innerHTML = html;
}

// ===================================
// EDIT ATTENDANCE
// ===================================

let editingAttendanceIndex = null;

function openEditAttendanceModal(idx) {
    const record = attendanceRecords[idx];
    if (!record) return;
    editingAttendanceIndex = idx;

    document.getElementById('editSubject').value = record.subject || '';
    document.getElementById('editSemester').value = record.semester || 1;
    document.getElementById('editStatus').value = record.status;

    openModal('editAttendanceModal');
}

function handleSaveEditAttendance(e) {
    e.preventDefault();
    if (editingAttendanceIndex === null) return;

    const rec = attendanceRecords[editingAttendanceIndex];
    rec.subject = document.getElementById('editSubject').value.trim();
    rec.semester = Number(document.getElementById('editSemester').value);
    rec.status = document.getElementById('editStatus').value;

    saveToLocalStorage();
    renderAttendanceTable();
    updateStats();
    closeModal('editAttendanceModal');
}

// ===================================
// LIVE UZBEKISTAN TIME (Nov 11, 2025 03:50 AM +05)
// ===================================

function updateUzbekistanTime() {
    const now = new Date();
    const uzTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tashkent" }));

    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    };

    const formatted = uzTime.toLocaleString('en-US', options).replace(',', '');
    document.getElementById('uzTime').textContent = `${formatted} (UZ)`;
}

updateUzbekistanTime();
setInterval(updateUzbekistanTime, 1000);

// ===================================
// CONSOLE WELCOME
// ===================================

console.log('%cNFC Attendance System Ready! (UZ Time: Nov 11, 2025 03:50 AM)', 'color: #4fc3f7; font-size: 16px; font-weight: bold;');