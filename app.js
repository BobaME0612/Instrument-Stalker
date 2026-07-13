// Data Model & State Management
let projects = [];
let activeProjectId = '';
let selectedInstrumentId = '';
let statusChartInstance = null;
let areaChartInstance = null;
let parsedImportData = []; // Store temporary import rows
let currentView = 'main'; // 'main' for global dashboard, 'sub' for sub-project instrument list
let selectedOverviewProjIds = []; // IDs of sub-projects selected in Global overview
let theme = 'light'; // 'light' or 'dark' theme
let draggedProjectId = null; // Store ID of project being dragged
let selectedRowIds = []; // IDs of selected rows in table for batch operations
let barChartSlots = []; // Slots configuration for comparison bar chart: [{ id, show, projectId, color }]

// Supabase Configuration API Credentials
const SUPABASE_URL = 'https://fweihrswsepkbsevsdll.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable___2zHcSBoEt9jaYZ2hCpOQ_GCdSWgfm';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Constant Configuration
const INSTRUMENT_TYPES = [
  'Flow Transmitter',
  'Level Transmitter',
  'Pressure Transmitter',
  'Temperature Transmitter',
  'Gauge',
  'Moter Operate Valve',
  'Control/ONOFF Valve',
  'Other'
];
const MILESTONES = [
  { id: 'calibrated', name: 'Calibrated' },
  { id: 'installation', name: 'Installed' },
  { id: 'cabling', name: 'Cabling' },
  { id: 'loopCheck', name: 'Loop Check' }
];

// Mock Data Definitions
const mockProjects = [
  {
    id: 'proj-1',
    name: 'Unit 1 Boiler Renovation',
    description: 'Upgrading primary steam and feedwater loop transmitters in Unit 1 Boiler area.',
    instruments: [
      {
        id: 'inst-101',
        tag: 'PIT-101A',
        name: 'Main Steam Header Pressure',
        type: 'Pressure Transmitter',
        area: 'Boiler Area A',
        technician: 'Somchai S.',
        targetDate: '2026-07-20',
        notes: 'Mounting bracket must be heavy-duty carbon steel. Signal loop goes to DCS panel Cabinet 3.',
        steps: { calibrated: true, installation: true, cabling: true, loopCheck: true },
        status: 'Commissioned',
        progress: 100,
        logs: [
          { date: '2026-07-01T08:00:00Z', message: 'Instrument registered in database.' },
          { date: '2026-07-02T10:30:00Z', message: 'Physical installation completed.' },
          { date: '2026-07-03T14:15:00Z', message: 'Cabling terminated and glanded.' },
          { date: '2026-07-05T11:00:00Z', message: 'Loop check complete. Signal verified on DCS.' }
        ]
      },
      {
        id: 'inst-102',
        tag: 'TIT-102',
        name: 'Reheater Inlet Temperature',
        type: 'Temperature Transmitter',
        area: 'Boiler Area A',
        technician: 'Somchai S.',
        targetDate: '2026-07-22',
        notes: 'Thermowell insertion depth is 250mm. Duplex Type K thermocouple.',
        steps: { calibrated: true, installation: true, cabling: true, loopCheck: false },
        status: 'Calibrated',
        progress: 75,
        logs: [
          { date: '2026-07-01T08:15:00Z', message: 'Instrument registered in database.' },
          { date: '2026-07-03T11:00:00Z', message: 'Thermowell and transmitter head mounted.' },
          { date: '2026-07-04T15:20:00Z', message: 'Compensation cable glanded and cabled.' }
        ]
      },
      {
        id: 'inst-103',
        tag: 'FIT-103',
        name: 'Feedwater Line Flowmeter',
        type: 'Flow Transmitter',
        area: 'Boiler Area B',
        technician: 'John D.',
        targetDate: '2026-07-25',
        notes: 'Orifice plate transmitter. Check correct flow direction arrow during tubing.',
        steps: { calibrated: false, installation: true, cabling: false, loopCheck: false },
        status: 'In Progress',
        progress: 25,
        logs: [
          { date: '2026-07-01T08:20:00Z', message: 'Instrument registered in database.' },
          { date: '2026-07-05T13:40:00Z', message: 'Flowmeter body physically installed.' }
        ]
      },
      {
        id: 'inst-104',
        tag: 'LCV-104',
        name: 'Drum Level Control Valve',
        type: 'Control/ONOFF Valve',
        area: 'Boiler Area A',
        technician: 'John D.',
        targetDate: '2026-07-28',
        notes: 'Pneumatic actuator with smart positioner. Requires 4-20mA control signal and 1.4 barg air supply.',
        steps: { calibrated: false, installation: false, cabling: false, loopCheck: false },
        status: 'Pending',
        progress: 0,
        logs: [
          { date: '2026-07-01T08:30:00Z', message: 'Instrument registered in database.' }
        ]
      },
      {
        id: 'inst-105',
        tag: 'LIT-105',
        name: 'Boiler Drum Level Transmitter',
        type: 'Level Transmitter',
        area: 'Boiler Area B',
        technician: 'Somchai S.',
        targetDate: '2026-07-21',
        notes: 'Guided wave radar type. Internal probe length matches high-low float tap distance.',
        steps: { calibrated: true, installation: true, cabling: true, loopCheck: false },
        status: 'Calibrated',
        progress: 75,
        logs: [
          { date: '2026-07-01T08:45:00Z', message: 'Instrument registered in database.' },
          { date: '2026-07-02T13:00:00Z', message: 'Sensor flange bolted to drum standpipe.' },
          { date: '2026-07-03T16:30:00Z', message: 'Coaxial cabling connected to transmitter head.' }
        ]
      }
    ]
  },
  {
    id: 'proj-2',
    name: 'Water Treatment Plant Upgrade',
    description: 'Dosing pump instrument enhancements and filtration block automation gauges.',
    instruments: [
      {
        id: 'inst-201',
        tag: 'FIT-201',
        name: 'Clarified Water Intake Flow',
        type: 'Flow Transmitter',
        area: 'Water Treatment Plant',
        technician: 'Alice W.',
        targetDate: '2026-07-15',
        notes: 'Electromagnetic flowmeter. Needs grounding rings installed on rubber-lined flange.',
        steps: { calibrated: true, installation: true, cabling: true, loopCheck: true },
        status: 'Commissioned',
        progress: 100,
        logs: [
          { date: '2026-07-01T09:00:00Z', message: 'Registered instrument.' },
          { date: '2026-07-02T10:00:00Z', message: 'Flow tube bolted into raw water pipeline.' },
          { date: '2026-07-03T11:00:00Z', message: 'Power supply and signal cables completed.' },
          { date: '2026-07-05T14:00:00Z', message: 'Analog and pulse loop check verified at PLC panel.' }
        ]
      },
      {
        id: 'inst-202',
        tag: 'pH-202',
        name: 'Alum Dosing Dosing pH Sensor',
        type: 'Other',
        area: 'Water Treatment Plant',
        technician: 'Alice W.',
        targetDate: '2026-07-18',
        notes: 'pH glass electrode. Keep electrode bulb wet in buffer storage solution until power up.',
        steps: { calibrated: true, installation: true, cabling: true, loopCheck: false },
        status: 'Calibrated',
        progress: 75,
        logs: [
          { date: '2026-07-01T09:05:00Z', message: 'Registered instrument.' },
          { date: '2026-07-03T14:00:00Z', message: 'pH sensor flow-through chamber installed.' },
          { date: '2026-07-04T11:30:00Z', message: 'Special low-noise sensor cabling run to analyzer.' }
        ]
      },
      {
        id: 'inst-203',
        tag: 'LCV-203',
        name: 'Filter Backwash Control Valve',
        type: 'Control/ONOFF Valve',
        area: 'Water Treatment Plant',
        technician: 'Alice W.',
        targetDate: '2026-07-29',
        notes: 'Butterfly valve. Double-acting pneumatic cylinder. Limit switch box for feed-back.',
        steps: { calibrated: false, installation: false, cabling: false, loopCheck: false },
        status: 'Pending',
        progress: 0,
        logs: [
          { date: '2026-07-01T09:10:00Z', message: 'Registered instrument.' }
        ]
      }
    ]
  }
];

// App Initialization
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  setupEventListeners();
  updateClock();
  setInterval(updateClock, 1000);
});

