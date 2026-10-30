
const $ = id => document.getElementById(id);
const keyBox = $('key');
keyBox.value = sessionStorage.getItem('adminKey') || '';
keyBox.addEventListener('input', () => sessionStorage.setItem('adminKey', keyBox.value));

let courses = [];
let editingId = null;

function say(text, isError) {
  const m = $('msg');
  m.textContent = text;
  m.className = 'message' + (isError ? ' error' : '');
}

async function api(url, method, body) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', 'x-admin-key': keyBox.value },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
  return data;
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function render() {
  const box = $('list');
  if (!courses.length) { box.innerHTML = '<p class="empty">No courses yet. Add the first one above.</p>'; return; }
  box.innerHTML = courses.map(c => `
    <div class="course">
      <b>${esc(c.code)}</b> – ${esc(c.name)}
      <small>${esc(c.duration)}</small>
      <small>${esc(c.description)}</small>
      <div class="actions">
        <button class="mini" data-edit="${c.id}">Edit</button>
        <button class="mini danger" data-del="${c.id}">Delete</button>
      </div>
    </div>`).join('');
}

async function load() {
  try {
    courses = await api('/api/courses', 'GET');
    render();
  } catch (e) { $('list').innerHTML = '<p class="empty">' + esc(e.message) + '</p>'; }
}

function resetForm() {
  editingId = null;
  $('courseForm').reset();
  $('formTitle').textContent = 'Add a course';
  $('saveBtn').textContent = 'Add course';
  $('cancelBtn').hidden = true;
}

$('courseForm').addEventListener('submit', async e => {
  e.preventDefault();
  const body = { code: $('code').value, name: $('name').value, duration: $('duration').value, description: $('description').value };
  if (!body.code.trim() || !body.name.trim()) return say('Enter a course code and name.', true);
  try {
    if (editingId) await api('/api/courses/' + editingId, 'PUT', body);
    else await api('/api/courses', 'POST', body);
    say(editingId ? 'Course updated.' : 'Course added.');
    resetForm();
    load();
  } catch (err) { say(err.message, true); }
});

$('cancelBtn').addEventListener('click', () => { resetForm(); say(''); });

$('list').addEventListener('click', async e => {
  const edit = e.target.dataset.edit, del = e.target.dataset.del;
  if (edit) {
    const c = courses.find(x => x.id === edit);
    editingId = edit;
    $('code').value = c.code; $('name').value = c.name;
    $('duration').value = c.duration; $('description').value = c.description;
    $('formTitle').textContent = 'Edit course';
    $('saveBtn').textContent = 'Save changes';
    $('cancelBtn').hidden = false;
    $('code').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  if (del && confirm('Delete this course?')) {
    try { await api('/api/courses/' + del, 'DELETE'); say('Course deleted.'); load(); }
    catch (err) { say(err.message, true); }
  }
});

load();