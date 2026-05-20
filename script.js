// ── Constants ──────────────────────────────────────────────
const COLORS = [
  { hex: '#ff6b6b', label: 'Red' },
  { hex: '#ffd93d', label: 'Yellow' },
  { hex: '#6bcb77', label: 'Green' },
  { hex: '#4d96ff', label: 'Blue' },
  { hex: '#c77dff', label: 'Purple' },
  { hex: '#ff9f43', label: 'Orange' },
];

const TAGS = ['personal', 'work', 'health', 'idea', 'urgent', 'creative'];

const COLOR_TAG_MAP = {
  '#ff6b6b': 'urgent',
  '#ffd93d': 'idea',
  '#6bcb77': 'health',
  '#4d96ff': 'work',
  '#c77dff': 'creative',
  '#ff9f43': 'personal',
};

// ── State ───────────────────────────────────────────────────
let todos         = JSON.parse(localStorage.getItem('colorful-todos') || '[]');
let selectedColor = COLORS[3].hex; // default: blue
let filter        = 'all';

// ── Element refs ────────────────────────────────────────────
const todoInput  = document.getElementById('todo-input');
const addBtn     = document.getElementById('add-btn');
const todoList   = document.getElementById('todo-list');
const emptyState = document.getElementById('empty-state');
const clearBtn   = document.getElementById('clear-btn');
const pickerEl   = document.getElementById('color-picker');

// ── Build color picker ──────────────────────────────────────
COLORS.forEach(c => {
  const dot = document.createElement('button');
  dot.className  = 'color-dot' + (c.hex === selectedColor ? ' selected' : '');
  dot.style.background = c.hex;
  dot.title      = c.label;

  dot.addEventListener('click', () => {
    selectedColor = c.hex;
    document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
    dot.classList.add('selected');
  });

  pickerEl.appendChild(dot);
});

// ── Helpers ─────────────────────────────────────────────────
function save() {
  localStorage.setItem('colorful-todos', JSON.stringify(todos));
}

function escapeHtml(s) {
  return s
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;');
}

function getTag(text) {
  const lower = text.toLowerCase();
  for (const tag of TAGS) {
    if (lower.includes(tag)) return tag;
  }
  return COLOR_TAG_MAP[selectedColor] || 'task';
}

// ── CRUD ─────────────────────────────────────────────────────
function addTodo() {
  const text = todoInput.value.trim();
  if (!text) { todoInput.focus(); return; }

  const todo = {
    id:      Date.now(),
    text,
    done:    false,
    color:   selectedColor,
    tag:     getTag(text),
    created: Date.now(),
  };

  todos.unshift(todo);
  save();
  render();
  todoInput.value = '';
  todoInput.focus();
}

function toggleTodo(id) {
  const t = todos.find(t => t.id === id);
  if (t) { t.done = !t.done; save(); render(); }
}

function deleteTodo(id) {
  const el = document.querySelector(`[data-id="${id}"]`);
  if (!el) return;

  el.classList.add('removing');
  el.addEventListener('animationend', () => {
    todos = todos.filter(t => t.id !== id);
    save();
    render();
  }, { once: true });
}

function clearDone() {
  todos = todos.filter(t => !t.done);
  save();
  render();
}

// ── Render ───────────────────────────────────────────────────
function render() {
  const filtered = todos.filter(t => {
    if (filter === 'active') return !t.done;
    if (filter === 'done')   return  t.done;
    return true;
  });

  // Update stat pills
  document.getElementById('count-active').textContent = todos.filter(t => !t.done).length;
  document.getElementById('count-done').textContent   = todos.filter(t =>  t.done).length;
  document.getElementById('count-total').textContent  = todos.length;

  // Clear button visibility
  clearBtn.classList.toggle('visible', todos.some(t => t.done));

  // Empty state
  if (filtered.length === 0) {
    todoList.innerHTML = '';
    emptyState.classList.add('show');

    emptyState.querySelector('.empty-emoji').textContent =
      filter === 'done'   ? '😅' :
      filter === 'active' ? '✅' : '🎉';

    emptyState.querySelector('p').textContent =
      filter === 'done'   ? 'No completed tasks yet.'    :
      filter === 'active' ? 'All tasks done! Great job!' :
      'Nothing here. Add something!';

    return;
  }

  emptyState.classList.remove('show');

  todoList.innerHTML = filtered.map(t => `
    <div class="todo-item ${t.done ? 'done' : ''}" data-id="${t.id}" style="--item-color: ${t.color}">
      <button class="check-btn" onclick="toggleTodo(${t.id})" title="Toggle done">
        <span class="checkmark">✓</span>
      </button>
      <span class="todo-text">${escapeHtml(t.text)}</span>
      <span class="todo-tag">${t.tag}</span>
      <button class="del-btn" onclick="deleteTodo(${t.id})" title="Delete">✕</button>
    </div>
  `).join('');
}

// ── Event listeners ──────────────────────────────────────────
addBtn.addEventListener('click', addTodo);

todoInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') addTodo();
});

clearBtn.addEventListener('click', clearDone);

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    filter = btn.dataset.filter;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    render();
  });
});

// ── Init ─────────────────────────────────────────────────────
render();