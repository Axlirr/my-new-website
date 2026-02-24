const KEY = 'axlirr_agency_os_v1';

const seed = {
  agents: [
    { id: 'outbound', name: 'Outbound Growth', active: true },
    { id: 'builder', name: 'AI Automation Builder', active: true },
    { id: 'webdev', name: 'Web/Dev Portfolio', active: true },
    { id: 'pm', name: 'PM + Client Success', active: true },
    { id: 'copy', name: 'Copy + Design', active: true }
  ],
  leads: [
    { id: crypto.randomUUID(), company: 'True Care Medical', role: 'Clinic Receptionist', contact: 'Info@truecareclinic.sg', stage: 'Contacted' },
    { id: crypto.randomUUID(), company: 'French Toast Language Centre', role: 'Receptionist/Admin', contact: 'contact@frenchtoast.sg', stage: 'New' },
    { id: crypto.randomUUID(), company: 'Cogent Logistics', role: 'Customer Service Officer', contact: 'enquiry@sh-cogent.com.sg', stage: 'Replied' }
  ],
  tasks: [
    { id: crypto.randomUUID(), title: 'Launch 30-lead outreach batch', owner: 'Outbound Growth', status: 'In Progress' },
    { id: crypto.randomUUID(), title: 'Finalize LP hero + CTA variants', owner: 'Web/Dev Portfolio', status: 'Todo' },
    { id: crypto.randomUUID(), title: 'Publish healthcare blueprint v2', owner: 'AI Automation Builder', status: 'Todo' }
  ],
  comms: 'Shared board initialized. Add daily updates here.',
  logs: []
};

function load() {
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : structuredClone(seed);
}

function save() {
  localStorage.setItem(KEY, JSON.stringify(state));
  document.getElementById('lastSaved').textContent = `Last saved: ${new Date().toLocaleString()}`;
}

let state = load();

function setPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-page="${pageId}"]`).classList.add('active');
  document.getElementById('pageTitle').textContent = pageId[0].toUpperCase() + pageId.slice(1);
}

function renderKPIs() {
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
      <div class="bar-wrap"><div class="bar" style="width:${(counts[i]/max)*100}%"></div></div>
      <small>${counts[i]}</small>
    </div>
  `).join('');
}

function renderAgents() {
  const wrap = document.getElementById('agentList');
  wrap.innerHTML = state.agents.map(a => `
    <div class="agent-card">
      <div class="head">
        <strong>${a.name}</strong>
        <span class="${a.active ? 'on' : 'off'}">${a.active ? 'Active' : 'Paused'}</span>
      </div>
      <button data-agent-toggle="${a.id}">${a.active ? 'Pause' : 'Resume'}</button>
    </div>
  `).join('');

  const selectA = document.getElementById('instructionAgent');
  const selectT = document.getElementById('taskOwner');
  const opts = state.agents.map(a => `<option value="${a.name}">${a.name}</option>`).join('');
  selectA.innerHTML = opts;
  selectT.innerHTML = opts;
}

function renderLeads() {
  const tb = document.getElementById('leadTable');
  tb.innerHTML = state.leads.map(l => `
    <tr>
      <td>${l.company}</td>
      <td>${l.role}</td>
      <td>${l.contact}</td>
      <td>
        <select data-stage-id="${l.id}">
          ${['New','Contacted','Replied','Booked'].map(s => `<option ${l.stage===s?'selected':''}>${s}</option>`).join('')}
        </select>
      </td>
      <td><button data-lead-del="${l.id}">Delete</button></td>
    </tr>
  `).join('');
}

function renderTasks() {
  const board = document.getElementById('taskBoard');
  const cols = ['Todo', 'In Progress', 'Done'];
  board.innerHTML = cols.map(c => `
    <div class="col">
      <h4>${c}</h4>
      ${(state.tasks.filter(t => t.status === c)).map(t => `
        <div class="task">
          <div>${t.title}</div>
          <small>${t.owner}</small><br/>
          <select data-task-move="${t.id}">
            ${cols.map(x => `<option ${x===t.status?'selected':''}>${x}</option>`).join('')}
          </select>
          <button data-task-del="${t.id}">Delete</button>
        </div>
      `).join('')}
    </div>
  `).join('');
}

function renderComms() {
  document.getElementById('commsText').value = state.comms || '';
}

function addLog(msg) {
  state.logs.unshift({ at: new Date().toISOString(), msg });
  state.logs = state.logs.slice(0, 100);
}

function rerender() {
  renderKPIs();
  renderAgents();
  renderLeads();
  renderTasks();
  renderComms();
  save();
}

// Nav
for (const btn of document.querySelectorAll('.nav-btn')) {
  btn.addEventListener('click', () => setPage(btn.dataset.page));
}

// Agent toggles
document.addEventListener('click', e => {
  const id = e.target.dataset.agentToggle;
  if (id) {
    const agent = state.agents.find(a => a.id === id);
    agent.active = !agent.active;
    addLog(`${agent.name} set to ${agent.active ? 'Active' : 'Paused'}`);
    rerender();
  }

  const lid = e.target.dataset.leadDel;
  if (lid) {
    state.leads = state.leads.filter(l => l.id !== lid);
    addLog('Lead deleted');
    rerender();
  }

  const tid = e.target.dataset.taskDel;
  if (tid) {
    state.tasks = state.tasks.filter(t => t.id !== tid);
    addLog('Task deleted');
    rerender();
  }
});

// Lead stage updates + task moves
document.addEventListener('change', e => {
  const sid = e.target.dataset.stageId;
  if (sid) {
    const lead = state.leads.find(l => l.id === sid);
    lead.stage = e.target.value;
    addLog(`Lead stage changed: ${lead.company} -> ${lead.stage}`);
    rerender();
  }

  const tmid = e.target.dataset.taskMove;
  if (tmid) {
    const task = state.tasks.find(t => t.id === tmid);
    task.status = e.target.value;
    addLog(`Task moved: ${task.title} -> ${task.status}`);
    rerender();
  }
});

// Forms
document.getElementById('leadForm').addEventListener('submit', e => {
  e.preventDefault();
  state.leads.unshift({
    id: crypto.randomUUID(),
    company: leadCompany.value.trim(),
    role: leadRole.value.trim(),
    contact: leadContact.value.trim(),
    stage: leadStage.value
  });
  e.target.reset();
  addLog('Lead added');
  rerender();
});

document.getElementById('taskForm').addEventListener('submit', e => {
  e.preventDefault();
  state.tasks.unshift({
    id: crypto.randomUUID(),
    title: taskTitle.value.trim(),
    owner: taskOwner.value,
    status: taskStatus.value
  });
  e.target.reset();
  addLog('Task added');
  rerender();
});

document.getElementById('instructionForm').addEventListener('submit', e => {
  e.preventDefault();
  const msg = `[Instruction -> ${instructionAgent.value}] ${instructionText.value.trim()}`;
  state.comms = `${msg}\n${state.comms}`;
  addLog('Instruction logged');
  instructionText.value = '';
  rerender();
});

document.getElementById('saveComms').addEventListener('click', () => {
  state.comms = document.getElementById('commsText').value;
  addLog('Comms board saved');
  rerender();
});

document.getElementById('exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'axlirr-agency-os-export.json';
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById('resetBtn').addEventListener('click', () => {
  if (!confirm('Reset all dashboard data?')) return;
  state = structuredClone(seed);
  addLog('App reset');
  rerender();
});

rerender();