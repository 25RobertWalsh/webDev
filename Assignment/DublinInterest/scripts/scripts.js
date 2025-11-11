// ===== To-Do List Functionality =====

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    loadTodos();
    setupEventListeners();
});

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

        todoList.appendChild(li);
    });

    updateStats();
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
