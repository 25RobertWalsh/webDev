// DOM Elements
const addBtn = document.getElementById('addBtn');
const todoList = document.getElementById('todoList');
const newTodoInput = document.getElementById('newTodo');

// Scroll animation for homepage-content-items
function revealOnScroll() {
    const items = document.querySelectorAll('.homepage-content-item');
    items.forEach(item => {
        const rect = item.getBoundingClientRect();
        // Trigger animation when item is 100px from bottom of viewport
        if (rect.top < window.innerHeight - 200) {
            item.classList.add('visible');
        }
    });
}

if (document.querySelectorAll('.homepage-content-item').length > 0) {
    window.addEventListener('scroll', revealOnScroll);
    window.addEventListener('DOMContentLoaded', revealOnScroll);
}

let itemNum = 0;
let draggedItem = null;

// Helper to create elements with attributes
const createElement = (tag, className, text = '') => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
};

// Load todos from localStorage
window.addEventListener('DOMContentLoaded', () => {
    const savedTodos = localStorage.getItem('todoItems');
    if (savedTodos) {
        JSON.parse(savedTodos).forEach(todo => createTodoElement(todo.text, todo.completed));
        itemNum = JSON.parse(savedTodos).length;
    }
});

// Save todos to localStorage
const saveTodos = () => {
    const todos = [...todoList.querySelectorAll('.todo-list-item')].map(item => ({
        text: item.querySelector('.todo-text').textContent,
        completed: item.querySelector('.todo-checkbox').checked
    }));
    localStorage.setItem('todoItems', JSON.stringify(todos));
};

// Add new todo item
newTodoInput.addEventListener('keypress', e => e.key === 'Enter' && addTodoItem());
addBtn.addEventListener('click', addTodoItem);

function addTodoItem() {
    if (newTodoInput.value.trim()) {
        createTodoElement(newTodoInput.value, false);
        newTodoInput.value = '';
        saveTodos();
        itemNum++;
    }
}

function createTodoElement(todoText, isCompleted) {
    const li = createElement('li', 'todo-list-item');
    li.id = `todoItem${itemNum}`;
    li.draggable = true;
    
    // Checkbox
    const checkbox = createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'todo-checkbox';
    checkbox.checked = isCompleted;
    
    // Text span
    const textSpan = createElement('span', 'todo-text', todoText);
    if (isCompleted) textSpan.classList.add('completed');
    
    // Event listeners for checkbox and text
    checkbox.addEventListener('change', () => {
        textSpan.classList.toggle('completed');
        saveTodos();
    });
    textSpan.addEventListener('dblclick', () => editTodoItem(textSpan));
    
    // Left group (checkbox + text)
    const leftGroup = createElement('div', 'todo-left-group');
    leftGroup.appendChild(checkbox);
    leftGroup.appendChild(textSpan);
    li.appendChild(leftGroup);
    
    // Edit button
    const editBtn = createElement('button', 'edit-button', 'Edit');
    editBtn.addEventListener('click', () => editTodoItem(textSpan));
    li.appendChild(editBtn);
    
    // Delete button
    const delBtn = createElement('button', 'delete-button', 'Delete');
    delBtn.id = `delBtn${itemNum}`;
    delBtn.addEventListener('click', deleteTodoItem);
    li.appendChild(delBtn);
    
    // Drag events
    li.addEventListener('dragstart', handleDragStart);
    li.addEventListener('dragover', handleDragOver);
    li.addEventListener('drop', handleDrop);
    li.addEventListener('dragend', handleDragEnd);
    li.addEventListener('dragenter', handleDragEnter);
    li.addEventListener('dragleave', handleDragLeave);
    
    todoList.appendChild(li);
}

const deleteTodoItem = e => {
    e.target.parentElement.remove();
    saveTodos();
};

function editTodoItem(textSpan) {
    const currentText = textSpan.textContent;
    const inputBox = createElement('input', 'todo-edit-input');
    inputBox.type = 'text';
    inputBox.value = currentText;
    
    textSpan.replaceWith(inputBox);
    inputBox.focus();
    inputBox.select();
    
    const finishEdit = () => {
        const newText = inputBox.value.trim() || currentText;
        textSpan.textContent = newText;
        inputBox.replaceWith(textSpan);
        saveTodos();
    };
    
    inputBox.addEventListener('keypress', e => e.key === 'Enter' && finishEdit());
    inputBox.addEventListener('blur', finishEdit);
}

// Drag handlers
const handleDragStart = function(e) {
    draggedItem = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
};

const handleDragEnd = function(e) {
    this.classList.remove('dragging');
    todoList.querySelectorAll('.todo-list-item').forEach(item => item.classList.remove('drag-over'));
};

const handleDragOver = e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
};

const handleDragEnter = function() {
    if (this !== draggedItem) this.classList.add('drag-over');
};

const handleDragLeave = function() {
    this.classList.remove('drag-over');
};

const handleDrop = function(e) {
    e.stopPropagation();
    if (draggedItem !== this) {
        todoList.insertBefore(draggedItem, this);
        saveTodos();
    }
};

