const FALLBACK_CLASSES = [
    {
        id: 'fallback-1',
        title: 'HIIT Conditioning',
        coach: 'Coach Alex',
        schedule: 'Mon / Wed / Fri · 18:00',
        capacity: 20,
        enrolled: 10
    },
    {
        id: 'fallback-2',
        title: 'Strength & Core',
        coach: 'Coach Maya',
        schedule: 'Tue / Thu · 19:00',
        capacity: 15,
        enrolled: 8
    },
    {
        id: 'fallback-3',
        title: '1-on-1 Personal Training',
        coach: 'Coach Sam',
        schedule: 'By Appointment',
        capacity: 10,
        enrolled: 2
    }
];

let availableClasses = [];
let myBookings = [];
let currentUserRole = 'member';
let editingClassId = null;

// 判断当前用户是否具备管理课程权限（coach 或 admin）
function canManageClasses() {
    return currentUserRole === 'coach' || currentUserRole === 'admin';
}

// 从 Supabase `user_roles` 读取当前用户角色
async function loadCurrentUserRole() {
    if (typeof supabaseClient === 'undefined' || typeof currentUser === 'undefined' || !currentUser) {
        currentUserRole = 'member';
        updateCoachControlsVisibility();
        return currentUserRole;
    }

    const { data, error } = await supabaseClient
        .from('user_roles')
        .select('role')
        .eq('user_id', currentUser.id)
        .maybeSingle();

    if (error) {
        console.error('加载 user_roles 失败:', error.message);
        currentUserRole = 'member';
    } else {
        currentUserRole = data?.role || 'member';
    }

    updateCoachControlsVisibility();
    return currentUserRole;
}

// 控制教练/管理员课程管理区域的显隐（#coach-class-manager）
function updateCoachControlsVisibility() {
    const managerEl = document.getElementById('coach-class-manager');
    if (!managerEl) return;
    managerEl.classList.toggle('hidden', !canManageClasses());
}

// 1. 从 Supabase `classes` 表加载课程
async function loadClasses() {
    const listEl = document.getElementById('classes-list');
    if (!listEl) return;

    if (typeof supabaseClient === 'undefined') {
        availableClasses = FALLBACK_CLASSES;
        renderClasses();
        return;
    }

    if (typeof currentUser !== 'undefined' && currentUser) {
        await loadCurrentUserRole();
    } else {
        currentUserRole = 'member';
        updateCoachControlsVisibility();
    }

    const { data, error } = await supabaseClient
        .from('classes')
        .select('*')
        .order('created_at', { ascending: true });

    if (error) {
        // 如果表里没有 created_at 列，自动退回无排序查询
        const fallbackQuery = await supabaseClient.from('classes').select('*');
        if (fallbackQuery.error) {
            console.error('加载 classes 失败:', fallbackQuery.error.message);
            availableClasses = FALLBACK_CLASSES;
        } else {
            availableClasses = fallbackQuery.data && fallbackQuery.data.length > 0
                ? fallbackQuery.data
                : FALLBACK_CLASSES;
        }
    } else {
        availableClasses = data && data.length > 0 ? data : FALLBACK_CLASSES;
    }

    if (typeof currentUser !== 'undefined' && currentUser) {
        await loadBookings();
    }

    renderClasses();
}

// 2. 从 Supabase `bookings` 表加载当前用户的预约记录
async function loadBookings() {
    if (typeof supabaseClient === 'undefined' || typeof currentUser === 'undefined' || !currentUser) {
        return;
    }

    const { data, error } = await supabaseClient
        .from('bookings')
        .select('*')
        .eq('user_id', currentUser.id);

    if (error) {
        console.error('加载 bookings 失败:', error.message);
        myBookings = [];
    } else {
        myBookings = data || [];
    }

    renderBookings();
    updateTrainingAdvice();
}

