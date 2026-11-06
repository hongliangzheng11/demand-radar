/* MediaCrawler adapter: all imported files are parsed locally in the browser. */
(() => {
  const input = document.querySelector('#fileInput');
  const result = document.querySelector('#importResult');
  const cards = document.querySelector('#cards');
  const radarNav = document.querySelector('[data-view="radar"]');
  let mediaCards = [], mediaActive = false;
  input.multiple = true;

  const themes = [
    ['焦虑与内耗',['焦虑','内耗','烦恼','压力','崩溃','emo','情绪','迷茫','难过','害怕','恐惧']],
    ['职场与工作',['工作','职场','老板','同事','上班','辞职','加班','公司','工资','面试']],
    ['关系与社交',['恋爱','男朋友','女朋友','老公','老婆','朋友','人际','沟通','孤独','关系']],
    ['学习与成长',['学习','考试','学校','考研','拖延','自律','坚持','成长','目标','努力']],
    ['家庭与照护',['父母','孩子','家庭','婚姻','婆婆','育儿','妈妈','爸爸','老人']],
    ['健康与睡眠',['睡眠','失眠','身体','医院','生病','健康','焦虑症','抑郁','痛经']],
    ['经济与消费',['钱','工资','消费','房租','负债','穷','赚钱','买不起','经济']]
  ];
  // Aggregated locally from the user's latest 2026-11-05 MediaCrawler export.
  // No handles, raw comments, or access tokens are bundled in this snapshot.
  const importedSnapshot = [
    {id:'snapshot-emotion',tag:'小红书 · 已导入快照',title:'睡眠与情绪恢复：焦虑、内耗、睡不着',score:92,heat:'高',trend:'71 篇笔记',gap:'待访谈',summary:'在 71 篇相关笔记与 162 条匹配评论中出现；评论共鸣约 36,277。',quote:'来自导入样本的匿名评论证据。',url:''},
    {id:'snapshot-debt',tag:'小红书 · 已导入快照',title:'收入与负债压力：钱不够、还款与房租',score:88,heat:'高',trend:'6 篇笔记',gap:'待访谈',summary:'在 6 篇相关笔记与 46 条匹配评论中出现；评论共鸣约 19,353。',quote:'来自导入样本的匿名评论证据。',url:''},
    {id:'snapshot-work',tag:'小红书 · 已导入快照',title:'职场消耗与加班：老板、同事与离职',score:79,heat:'高',trend:'13 篇笔记',gap:'待访谈',summary:'在 13 篇相关笔记与 79 条匹配评论中出现；评论共鸣约 1,795。',quote:'来自导入样本的匿名评论证据。',url:''},
    {id:'snapshot-job',tag:'小红书 · 已导入快照',title:'求职与失业焦虑：找工作、面试与 offer',score:77,heat:'高',trend:'10 篇笔记',gap:'待访谈',summary:'在 10 篇相关笔记与 57 条匹配评论中出现；评论共鸣约 4,715。',quote:'来自导入样本的匿名评论证据。',url:''},
    {id:'snapshot-parenting',tag:'小红书 · 已导入快照',title:'育儿与家庭照护：孩子、父母与照料',score:72,heat:'高',trend:'17 篇笔记',gap:'待补证',summary:'在 17 篇相关笔记与 114 条匹配评论中出现；评论共鸣约 1,968。',quote:'来自导入样本的匿名评论证据。',url:''},
    {id:'snapshot-social',tag:'小红书 · 已导入快照',title:'社交孤独与沟通：朋友、人际与关系维护',score:70,heat:'中高',trend:'23 篇笔记',gap:'待补证',summary:'在 23 篇相关笔记与 69 条匹配评论中出现；评论共鸣约 5,184。',quote:'来自导入样本的匿名评论证据。',url:''},
    {id:'snapshot-love',tag:'小红书 · 已导入快照',title:'亲密关系与婚恋：恋爱、分手与婚姻',score:69,heat:'中高',trend:'15 篇笔记',gap:'待补证',summary:'在 15 篇相关笔记与 61 条匹配评论中出现；评论共鸣约 5,012。',quote:'来自导入样本的匿名评论证据。',url:''},
    {id:'snapshot-career',tag:'小红书 · 已导入快照',title:'职业迷茫与转型：方向、转行与副业',score:66,heat:'中高',trend:'12 篇笔记',gap:'待补证',summary:'在 12 篇相关笔记与 50 条匹配评论中出现；评论共鸣约 1,290。',quote:'来自导入样本的匿名评论证据。',url:''},
    {id:'snapshot-learning',tag:'小红书 · 已导入快照',title:'学习拖延与自律：效率、专注与坚持',score:63,heat:'中',trend:'14 篇笔记',gap:'待补证',summary:'在 14 篇相关笔记与 42 条匹配评论中出现；评论共鸣约 1,394。',quote:'来自导入样本的匿名评论证据。',url:''},
    {id:'snapshot-health',tag:'小红书 · 已导入快照',title:'健康与身体不适：生病、疼痛与调理',score:62,heat:'中',trend:'7 篇笔记',gap:'待补证',summary:'在 7 篇相关笔记与 37 条匹配评论中出现；评论共鸣约 2,102。',quote:'来自导入样本的匿名评论证据。',url:''},
    {id:'snapshot-home',tag:'小红书 · 已导入快照',title:'住房与城市生活：租房、房贷与通勤',score:60,heat:'中',trend:'8 篇笔记',gap:'待补证',summary:'在 8 篇相关笔记与 33 条匹配评论中出现；评论共鸣约 2,499。',quote:'来自导入样本的匿名评论证据。',url:''}
  ];
  const esc = v => String(v || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num = v => { const m = String(v || '').replace(/,/g,'').match(/([\d.]+)\s*(万|w)?/i); return m ? Number(m[1]) * (m[2] ? 10000 : 1) : 0; };

  function parseCsv(text) {
    const rows=[]; let row=[], cell='', quoted=false;
    for(let i=0;i<text.length;i++) { const ch=text[i], nx=text[i+1];
      if(ch==='"' && quoted && nx==='"') { cell+='"'; i++; }
      else if(ch==='"') quoted=!quoted;
      else if(ch===',' && !quoted) { row.push(cell); cell=''; }
      else if((ch==='\n'||ch==='\r') && !quoted) { if(ch==='\r'&&nx==='\n')i++; row.push(cell); if(row.some(x=>x!==''))rows.push(row); row=[];cell=''; }
      else cell+=ch;
    }
    if(cell||row.length){row.push(cell);rows.push(row);}
    const head=(rows.shift()||[]).map(x=>x.replace(/^\uFEFF/,'').trim());
    return rows.map(r=>Object.fromEntries(head.map((h,i)=>[h,(r[i]||'').trim()])));
  }
  function parseMediaFile(name, text) {
    const trimmed = text.replace(/^\uFEFF/, '').trim();
    if (/\.jsonl$/i.test(name)) {
      try {
        return trimmed.split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line));
      } catch {
        throw new Error(`${name} 不是有效的 JSONL 文件。`);
      }
    }
    const looksLikeJson = /\.json$/i.test(name) || trimmed.startsWith('[') || trimmed.startsWith('{');
    if (!looksLikeJson) return parseCsv(text);

    let parsed;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      throw new Error(`${name} 不是有效的 JSON 文件。`);
    }
    const rows = Array.isArray(parsed) ? parsed : [parsed];
    if (!rows.every(row => row && typeof row === 'object' && !Array.isArray(row))) {
      throw new Error(`${name} 需要是由对象组成的 JSON 数组。`);
    }
    return rows;
  }
  function normalizeNotes(rows) {
    return rows.map(row => ({
      ...row,
      note_id: row.note_id ?? row.aweme_id ?? row.video_id ?? row.content_id ?? row.item_id ?? row.id,
      title: row.title ?? row.desc ?? row.content ?? '',
      desc: row.desc ?? row.content ?? row.title ?? '',
      tag_list: row.tag_list ?? row.tags ?? '',
      note_url: row.note_url ?? row.video_url ?? row.url ?? ''
    })).filter(row => row.note_id != null);
  }
  function normalizeComments(rows) {
    return rows.map(row => ({
      ...row,
      comment_id: row.comment_id ?? row.id,
      note_id: row.note_id ?? row.aweme_id ?? row.video_id ?? row.content_id ?? row.item_id ?? row.target_id,
      content: row.content ?? row.comment_text ?? row.text ?? ''
    })).filter(row => row.comment_id != null && row.content);
  }
  function makeCards(notes, comments, platform = '媒体') {
    const assignTheme = text => {
      const value = String(text || '').toLowerCase();
      let best = -1, bestScore = 0;
      themes.forEach(([, words], index) => {
        const score = words.reduce((sum, word) => sum + (value.includes(word.toLowerCase()) ? 1 : 0), 0);
        if (score > bestScore) { best = index; bestScore = score; }
      });
      return best;
    };
    const noteGroups = themes.map(() => []), commentGroups = themes.map(() => []);
    notes.forEach(note => { const i = assignTheme(`${note.title} ${note.desc} ${note.tag_list}`); if (i >= 0) noteGroups[i].push(note); });
    comments.forEach(comment => { const i = assignTheme(comment.content); if (i >= 0) commentGroups[i].push(comment); });
    const results = themes.map(([name, words], index) => {
      const noteMatches=noteGroups[index];
      const commentMatches=commentGroups[index];
      const resonance=commentMatches.reduce((t,x)=>t+num(x.like_count),0);
      const engagement=noteMatches.reduce((t,x)=>t+num(x.liked_count)+num(x.collected_count)*1.5+num(x.comment_count)*2+num(x.share_count)*2,0);
      const signal=noteMatches.length*8+commentMatches.length*1.5+Math.min(18,Math.log10(resonance+1)*4)+Math.min(20,Math.log10(engagement+1)*4);
      const evidence=commentMatches.filter(x=>x.content&&x.content.length>=6).sort((a,b)=>num(b.like_count)-num(a.like_count))[0];
      return {name,words,index,noteMatches,commentMatches,resonance,signal,evidence};
    }).filter(x=>x.noteMatches.length||x.commentMatches.length);
    const max=Math.max(...results.map(x=>x.signal),1);
    return results.map((x,i)=>({
      id:`media-${x.index}`,tag:`${platform} · 真实导入`,title:`${x.name}：值得继续验证的生活烦恼`,
      score:Math.min(95,Math.max(52,Math.round(52+x.signal/max*40))),
      heat:x.commentMatches.length>=15?'高':x.commentMatches.length>=5?'中高':'中', trend:`${x.noteMatches.length} 篇笔记`, gap:x.commentMatches.length>=10?'待访谈':'待补证',
      summary:`在 ${x.noteMatches.length} 篇相关笔记与 ${x.commentMatches.length} 条直接匹配评论中出现；评论共鸣约 ${Math.round(x.resonance).toLocaleString()}。`,
      quote:(x.evidence?.content||'该主题暂时没有足够长的评论证据。').replace(/[\r\n]+/g,' ').slice(0,100),
      url:x.noteMatches[0] ? String(x.noteMatches[0].note_url||'').split('?')[0] : ''
    })).sort((a,b)=>b.score-a.score);
  }
  let searchQuery = '';
  function renderMedia() {
    const visible = mediaCards.filter(x => `${x.title} ${x.summary} ${x.quote} ${x.tag}`.toLowerCase().includes(searchQuery));
    cards.innerHTML=visible.map(x=>`<article class="card" data-opportunity-id="${esc(x.id)}"><span class="tag">${esc(x.tag)}</span><div class="score">${x.score}<small>/100</small></div><h3>${esc(x.title)}</h3><p>${esc(x.summary)}</p><div class="metrics"><div class="metric"><b>${x.heat}</b><span>评论信号</span></div><div class="metric"><b>${esc(x.trend)}</b><span>样本来源</span></div><div class="metric"><b>${x.gap}</b><span>验证状态</span></div></div><div class="bar"><i style="width:${x.score}%"></i></div><div class="quote">“${esc(x.quote)}”</div><button class="secondary research-trigger" data-research-id="${esc(x.id)}" style="width:100%;margin-top:12px">研究这个烦恼</button>${x.url?`<a class="secondary" style="display:block;text-align:center;margin-top:8px;text-decoration:none" href="${esc(x.url)}" target="_blank" rel="noreferrer">查看原始笔记</a>`:''}</article>`).join('') || '<p class="hint">没有匹配的烦恼，请尝试其他关键词。</p>';
    document.querySelector('.toolbar h2').textContent='小红书导入：正在浮现的烦恼';
    document.querySelector('.toolbar span').textContent=`${visible.length} 个主题 · ${mediaCards === importedSnapshot ? '2026-11-05 导入快照' : '本地分析'}`;
  }
  function showImportedMedia(contentRows, commentRows, platform = '媒体') {
    const notes = [...new Map(normalizeNotes(contentRows).map(row => [String(row.note_id), row])).values()];
    const comments = [...new Map(normalizeComments(commentRows).map(row => [String(row.comment_id), row])).values()];
    if (!notes.length || !comments.length) {
      throw new Error('数据中没有可用的内容或评论记录。内容需有 id/title/desc，评论需有 id/content。');
    }
    mediaCards=makeCards(notes,comments,platform); mediaActive=true; searchQuery='';
    result.innerHTML=`<div class="detail" style="margin-top:20px"><div class="evidence"><h4>已识别真实数据</h4><p class="hint">${notes.length} 篇内容 · ${comments.length} 条评论 · 已按内容 ID 合并。原始昵称不展示，文件不上传到服务器。</p></div><div class="evidence"><h4>机会分说明</h4><p class="hint">综合主题频次、评论点赞共鸣和内容互动量，用于排序，不代表平台整体热度。</p></div></div>`;
    window.dispatchEvent(new CustomEvent('radar:import', {detail:{notes, comments, platform}}));
    radarNav.click(); renderMedia();
  }
  async function importMedia(files) {
    const parsed=await Promise.all([...files].map(async f=>({name:f.name,rows:parseMediaFile(f.name,await f.text())})));
    const content=parsed.find(x=>x.rows.some(row => row && !('comment_id' in row) && ('title' in row || 'desc' in row)));
    const comments=parsed.find(x=>x.rows.some(row => row && 'comment_id' in row && 'content' in row));
    if(!content||!comments)throw new Error('请选择同时包含 title/desc 的内容 JSON/CSV 与包含 comment_id/content 的评论 JSON/CSV。');
    showImportedMedia(content.rows,comments.rows,'媒体');
  }
  async function importCrawlerRun(source) {
    const url = new URL(source);
    if (!['127.0.0.1','localhost'].includes(url.hostname) || url.pathname !== '/api/crawler/radar-export') {
      throw new Error('只允许导入本机 MediaCrawler 的本次任务数据。');
    }
    const response = await fetch(url.toString());
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.detail || '无法读取本次爬取结果。');
    showImportedMedia(payload.contents || [], payload.comments || [], payload.platform || '媒体');
  }
  document.querySelector('#chooseFile').onclick=()=>input.click();
  document.querySelector('#importSqlite').onclick = async event => {
    const button = event.currentTarget;
    button.disabled = true;
    result.textContent = '正在读取本机数据库…';
    try {
      const response = await fetch('/api/sqlite-import', {cache: 'no-store'});
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.detail || '读取数据库失败');
      showImportedMedia(payload.contents || [], payload.comments || [], payload.platform);
    } catch (err) {
      result.innerHTML = `<p class="hint" style="color:#b6412e;margin-top:18px">导入失败：${esc(err.message)}</p>`;
    } finally { button.disabled = false; }
  };
  document.querySelector('#searchForm').onsubmit = e => {
    if (!mediaActive) return;
    e.preventDefault();
    searchQuery = document.querySelector('#query').value.trim().toLowerCase();
    radarNav.click();
    renderMedia();
  };
  input.onchange=async e=>{try{await importMedia(e.target.files);}catch(err){result.innerHTML=`<p class="hint" style="color:#b6412e;margin-top:18px">导入失败：${esc(err.message)}</p>`;}};
  document.querySelectorAll('.nav button').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.view==='radar'&&mediaActive)setTimeout(renderMedia,0);}));
  mediaCards = importedSnapshot;
  mediaActive = true;
  window.DemandRadarMedia = { getCards: () => mediaCards.slice() };
  setTimeout(renderMedia, 0);
  const crawlerSource = new URLSearchParams(window.location.search).get('source');
  if (crawlerSource) {
    result.innerHTML = '<p class="hint" style="margin-top:18px">正在导入本次爬取的数据…</p>';
    importCrawlerRun(crawlerSource)
      .then(() => window.history.replaceState({}, '', window.location.pathname))
      .catch(err => {
        result.innerHTML = `<p class="hint" style="color:#b6412e;margin-top:18px">自动导入失败：${esc(err.message)}</p>`;
        document.querySelector('[data-view="import"]').click();
      });
  }
})();
