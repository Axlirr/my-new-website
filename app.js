const STORAGE_KEY = 'axlirr_agency_os_v2';

const seed = {
  agents: [
    { id: 'outbound', name: 'Outbound Growth', active: true },
    { id: 'builder', name: 'AI Automation Builder', active: true },
    { id: 'webdev', name: 'Web/Dev Portfolio', active: true },
    { id: 'pmcs', name: 'PM + Client Success', active: true },
    { id: 'copy', name: 'Copy + Design Enablement', active: true }
  ],
  leads: [
    { id: crypto.randomUUID(), company: 'True Care Medical', role: 'Clinic Receptionist', contact: 'info@truecareclinic.sg', stage: 'Contacted' },
    { id: crypto.randomUUID(), company: 'French Toast Language Centre', role: 'Receptionist / Admin', contact: 'contact@frenchtoast.sg', stage: 'New' },
    { id: crypto.randomUUID(), company: 'Cogent Logistics', role: 'Customer Service Officer', contact: 'enquiry@sh-cogent.com.sg', stage: 'Replied' }
  ],
  tasks: [
    { id: crypto.randomUUID(), title: 'Launch 30-lead outreach batch', owner: 'Outbound Growth', status: 'In Progress' },
    { id: crypto.randomUUID(), title: 'Finalize landing page CTA variants', owner: 'Web/Dev Portfolio', status: 'Todo' },
    { id: crypto.randomUUID(), title: 'Prepare UAT checklist v1', owner: 'PM + Client Success', status: 'Todo' }
  ],
  comms: 'Cross-agent board:\n- Daily updates\n- Blockers\n- Handshake requests',
  logs: []
};

const pageId = document.body.dataset.page || 'overview';

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : structuredClone(seed);
}
let state = loadState();