// 3. 渲染课程列表（#classes-list）
function renderClasses() {
    const listEl = document.getElementById('classes-list');
    if (!listEl) return;

    if (!availableClasses.length) {
        listEl.innerHTML = '<p class="text-sm text-slate-400">No available classes.</p>';
        return;
    }

    const bookedClassIds = new Set(
        myBookings.map((b) => String(b.class_id ?? b.class_title))
    );
    const isStaff = canManageClasses();

    listEl.innerHTML = availableClasses
        .map((cls) => {
            const clsId = cls.id ?? cls.title;
            const title = cls.title || cls.name || 'Fitness Class';
            const coach = cls.coach || 'Coach';
            const schedule = cls.schedule || cls.time || 'Flexible';
            const capacity = Number(cls.capacity ?? 20);
            const enrolled = Number(cls.enrolled ?? 0);
            const isBooked = bookedClassIds.has(String(clsId)) || bookedClassIds.has(String(title));
            const isFull = enrolled >= capacity && !isBooked;
            const isRealDbRow = Boolean(cls.id) && !String(cls.id).startsWith('fallback-');

            const coachActionsHtml = isStaff && isRealDbRow
                ? `
                    <button
                        type="button"
                        onclick="startEditClass('${escapeAttr(String(cls.id))}')"
                        class="bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                    >
                        Edit
                    </button>
                    <button
                        type="button"
                        onclick="deleteClass('${escapeAttr(String(cls.id))}')"
                        class="bg-rose-100 hover:bg-rose-200 text-rose-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                    >
                        Delete
                    </button>
                `
                : '';

            const bookingButtonHtml = isBooked
                ? `<button disabled class="bg-emerald-100 text-emerald-700 text-xs font-semibold px-4 py-2 rounded-lg cursor-default">Booked ✓</button>`
                : isFull
                ? `<button disabled class="bg-slate-100 text-slate-400 text-xs font-semibold px-4 py-2 rounded-lg cursor-not-allowed">Full</button>`
                : `<button type="button" onclick="bookClass('${escapeAttr(String(clsId))}')" class="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition">Book</button>`;

            return `
                <div class="p-4 rounded-xl border border-slate-200 bg-white/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h3 class="font-bold text-slate-800 text-sm">${escapeHtml(title)}</h3>
                        <p class="text-xs text-slate-500 mt-0.5">
                            Coach: ${escapeHtml(coach)} · Time: ${escapeHtml(schedule)} · Spots: ${enrolled}/${capacity}
                        </p>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                        ${coachActionsHtml}
                        ${bookingButtonHtml}
                    </div>
                </div>
            `;
        })
        .join('');
}

// 4. 教练/管理员：新增或保存编辑课程（绑定表单提交或按钮点击）
async function saveClassForm(event) {
    if (event) event.preventDefault();

    if (!canManageClasses()) {
        return alert('Permission denied: Only coaches or admins can manage classes.');
    }
    if (typeof supabaseClient === 'undefined') {
        return alert('Supabase client is not initialized.');
    }

    const title = document.getElementById('class-title')?.value.trim();
    const coach = document.getElementById('class-coach')?.value.trim();
    const schedule = document.getElementById('class-schedule')?.value.trim();
    const capacity = Number(document.getElementById('class-capacity')?.value ?? 20);
    const enrolled = Number(document.getElementById('class-enrolled')?.value ?? 0);

    if (!title || !coach || !schedule) {
        return alert('Please fill in Class Title, Coach, and Schedule.');
    }
    if (Number.isNaN(capacity) || capacity < 1) {
        return alert('Capacity must be at least 1.');
    }
    if (Number.isNaN(enrolled) || enrolled < 0) {
        return alert('Enrolled count cannot be negative.');
    }

    const payload = {
        title,
        coach,
        schedule,
        capacity,
        enrolled
    };

    let result;
    if (editingClassId) {
        result = await supabaseClient
            .from('classes')
            .update(payload)
            .eq('id', editingClassId);
    } else {
        result = await supabaseClient
            .from('classes')
            .insert([payload]);
    }

    if (result.error) {
        return alert('Save class failed: ' + result.error.message);
    }

    alert(editingClassId ? 'Class updated successfully!' : 'New class added successfully!');
    resetClassForm();
    await loadClasses();
}

// 将某门课程填入表单进入编辑模式
function startEditClass(classId) {
    if (!canManageClasses()) return;

    const cls = availableClasses.find((c) => String(c.id) === String(classId));
    if (!cls) return;

    editingClassId = cls.id;

    const titleInput = document.getElementById('class-title');
    const coachInput = document.getElementById('class-coach');
    const scheduleInput = document.getElementById('class-schedule');
    const capacityInput = document.getElementById('class-capacity');
    const enrolledInput = document.getElementById('class-enrolled');
    const submitBtn = document.getElementById('class-submit-btn');

    if (titleInput) titleInput.value = cls.title || '';
    if (coachInput) coachInput.value = cls.coach || '';
    if (scheduleInput) scheduleInput.value = cls.schedule || '';
    if (capacityInput) capacityInput.value = cls.capacity ?? 20;
    if (enrolledInput) enrolledInput.value = cls.enrolled ?? 0;
    if (submitBtn) submitBtn.innerText = 'Update Class';

    document.getElementById('coach-class-manager')?.scrollIntoView({ behavior: 'smooth' });
}