// Load all data from Supabase DB on app startup
async function loadData() {
  const savedActiveId = localStorage.getItem('inst_active_proj_id');
  const savedView = localStorage.getItem('inst_current_view');
  const savedSelectedIds = localStorage.getItem('inst_selected_overview_ids');
  const savedTheme = localStorage.getItem('inst_theme');
  const savedSlots = localStorage.getItem('inst_bar_chart_slots');

  try {
    // 1. Fetch all projects from Supabase
    const { data: dbProjects, error: projError } = await supabaseClient
      .from('projects')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (projError) throw projError;

    // 2. Fetch all instruments from Supabase
    const { data: dbInstruments, error: instError } = await supabaseClient
      .from('instruments')
      .select('*');
      
    if (instError) throw instError;

    // 3. Assemble frontend data structure
    projects = dbProjects.map(proj => {
      return {
        id: proj.id,
        name: proj.name,
        description: proj.description,
        instruments: dbInstruments.filter(inst => inst.project_id === proj.id)
      };
    });

  } catch (err) {
    console.error("Error loading data from Supabase:", err);
    alert("Could not load data from database. Falling back to local/mock data.");
    projects = [];
  }

  // Handle active views state initialization
  if (savedActiveId && projects.some(p => p.id === savedActiveId)) {
    activeProjectId = savedActiveId;
  } else if (projects.length > 0) {
    activeProjectId = projects[0].id;
  }

  // Differentiate between new tab/session load and page refresh
  const isRefresh = sessionStorage.getItem('inst_session_active');
  if (isRefresh && savedView) {
    currentView = savedView;
  } else {
    currentView = 'main';
    sessionStorage.setItem('inst_session_active', 'true');
  }

  if (savedSelectedIds) {
    selectedOverviewProjIds = JSON.parse(savedSelectedIds);
  } else {
    selectedOverviewProjIds = projects.map(p => p.id);
  }

  theme = savedTheme || 'light';
  if (theme === 'dark') {
    document.body.classList.add('dark-theme');
  } else {
    document.body.classList.remove('dark-theme');
  }

  // Load bar chart slots configurations
  if (savedSlots) {
    barChartSlots = JSON.parse(savedSlots);
    
    // Auto-validate slots to ensure selected projectIds still exist
    barChartSlots.forEach(slot => {
      if (slot.projectId && !projects.some(p => p.id === slot.projectId)) {
        slot.projectId = projects[0]?.id || '';
      }
    });
  } else {
    // Initialize default slots based on first 4 projects (or less if there are fewer projects)
    barChartSlots = [];
    const defaultPalette = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444', '#06b6d4', '#14b8a6'];
    projects.slice(0, 4).forEach((p, idx) => {
      barChartSlots.push({
        id: 'slot-' + Date.now() + '-' + idx,
        show: true,
        projectId: p.id,
        color: defaultPalette[idx % defaultPalette.length]
      });
    });
  }
  
  renderProjectList();
  renderActiveView();
  updateThemeButtonIcon();
}

// Save local status UI variables (such as active theme, active project selection) to LocalStorage
function saveData() {
  localStorage.setItem('inst_active_proj_id', activeProjectId);
  localStorage.setItem('inst_current_view', currentView);
  localStorage.setItem('inst_selected_overview_ids', JSON.stringify(selectedOverviewProjIds));
  localStorage.setItem('inst_theme', theme);
  localStorage.setItem('inst_bar_chart_slots', JSON.stringify(barChartSlots));
}

// System Time Clock
function updateClock() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour12: false });
  const dateStr = now.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  const clockEl = document.getElementById('timeString');
  if (clockEl) {
    clockEl.textContent = `${dateStr} ${timeStr}`;
  }
}

// Render the Sidebar Project List
function renderProjectList() {
  const projectListEl = document.getElementById('projectList');
  if (!projectListEl) return;
  
  projectListEl.innerHTML = '';
  
  projects.forEach(project => {
    // Calculate overall project progress
    const totalInsts = project.instruments.length;
    let overallProgress = 0;
    if (totalInsts > 0) {
      const totalProgress = project.instruments.reduce((acc, curr) => acc + (curr.progress || 0), 0);
      overallProgress = Math.round(totalProgress / totalInsts);
    }
    
    const isActive = (project.id === activeProjectId) && (currentView === 'sub');
    
    const projectItem = document.createElement('div');
    projectItem.className = `project-item ${isActive ? 'active' : ''}`;
    projectItem.setAttribute('role', 'listitem');
    projectItem.onclick = () => selectProject(project.id);
    
    // Drag & Drop event listeners
    projectItem.setAttribute('draggable', 'true');
    projectItem.addEventListener('dragstart', (e) => {
      draggedProjectId = project.id;
      projectItem.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    
    projectItem.addEventListener('dragend', () => {
      projectItem.classList.remove('dragging');
      draggedProjectId = null;
      document.querySelectorAll('#projectList .project-item').forEach(el => {
        el.classList.remove('drag-over-top');
        el.classList.remove('drag-over-bottom');
      });
    });
    
    projectItem.addEventListener('dragover', (e) => {
      e.preventDefault();
      const rect = projectItem.getBoundingClientRect();
      const relativeY = e.clientY - rect.top;
      const isTop = relativeY < rect.height / 2;
      
      if (isTop) {
        projectItem.classList.add('drag-over-top');
        projectItem.classList.remove('drag-over-bottom');
      } else {
        projectItem.classList.add('drag-over-bottom');
        projectItem.classList.remove('drag-over-top');
      }
    });
    
    projectItem.addEventListener('dragleave', () => {
      projectItem.classList.remove('drag-over-top');
      projectItem.classList.remove('drag-over-bottom');
    });
    
    projectItem.addEventListener('drop', (e) => {
      e.preventDefault();
      projectItem.classList.remove('drag-over-top');
      projectItem.classList.remove('drag-over-bottom');
      
      if (!draggedProjectId || draggedProjectId === project.id) return;
      
      const rect = projectItem.getBoundingClientRect();
      const relativeY = e.clientY - rect.top;
      const isTop = relativeY < rect.height / 2;
      
      const draggedIndex = projects.findIndex(p => p.id === draggedProjectId);
      if (draggedIndex === -1) return;
      const draggedProj = projects[draggedIndex];
      
      // Remove from old position
      projects.splice(draggedIndex, 1);
      
      // Insert at new position
      let targetIndex = projects.findIndex(p => p.id === project.id);
      if (!isTop) {
        targetIndex += 1;
      }
      
      projects.splice(targetIndex, 0, draggedProj);
      
      saveData();
      renderProjectList();
      renderActiveView();
    });
    
    projectItem.innerHTML = `
      <div class="project-item-header">
        <span class="project-name" title="${project.name}">${project.name}</span>
        <div class="project-actions">
          <button class="project-btn edit-proj-btn" data-id="${project.id}" title="Rename project">✏️</button>
          <button class="project-btn delete delete-proj-btn" data-id="${project.id}" title="Delete project">🗑️</button>
        </div>
      </div>
      <div class="project-progress-bar-container">
        <div class="project-progress-fill" style="width: ${overallProgress}%"></div>
      </div>
      <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 4px; display: flex; justify-content: space-between;">
        <span>${totalInsts} Instruments</span>
        <span>${overallProgress}% Done</span>
      </div>
    `;
    
    projectListEl.appendChild(projectItem);
  });
  
  // Attach event listeners for project edit/delete buttons
  document.querySelectorAll('.edit-proj-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      renameProject(btn.getAttribute('data-id'));
    };
  });
  
  document.querySelectorAll('.delete-proj-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      deleteProject(btn.getAttribute('data-id'));
    };
  });
}

// Switch active sub-project
function selectProject(projectId) {
  activeProjectId = projectId;
  currentView = 'sub';
  selectedRowIds = []; // Clear batch selection
  saveData();
  renderProjectList();
  renderActiveView();
  closeDrawer();
}

// Switch to global dashboard
function switchToGlobalDashboard() {
  currentView = 'main';
  selectedRowIds = []; // Clear batch selection
  saveData();
  renderProjectList();
  renderActiveView();
  closeDrawer();
}

// Toggle app theme (Light / Dark mode)
function toggleTheme() {
  theme = theme === 'light' ? 'dark' : 'light';
  if (theme === 'dark') {
    document.body.classList.add('dark-theme');
  } else {
    document.body.classList.remove('dark-theme');
  }
  saveData();
  updateThemeButtonIcon();
  
  // Re-render the active view to refresh Chart colors dynamically
  renderActiveView();
}

function updateThemeButtonIcon() {
  const iconEl = document.getElementById('themeIcon');
  const btnEl = document.getElementById('btnThemeToggle');
  if (!iconEl || !btnEl) return;
  
  if (theme === 'dark') {
    // Sun icon for switching to light theme
    iconEl.innerHTML = `
      <circle cx="12" cy="12" r="5"></circle>
      <line x1="12" y1="1" x2="12" y2="3"></line>
      <line x1="12" y1="21" x2="12" y2="23"></line>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
      <line x1="1" y1="12" x2="3" y2="12"></line>
      <line x1="21" y1="12" x2="23" y2="12"></line>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
    `;
    btnEl.title = "Switch to Light Mode";
  } else {
    // Moon icon for switching to dark theme
    iconEl.innerHTML = `
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    `;
    btnEl.title = "Switch to Dark Mode";
  }
}

// Create New Project
async function createProject() {
  const name = prompt("Enter new project name:");
  if (!name || name.trim() === "") return;
  
  const desc = prompt("Enter project description (optional):") || "";
  const newProjId = 'proj-' + Date.now();
  
  const { error } = await supabaseClient
    .from('projects')
    .insert({ id: newProjId, name: name.trim(), description: desc.trim() });
    
  if (error) {
    alert("Failed to create project in database.");
    console.error(error);
    return;
  }
  
  activeProjectId = newProjId;
  currentView = 'sub';
  selectedOverviewProjIds.push(newProjId);
  
  saveData();
  await loadData();
  closeDrawer();
}