function saveState(note) {
  if (note) {
    state.logs.unshift({ at: new Date().toISOString(), message: note });
    state.logs = state.logs.slice(0, 100);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  const ls = document.getElementById('lastSaved');
  if (ls) ls.textContent = `Last saved: ${new Date().toLocaleString()}`;
  renderSidebarStats();
}

function renderSidebarStats() {
  const el = document.getElementById('sidebarStats');
  if (!el) return;
  const booked = state.leads.filter(l => l.stage === 'Booked').length;
  const openTasks = state.tasks.filter(t => t.status !== 'Done').length;
  const activeAgents = state.agents.filter(a => a.active).length;
  el.innerHTML = `
    <p>Leads: <strong>${state.leads.length}</strong></p>
    <p>Booked Calls: <strong>${booked}</strong></p>
    <p>Open Tasks: <strong>${openTasks}</strong></p>
    <p>Active Agents: <strong>${activeAgents}</strong></p>
  `;
}

function setupLayout() {
  document.querySelectorAll('.nav a').forEach(a => {
    if (a.dataset.page === pageId) a.classList.add('active');
  });

  const btn = document.getElementById('mobileMenuBtn');
  const sidebar = document.getElementById('sidebar');
  if (btn && sidebar) {
    btn.addEventListener('click', () => sidebar.classList.toggle('open'));
    document.querySelectorAll('.nav a').forEach(a => a.addEventListener('click', () => sidebar.classList.remove('open')));
  }

  const title = document.getElementById('topTitle');
  if (title) {
    const map = {
      overview: 'Overview',
      agents: 'Agents',
      leads: 'Leads',
      tasks: 'Tasks',
      comms: 'Comms Board',
      settings: 'Settings'
    };
    title.textContent = map[pageId] || 'Dashboard';
  }
}

function agentOptions() {
  return state.agents.map(a => `<option value="${a.name}">${a.name}</option>`).join('');
}

function renderOverview() {
  const kpiLeads = document.getElementById('kpiLeads');
  if (!kpiLeads) return;
  document.getElementById('kpiLeads').textContent = state.leads.length;
  document.getElementById('kpiCalls').textContent = state.leads.filter(l => l.stage === 'Booked').length;
  document.getElementById('kpiTasks').textContent = state.tasks.filter(t => t.status !== 'Done').length;
  document.getElementById('kpiAgents').textContent = state.agents.filter(a => a.active).length;

  const stages = ['New', 'Contacted', 'Replied', 'Booked'];
  const counts = stages.map(s => state.leads.filter(l => l.stage === s).length);
  const max = Math.max(...counts, 1);
  const bars = document.getElementById('funnelBars');
  bars.innerHTML = stages.map((s, i) => `
    <div class="bar-row">
      <small>${s}</small>
      <div class="bar-wrap"><div class="bar" style="width:${(counts[i] / max) * 100}%"></div></div>
      <small>${counts[i]}</small>
    </div>
  `).join('');

  const recent = document.getElementById('recentLogs');
  recent.innerHTML = (state.logs.slice(0, 8)).map(l => `<li>${new Date(l.at).toLocaleString()} — ${l.message}</li>`).join('') || '<li>No activity yet.</li>';
}

function renderAgents() {
  const list = document.getElementById('agentList');
  if (!list) return;
  list.innerHTML = state.agents.map(a => `
    <div class="agent-card">
      <div class="agent-head">
        <strong>${a.name}</strong>
        <span class="${a.active ? 'status-on' : 'status-off'}">${a.active ? 'Active' : 'Paused'}</span>
      </div>
      <button data-toggle-agent="${a.id}">${a.active ? 'Pause' : 'Resume'}</button>
    </div>
  `).join('');

  const sel = document.getElementById('instructionAgent');
  if (sel) sel.innerHTML = agentOptions();
}

function renderLeads() {
  const table = document.getElementById('leadTable');
  if (!table) return;
  table.innerHTML = state.leads.map(l => `
    <tr>
      <td>${l.company}</td>
      <td>${l.role}</td>
      <td>${l.contact}</td>
      <td>
        <select data-stage-id="${l.id}">
          ${['New', 'Contacted', 'Replied', 'Booked'].map(s => `<option ${s === l.stage ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </td>
      <td><button data-del-lead="${l.id}">Delete</button></td>
    </tr>
  `).join('');
}

function renderTasks() {
  const board = document.getElementById('taskBoard');
  if (!board) return;
  const cols = ['Todo', 'In Progress', 'Done'];
  board.innerHTML = cols.map(c => `
    <div class="kanban-col">
      <h4>${c}</h4>
      ${(state.tasks.filter(t => t.status === c)).map(t => `
        <div class="task-card">
          <div>${t.title}</div>
          <small>${t.owner}</small>
          <div class="inline" style="margin-top:8px;">
            <select data-move-task="${t.id}">
              ${cols.map(x => `<option ${x === t.status ? 'selected' : ''}>${x}</option>`).join('')}
            </select>
            <button data-del-task="${t.id}">Delete</button>
          </div>
        </div>
      `).join('') || '<p class="muted">No tasks</p>'}
    </div>
  `).join('');

  const ownerSel = document.getElementById('taskOwner');
  if (ownerSel) ownerSel.innerHTML = agentOptions();
}

function renderComms() {
  const c = document.getElementById('commsText');
  if (!c) return;
  c.value = state.comms || '';
}

function wireForms() {
  const leadForm = document.getElementById('leadForm');
  if (leadForm) {
    leadForm.addEventListener('submit', e => {
      e.preventDefault();
      state.leads.unshift({
        id: crypto.randomUUID(),
        company: leadCompany.value.trim(),
        role: leadRole.value.trim(),
        contact: leadContact.value.trim(),
        stage: leadStage.value
      });
      leadForm.reset();
      saveState('Lead added');
      renderLeads();
      renderOverview();
    });
  }

  const taskForm = document.getElementById('taskForm');
  if (taskForm) {
    taskForm.addEventListener('submit', e => {
      e.preventDefault();
      state.tasks.unshift({
        id: crypto.randomUUID(),
        title: taskTitle.value.trim(),
        owner: taskOwner.value,
        status: taskStatus.value
      });
      taskForm.reset();
      saveState('Task added');
      renderTasks();
      renderOverview();
    });
  }

  const instrForm = document.getElementById('instructionForm');
  if (instrForm) {
    instrForm.addEventListener('submit', e => {
      e.preventDefault();
      const line = `[Instruction -> ${instructionAgent.value}] ${instructionText.value.trim()}`;
      state.comms = `${line}\n${state.comms || ''}`;
      instructionText.value = '';
      saveState('Agent instruction logged');
      renderComms();
    });
  }

  const saveComms = document.getElementById('saveComms');
  if (saveComms) {
    saveComms.addEventListener('click', () => {
      state.comms = document.getElementById('commsText').value;
      saveState('Comms board updated');
    });
  }

  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'agency-os-data.json';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  const resetBtn = document.getElementById('resetBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (!confirm('Reset all dashboard data?')) return;
      state = structuredClone(seed);
      saveState('App data reset');
      location.reload();
    });
  }
}

function wireDelegates() {
  document.addEventListener('click', e => {
    const aid = e.target.dataset.toggleAgent;
    if (aid) {
      const a = state.agents.find(x => x.id === aid);
      if (!a) return;
      a.active = !a.active;
      saveState(`${a.name} set to ${a.active ? 'Active' : 'Paused'}`);
      renderAgents();
      renderOverview();
    }

    const dl = e.target.dataset.delLead;
    if (dl) {
      state.leads = state.leads.filter(l => l.id !== dl);
      saveState('Lead deleted');
      renderLeads();
      renderOverview();
    }

    const dt = e.target.dataset.delTask;
    if (dt) {
      state.tasks = state.tasks.filter(t => t.id !== dt);
      saveState('Task deleted');
      renderTasks();
      renderOverview();
    }
  });

  document.addEventListener('change', e => {
    const sid = e.target.dataset.stageId;
    if (sid) {
      const lead = state.leads.find(l => l.id === sid);
      if (!lead) return;
      lead.stage = e.target.value;
      saveState(`Lead stage changed: ${lead.company} -> ${lead.stage}`);
      renderOverview();
    }

    const mt = e.target.dataset.moveTask;
    if (mt) {
      const task = state.tasks.find(t => t.id === mt);
      if (!task) return;
      task.status = e.target.value;
      saveState(`Task status changed: ${task.title} -> ${task.status}`);
      renderTasks();
      renderOverview();
    }
  });
}

function init() {
  setupLayout();
  renderSidebarStats();
  renderOverview();
  renderAgents();
  renderLeads();
  renderTasks();
  renderComms();
  wireForms();
  wireDelegates();
  saveState();
}

init();