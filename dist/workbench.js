(() => {
  const $ = s => document.querySelector(s);
  const esc = v => String(v || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const stateKey = 'demand-radar-research-v1';
  let projects = JSON.parse(localStorage.getItem(stateKey) || '[]');
  let activeId = null;

  const style = document.createElement('style');
  style.textContent = `.research-nav{margin-left:auto!important;background:#173f31!important;color:#fff!important}.workbench{display:grid;grid-template-columns:280px 1fr;gap:18px;padding-bottom:45px}.project-list{background:#fffefa;border:1px solid var(--line);border-radius:18px;padding:13px}.project-item{width:100%;text-align:left;padding:13px;border-radius:12px;background:transparent;color:var(--ink);margin-bottom:6px}.project-item.active{background:#e6f1e8}.project-item b{display:block;font-size:14px}.project-item span{font-size:12px;color:var(--muted)}.research-form{background:#fffefa;border:1px solid var(--line);border-radius:18px;padding:25px}.research-form h2{margin:0 0 6px}.research-form label{display:block;font-size:13px;font-weight:700;margin:17px 0 6px}.research-form input,.research-form textarea,.research-form select{width:100%;border:1px solid var(--line);border-radius:10px;padding:10px;background:#fff;font:inherit}.research-form textarea{min-height:92px;resize:vertical}.research-actions{display:flex;gap:9px;margin-top:18px}.empty-project{color:var(--muted);padding:35px 10px;text-align:center}.modal-backdrop{position:fixed;inset:0;background:#18332888;display:grid;place-items:center;padding:18px;z-index:30}.detail-modal{width:min(620px,100%);background:#fffefa;border-radius:20px;padding:26px;box-shadow:0 20px 50px #11251b55}.detail-modal h2{margin:12px 0 7px}.modal-top{display:flex;justify-content:space-between;align-items:center}.close{background:#e9efe7;border-radius:9px;padding:7px 10px}.detail-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:19px 0}.detail-grid div{background:#f2f6ee;border-radius:10px;padding:12px}.detail-grid b{display:block;font-size:17px}@media(max-width:760px){.workbench{grid-template-columns:1fr}.detail-grid{grid-template-columns:1fr}.research-nav{margin-left:0!important}}`;
  document.head.append(style);

  const nav = document.createElement('button');
  nav.className = 'research-nav'; nav.dataset.view = 'research'; nav.textContent = '研究项目';
  $('.nav').append(nav);
  const research = document.createElement('section');
  research.id = 'research'; research.className = 'view hidden';
  research.innerHTML = `<div class="toolbar"><div><h2>问题研究台</h2><span>把有信号的烦恼转成可验证的项目</span></div><button class="secondary" id="newProject">新建研究</button></div><div class="workbench"><aside class="project-list" id="projectList"></aside><article class="research-form" id="projectForm"></article></div>`;
  $('.footer').before(research);

  function save() { localStorage.setItem(stateKey, JSON.stringify(projects)); }
  function getOpportunity(id) { return (window.DemandRadarMedia?.getCards() || []).find(x => x.id === id); }
  function project(id) { return projects.find(x => x.id === id); }
  function renderList() {
    const list = $('#projectList');
    if (!projects.length) { list.innerHTML = `<div class="empty-project">还没有研究项目。<br>在机会卡片点“研究这个烦恼”。</div>`; return; }
    list.innerHTML = projects.map(p => `<button class="project-item ${p.id===activeId?'active':''}" data-project="${p.id}"><b>${esc(p.title)}</b><span>${esc(p.status || '待验证')} · ${esc(p.updatedAt || '刚创建')}</span></button>`).join('');
    list.querySelectorAll('[data-project]').forEach(b => b.onclick = () => { activeId = b.dataset.project; renderAll(); });
  }
  function renderForm() {
    const box = $('#projectForm'), p = project(activeId);
    if (!p) { box.innerHTML = `<div class="empty-project">选择一个研究项目，或从机会卡片创建。</div>`; return; }
    box.innerHTML = `<h2>${esc(p.title)}</h2><p class="hint">把直觉写成可验证的假设，再决定是否继续投入。</p><label>状态</label><select data-field="status"><option ${p.status==='待验证'?'selected':''}>待验证</option><option ${p.status==='访谈中'?'selected':''}>访谈中</option><option ${p.status==='验证通过'?'selected':''}>验证通过</option><option ${p.status==='暂停'?'selected':''}>暂停</option><option ${p.status==='放弃'?'selected':''}>放弃</option></select><label>核心假设</label><textarea data-field="hypothesis" placeholder="例如：经常感到工作焦虑的职场人，愿意为可执行的情绪整理方案付费。">${esc(p.hypothesis)}</textarea><label>目标用户</label><input data-field="audience" placeholder="例如：一线城市、工作 1–5 年的职场人" value="${esc(p.audience)}"><label>访谈/证据记录</label><textarea data-field="evidence" placeholder="记录用户原话、访谈摘要、竞品观察…">${esc(p.evidence)}</textarea><label>下一步验证动作</label><textarea data-field="nextStep" placeholder="例如：访谈 10 位目标用户；建立问卷；制作一页落地页。">${esc(p.nextStep)}</textarea><label>当前结论</label><textarea data-field="conclusion" placeholder="还缺什么证据？为什么继续或放弃？">${esc(p.conclusion)}</textarea><div class="research-actions"><button class="primary" id="saveProject">保存研究记录</button><button class="secondary" id="deleteProject">删除项目</button></div>`;
    $('#saveProject').onclick = () => { box.querySelectorAll('[data-field]').forEach(el => p[el.dataset.field] = el.value.trim()); p.updatedAt = new Date().toLocaleDateString('zh-CN'); save(); renderAll(); };
    $('#deleteProject').onclick = () => { projects = projects.filter(x => x.id !== p.id); activeId = projects[0]?.id || null; save(); renderAll(); };
  }
  function renderAll() { renderList(); renderForm(); }
  function openResearch() { document.querySelectorAll('.nav button').forEach(x=>x.classList.remove('active')); nav.classList.add('active'); document.querySelectorAll('.view').forEach(x=>x.classList.add('hidden')); research.classList.remove('hidden'); renderAll(); }
  function createProject(op) {
    let p = projects.find(x => x.opportunityId === op.id);
    if (!p) { p = {id:'research-'+Date.now(),opportunityId:op.id,title:op.title,status:'待验证',hypothesis:'',audience:'',evidence:`数据证据：${op.summary}`,nextStep:'访谈 10 位目标用户，确认问题发生频率、当前替代方案和付费意愿。',conclusion:'',updatedAt:'刚创建'}; projects.unshift(p); save(); }
    activeId = p.id; openResearch();
  }
  function showDetail(op) {
    const layer = document.createElement('div'); layer.className = 'modal-backdrop';
    layer.innerHTML = `<div class="detail-modal"><div class="modal-top"><span class="tag">${esc(op.tag)}</span><button class="close">关闭</button></div><h2>${esc(op.title)}</h2><p class="hint">${esc(op.summary)}</p><div class="detail-grid"><div><b>${op.score}/100</b><span class="hint">机会分</span></div><div><b>${esc(op.heat)}</b><span class="hint">信号强度</span></div><div><b>${esc(op.gap)}</b><span class="hint">验证状态</span></div></div><div class="evidence"><h4>当前证据</h4><p class="quote">“${esc(op.quote)}”</p><p class="hint">下一步不是直接做产品，而是先访谈目标用户，验证问题是否高频、急迫且未被现有方案满足。</p></div><button class="primary" style="width:100%;margin-top:16px" id="startResearch">创建验证项目 →</button></div>`;
    document.body.append(layer); layer.querySelector('.close').onclick = () => layer.remove(); layer.onclick = e => { if(e.target === layer) layer.remove(); }; layer.querySelector('#startResearch').onclick = () => { layer.remove(); createProject(op); };
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-research-id]'); if (!b) return;
    e.preventDefault(); e.stopPropagation(); const op = getOpportunity(b.dataset.researchId); if (op) showDetail(op);
  });
  nav.onclick = openResearch;
  $('#newProject').onclick = () => { const p={id:'research-'+Date.now(),title:'未命名问题',status:'待验证',hypothesis:'',audience:'',evidence:'',nextStep:'',conclusion:'',updatedAt:'刚创建'}; projects.unshift(p); activeId=p.id; save(); renderAll(); };
  renderAll();
})();