// 重置课程表单状态
function resetClassForm() {
    editingClassId = null;

    const form = document.getElementById('class-editor-form');
    if (form) form.reset();

    const submitBtn = document.getElementById('class-submit-btn');
    if (submitBtn) submitBtn.innerText = 'Add Class';
}

// 教练/管理员：删除课程
async function deleteClass(classId) {
    if (!canManageClasses()) {
        return alert('Permission denied: Only coaches or admins can delete classes.');
    }
    if (!classId || typeof supabaseClient === 'undefined') return;

    const confirmed = confirm('Are you sure you want to delete this class?');
    if (!confirmed) return;

    const { error } = await supabaseClient
        .from('classes')
        .delete()
        .eq('id', classId);

    if (error) {
        return alert('Delete class failed: ' + error.message);
    }

    if (String(editingClassId) === String(classId)) {
        resetClassForm();
    }

    await loadClasses();
}

// 5. 预约课程 -> 写入 `bookings` 表
async function bookClass(classId) {
    if (typeof currentUser === 'undefined' || !currentUser) {
        return alert('Please login first to book a class!');
    }

    const cls = availableClasses.find((c) => String(c.id ?? c.title) === String(classId));
    if (!cls) return;

    const alreadyBooked = myBookings.some(
        (b) => String(b.class_id) === String(cls.id) || b.class_title === cls.title
    );
    if (alreadyBooked) {
        return alert('You have already booked this class.');
    }

    const payload = {
        user_id: currentUser.id,
        class_id: cls.id,
        class_title: cls.title || cls.name || 'Fitness Class',
        coach: cls.coach || 'Coach',
        schedule: cls.schedule || cls.time || 'Flexible',
        status: 'Confirmed'
    };

    const { error } = await supabaseClient.from('bookings').insert([payload]);

    if (error) {
        return alert('Booking failed: ' + error.message);
    }

    alert(`Booked "${payload.class_title}" successfully!`);
    await loadBookings();
    renderClasses();
}

// 6. 取消预约 -> 从 `bookings` 表删除
async function cancelBooking(bookingId) {
    if (!bookingId || typeof supabaseClient === 'undefined') return;

    const { error } = await supabaseClient
        .from('bookings')
        .delete()
        .eq('id', bookingId);

    if (error) {
        return alert('Cancel failed: ' + error.message);
    }

    await loadBookings();
    renderClasses();
}

// 7. 渲染“我的预约”（#bookings-list）
function renderBookings() {
    const bookingsEl = document.getElementById('bookings-list');
    if (!bookingsEl) return;

    if (!myBookings.length) {
        bookingsEl.innerHTML = '<p class="text-sm text-slate-400">No training bookings found.</p>';
        return;
    }

    bookingsEl.innerHTML = myBookings
        .map((b) => `
            <div class="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs">
                <div>
                    <span class="font-semibold text-slate-800">${escapeHtml(b.class_title || 'Class')}</span>
                    <span class="text-slate-500 ml-2">${escapeHtml(b.schedule || '')}</span>
                </div>
                <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-medium">${escapeHtml(b.status || 'Confirmed')}</span>
                    ${
                        b.id
                            ? `<button type="button" onclick="cancelBooking('${escapeAttr(String(b.id))}')" class="text-rose-600 hover:underline">Cancel</button>`
                            : ''
                    }
                </div>
            </div>
        `)
        .join('');
}

// 8. 更新第 4 板块的 AI 教练提示
function updateTrainingAdvice() {
    const adviceEl = document.getElementById('training-advice');
    if (!adviceEl || !myBookings.length) return;

    const latestTitle = escapeHtml(myBookings[0].class_title || 'your session');
    adviceEl.innerHTML = `💡 <span class="font-semibold">AI Coach Insight:</span> You currently have <strong>${myBookings.length}</strong> booked session(s), latest: <strong>${latestTitle}</strong>. Remember to warm up and hydrate before training.`;
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function escapeAttr(value) {
    return String(value).replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// 页面加载完成后尝试初始化；若登录在后，可在 auth.js / app.js 登录后再调一次 loadClasses()
document.addEventListener('DOMContentLoaded', () => {
    loadClasses();
});