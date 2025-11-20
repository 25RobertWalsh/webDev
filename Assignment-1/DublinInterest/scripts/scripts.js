// ===== Navigation Active Link Highlighting =====

// Highlight the current page's navigation link
function setActiveNavLink() {
    // Get the current page filename
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Get all navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Remove active class from all links
    navLinks.forEach(link => link.classList.remove('active'));
    
    // Add active class to the current page's link
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('active');
        }
    });
}

// ===== To-Do List Functionality =====

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    setActiveNavLink();
    loadTodos();
    setupEventListeners();
});

// Drag state for reordering
let dragSrcId = null;

// Setup all event listeners
function setupEventListeners() {
    const addBtn = document.getElementById('addBtn');
    const todoInput = document.getElementById('todoInput');
    const clearBtn = document.getElementById('clearCompleted');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const emailForm = document.getElementById('emailForm');

    if (addBtn) {
        addBtn.addEventListener('click', addTodo);
        todoInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addTodo();
            }
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', clearCompleted);
    }

    if (filterBtns) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                filterBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                const filter = this.getAttribute('data-filter');
                renderTodos(filter);
            });
        });
    }

    if (emailForm) {
        emailForm.addEventListener('submit', handleEmailSubmit);
    }
}

// Add a new to-do item
function addTodo() {
    const input = document.getElementById('todoInput');
    const text = input.value.trim();

    if (text === '') {
        alert('Please enter a to-do item!');
        return;
    }

    const todo = {
        id: Date.now(),
        text: text,
        completed: false,
        createdAt: new Date().toLocaleString()
    };

    let todos = getTodos();
    todos.push(todo);
    saveTodos(todos);
    input.value = '';
    renderTodos('all');
}

// Delete a to-do item
function deleteTodo(id) {
    let todos = getTodos();
    todos = todos.filter(todo => todo.id !== id);
    saveTodos(todos);
    renderTodos('all');
}

// Toggle completion status
function toggleTodo(id) {
    let todos = getTodos();
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        saveTodos(todos);
        renderTodos('all');
    }
}

// Clear all completed items
function clearCompleted() {
    if (confirm('Are you sure you want to delete all completed items?')) {
        let todos = getTodos();
        todos = todos.filter(todo => !todo.completed);
        saveTodos(todos);
        renderTodos('all');
    }
}

// Render todos based on filter
function renderTodos(filter = 'all') {
    const todoList = document.getElementById('todoList');
    if (!todoList) return;

    let todos = getTodos();

    if (filter === 'active') {
        todos = todos.filter(todo => !todo.completed);
    } else if (filter === 'completed') {
        todos = todos.filter(todo => todo.completed);
    }

    todoList.innerHTML = '';

    if (todos.length === 0) {
        todoList.innerHTML = '<li class="empty-state"><p>No items found. Start by adding a new item!</p></li>';
        updateStats();
        return;
    }

    todos.forEach(todo => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        li.setAttribute('draggable', 'true');
        li.dataset.id = todo.id;

        li.innerHTML = `
            <input 
                type="checkbox" 
                class="todo-checkbox" 
                ${todo.completed ? 'checked' : ''} 
                onchange="toggleTodo(${todo.id})"
            >
            <span class="todo-text">${escapeHtml(todo.text)}</span>
            <button class="todo-delete" onclick="deleteTodo(${todo.id})">Delete</button>
        `;

        // Drag and drop handlers
        li.addEventListener('dragstart', onDragStart);
        li.addEventListener('dragover', onDragOver);
        li.addEventListener('dragleave', onDragLeave);
        li.addEventListener('drop', onDrop);
        li.addEventListener('dragend', onDragEnd);

        todoList.appendChild(li);
    });

    // Attach edit handler to text spans
    document.querySelectorAll('.todo-text').forEach(span => {
        span.addEventListener('dblclick', function(e) {
            const li = this.closest('.todo-item');
            const todoId = Number(li.dataset.id);
            const currentText = this.textContent;
            startEdit(li, todoId, currentText);
        });
        span.style.cursor = 'pointer';
        span.title = 'Double-click to edit';
    });

    updateStats();
}

// Drag & Drop handlers for reordering
function onDragStart(e) {
    dragSrcId = Number(this.dataset.id);
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', String(dragSrcId)); } catch (err) {}
    this.classList.add('dragging');
}

function onDragOver(e) {
    e.preventDefault(); // allow drop
    e.dataTransfer.dropEffect = 'move';
    this.classList.add('drag-over');
}

function onDragLeave(e) {
    this.classList.remove('drag-over');
}

function onDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');

    const targetId = Number(this.dataset.id);
    if (dragSrcId === null || dragSrcId === targetId) return;

    let todosFull = getTodos();
    const draggedIndexFull = todosFull.findIndex(t => t.id === dragSrcId);
    const targetIndexFull = todosFull.findIndex(t => t.id === targetId);
    if (draggedIndexFull < 0 || targetIndexFull < 0) return;

    // Decide whether to insert before or after based on mouse position
    const rect = this.getBoundingClientRect();
    const insertBefore = (e.clientY - rect.top) < (rect.height / 2);

    let newIndex = targetIndexFull + (insertBefore ? 0 : 1);
    if (draggedIndexFull < newIndex) newIndex--;

    const [moved] = todosFull.splice(draggedIndexFull, 1);
    todosFull.splice(newIndex, 0, moved);

    saveTodos(todosFull);
    dragSrcId = null;
    renderTodos('all');
}

function onDragEnd(e) {
    this.classList.remove('dragging');
    document.querySelectorAll('.todo-item.drag-over').forEach(el => el.classList.remove('drag-over'));
    dragSrcId = null;
}

// Update statistics
function updateStats() {
    const todos = getTodos();
    const completed = todos.filter(t => t.completed).length;
    const total = todos.length;

    const totalSpan = document.getElementById('totalItems');
    const completedSpan = document.getElementById('completedItems');

    if (totalSpan) totalSpan.textContent = total;
    if (completedSpan) completedSpan.textContent = completed;
}

// Get todos from localStorage
function getTodos() {
    const todos = localStorage.getItem('dublinTodos');
    return todos ? JSON.parse(todos) : [];
}

// Save todos to localStorage
function saveTodos(todos) {
    localStorage.setItem('dublinTodos', JSON.stringify(todos));
}

// Load todos on page load
function loadTodos() {
    const todoList = document.getElementById('todoList');
    if (todoList) {
        renderTodos('all');
    }
}

// Handle email form submission
function handleEmailSubmit(e) {
    e.preventDefault();

    const input = e.target.querySelector('input[type="email"]');
    const email = input.value.trim();
    const messageDiv = document.getElementById('formMessage');

    if (!email) {
        messageDiv.textContent = 'Please enter a valid email address.';
        messageDiv.className = 'error';
        return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        messageDiv.textContent = 'Please enter a valid email address.';
        messageDiv.className = 'error';
        return;
    }

    // Save email to localStorage
    let emails = localStorage.getItem('subscribedEmails');
    emails = emails ? JSON.parse(emails) : [];

    if (emails.includes(email)) {
        messageDiv.textContent = 'This email is already subscribed!';
        messageDiv.className = 'error';
        return;
    }

    emails.push(email);
    localStorage.setItem('subscribedEmails', JSON.stringify(emails));

    messageDiv.textContent = 'Thank you for subscribing! Check your email for updates about Dublin.';
    messageDiv.className = 'success';
    input.value = '';

    // Clear message after 5 seconds
    setTimeout(() => {
        messageDiv.textContent = '';
        messageDiv.className = '';
    }, 5000);
}

// Edit mode for todo items
function startEdit(li, todoId, currentText) {
    // Disable dragging while editing
    li.setAttribute('draggable', 'false');
    li.classList.add('editing');

    // Replace text span with input
    const textSpan = li.querySelector('.todo-text');
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'todo-edit-input';
    input.value = currentText;
    input.maxLength = 100;

    textSpan.replaceWith(input);
    input.focus();
    input.select();

    // Handle save/cancel
    function saveEdit() {
        const newText = input.value.trim();
        if (newText === '') {
            alert('Todo text cannot be empty!');
            input.focus();
            return;
        }
        if (newText !== currentText) {
            let todos = getTodos();
            const todo = todos.find(t => t.id === todoId);
            if (todo) {
                todo.text = newText;
                saveTodos(todos);
            }
        }
        cancelEdit();
    }

    function cancelEdit() {
        li.classList.remove('editing');
        li.setAttribute('draggable', 'true');
        renderTodos('all');
    }

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            saveEdit();
        } else if (e.key === 'Escape') {
            cancelEdit();
        }
    });

    input.addEventListener('blur', saveEdit);
}

// Utility function to escape HTML characters
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Add empty state styling
const style = document.createElement('style');
style.textContent = `
    .empty-state {
        text-align: center;
        padding: 40px 20px;
        color: var(--text-light);
        background-color: var(--light-bg);
        border-radius: var(--border-radius);
        margin-bottom: 1rem;
    }

    .empty-state p {
        margin: 0;
        font-size: 1.1rem;
    }
`;
document.head.appendChild(style);