// Rename Project
async function renameProject(projectId) {
  const project = projects.find(p => p.id === projectId);
  if (!project) return;
  
  const newName = prompt("Rename project to:", project.name);
  if (!newName || newName.trim() === "") return;
  
  const { error } = await supabaseClient
    .from('projects')
    .update({ name: newName.trim() })
    .eq('id', projectId);
    
  if (error) {
    alert("Failed to rename project in database.");
    console.error(error);
    return;
  }
  
  saveData();
  await loadData();
}

// Delete Project
async function deleteProject(projectId) {
  const project = projects.find(p => p.id === projectId);
  if (!project) return;
  
  const confirmDel = confirm(`Are you sure you want to delete project "${project.name}" and all its instruments? This action cannot be undone.`);
  if (!confirmDel) return;
  
  const { error } = await supabaseClient
    .from('projects')
    .delete()
    .eq('id', projectId);
    
  if (error) {
    alert("Failed to delete project from database.");
    console.error(error);
    return;
  }
  
  projects = projects.filter(p => p.id !== projectId);
  selectedOverviewProjIds = selectedOverviewProjIds.filter(id => id !== projectId);
  
  if (activeProjectId === projectId) {
    activeProjectId = projects.length > 0 ? projects[0].id : '';
  }
  
  if (projects.length === 0) {
    currentView = 'main';
  }
  
  saveData();
  await loadData();
  closeDrawer();
}

// Render active view based on view mode (Global Dashboard vs Sub-Project list)
function renderActiveView() {
  const btnGlobal = document.getElementById('btnGlobalDashboard');
  
  if (currentView === 'main') {
    // Highlight sidebar Global Dashboard item
    btnGlobal.classList.add('active');
    // De-highlight sub-project sidebar items
    document.querySelectorAll('#projectList .project-item').forEach(el => el.classList.remove('active'));
    
    // Set Header titles
    document.getElementById('activeProjectName').textContent = 'Global Overview';
    document.getElementById('activeProjectDesc').textContent = 'Aggregated dashboard tracking all selected sub-projects.';
    
    // Hide sub-project specific elements
    document.getElementById('tableSection').style.display = 'none';
    document.getElementById('toolbarSection').style.display = 'none';
    document.getElementById('btnAddInstrument').style.display = 'none';
    
    // Show main project (Global) elements
    document.getElementById('kpiSection').style.display = 'grid';
    document.getElementById('chartsSection').style.display = 'grid';
    document.getElementById('globalProjectSelectorCard').style.display = 'block';
    
    renderGlobalProjectChecklist();
    renderGlobalDashboard();
  } else {
    // Sub-project view
    btnGlobal.classList.remove('active');
    
    // Show sub-project specific elements
    document.getElementById('tableSection').style.display = 'block';
    document.getElementById('toolbarSection').style.display = 'block';
    document.getElementById('btnAddInstrument').style.display = 'inline-flex';
    
    // Hide main project (Global) elements
    document.getElementById('kpiSection').style.display = 'none';
    document.getElementById('chartsSection').style.display = 'none';
    document.getElementById('globalProjectSelectorCard').style.display = 'none';
    
    renderActiveSubProject();
  }
}

// Render sub-project instrument list details
function renderActiveSubProject() {
  const activeProj = projects.find(p => p.id === activeProjectId);
  if (!activeProj) return;
  
  document.getElementById('activeProjectName').textContent = activeProj.name;
  document.getElementById('activeProjectDesc').textContent = activeProj.description || 'No description provided.';
  
  renderTable();
  
  // Calculate and update the overall progress text in the toolbar card
  const totalInsts = activeProj.instruments.length;
  let overallProgress = 0;
  if (totalInsts > 0) {
    const totalProgress = activeProj.instruments.reduce((acc, curr) => acc + (curr.progress || 0), 0);
    overallProgress = Math.round(totalProgress / totalInsts);
  }
  document.getElementById('overallProgressText').textContent = overallProgress + '%';
}

// Render sub-projects checkbox list in Global View
function renderGlobalProjectChecklist() {
  const container = document.getElementById('globalProjectChecklist');
  if (!container) return;
  
  container.innerHTML = '';
  
  if (projects.length === 0) {
    container.innerHTML = '<span style="color: var(--text-muted); font-size: 0.85rem;">No sub-projects found. Create one from the sidebar.</span>';
    return;
  }
  
  projects.forEach(proj => {
    const isChecked = selectedOverviewProjIds.includes(proj.id);
    const label = document.createElement('label');
    label.style.display = 'flex';
    label.style.alignItems = 'center';
    label.style.gap = '8px';
    label.style.fontSize = '0.9rem';
    label.style.fontWeight = '600';
    label.style.cursor = 'pointer';
    label.style.backgroundColor = 'var(--bg-app)';
    label.style.padding = '8px 14px';
    label.style.borderRadius = '8px';
    label.style.border = '1px solid var(--border-subtle)';
    
    label.innerHTML = `
      <input type="checkbox" class="global-proj-chk" data-id="${proj.id}" ${isChecked ? 'checked' : ''} style="cursor: pointer; width: 16px; height: 16px;">
      <span>${proj.name}</span>
      <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: normal;">(${proj.instruments.length} insts)</span>
    `;
    
    // Bind change listener
    const chk = label.querySelector('input');
    chk.onchange = (e) => {
      toggleOverviewProject(proj.id, e.target.checked);
    };
    
    container.appendChild(label);
  });
}

function toggleOverviewProject(projId, isChecked) {
  if (isChecked) {
    if (!selectedOverviewProjIds.includes(projId)) {
      selectedOverviewProjIds.push(projId);
    }
  } else {
    selectedOverviewProjIds = selectedOverviewProjIds.filter(id => id !== projId);
  }
  saveData();
  renderGlobalDashboard();
  renderProjectList(); // Update sidebar progress bars
}

// Render Instruments Table based on search/filter/sort
function renderTable() {
  const activeProj = projects.find(p => p.id === activeProjectId);
  if (!activeProj) return;
  
  const searchVal = document.getElementById('searchBar').value.toLowerCase().trim();
  const filterType = document.getElementById('filterType').value;
  const filterStatus = document.getElementById('filterStatus').value;
  const sortBy = document.getElementById('sortBy').value;
  
  let filtered = activeProj.instruments.filter(inst => {
    const matchesSearch = 
      inst.tag.toLowerCase().includes(searchVal) ||
      inst.name.toLowerCase().includes(searchVal) ||
      (inst.technician && inst.technician.toLowerCase().includes(searchVal));
      
    const matchesType = !filterType || inst.type === filterType;
    const matchesStatus = !filterStatus || inst.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });
  
  // Sort
  filtered.sort((a, b) => {
    if (sortBy === 'tag') {
      return a.tag.localeCompare(b.tag, undefined, { numeric: true, sensitivity: 'base' });
    } else if (sortBy === 'progressDesc') {
      return b.progress - a.progress;
    } else if (sortBy === 'progressAsc') {
      return a.progress - b.progress;
    } else if (sortBy === 'lastUpdated') {
      if (!a.lastUpdated) return 1;
      if (!b.lastUpdated) return -1;
      return new Date(b.lastUpdated) - new Date(a.lastUpdated);
    }
    return 0;
  });
  
  const tableBody = document.getElementById('instrumentTableBody');
  const emptyState = document.getElementById('emptyState');
  
  tableBody.innerHTML = '';
  
  if (filtered.length === 0) {
    emptyState.style.display = 'block';
    return;
  }
  
  emptyState.style.display = 'none';
  
  filtered.forEach(inst => {
    const row = document.createElement('tr');
    row.style.cursor = 'pointer';
    row.onclick = () => viewInstrumentDetails(inst.id);
    if (selectedInstrumentId === inst.id) {
      row.style.backgroundColor = 'var(--primary-light)';
    }
    
    // Status Badge Styling
    let statusClass = 'status-pending';
    if (inst.status === 'In Progress') statusClass = 'status-inprogress';
    else if (inst.status === 'Calibrated') statusClass = 'status-calibrated';
    else if (inst.status === 'Commissioned') statusClass = 'status-commissioned';
    
    // Progress Bar Style
    let fillClass = '';
    if (inst.progress === 100) fillClass = 'success';
    else if (inst.progress > 0) fillClass = 'warning';
    
    // Date formatting
    let dateDisplay = 'N/A';
    if (inst.lastUpdated) {
      const d = new Date(inst.lastUpdated);
      dateDisplay = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    
    const isGauge = inst.type === 'Gauge';
    const cablingCheckbox = isGauge 
      ? `<span style="color: var(--text-light); font-size: 0.85rem; font-weight: 500;">N/A</span>` 
      : `<input type="checkbox" class="tbl-chk-cabling" data-id="${inst.id}" ${inst.steps.cabling ? 'checked' : ''} style="cursor: pointer; width: 15px; height: 15px;">`;
    const loopCheckCheckbox = isGauge 
      ? `<span style="color: var(--text-light); font-size: 0.85rem; font-weight: 500;">N/A</span>` 
      : `<input type="checkbox" class="tbl-chk-loopCheck" data-id="${inst.id}" ${inst.steps.loopCheck ? 'checked' : ''} style="cursor: pointer; width: 15px; height: 15px;">`;
      
    const isSelected = selectedRowIds.includes(inst.id);
    row.innerHTML = `
      <td style="text-align: center;" onclick="event.stopPropagation();">
        <input type="checkbox" class="row-select-chk" data-id="${inst.id}" ${isSelected ? 'checked' : ''} style="cursor: pointer; width: 15px; height: 15px;">
      </td>
      <td><span class="tag-mono">${inst.tag}</span></td>
      <td>
        <div class="inst-name">${inst.name}</div>
        <div class="inst-type">${inst.type}</div>
      </td>
      <td>${inst.area}</td>
      <td style="text-align: center;" onclick="event.stopPropagation();">
        <input type="checkbox" class="tbl-chk-calibrated" data-id="${inst.id}" ${inst.steps.calibrated ? 'checked' : ''} style="cursor: pointer; width: 15px; height: 15px;">
      </td>
      <td style="text-align: center;" onclick="event.stopPropagation();">
        <input type="checkbox" class="tbl-chk-installation" data-id="${inst.id}" ${inst.steps.installation ? 'checked' : ''} style="cursor: pointer; width: 15px; height: 15px;">
      </td>
      <td style="text-align: center;" onclick="event.stopPropagation();">
        ${cablingCheckbox}
      </td>
      <td style="text-align: center;" onclick="event.stopPropagation();">
        ${loopCheckCheckbox}
      </td>
      <td>
        <div class="progress-cell-container">
          <div class="bar-outer">
            <div class="bar-inner ${fillClass}" style="width: ${inst.progress}%"></div>
          </div>
          <span class="progress-number">${inst.progress}%</span>
        </div>
      </td>
      <td>${dateDisplay}</td>
      <td style="text-align: center;">
        <div class="action-buttons">
          <button class="icon-btn primary-btn edit-inst-btn" data-id="${inst.id}" title="Edit Instrument Details">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
          </button>
          <button class="icon-btn delete-btn delete-inst-btn" data-id="${inst.id}" title="Delete Instrument">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>
        </div>
      </td>
    `;
    
    tableBody.appendChild(row);
  });
  
  // Attach edit and delete buttons
  document.querySelectorAll('.edit-inst-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      openEditModal(btn.getAttribute('data-id'));
    };
  });
  
  document.querySelectorAll('.delete-inst-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      deleteInstrument(btn.getAttribute('data-id'));
    };
  });
  
  // Update selectAllInstruments state
  const selectAllChk = document.getElementById('selectAllInstruments');
  if (selectAllChk) {
    const allFilteredSelected = filtered.length > 0 && filtered.every(inst => selectedRowIds.includes(inst.id));
    selectAllChk.checked = allFilteredSelected;
  }

  // Update Bulk Delete button visibility and count
  const btnBulkDelete = document.getElementById('btnBulkDelete');
  const selectedCountText = document.getElementById('selectedCountText');
  if (btnBulkDelete && selectedCountText) {
    if (selectedRowIds.length > 0) {
      btnBulkDelete.style.display = 'inline-flex';
      selectedCountText.textContent = selectedRowIds.length;
    } else {
      btnBulkDelete.style.display = 'none';
    }
  }
}

