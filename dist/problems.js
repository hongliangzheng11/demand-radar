/* Evidence-first local problem workspace. Automatic matches are candidates, not conclusions. */
(() => {
  const key = 'demand-radar-problems-v1';
  const $ = s => document.querySelector(s);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const uid = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let data;
  try { data = JSON.parse(localStorage.getItem(key) || '{"cards":[]}'); if (!Array.isArray(data.cards)) throw Error(); } catch { data = {cards:[]}; }
  let active = null, query = '';
  const style = document.createElement('style');
  style.textContent = `.problem-layout{display:grid;grid-template-columns:300px 1fr;gap:16px}.problem-list,.problem-detail{background:#fffefa;border:1px solid var(--line);border-radius:18px;padding:18px;min-width:0}.problem-list input,.problem-detail input,.problem-detail textarea,.problem-detail select{width:100%;padding:10px;border:1px solid var(--line);border-radius:9px;font:inherit;background:white}.problem-detail textarea{min-height:76px;resize:vertical}.problem-detail label{display:block;font-size:13px;font-weight:700;margin:14px 0 5px}.problem-item{display:block;width:100%;text-align:left;background:transparent;border-radius:10px;padding:12px;margin-top:6px}.problem-item.selected{background:#e6f1e8}.problem-item strong,.problem-item small{display:block}.problem-item small{color:var(--muted);margin-top:5px}.problem-evidence{background:#f4f7f0;border-radius:12px;padding:14px;margin:10px 0;overflow-wrap:anywhere}.problem-evidence p{white-space:pre-wrap}.problem-actions{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0}.problem-notice{color:#855b19;background:#fff6dc;padding:12px;border-radius:10px}.problem-fields{display:grid;grid-template-columns:1fr 1fr;gap:0 14px}.problem-list-scroll{max-height:70vh;overflow:auto}.problem-counter{color:var(--muted);font-size:13px}.problem-detail h2{overflow-wrap:anywhere}@media(max-width:760px){.problem-layout,.problem-fields{grid-template-columns:1fr}.problem-list-scroll{max-height:300px}}`;
  document.head.append(style);
  const nav = document.createElement('button'); nav.dataset.view = 'problems'; nav.textContent = '具体问题'; $('.nav').append(nav);
  const section = document.createElement('section'); section.id = 'problems'; section.className = 'view hidden';
  section.innerHTML = `<div class="toolbar"><div><h2>具体问题工作台</h2><span>从原文候选开始，人工整理并验证</span></div><div><button class="secondary" id="exportProblems">导出备份</button> <button class="secondary" id="newProblem">新建问题</button></div></div><p class="problem-notice">自动提取仅依据表达困难的词语，可能漏掉或误判，也不会自动理解语义。请阅读原文、手动合并或拆分；未知信息留空。数据保存在当前浏览器，可导出备份。</p><div class="problem-layout"><aside class="problem-list"><input id="problemSearch" placeholder="搜索问题或证据"><p class="problem-counter" id="problemCount"></p><div class="problem-list-scroll" id="problemList"></div></aside><article class="problem-detail" id="problemDetail"></article></div>`;
  $('.footer').before(section);
  const restoreButton = document.createElement('button'); restoreButton.className='secondary'; restoreButton.textContent='恢复备份';
  const restoreInput = document.createElement('input'); restoreInput.type='file'; restoreInput.accept='.json,application/json'; restoreInput.hidden=true;
  $('#exportProblems').after(restoreButton, restoreInput);
  restoreButton.onclick=()=>restoreInput.click();
  restoreInput.onchange=async()=>{ const file=restoreInput.files[0]; if(!file)return; try { const backup=JSON.parse(await file.text()); if(!Array.isArray(backup.cards) || !backup.cards.every(c=>c && typeof c.id==='string' && typeof c.title==='string' && Array.isArray(c.evidence) && c.evidence.every(e=>e && typeof e.id==='string' && typeof e.text==='string' && typeof e.sourceKey==='string'))) throw Error('格式不正确'); if(!confirm('恢复备份会替换当前问题和记录。建议先导出当前备份，确定继续吗？'))return; const previous=data; data=backup; if(!save()){data=previous;return;} active=data.cards[0]?.id || null; render(); } catch(err) { alert('无法恢复备份：文件格式不正确。'); } finally { restoreInput.value=''; } };
  function save() { try { localStorage.setItem(key, JSON.stringify(data)); return true; } catch(e) { alert('保存失败，浏览器存储空间可能不足。请先导出备份，减少导入数据后重试。'); return false; } }
  function open() { document.querySelectorAll('.nav button').forEach(x => x.classList.remove('active')); nav.classList.add('active'); document.querySelectorAll('.view').forEach(x => x.classList.add('hidden')); section.classList.remove('hidden'); render(); }
  nav.onclick = open;
  function card() { return data.cards.find(x => x.id === active); }
  function persistForm() { const c=card(); if (!c) return; section.querySelectorAll('[data-field]').forEach(el => c[el.dataset.field] = el.value.trim()); save(); }
  function evidenceHtml(e) {
    let url = ''; try { const u = new URL(e.url); if (['http:','https:'].includes(u.protocol)) url = u.href; } catch {}
    return `<div class="problem-evidence"><strong>${esc(e.kind)} · ${esc(e.platform || '未知平台')}</strong> <span class="hint">${esc(e.date || '时间未知')} · 作者 ${esc(e.author || '未知')}</span><p>“${esc(e.text)}”</p>${e.context ? `<p class="hint">原帖上下文：${esc(e.context)}</p>` : ''}${url ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">查看对应原帖 ↗</a>` : '<span class="hint">没有原帖链接</span>'}<div class="problem-actions"><button class="secondary" data-split="${esc(e.id)}">拆出为新问题</button><button class="secondary" data-remove-evidence="${esc(e.id)}">移除证据</button></div></div>`;
  }
  function render() {
    const list = data.cards.filter(c => `${c.title} ${c.audience || ''} ${c.scene || ''} ${(c.evidence || []).map(e=>e.text).join(' ')}`.toLowerCase().includes(query));
    $('#problemCount').textContent = `${list.length} 个问题 · 按证据条数排序，数量不代表独立用户数`;
    $('#problemList').innerHTML = list.sort((a,b)=>b.evidence.length-a.evidence.length).map(c=>`<button class="problem-item ${c.id===active?'selected':''}" data-card="${esc(c.id)}"><strong>${esc(c.title || '未命名问题')}</strong><small>${esc(c.status || '待核查')} · ${c.evidence.length} 条证据</small></button>`).join('') || '<p class="hint">还没有匹配的问题。请先导入爬虫数据或手动新建。</p>';
    const c = card(), box = $('#problemDetail');
    if (!c) { box.innerHTML = '<div class="empty-project">导入数据后选择一个候选问题，或手动新建问题。</div>'; return; }
    const field = (name,label,placeholder='',multiline=false) => `<label>${label}</label>${multiline ? `<textarea data-field="${name}" placeholder="${placeholder}">${esc(c[name])}</textarea>` : `<input data-field="${name}" value="${esc(c[name])}" placeholder="${placeholder}">`}`;
    box.innerHTML = `<h2>问题详情</h2><p class="hint">保留事实与推断的区别；未在证据中出现的内容请标明为假设。</p>${field('title','问题描述','例如：临时加班时难以安排可信任的人接孩子')}<div class="problem-fields">${field('audience','人群','未知，等待核实')}${field('scene','场景','未知，等待核实')}${field('goal','想完成的事','未知，等待核实')}${field('obstacle','障碍','未知，等待核实')}${field('consequence','后果','未知，等待核实')}${field('alternative','现有办法及不足','未知，等待核实')}</div><label>验证状态</label><select data-field="status">${['待核查','待访谈','问题已验证','测试方案','暂不推进'].map(s=>`<option ${c.status===s?'selected':''}>${s}</option>`).join('')}</select>${field('assessment','评估与反例','频率、严重程度、付费线索、证据不足之处',true)}${field('solution','解决方案假设','可能的方案；标明尚未验证',true)}${field('next','下一步验证','访谈、竞品调研或低成本实验',true)}<div class="problem-actions"><button class="primary" id="saveProblem">保存修改</button><button class="secondary" id="deleteProblem">删除问题</button></div><h3>原文证据（${c.evidence.length}）</h3><p class="hint">一条原文只是线索；评论上下文来自其对应原帖，不能视为评论者亲自陈述。去重作者、频率和市场规模仍需核实。</p>${c.evidence.map(evidenceHtml).join('') || '<p class="hint">暂无证据</p>'}<label>合并到另一个问题</label><select id="mergeTarget"><option value="">选择目标问题</option>${data.cards.filter(x=>x.id!==c.id).map(x=>`<option value="${esc(x.id)}">${esc(x.title || '未命名问题')}</option>`).join('')}</select><div class="problem-actions"><button class="secondary" id="mergeProblem">将当前问题的证据合并到目标</button></div><p class="hint">合并前请核对人群、场景与障碍；当前问题的文字记录不会自动覆盖目标，请先复制需要保留的内容。</p>`;
  }
  section.addEventListener('click', e => {
    const b=e.target.closest('button'); if (!b) return;
    if (b.dataset.card) { persistForm(); active=b.dataset.card; render(); }
    else if (b.id==='saveProblem') { persistForm(); render(); }
    else if (b.id==='newProblem') { persistForm(); const c={id:uid(),title:'未命名问题',status:'待核查',evidence:[]}; data.cards.unshift(c); active=c.id; save(); render(); }
    else if (b.id==='deleteProblem') { if (!confirm('删除这个问题及其中的证据？此操作无法撤销。')) return; data.cards=data.cards.filter(x=>x.id!==active); active=null; save(); render(); }
    else if (b.dataset.split) { persistForm(); const c=card(), i=c.evidence.findIndex(x=>x.id===b.dataset.split); if(i<0)return; const [ev]=c.evidence.splice(i,1); const n={id:uid(),title:ev.text.slice(0,70),status:'待核查',evidence:[ev]}; data.cards.unshift(n); active=n.id; save(); render(); }
    else if (b.dataset.removeEvidence) { if(!confirm('从此问题移除这条证据？'))return; persistForm(); const c=card(); c.evidence=c.evidence.filter(x=>x.id!==b.dataset.removeEvidence); save(); render(); }
    else if (b.id==='mergeProblem') { const id=$('#mergeTarget').value, target=data.cards.find(x=>x.id===id); if(!target){alert('请先选择目标问题。');return;} if(!confirm('合并证据后，当前问题及其文字记录将被删除。继续吗？'))return; persistForm(); const c=card(), seen=new Set(target.evidence.map(x=>x.sourceKey)); target.evidence.push(...c.evidence.filter(x=>!seen.has(x.sourceKey))); data.cards=data.cards.filter(x=>x.id!==c.id); active=target.id; save(); render(); }
    else if (b.id==='exportProblems') { persistForm(); const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})); a.download='烦恼雷达-问题备份.json'; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000); }
  });
  $('#problemSearch').oninput = e => { query=e.target.value.trim().toLowerCase(); render(); };
  window.addEventListener('radar:import', e => {
    const {notes,comments,platform}=e.detail, noteMap=new Map(notes.map(n=>[String(n.note_id),n]));
    const seen=new Set(data.cards.flatMap(c=>c.evidence.map(x=>x.sourceKey)));
    const pattern=/(难以|很难|无法|不能|没办法|不知道怎么|怎么办|困扰|烦恼|焦虑|痛苦|麻烦|费时|浪费时间|不方便|总是.*不了|容易.*(漏|忘|坏)|担心|担忧|失眠|压力|加班|拖延|求推荐|有没有.{0,12}(工具|方法|办法))/i;
    let added=0;
    function add(text, row, note, kind, id) {
      const sourceKey=`${platform}:${kind}:${id}`; if(seen.has(sourceKey))return;
      const cleaned=String(text || '').replace(/\s+/g,' ').trim();
      if(cleaned.length<8 || !pattern.test(cleaned))return;
      const match=cleaned.split(/[。！？!?\n]/).map(x=>x.trim()).find(x=>x.length>=8 && pattern.test(x)) || cleaned;
      const ev={id:uid(),sourceKey,kind,platform,text:cleaned,url:note?.note_url || '',context:kind==='评论' ? [note?.title,note?.desc].filter(Boolean).join(' ').slice(0,600) : '',date:row.create_time || row.publish_time || row.time || '',author:row.user_id || row.author_id || ''};
      data.cards.push({id:uid(),title:match.slice(0,70),status:'待核查',evidence:[ev]}); seen.add(sourceKey); added++;
    }
    notes.forEach(n=>add([n.title,n.desc].filter((x,i,a)=>x && a.indexOf(x)===i).join('。'),n,n,'笔记',n.note_id));
    comments.forEach(c=>add(c.content,c,noteMap.get(String(c.note_id)),'评论',c.comment_id));
    save(); if(!active && data.cards.length)active=data.cards[0].id;
    const msg=document.createElement('p'); msg.className='hint'; msg.textContent=`已新增 ${added} 个待核查的问题候选；重复来源跳过。打开“具体问题”查看、合并和验证。`; $('#importResult').append(msg);
    render();
  });
  render();
})();
