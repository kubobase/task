// Task Management Application Logic

document.addEventListener('DOMContentLoaded', () => {
    // App State
    let tasks = [];
    let currentViewMode = 'category'; // 'category' or 'status'
    
    // DOM Elements
    const dateDisplay = document.getElementById('current-date');
    const btnNewTask = document.getElementById('btn-new-task');
    const taskModal = document.getElementById('task-modal');
    const taskForm = document.getElementById('task-form');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnCancelTask = document.getElementById('btn-cancel-task');
    const modalTitle = document.getElementById('modal-title');
    
    // View Switcher Elements
    const btnViewCategory = document.getElementById('view-mode-category');
    const btnViewStatus = document.getElementById('view-mode-status');
    const boardCategoryView = document.getElementById('board-category-view');
    const boardStatusView = document.getElementById('board-status-view');
    
    // Form Inputs
    const inputId = document.getElementById('task-id');
    const inputTitle = document.getElementById('task-title-input');
    const inputDesc = document.getElementById('task-desc-input');
    const inputCategory = document.getElementById('task-category-input');
    const inputPriority = document.getElementById('task-priority-input');
    const inputStatus = document.getElementById('task-status-input');
    const inputDue = document.getElementById('task-due-input');
    const inputTag = document.getElementById('task-tag-input');
    
    // Category Columns Lists
    const colTodayList = document.getElementById('tasks-today-list');
    const colPriorityList = document.getElementById('tasks-priority-list');
    const colMonthList = document.getElementById('tasks-month-list');
    
    // Status Columns Lists
    const colUnstartedList = document.getElementById('tasks-unstarted-list');
    const colInprogressList = document.getElementById('tasks-inprogress-list');
    const colConfirmList = document.getElementById('tasks-confirm-list');
    const colCompletedList = document.getElementById('tasks-completed-list');
    
    // Category Counts
    const countToday = document.getElementById('count-today');
    const countPriority = document.getElementById('count-priority');
    const countMonth = document.getElementById('count-month');
    
    // Status Counts
    const countUnstarted = document.getElementById('count-unstarted');
    const countInprogress = document.getElementById('count-inprogress');
    const countConfirm = document.getElementById('count-confirm');
    const countCompleted = document.getElementById('count-completed');
    
    // Statistics Displays
    const overallProgressText = document.getElementById('overall-progress-text');
    const overallProgressBar = document.getElementById('overall-progress-bar');
    const todayStatsValue = document.getElementById('today-stats-value');
    const todayCompletedMeta = document.getElementById('today-completed-meta');
    const priorityStatsValue = document.getElementById('priority-stats-value');
    const priorityCompletedMeta = document.getElementById('priority-completed-meta');
    const monthStatsValue = document.getElementById('month-stats-value');
    const monthCompletedMeta = document.getElementById('month-completed-meta');
    
    // Backup Buttons
    const btnExport = document.getElementById('btn-export');
    const btnImportTrigger = document.getElementById('btn-import-trigger');
    const fileImport = document.getElementById('file-import');
    
    // Toast Notification
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');

    // 1. Initialize Date Display
    function updateDateDisplay() {
        const days = ['日', '月', '火', '水', '木', '金', '土'];
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const date = now.getDate();
        const day = days[now.getDay()];
        
        dateDisplay.textContent = `${year}年${month}月${date}日 (${day})`;
    }
    updateDateDisplay();

    // 2. Load Tasks
    function loadTasks() {
        const stored = localStorage.getItem('okubo_tasks');
        if (stored) {
            tasks = JSON.parse(stored);
        } else {
            tasks = [];
            saveTasksToStorage();
        }
        renderDashboard();
    }

    function getFormattedDate(daysOffset) {
        const d = new Date();
        d.setDate(d.getDate() + daysOffset);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const date = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${date}`;
    }

    function saveTasksToStorage() {
        localStorage.setItem('okubo_tasks', JSON.stringify(tasks));
    }

    // Helper: Determine Status text & CSS class from progress percentage
    function getStatusInfo(progress) {
        if (progress === 0) {
            return { text: '未着手', class: 'badge-not-started' };
        } else if (progress === 100) {
            return { text: '完了', class: 'badge-completed' };
        } else if (progress >= 90) {
            return { text: '要確認', class: 'badge-waiting-confirm' };
        } else {
            return { text: '進行中', class: 'badge-in-progress' };
        }
    }

    // Helper: Get status string from progress percentage
    function getStatusFromProgress(progress) {
        if (progress === 0) return '未着手';
        if (progress === 100) return '完了';
        if (progress >= 90) return '確認待ち'; // Syncs to "確認待ち" select option
        return '進行中';
    }

    // Helper: Toast Message
    function showToast(message, isSuccess = true) {
        toastMessage.textContent = message;
        const icon = toast.querySelector('.toast-icon');
        if (isSuccess) {
            icon.className = 'fa-solid fa-circle-check toast-icon';
            icon.style.color = 'var(--color-success)';
        } else {
            icon.className = 'fa-solid fa-triangle-exclamation toast-icon';
            icon.style.color = 'var(--color-danger)';
        }
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // 3. Render dashboard lists & statistics
    function renderDashboard() {
        // Clear all list columns
        colTodayList.innerHTML = '';
        colPriorityList.innerHTML = '';
        colMonthList.innerHTML = '';
        
        colUnstartedList.innerHTML = '';
        colInprogressList.innerHTML = '';
        colConfirmList.innerHTML = '';
        colCompletedList.innerHTML = '';

        // Category Counts
        let countTodayVal = 0;
        let completedTodayVal = 0;
        let countPriorityVal = 0;
        let completedPriorityVal = 0;
        let countMonthVal = 0;
        let completedMonthVal = 0;
        
        // Status Counts
        let countUnstartedVal = 0;
        let countInprogressVal = 0;
        let countConfirmVal = 0;
        let countCompletedVal = 0;
        
        let totalProgressSum = 0;
        const todayStr = getFormattedDate(0);

        tasks.forEach(task => {
            const card = createTaskCard(task, todayStr);
            totalProgressSum += Number(task.progress);

            // Compute counts and distribute cards based on View Mode
            
            // 1. Calculate Category Views Info
            if (task.category === 'today') {
                countTodayVal++;
                if (task.progress === 100) completedTodayVal++;
                if (currentViewMode === 'category') colTodayList.appendChild(card);
            } else if (task.category === 'priority') {
                countPriorityVal++;
                if (task.progress === 100) completedPriorityVal++;
                if (currentViewMode === 'category') colPriorityList.appendChild(card);
            } else if (task.category === 'month') {
                countMonthVal++;
                if (task.progress === 100) completedMonthVal++;
                if (currentViewMode === 'category') colMonthList.appendChild(card);
            }
            
            // 2. Calculate Status Views Info
            const statusStr = getStatusFromProgress(task.progress);
            if (statusStr === '未着手') {
                countUnstartedVal++;
                if (currentViewMode === 'status') colUnstartedList.appendChild(card);
            } else if (statusStr === '完了') {
                countCompletedVal++;
                if (currentViewMode === 'status') colCompletedList.appendChild(card);
            } else if (statusStr === '確認待ち') {
                countConfirmVal++;
                if (currentViewMode === 'status') colConfirmList.appendChild(card);
            } else { // 進行中
                countInprogressVal++;
                if (currentViewMode === 'status') colInprogressList.appendChild(card);
            }
        });

        // Set Category counts labels
        countToday.textContent = countTodayVal;
        countPriority.textContent = countPriorityVal;
        countMonth.textContent = countMonthVal;
        
        // Set Status counts labels
        countUnstarted.textContent = countUnstartedVal;
        countInprogress.textContent = countInprogressVal;
        countConfirm.textContent = countConfirmVal;
        countCompleted.textContent = countCompletedVal;

        // Render Statistics
        const totalTasks = tasks.length;
        const averageProgress = totalTasks > 0 ? Math.round(totalProgressSum / totalTasks) : 0;
        
        overallProgressText.textContent = `${averageProgress}%`;
        overallProgressBar.style.width = `${averageProgress}%`;

        // Today card stats
        todayStatsValue.innerHTML = `${countTodayVal} <span class="stat-unit">件</span>`;
        todayCompletedMeta.textContent = `完了: ${completedTodayVal}件 / 未完了: ${countTodayVal - completedTodayVal}件`;

        // Priority card stats
        const remainingPriority = countPriorityVal - completedPriorityVal;
        priorityStatsValue.innerHTML = `${remainingPriority} <span class="stat-unit">件</span>`;
        priorityCompletedMeta.textContent = `完了済み: ${completedPriorityVal}件`;

        // Month card stats
        monthStatsValue.innerHTML = `${countMonthVal} <span class="stat-unit">件</span>`;
        monthCompletedMeta.textContent = `完了率: ${countMonthVal > 0 ? Math.round((completedMonthVal / countMonthVal) * 100) : 0}% (${completedMonthVal}/${countMonthVal})`;
    }

    // 4. Create Task Card DOM
    function createTaskCard(task, todayStr) {
        const card = document.createElement('div');
        card.className = 'task-card';
        card.setAttribute('data-id', task.id);

        const statusInfo = getStatusInfo(task.progress);
        const priorityClass = task.priority === '高' ? 'priority-high' : (task.priority === '低' ? 'priority-low' : 'priority-medium');
        
        // Tags rendering
        let tagsHtml = '';
        if (task.tag && task.tag.trim() !== '') {
            const tagsList = task.tag.split(/[\/,]/).map(t => t.trim()).filter(t => t !== '');
            if (tagsList.length > 0) {
                tagsHtml = `<div class="task-tags-row">
                    ${tagsList.map(t => `<span class="task-tag">${escapeHTML(t)}</span>`).join('')}
                </div>`;
            }
        }
        
        // Date Check
        let dateHtml = '';
        if (task.dueDate) {
            const isOverdue = task.dueDate < todayStr && task.progress < 100;
            const overdueClass = isOverdue ? 'overdue' : '';
            const calendarIcon = isOverdue ? 'fa-solid fa-triangle-exclamation' : 'fa-regular fa-calendar';
            const label = isOverdue ? '期限切れ: ' : '期限: ';
            dateHtml = `<div class="task-due-date ${overdueClass}">
                <i class="${calendarIcon}"></i>
                <span>${label}${formatDateJapanese(task.dueDate)}</span>
            </div>`;
        }

        card.innerHTML = `
            <div class="task-card-header">
                <h4 class="task-title">${escapeHTML(task.title)}</h4>
                <div class="task-card-actions">
                    <button class="btn-card-action btn-edit" title="編集する">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="btn-card-action btn-delete" title="削除する">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
            ${tagsHtml}
            ${task.desc ? `<p class="task-desc">${escapeHTML(task.desc)}</p>` : ''}
            <div class="task-progress-section">
                <div class="progress-header-row">
                    <div style="display: flex; gap: 6px; align-items: center;">
                        <span class="status-badge ${statusInfo.class}">${statusInfo.text}</span>
                        <span class="priority-tag ${priorityClass}">${escapeHTML(task.priority || '中')}</span>
                    </div>
                    <span class="progress-percentage">${task.progress}%</span>
                </div>
                <div class="inline-slider-wrapper">
                    <input type="range" class="inline-slider" min="0" max="100" value="${task.progress}" step="5">
                </div>
            </div>
            ${dateHtml}
        `;

        // Card Action Events
        card.querySelector('.btn-edit').addEventListener('click', (e) => {
            e.stopPropagation();
            openEditModal(task);
        });

        card.querySelector('.btn-delete').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteTask(task.id);
        });

        // Interactive Inline Progress Slider
        const inlineSlider = card.querySelector('.inline-slider');
        inlineSlider.addEventListener('input', (e) => {
            const newProgress = parseInt(e.target.value, 10);
            updateTaskProgress(task.id, newProgress);
        });

        return card;
    }

    // Helper: Format YYYY-MM-DD to Japanese style
    function formatDateJapanese(dateStr) {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length !== 3) return dateStr;
        return `${parseInt(parts[1], 10)}月${parseInt(parts[2], 10)}日`;
    }

    // Helper: HTML Escaper to avoid XSS
    function escapeHTML(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // 5. Update Task Progress directly from card slider
    function updateTaskProgress(id, progress) {
        const task = tasks.find(t => t.id === id);
        if (task) {
            const oldProgress = task.progress;
            const oldStatus = getStatusFromProgress(oldProgress);
            
            task.progress = progress;
            const newStatus = getStatusFromProgress(progress);
            task.status = newStatus;
            saveTasksToStorage();
            
            // If the view mode is 'status', or if the status group shifts columns, we must re-render the layout
            if (currentViewMode === 'status' && oldStatus !== newStatus) {
                renderDashboard();
                return;
            }

            // Fast UI Update: Instead of full render, update counts & styles dynamically
            const card = document.querySelector(`.task-card[data-id="${id}"]`);
            if (card) {
                const statusInfo = getStatusInfo(progress);
                const badge = card.querySelector('.status-badge');
                const percentText = card.querySelector('.progress-percentage');
                
                badge.textContent = statusInfo.text;
                badge.className = `status-badge ${statusInfo.class}`;
                percentText.textContent = `${progress}%`;
                
                // If progress reaches 100 or drops from 100, check if calendar display needs refreshing
                const dueDisplay = card.querySelector('.task-due-date');
                if (dueDisplay) {
                    const todayStr = getFormattedDate(0);
                    const isOverdue = task.dueDate < todayStr && progress < 100;
                    if (isOverdue) {
                        dueDisplay.classList.add('overdue');
                        dueDisplay.querySelector('i').className = 'fa-solid fa-triangle-exclamation';
                        dueDisplay.querySelector('span').textContent = `期限切れ: ${formatDateJapanese(task.dueDate)}`;
                    } else {
                        dueDisplay.classList.remove('overdue');
                        dueDisplay.querySelector('i').className = 'fa-regular fa-calendar';
                        dueDisplay.querySelector('span').textContent = `期限: ${formatDateJapanese(task.dueDate)}`;
                    }
                }
            }

            // If we transition to/from 100%, trigger counts update
            if ((oldProgress === 100 && progress < 100) || (oldProgress < 100 && progress === 100)) {
                renderDashboard();
            } else {
                // Just recalculate overall statistics
                let totalProgressSum = 0;
                tasks.forEach(t => totalProgressSum += Number(t.progress));
                const averageProgress = tasks.length > 0 ? Math.round(totalProgressSum / tasks.length) : 0;
                overallProgressText.textContent = `${averageProgress}%`;
                overallProgressBar.style.width = `${averageProgress}%`;
            }
        }
    }

    // 6. Delete Task Handler
    function deleteTask(id) {
        if (confirm('このタスクを削除してもよろしいですか？')) {
            tasks = tasks.filter(t => t.id !== id);
            saveTasksToStorage();
            renderDashboard();
            showToast('タスクを削除しました。');
        }
    }

    // 7. Modal Handlers (Create & Edit)
    btnNewTask.addEventListener('click', () => {
        openCreateModal();
    });

    function openCreateModal() {
        modalTitle.textContent = '新しいタスクを追加';
        taskForm.reset();
        
        inputId.value = '';
        inputPriority.value = '中';
        inputStatus.value = '未着手';
        inputTag.value = '';
        
        // Default due date to today
        inputDue.value = getFormattedDate(0);
        
        taskModal.style.display = 'flex';
        inputTitle.focus();
    }

    function openEditModal(task) {
        modalTitle.textContent = 'タスクの編集';
        
        inputId.value = task.id;
        inputTitle.value = task.title;
        inputDesc.value = task.desc || '';
        inputCategory.value = task.category;
        inputDue.value = task.dueDate || '';
        inputPriority.value = task.priority || '中';
        inputStatus.value = task.status || getStatusFromProgress(task.progress);
        inputTag.value = task.tag || '';
        
        taskModal.style.display = 'flex';
        inputTitle.focus();
    }

    function closeModal() {
        taskModal.style.display = 'none';
        taskForm.reset();
    }

    btnCloseModal.addEventListener('click', closeModal);
    btnCancelTask.addEventListener('click', closeModal);
    
    // Close modal on click outside content
    taskModal.addEventListener('click', (e) => {
        if (e.target === taskModal) {
            closeModal();
        }
    });

    // Form Submit
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const id = inputId.value;
        const title = inputTitle.value.trim();
        const desc = inputDesc.value.trim();
        const category = inputCategory.value;
        const priority = inputPriority.value;
        const status = inputStatus.value;
        const dueDate = inputDue.value;
        const tag = inputTag.value.trim();

        if (!title) return;

        // Dynamic progress calculation based on status
        let progress = 0;
        if (id) {
            const oldTask = tasks.find(t => t.id === id);
            if (oldTask) {
                progress = oldTask.progress;
            }
        }
        
        if (status === '未着手') {
            progress = 0;
        } else if (status === '完了') {
            progress = 100;
        } else if (status === '進行中') {
            if (progress === 0 || progress >= 90) progress = 50;
        } else if (status === '確認待ち') {
            if (progress < 90 || progress === 100) progress = 90;
        }

        if (id) {
            // Edit Mode
            const task = tasks.find(t => t.id === id);
            if (task) {
                task.title = title;
                task.desc = desc;
                task.category = category;
                task.priority = priority;
                task.status = status;
                task.dueDate = dueDate;
                task.tag = tag;
                task.progress = progress;
                showToast('タスクを更新しました。');
            }
        } else {
            // Create Mode
            const newTask = {
                id: 'task_' + Date.now(),
                title,
                desc,
                category,
                priority,
                status,
                dueDate,
                tag,
                progress
            };
            tasks.push(newTask);
            showToast('新しいタスクを作成しました。');
        }

        saveTasksToStorage();
        closeModal();
        renderDashboard();
    });

    // 8. View Switcher Logic
    btnViewCategory.addEventListener('click', () => {
        if (currentViewMode === 'category') return;
        
        btnViewCategory.classList.add('active');
        btnViewStatus.classList.remove('active');
        
        boardCategoryView.style.display = 'grid';
        boardStatusView.style.display = 'none';
        
        currentViewMode = 'category';
        renderDashboard();
    });

    btnViewStatus.addEventListener('click', () => {
        if (currentViewMode === 'status') return;
        
        btnViewStatus.classList.add('active');
        btnViewCategory.classList.remove('active');
        
        boardCategoryView.style.display = 'none';
        boardStatusView.style.display = 'grid';
        
        currentViewMode = 'status';
        renderDashboard();
    });

    // 9. Export and Import data in JSON
    btnExport.addEventListener('click', () => {
        if (tasks.length === 0) {
            showToast('エクスポートするタスクがありません。', false);
            return;
        }
        
        const dataStr = JSON.stringify(tasks, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `task_backup_${getFormattedDate(0)}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        showToast('データをダウンロードしました。');
    });

    btnImportTrigger.addEventListener('click', () => {
        fileImport.click();
    });

    fileImport.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const parsed = JSON.parse(event.target.result);
                
                // Simple Schema Validation
                if (Array.isArray(parsed) && parsed.every(t => t.id && t.title && t.category && t.progress !== undefined)) {
                    tasks = parsed;
                    saveTasksToStorage();
                    renderDashboard();
                    showToast('データを正常にインポートしました。');
                } else {
                    showToast('無効なファイル形式です。', false);
                }
            } catch (err) {
                showToast('ファイルの読み込みに失敗しました。', false);
            }
        };
        reader.readAsText(file);
        // Clear value so the same file can be imported again
        fileImport.value = '';
    });

    // Initial Load
    loadTasks();
});