// Render global dashboard aggregates, KPIs, and comparison charts
function renderGlobalDashboard() {
  let aggregatedInstruments = [];
  let subProjectAverages = [];
  
  projects.forEach(proj => {
    const isSelected = selectedOverviewProjIds.includes(proj.id);
    const total = proj.instruments.length;
    let avg = 0;
    if (total > 0) {
      const sum = proj.instruments.reduce((acc, c) => acc + c.progress, 0);
      avg = Math.round(sum / total);
    }
    
    if (isSelected) {
      aggregatedInstruments = aggregatedInstruments.concat(proj.instruments);
      subProjectAverages.push({
        id: proj.id,
        name: proj.name,
        avgProgress: avg,
        instCount: total
      });
    }
  });
  
  // 1. Calculate aggregated KPIs
  const total = aggregatedInstruments.length;
  let installed = 0;
  let cabling = 0;
  let loopCheck = 0;
  let calibrated = 0;
  
  aggregatedInstruments.forEach(inst => {
    if (inst.steps.installation) installed++;
    if (inst.steps.cabling) cabling++;
    if (inst.steps.loopCheck) loopCheck++;
    if (inst.steps.calibrated) calibrated++;
  });
  
  document.getElementById('kpiTotalVal').textContent = total;
  document.getElementById('kpiInstalledVal').textContent = installed;
  document.getElementById('kpiCablingVal').textContent = cabling;
  document.getElementById('kpiLoopCheckVal').textContent = loopCheck;
  document.getElementById('kpiCalibratedVal').textContent = calibrated;
  
  const calcPct = (val) => total > 0 ? Math.round((val / total) * 100) + '%' : '0%';
  document.getElementById('kpiInstalledPct').textContent = calcPct(installed);
  document.getElementById('kpiCablingPct').textContent = calcPct(cabling);
  document.getElementById('kpiLoopCheckPct').textContent = calcPct(loopCheck);
  document.getElementById('kpiCalibratedPct').textContent = calcPct(calibrated);
  
  // Resolve chart colors depending on light vs dark theme
  const isDark = document.body.classList.contains('dark-theme');
  const labelColor = isDark ? '#94a3b8' : '#334155';
  const gridColor = isDark ? '#1e293b' : '#f1f5f9';
  const chartBorderColor = isDark ? '#131926' : '#ffffff';
  
  // 2. Render Milestone Completion Overview Progress List
  if (areaChartInstance) areaChartInstance.destroy();
  
  const progressListContainer = document.getElementById('milestoneProgressList');
  if (progressListContainer) {
    const instPct = total > 0 ? Math.round((installed / total) * 100) : 0;
    const cabPct = total > 0 ? Math.round((cabling / total) * 100) : 0;
    const loopPct = total > 0 ? Math.round((loopCheck / total) * 100) : 0;
    const calPct = total > 0 ? Math.round((calibrated / total) * 100) : 0;

    const milestonesData = [
      { name: 'Installed', pct: instPct, count: installed, color: '#f59e0b' },
      { name: 'Cabling', pct: cabPct, count: cabling, color: '#6366f1' },
      { name: 'Loop Check', pct: loopPct, count: loopCheck, color: '#10b981' },
      { name: 'Calibrated', pct: calPct, count: calibrated, color: '#64748b' }
    ];

    progressListContainer.innerHTML = '';
    
    milestonesData.forEach(item => {
      const itemEl = document.createElement('div');
      itemEl.className = 'milestone-progress-item';
      
      itemEl.innerHTML = `
        <div class="milestone-progress-info">
          <span class="milestone-progress-label">
            <span class="milestone-progress-dot" style="background-color: ${item.color};"></span>
            ${item.name}
          </span>
          <span class="milestone-progress-stats">
            <strong>${item.count}</strong> / ${total} Units (${item.pct}%)
          </span>
        </div>
        <div class="milestone-progress-track">
          <div class="milestone-progress-fill" style="background-color: ${item.color}; width: 0%;"></div>
        </div>
      `;
      
      progressListContainer.appendChild(itemEl);
      
      // Animate the fill width on next frame
      requestAnimationFrame(() => {
        setTimeout(() => {
          const fillEl = itemEl.querySelector('.milestone-progress-fill');
          if (fillEl) fillEl.style.width = `${item.pct}%`;
        }, 50);
      });
    });
  }
  
  // Bar Chart: Sub-Project Comparison
  // 1. Prepare Bar Chart Data from slots configuration
  const labels = [];
  const dataVals = [];
  const backgroundColors = [];

  barChartSlots.forEach(slot => {
    if (slot.show && slot.projectId) {
      const proj = projects.find(p => p.id === slot.projectId);
      if (proj) {
        labels.push(proj.name);
        
        // Calculate progress percentage
        const total = proj.instruments.length;
        let avg = 0;
        if (total > 0) {
          const sum = proj.instruments.reduce((acc, c) => acc + c.progress, 0);
          avg = Math.round(sum / total);
        }
        dataVals.push(avg);
        backgroundColors.push(slot.color);
      }
    }
  });

  // 2. Render Slots Config Rows inside #barSlotsContainer
  const slotsContainer = document.getElementById('barSlotsContainer');
  if (slotsContainer) {
    slotsContainer.innerHTML = '';
    
    barChartSlots.forEach(slot => {
      const slotRow = document.createElement('div');
      slotRow.className = 'bar-slot-row';
      
      // Build options with selected state
      const options = projects.map(p => {
        return `<option value="${p.id}" ${p.id === slot.projectId ? 'selected' : ''}>${p.name}</option>`;
      }).join('');
      
      const selectHTML = `
        <select class="slot-project-select">
          <option value="" ${!slot.projectId ? 'selected' : ''}>-- Choose Sub-Project --</option>
          ${options}
        </select>
      `;
      
      const deleteButtonHTML = barChartSlots.length > 1 
        ? `<button type="button" class="btn-delete-slot" title="Delete Slot">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
           </button>`
        : '';
        
      slotRow.innerHTML = `
        <input type="checkbox" class="slot-checkbox" ${slot.show ? 'checked' : ''} title="Show/Hide in chart">
        ${selectHTML}
        <input type="color" class="slot-color-picker" value="${slot.color}" title="Choose color">
        ${deleteButtonHTML}
      `;
      
      // Bind checkbox change
      const chk = slotRow.querySelector('.slot-checkbox');
      chk.onchange = (e) => {
        slot.show = e.target.checked;
        saveData();
        renderGlobalDashboard();
      };
      
      // Bind select change
      const select = slotRow.querySelector('.slot-project-select');
      select.onchange = (e) => {
        slot.projectId = e.target.value;
        saveData();
        renderGlobalDashboard();
      };
      
      // Bind color picker input (live updates while dragging)
      const cp = slotRow.querySelector('.slot-color-picker');
      cp.oninput = (e) => {
        const newColor = e.target.value;
        slot.color = newColor;
        
        // Live update chart color
        if (areaChartInstance) {
          const proj = projects.find(p => p.id === slot.projectId);
          if (proj) {
            const idx = labels.indexOf(proj.name);
            if (idx !== -1) {
              areaChartInstance.data.datasets[0].backgroundColor[idx] = newColor;
              areaChartInstance.data.datasets[0].hoverBackgroundColor[idx] = newColor;
              areaChartInstance.update('none'); // silent update
            }
          }
        }
      };
      
      // Save color picker when finished dragging
      cp.onchange = () => {
        saveData();
      };
      
      // Bind delete button
      if (barChartSlots.length > 1) {
        const btnDel = slotRow.querySelector('.btn-delete-slot');
        btnDel.onclick = () => {
          barChartSlots = barChartSlots.filter(s => s.id !== slot.id);
          saveData();
          renderGlobalDashboard();
        };
      }
      
      slotsContainer.appendChild(slotRow);
    });
  }

  // 3. Bind Add Slot Button
  const btnAddSlot = document.getElementById('btnAddBarSlot');
  if (btnAddSlot) {
    btnAddSlot.onclick = () => {
      const defaultPalette = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444', '#06b6d4', '#14b8a6'];
      // Assign the first available project that is not already in the slots, otherwise default to first project
      const unusedProj = projects.find(p => !barChartSlots.some(s => s.projectId === p.id));
      
      barChartSlots.push({
        id: 'slot-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        show: true,
        projectId: unusedProj ? unusedProj.id : (projects[0]?.id || ''),
        color: defaultPalette[barChartSlots.length % defaultPalette.length]
      });
      saveData();
      renderGlobalDashboard();
    };
  }

  const areaCtx = document.getElementById('areaChart').getContext('2d');
  
  areaChartInstance = new Chart(areaCtx, {
    type: 'bar',
    data: {
      labels: labels.length > 0 ? labels : ['No Sub-projects Selected'],
      datasets: [{
        label: 'Completion Progress %',
        data: dataVals.length > 0 ? dataVals : [0],
        backgroundColor: backgroundColors,
        hoverBackgroundColor: backgroundColors,
        borderRadius: 6,
        borderWidth: 0,
        barThickness: 36,
        maxBarThickness: 36
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          grid: { color: gridColor },
          ticks: {
            color: labelColor,
            font: { family: 'Plus Jakarta Sans', size: 10 },
            callback: function(value) { return value + '%'; },
            stepSize: 20,
            padding: 30
          }
        },
        x: {
          grid: { display: false },
          ticks: {
            color: labelColor,
            font: { family: 'Plus Jakarta Sans', size: 10, weight: '600' }
          }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              return ` Progress: ${context.parsed.y}%`;
            }
          }
        }
      }
    }
  });
}

// Side Drawer Detail View
function viewInstrumentDetails(instId) {
  if (selectedInstrumentId === instId && document.getElementById('detailsDrawer').classList.contains('active')) {
    closeDrawer();
    return;
  }
  
  selectedInstrumentId = instId;
  const activeProj = projects.find(p => p.id === activeProjectId);
  if (!activeProj) return;
  
  const inst = activeProj.instruments.find(i => i.id === instId);
  if (!inst) return;
  
  // Highlight row in table
  renderTable();
  
  // Display text content
  document.getElementById('drawerTag').textContent = inst.tag;
  document.getElementById('drawerName').textContent = inst.name;
  document.getElementById('drawerType').textContent = inst.type;
  document.getElementById('drawerArea').textContent = inst.area;
  
  let dateStr = 'N/A';
  if (inst.lastUpdated) {
    const d = new Date(inst.lastUpdated);
    dateStr = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  document.getElementById('drawerLatestUpdate').textContent = dateStr;
  document.getElementById('drawerPidDrawing').textContent = inst.pidDrawing || 'N/A';
  document.getElementById('drawerSpecDrawing').textContent = inst.specDrawing || 'N/A';
  document.getElementById('drawerLocation').textContent = inst.notes || 'No location provided.';
  
  // Hide Cabling and Loop Check milestones if it is a Gauge
  const isGauge = inst.type === 'Gauge';
  const cablingWrapper = document.getElementById('chkCablingWrapper');
  const loopCheckWrapper = document.getElementById('chkLoopCheckWrapper');
  if (cablingWrapper && loopCheckWrapper) {
    cablingWrapper.style.display = isGauge ? 'none' : 'flex';
    loopCheckWrapper.style.display = isGauge ? 'none' : 'flex';
  }
  
  if (isGauge) {
    inst.steps.cabling = false;
    inst.steps.loopCheck = false;
  }
  
  // Milestones Checkboxes
  document.getElementById('chkCalibrated').checked = inst.steps.calibrated || false;
  document.getElementById('chkInstallation').checked = inst.steps.installation || false;
  document.getElementById('chkCabling').checked = inst.steps.cabling || false;
  document.getElementById('chkLoopCheck').checked = inst.steps.loopCheck || false;
  
  // Activity timeline logs
  renderLogs(inst.logs);
  
  // Show drawer
  document.getElementById('detailsDrawer').classList.add('active');
}

function renderLogs(logs) {
  const container = document.getElementById('drawerLogsList');
  container.innerHTML = '';
  
  if (!logs || logs.length === 0) {
    container.innerHTML = '<div style="font-size: 0.75rem; color: var(--text-light);">No activity logs.</div>';
    return;
  }
  
  // Sort logs descending (latest first)
  const sortedLogs = [...logs].sort((a, b) => new Date(b.date) - new Date(a.date));
  
  sortedLogs.forEach(log => {
    const d = new Date(log.date);
    const dateDisplay = d.toLocaleString('en-US', { hour12: false, month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    
    const logItem = document.createElement('div');
    logItem.className = 'log-item';
    logItem.innerHTML = `
      <div class="log-date">${dateDisplay}</div>
      <div class="log-msg">${log.message}</div>
    `;
    container.appendChild(logItem);
  });
}

function closeDrawer() {
  selectedInstrumentId = '';
  document.getElementById('detailsDrawer').classList.remove('active');
  // De-highlight table row
  renderTable();
}

// Milestone Checkbox State Updates (Unified function for table & drawer)
async function updateInstrumentMilestone(instId, milestoneId, isChecked) {
  const activeProj = projects.find(p => p.id === activeProjectId);
  if (!activeProj) return;
  
  const inst = activeProj.instruments.find(i => i.id === instId);
  if (!inst) return;
  
  // Clone milestones steps locally
  const newSteps = { ...inst.steps };
  newSteps[milestoneId] = isChecked;
  
  // Reset non-applicable steps for Gauge
  const isGauge = inst.type === 'Gauge';
  if (isGauge) {
    newSteps.cabling = false;
    newSteps.loopCheck = false;
  }
  
  // Calculate completion percentage based on checked milestones
  const stepKeys = isGauge ? ['calibrated', 'installation'] : ['calibrated', 'installation', 'cabling', 'loopCheck'];
  const checkedCount = stepKeys.filter(key => newSteps[key]).length;
  const denominator = isGauge ? 2 : 4;
  const newProgress = Math.round((checkedCount / denominator) * 100);
  
  // Transition Status
  let newStatus = 'Pending';
  if (checkedCount === denominator) {
    newStatus = 'Commissioned';
  } else if (checkedCount > 0) {
    newStatus = 'In Progress';
  }
  
  const newLogs = [...inst.logs];
  const lastUpdated = new Date().toISOString();
  const milestoneText = MILESTONES.find(m => m.id === milestoneId).name;
  newLogs.push({
    date: lastUpdated,
    message: `${milestoneText} marked as ${isChecked ? 'Completed' : 'Incomplete'}.`
  });
  
  if (inst.status !== newStatus) {
    newLogs.push({
      date: lastUpdated,
      message: `Status automatically transitioned from [${inst.status}] to [${newStatus}].`
    });
  }

  // Update in Supabase
  const { error } = await supabaseClient
    .from('instruments')
    .update({
      steps: newSteps,
      progress: newProgress,
      status: newStatus,
      logs: newLogs,
      lastUpdated: lastUpdated
    })
    .eq('id', instId);
    
  if (error) {
    alert("Failed to update milestone state in database.");
    console.error(error);
    return;
  }
  
  saveData();
  await loadData();
  
  // Live drawer UI updates if currently active on this instrument
  if (selectedInstrumentId === instId) {
    const updatedProj = projects.find(p => p.id === activeProjectId);
    const updatedInst = updatedProj ? updatedProj.instruments.find(i => i.id === instId) : null;
    if (updatedInst) {
      document.getElementById('chkCalibrated').checked = updatedInst.steps.calibrated || false;
      document.getElementById('chkInstallation').checked = updatedInst.steps.installation || false;
      document.getElementById('chkCabling').checked = updatedInst.steps.cabling || false;
      document.getElementById('chkLoopCheck').checked = updatedInst.steps.loopCheck || false;
      renderLogs(updatedInst.logs);
    }
  }
}

// Add / Edit Form Operations
function openAddModal() {
  document.getElementById('modalTitle').textContent = 'Add Instrument';
  document.getElementById('instFormId').value = '';
  document.getElementById('instrumentForm').reset();
  
  document.getElementById('instPidDrawing').value = '';
  document.getElementById('instSpecDrawing').value = '';
  
  document.getElementById('instrumentModal').classList.add('active');
}

function openEditModal(instId) {
  const activeProj = projects.find(p => p.id === activeProjectId);
  if (!activeProj) return;
  
  const inst = activeProj.instruments.find(i => i.id === instId);
  if (!inst) return;
  
  document.getElementById('modalTitle').textContent = 'Edit Instrument Details';
  document.getElementById('instFormId').value = inst.id;
  
  document.getElementById('instTag').value = inst.tag;
  document.getElementById('instName').value = inst.name;
  document.getElementById('instType').value = inst.type;
  document.getElementById('instArea').value = inst.area;
  document.getElementById('instPidDrawing').value = inst.pidDrawing || '';
  document.getElementById('instSpecDrawing').value = inst.specDrawing || '';
  document.getElementById('instNotes').value = inst.notes || '';
  
  document.getElementById('instrumentModal').classList.add('active');
}

function closeFormModal() {
  document.getElementById('instrumentModal').classList.remove('active');
}

// Save instrument form submit
async function saveInstrumentForm(e) {
  e.preventDefault();
  
  const activeProj = projects.find(p => p.id === activeProjectId);
  if (!activeProj) return;
  
  const instId = document.getElementById('instFormId').value;
  const tag = document.getElementById('instTag').value.toUpperCase().trim();
  const name = document.getElementById('instName').value.trim();
  const type = document.getElementById('instType').value;
  const area = document.getElementById('instArea').value.trim();
  const pidDrawing = document.getElementById('instPidDrawing').value.trim();
  const specDrawing = document.getElementById('instSpecDrawing').value.trim();
  const notes = document.getElementById('instNotes').value.trim();
  
  // Verify tag format
  if (!tag) {
    alert("Tag number is required.");
    return;
  }
  
  const finalId = instId || ('inst-' + Date.now() + Math.random().toString(36).substr(2, 5));
  const payload = {
    id: finalId,
    project_id: activeProjectId,
    tag: tag,
    name: name,
    type: type,
    area: area,
    pidDrawing: pidDrawing,
    specDrawing: specDrawing,
    notes: notes,
    lastUpdated: new Date().toISOString()
  };
  
  if (instId) {
    // Edit existing instrument
    const inst = activeProj.instruments.find(i => i.id === instId);
    if (!inst) return;
    
    // Tag Uniqueness check (except itself)
    const tagExists = activeProj.instruments.some(i => i.id !== instId && i.tag.toUpperCase() === tag);
    if (tagExists) {
      alert(`An instrument with Tag "${tag}" already exists in this project.`);
      return;
    }
    
    // Log important field changes
    let logMsg = 'Instrument details modified:';
    if (inst.tag !== tag) logMsg += ` tag changed to ${tag};`;
    if (inst.area !== area) logMsg += ` system changed to ${area};`;
    if (inst.pidDrawing !== pidDrawing) logMsg += ` PID drawing changed to ${pidDrawing};`;
    if (inst.specDrawing !== specDrawing) logMsg += ` Spec drawing changed to ${specDrawing};`;
    
    // If instrument type changed to Gauge, reset cabling/loopcheck and recalculate progress
    const isGauge = type === 'Gauge';
    const newSteps = { ...inst.steps };
    if (isGauge) {
      newSteps.cabling = false;
      newSteps.loopCheck = false;
    }
    const stepKeys = isGauge ? ['calibrated', 'installation'] : ['calibrated', 'installation', 'cabling', 'loopCheck'];
    const checkedCount = stepKeys.filter(key => newSteps[key]).length;
    const denominator = isGauge ? 2 : 4;
    const newProgress = Math.round((checkedCount / denominator) * 100);
    
    // Recalculate status
    let newStatus = 'Pending';
    if (checkedCount === denominator) {
      newStatus = 'Commissioned';
    } else if (checkedCount > 0) {
      newStatus = 'In Progress';
    }
    
    const newLogs = [...inst.logs];
    newLogs.push({
      date: payload.last_updated,
      message: logMsg === 'Instrument details modified:' ? 'Instrument configuration details updated.' : logMsg
    });
    
    payload.steps = newSteps;
    payload.progress = newProgress;
    payload.status = newStatus;
    payload.logs = newLogs;
  } else {
    // Check global tag uniqueness in project
    const tagExists = activeProj.instruments.some(i => i.tag.toUpperCase() === tag);
    if (tagExists) {
      alert(`An instrument with Tag "${tag}" already exists in this project.`);
      return;
    }
    
    payload.steps = { calibrated: false, installation: false, cabling: false, loopCheck: false };
    payload.status = 'Pending';
    payload.progress = 0;
    payload.logs = [
      { date: payload.last_updated, message: 'Instrument created and added to database.' }
    ];
  }
  
  const { error } = await supabaseClient
    .from('instruments')
    .upsert(payload);
    
  if (error) {
    alert("Failed to save instrument details to database.");
    console.error(error);
    return;
  }
  
  saveData();
  closeFormModal();
  await loadData();
  
  // If drawer is active on the edited item, refresh it
  if (selectedInstrumentId === instId) {
    viewInstrumentDetails(instId);
  }
}

// Delete Instrument
async function deleteInstrument(instId) {
  const activeProj = projects.find(p => p.id === activeProjectId);
  if (!activeProj) return;
  
  const inst = activeProj.instruments.find(i => i.id === instId);
  if (!inst) return;
  
  const confirmDel = confirm(`Are you sure you want to delete instrument "${inst.tag} - ${inst.name}"?`);
  if (!confirmDel) return;
  
  const { error } = await supabaseClient
    .from('instruments')
    .delete()
    .eq('id', instId);
    
  if (error) {
    alert("Failed to delete instrument.");
    console.error(error);
    return;
  }
  
  saveData();
  await loadData();
  
  // If drawer was viewing it, close it
  if (selectedInstrumentId === instId) {
    closeDrawer();
  }
}

// SheetJS Excel/CSV parsing & File Imports
function handleImportExcelClick() {
  document.getElementById('excelFileInput').click();
}

function handleExcelFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (event) => {
    const data = event.target.result;
    let workbook;
    try {
      workbook = XLSX.read(data, { type: 'binary', cellDates: true });
    } catch (err) {
      alert("Failed to read file. Please ensure it is a valid Excel (.xlsx/.xls) or CSV file.");
      return;
    }
    
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];
    // Convert sheet to JSON matrix (header: 1 gets array of arrays)
    const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
    
    if (rawRows.length === 0) {
      alert("The uploaded file is empty.");
      return;
    }
    
    processRawImportData(rawRows);
  };
  
  reader.onerror = () => {
    alert("Error reading file.");
  };
  
  reader.readAsBinaryString(file);
  
  // Reset file input so same file can be uploaded again
  e.target.value = '';
}

// Process imported raw spreadsheet matrix
function processRawImportData(matrix) {
  const headers = matrix[0].map(h => String(h).toLowerCase().trim());
  
  // Column Mapping Dictionary
  let colIndices = { tag: -1, name: -1, type: -1, area: -1, pidDrawing: -1, specDrawing: -1, technician: -1, targetDate: -1, notes: -1 };
  
  headers.forEach((header, index) => {
    if (['tag', 'tag no', 'tag number', 'tagno', 'instrument tag', 'kks no.', 'kks no', 'kks'].includes(header)) colIndices.tag = index;
    else if (['name', 'instrument name', 'description', 'detail', 'instrument detail'].includes(header)) colIndices.name = index;
    else if (['type', 'instrument type', 'category', 'class'].includes(header)) colIndices.type = index;
    else if (['area', 'location', 'plant area', 'block', 'system'].includes(header)) colIndices.area = index;
    else if (['pid drawing', 'pid', 'p&id', 'p&id drawing'].includes(header)) colIndices.pidDrawing = index;
    else if (['spec drawing', 'spec', 'spec sheet', 'specsheet'].includes(header)) colIndices.specDrawing = index;
    else if (['technician', 'tech', 'assigned', 'installer'].includes(header)) colIndices.technician = index;
    else if (['target date', 'target', 'date', 'targetdate', 'schedule'].includes(header)) colIndices.targetDate = index;
    else if (['notes', 'note', 'remark', 'remarks'].includes(header)) colIndices.notes = index;
  });
  
  // Validation: Tag column is absolutely required
  if (colIndices.tag === -1) {
    alert("Error: Could not identify 'Tag' column. Please make sure your sheet has a header row containing 'Tag', 'Tag No' or similar.");
    return;
  }
  
  parsedImportData = [];
  const activeProj = projects.find(p => p.id === activeProjectId);
  const existingTags = activeProj ? activeProj.instruments.map(i => i.tag.toUpperCase()) : [];
  
  // Parse rows (skip header row 0)
  for (let r = 1; r < matrix.length; r++) {
    const row = matrix[r];
    // Check if row is empty
    if (row.filter(cell => String(cell).trim() !== "").length === 0) continue;
    
    const tag = String(row[colIndices.tag] || "").trim().toUpperCase();
    const name = String(colIndices.name !== -1 ? row[colIndices.name] : "").trim();
    let type = String(colIndices.type !== -1 ? row[colIndices.type] : "").trim();
    const area = String(colIndices.area !== -1 ? row[colIndices.area] : "").trim() || "Main System";
    const pidDrawing = colIndices.pidDrawing !== -1 ? String(row[colIndices.pidDrawing] || "").trim() : "";
    const specDrawing = colIndices.specDrawing !== -1 ? String(row[colIndices.specDrawing] || "").trim() : "";
    const technician = String(colIndices.technician !== -1 ? row[colIndices.technician] : "").trim();
    let targetDateRaw = colIndices.targetDate !== -1 ? row[colIndices.targetDate] : "";
    const notes = String(colIndices.notes !== -1 ? row[colIndices.notes] : "").trim();
    
    // Resolve instrument type to match allowed options
    let resolvedType = 'Other';
    const cleanType = type.toLowerCase();
    if (cleanType.includes('flow')) resolvedType = 'Flow Transmitter';
    else if (cleanType.includes('level') || cleanType.includes('lit') || cleanType.includes('gauge')) {
      if (cleanType.includes('gauge')) resolvedType = 'Gauge';
      else resolvedType = 'Level Transmitter';
    }
    else if (cleanType.includes('press') || cleanType.includes('pit')) {
      if (cleanType.includes('gauge')) resolvedType = 'Gauge';
      else resolvedType = 'Pressure Transmitter';
    }
    else if (cleanType.includes('temp') || cleanType.includes('tit')) {
      if (cleanType.includes('gauge')) resolvedType = 'Gauge';
      else resolvedType = 'Temperature Transmitter';
    }
    else if (cleanType.includes('gauge')) resolvedType = 'Gauge';
    else if (cleanType.includes('mov') || cleanType.includes('motor operate')) resolvedType = 'Moter Operate Valve';
    else if (cleanType.includes('valve') || cleanType.includes('control') || cleanType.includes('onoff')) resolvedType = 'Control/ONOFF Valve';
    else if (type) resolvedType = type; // Keep original if custom
    
    // Resolve date formats
    let targetDateStr = '';
    if (targetDateRaw) {
      if (targetDateRaw instanceof Date) {
        targetDateStr = targetDateRaw.toISOString().split('T')[0];
      } else {
        const parsedMs = Date.parse(targetDateRaw);
        if (!isNaN(parsedMs)) {
          targetDateStr = new Date(parsedMs).toISOString().split('T')[0];
        }
      }
    }
    
    let error = '';
    if (!tag) {
      error = "Missing Tag No.";
    } else if (existingTags.includes(tag)) {
      error = `Duplicate Tag in Project`;
    } else if (parsedImportData.some(item => item.tag === tag)) {
      error = `Duplicate Tag in File`;
    }
    
    parsedImportData.push({
      tag,
      name: name || `${resolvedType} Instrument`,
      type: resolvedType,
      area,
      pidDrawing,
      specDrawing,
      technician,
      targetDate: targetDateStr,
      notes,
      error,
      valid: !error
    });
  }
  
  showImportPreview();
}

// Render Preview modal
function showImportPreview() {
  const previewBody = document.getElementById('importPreviewTableBody');
  const previewHeader = document.querySelector('#importPreviewTable thead');
  const confirmBtn = document.getElementById('btnConfirmImport');
  
  previewHeader.innerHTML = `
    <tr>
      <th>Status</th>
      <th>Tag No</th>
      <th>Name</th>
      <th>Type</th>
      <th>Area</th>
      <th>Technician</th>
      <th>Target Date</th>
      <th>Notes</th>
    </tr>
  `;
  
  previewBody.innerHTML = '';
  
  let validCount = 0;
  let errorCount = 0;
  
  parsedImportData.forEach(row => {
    if (row.valid) validCount++;
    else errorCount++;
    
    const tr = document.createElement('tr');
    tr.style.backgroundColor = row.valid ? 'transparent' : 'rgba(239, 68, 68, 0.05)';
    
    tr.innerHTML = `
      <td>${row.valid ? '✅ Ok' : `<span class="row-error-badge" title="${row.error}">Error</span>`}</td>
      <td style="font-family: var(--font-mono); font-weight: 600;">${row.tag || '<span class="preview-error">EMPTY</span>'}</td>
      <td>${row.name}</td>
      <td>${row.type}</td>
      <td>${row.area}</td>
      <td>${row.technician || '-'}</td>
      <td>${row.targetDate || '-'}</td>
      <td style="font-size: 0.75rem; color: var(--text-muted); max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${row.notes || '-'}</td>
    `;
    previewBody.appendChild(tr);
  });
  
  document.getElementById('importSummaryTotal').textContent = parsedImportData.length;
  document.getElementById('importSummaryValid').textContent = validCount;
  document.getElementById('importSummaryErrors').textContent = errorCount;
  
  confirmBtn.disabled = validCount === 0;
  
  document.getElementById('importModal').classList.add('active');
}

function closeImportModal() {
  document.getElementById('importModal').classList.remove('active');
  parsedImportData = [];
}

// Commit records to current project
async function confirmFileImport() {
  const activeProj = projects.find(p => p.id === activeProjectId);
  if (!activeProj) return;
  
  const validRows = parsedImportData.filter(r => r.valid);
  if (validRows.length === 0) return;
  
  const insertPayloads = validRows.map(row => {
    return {
      id: 'inst-' + Date.now() + Math.random().toString(36).substr(2, 5),
      project_id: activeProjectId,
      tag: row.tag,
      name: row.name,
      type: row.type,
      area: row.area,
      pidDrawing: row.pidDrawing || '',
      specDrawing: row.specDrawing || '',
      technician: row.technician,
      targetDate: row.targetDate,
      notes: row.notes,
      steps: { calibrated: false, installation: false, cabling: false, loopCheck: false },
      status: 'Pending',
      progress: 0,
      lastUpdated: new Date().toISOString(),
      logs: [
        { date: new Date().toISOString(), message: 'Imported from uploaded spreadsheet.' }
      ]
    };
  });
  
  const { error } = await supabaseClient
    .from('instruments')
    .insert(insertPayloads);
    
  if (error) {
    alert("Failed to import instruments to database.");
    console.error(error);
    return;
  }
  
  saveData();
  closeImportModal();
  await loadData();
  
  alert(`Successfully imported ${validRows.length} instruments to project!`);
}

// Export Instrument Table to Excel via SheetJS
function exportProjectToExcel() {
  const activeProj = projects.find(p => p.id === activeProjectId);
  if (!activeProj || activeProj.instruments.length === 0) {
    alert("No instruments in active project to export.");
    return;
  }
  
  // Map JSON values to professional headers
  const exportRows = activeProj.instruments.map(inst => ({
    'KKS No.': inst.tag,
    'Instrument Detail': `${inst.name} (${inst.type})`,
    'System': inst.area,
    'Calibrated': inst.steps.calibrated ? 'Yes' : 'No',
    'Installed': inst.steps.installation ? 'Yes' : 'No',
    'Cabling': inst.type === 'Gauge' ? 'N/A' : (inst.steps.cabling ? 'Yes' : 'No'),
    'Loop Check': inst.type === 'Gauge' ? 'N/A' : (inst.steps.loopCheck ? 'Yes' : 'No'),
    'Progress (%)': `${inst.progress}%`,
    'Latest Update': inst.lastUpdated ? new Date(inst.lastUpdated).toLocaleDateString('en-US') : 'N/A',
    'Notes': inst.notes || ''
  }));
  
  const sheet = XLSX.utils.json_to_sheet(exportRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Instruments");
  
  // Download file
  const filename = `${activeProj.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_instruments.xlsx`;
  XLSX.writeFile(workbook, filename);
}

// Download formatted CSV Template
function downloadCSVTemplate() {
  const csvHeaders = `"Tag","Name","Type","Area","Technician","Target Date","Notes"\n`;
  const sampleRow1 = `"PIT-101A","High Steam Pressure Transmitter","Pressure","Boiler Area A","Somchai S.","2026-07-25","Mounting on main steam outlet line. Range 0-160 barg."\n`;
  const sampleRow2 = `"FIT-102","Boiler Feedwater Flowmeter","Flow","Boiler Area B","John D.","2026-07-28","Flange mounted turbine type. Zero check at commissioning."\n`;
  
  const csvContent = "data:text/csv;charset=utf-8," + csvHeaders + sampleRow1 + sampleRow2;
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "instrument_import_template.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Bind all UI event handlers
function setupEventListeners() {
  // Theme Toggle Button
  document.getElementById('btnThemeToggle').onclick = toggleTheme;
  
  // Sidebar Global Dashboard link
  document.getElementById('btnGlobalDashboard').onclick = switchToGlobalDashboard;
  
  // Sidebar Project add
  document.getElementById('btnNewProject').onclick = createProject;
  
  // Instrument Form Modals
  document.getElementById('btnAddInstrument').onclick = openAddModal;
  document.getElementById('btnModalClose').onclick = closeFormModal;
  document.getElementById('btnCancelForm').onclick = closeFormModal;
  document.getElementById('instrumentForm').onsubmit = saveInstrumentForm;
  
  // Details Drawer Close
  document.getElementById('btnDrawerClose').onclick = closeDrawer;
  
  // Milestones Checks in Drawer
  document.getElementById('chkCalibrated').onchange = (e) => {
    if (selectedInstrumentId) updateInstrumentMilestone(selectedInstrumentId, 'calibrated', e.target.checked);
  };
  document.getElementById('chkInstallation').onchange = (e) => {
    if (selectedInstrumentId) updateInstrumentMilestone(selectedInstrumentId, 'installation', e.target.checked);
  };
  document.getElementById('chkCabling').onchange = (e) => {
    if (selectedInstrumentId) updateInstrumentMilestone(selectedInstrumentId, 'cabling', e.target.checked);
  };
  document.getElementById('chkLoopCheck').onchange = (e) => {
    if (selectedInstrumentId) updateInstrumentMilestone(selectedInstrumentId, 'loopCheck', e.target.checked);
  };
  
  // Milestones & Row Checks in Table (Event delegation)
  document.getElementById('instrumentTableBody').addEventListener('change', (e) => {
    if (e.target.classList.contains('tbl-chk-calibrated')) {
      const instId = e.target.getAttribute('data-id');
      updateInstrumentMilestone(instId, 'calibrated', e.target.checked);
    } else if (e.target.classList.contains('tbl-chk-installation')) {
      const instId = e.target.getAttribute('data-id');
      updateInstrumentMilestone(instId, 'installation', e.target.checked);
    } else if (e.target.classList.contains('tbl-chk-cabling')) {
      const instId = e.target.getAttribute('data-id');
      updateInstrumentMilestone(instId, 'cabling', e.target.checked);
    } else if (e.target.classList.contains('tbl-chk-loopCheck')) {
      const instId = e.target.getAttribute('data-id');
      updateInstrumentMilestone(instId, 'loopCheck', e.target.checked);
    } else if (e.target.classList.contains('row-select-chk')) {
      const instId = e.target.getAttribute('data-id');
      if (e.target.checked) {
        if (!selectedRowIds.includes(instId)) {
          selectedRowIds.push(instId);
        }
      } else {
        selectedRowIds = selectedRowIds.filter(id => id !== instId);
      }
      renderTable(); // Recalculate Select All state and update action button count
    }
  });
  
  // Select All check box change listener
  document.getElementById('selectAllInstruments').onchange = (e) => {
    const activeProj = projects.find(p => p.id === activeProjectId);
    if (!activeProj) return;
    
    const searchVal = document.getElementById('searchBar').value.toLowerCase().trim();
    const filterType = document.getElementById('filterType').value;
    const filterStatus = document.getElementById('filterStatus').value;
    
    const filtered = activeProj.instruments.filter(inst => {
      const matchesSearch = !searchVal || 
        inst.tag.toLowerCase().includes(searchVal) || 
        inst.name.toLowerCase().includes(searchVal) || 
        (inst.technician && inst.technician.toLowerCase().includes(searchVal));
        
      const matchesType = !filterType || inst.type === filterType;
      const matchesStatus = !filterStatus || inst.status === filterStatus;
      
      return matchesSearch && matchesType && matchesStatus;
    });
    
    if (e.target.checked) {
      filtered.forEach(inst => {
        if (!selectedRowIds.includes(inst.id)) {
          selectedRowIds.push(inst.id);
        }
      });
    } else {
      const filteredIds = filtered.map(inst => inst.id);
      selectedRowIds = selectedRowIds.filter(id => !filteredIds.includes(id));
    }
    renderTable();
  };
  
  // Bulk delete button click listener
  document.getElementById('btnBulkDelete').onclick = async () => {
    const count = selectedRowIds.length;
    if (count === 0) return;
    
    const confirmMsg = `Are you sure you want to delete the ${count} selected instruments from this project? This action cannot be undone.`;
    if (!confirm(confirmMsg)) return;
    
    const { error } = await supabaseClient
      .from('instruments')
      .delete()
      .in('id', selectedRowIds);
      
    if (error) {
      alert("Failed to delete instruments.");
      console.error(error);
      return;
    }
    
    selectedRowIds = [];
    
    saveData();
    await loadData();
    
    alert(`Successfully deleted ${count} instruments!`);
  };
  
  // Filters, search, sort
  document.getElementById('searchBar').oninput = renderTable;
  document.getElementById('filterType').onchange = renderTable;
  document.getElementById('filterStatus').onchange = renderTable;
  document.getElementById('sortBy').onchange = renderTable;
  
  // File operations hooks
  document.getElementById('btnImportExcel').onclick = handleImportExcelClick;
  document.getElementById('excelFileInput').onchange = handleExcelFileSelect;
  document.getElementById('btnCancelImport').onclick = closeImportModal;
  document.getElementById('btnImportClose').onclick = closeImportModal;
  document.getElementById('btnConfirmImport').onclick = confirmFileImport;
  document.getElementById('btnExportExcel').onclick = exportProjectToExcel;
  document.getElementById('btnDownloadTemplate').onclick = downloadCSVTemplate;
  
  // Logo Icon Lightbox Click Handler
  const logoIcon = document.querySelector('.logo-icon');
  if (logoIcon) {
    logoIcon.style.cursor = 'pointer';
    logoIcon.onclick = () => {
      document.getElementById('logoLightboxModal').classList.add('active');
    };
  }
  
  // Lightbox Close Click Handlers
  const btnLogoClose = document.getElementById('btnLogoLightboxClose');
  if (btnLogoClose) {
    btnLogoClose.onclick = () => {
      document.getElementById('logoLightboxModal').classList.remove('active');
    };
  }
  
  const lightbox = document.getElementById('logoLightboxModal');
  if (lightbox) {
    lightbox.onclick = (e) => {
      if (e.target === lightbox) {
        lightbox.classList.remove('active');
      }
    };
  }

  // Copy Chart Button Click Handler (PowerPoint 16:9 Presentation Quality)
  const btnCopyChart = document.getElementById('btnCopyBarChart');
  if (btnCopyChart) {
    btnCopyChart.onclick = () => {
      if (!areaChartInstance) return;
      
      const isDark = document.body.classList.contains('dark-theme');
      const bgColor = isDark ? '#1e293b' : '#ffffff';
      const labelColor = isDark ? '#94a3b8' : '#64748b';
      const gridColor = isDark ? '#1e293b' : '#f1f5f9';
      
      // Create a high-res temporary canvas with standard 16:9 slide dimensions
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 1280;
      tempCanvas.height = 720;
      
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.fillStyle = bgColor;
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      
      // Setup optimized options for slide export
      const exportOptions = {
        responsive: false,
        maintainAspectRatio: false,
        animation: false,
        layout: {
          padding: {
            top: 60,
            bottom: 60,
            left: 60,
            right: 80
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            grid: { color: gridColor },
            ticks: {
              color: labelColor,
              font: { family: 'Plus Jakarta Sans', size: 16, weight: '600' },
              callback: function(value) { return value + '%'; },
              stepSize: 20,
              padding: 24
            }
          },
          x: {
            grid: { display: false },
            ticks: {
              color: labelColor,
              font: { family: 'Plus Jakarta Sans', size: 16, weight: '600' }
            }
          }
        },
        plugins: {
          legend: { display: false },
          title: { display: false }
        }
      };
      
      // Render chart on the offscreen 16:9 canvas
      const exportChart = new Chart(tempCtx, {
        type: 'bar',
        data: {
          labels: areaChartInstance.data.labels,
          datasets: [{
            label: 'Completion Progress %',
            data: areaChartInstance.data.datasets[0].data,
            backgroundColor: areaChartInstance.data.datasets[0].backgroundColor,
            borderRadius: 8,
            borderWidth: 0,
            barThickness: 48,
            maxBarThickness: 48
          }]
        },
        options: exportOptions
      });
      
      // Export to clipboard
      tempCanvas.toBlob(function(blob) {
        exportChart.destroy(); // clean up temporary chart instance
        
        if (!blob) {
          alert("Failed to generate image.");
          return;
        }
        
        try {
          const item = new ClipboardItem({ "image/png": blob });
          navigator.clipboard.write([item]).then(function() {
            const originalHTML = btnCopyChart.innerHTML;
            btnCopyChart.innerHTML = `
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span style="color: #10b981; font-weight: 700;">Copied!</span>
            `;
            setTimeout(() => {
              btnCopyChart.innerHTML = originalHTML;
            }, 2000);
          }).catch(function(err) {
            console.error("Clipboard write error: ", err);
            fallbackDownload(blob);
          });
        } catch (e) {
          console.error("Clipboard API error: ", e);
          fallbackDownload(blob);
        }
      }, "image/png");
    };
  }
}

// Fallback helper to download chart as image file
function fallbackDownload(blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `progress_chart_${Date.now()}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  alert("Clipboard access blocked. The chart image has been downloaded as a file instead!");
}
