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
  // Aggregated locally from the user's 2026-11-05 MediaCrawler export.
  // No handles, raw comments, or access tokens are bundled in this snapshot.
  const importedSnapshot = [
    {id:'snapshot-anxiety',tag:'小红书 · 已导入快照',title:'焦虑与内耗：值得继续验证的生活烦恼',score:92,heat:'高',trend:'18 篇笔记',gap:'待访谈',summary:'在 18 篇相关笔记与 31 条直接匹配评论中出现；评论共鸣约 8,527。',quote:'来自导入样本的匿名评论证据。',url:''},
    {id:'snapshot-work',tag:'小红书 · 已导入快照',title:'职场与工作：值得继续验证的生活烦恼',score:78,heat:'高',trend:'4 篇笔记',gap:'待访谈',summary:'在 4 篇相关笔记与 22 条直接匹配评论中出现；评论共鸣约 4,559。',quote:'来自导入样本的匿名评论证据。',url:''},
    {id:'snapshot-money',tag:'小红书 · 已导入快照',title:'经济与消费：值得继续验证的生活烦恼',score:76,heat:'高',trend:'2 篇笔记',gap:'待访谈',summary:'在 2 篇相关笔记与 18 条直接匹配评论中出现；评论共鸣约 11,445。',quote:'来自导入样本的匿名评论证据。',url:''},
    {id:'snapshot-health',tag:'小红书 · 已导入快照',title:'健康与睡眠：值得继续验证的生活烦恼',score:62,heat:'中高',trend:'2 篇笔记',gap:'待补证',summary:'在 2 篇相关笔记与 6 条直接匹配评论中出现；评论共鸣约 52。',quote:'来自导入样本的匿名评论证据。',url:''},
    {id:'snapshot-family',tag:'小红书 · 已导入快照',title:'家庭与照护：值得继续验证的生活烦恼',score:60,heat:'中高',trend:'1 篇笔记',gap:'待补证',summary:'在 1 篇相关笔记与 6 条直接匹配评论中出现；评论共鸣约 352。',quote:'来自导入样本的匿名评论证据。',url:''}
  ];
  const esc = v => String(v || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num = v => { const m = String(v || '').replace(/,/g,'').match(/([\d.]+)\s*(万|w)?/i); return m ? Number(m[1]) * (m[2] ? 10000 : 1) : 0; };

  function csv(text) {
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
  function makeCards(notes, comments) {
    const results = themes.map(([name, words]) => {
      const noteMatches=notes.filter(x=>words.some(w=>`${x.title} ${x.desc} ${x.tag_list}`.includes(w)));
      const commentMatches=comments.filter(x=>words.some(w=>String(x.content).includes(w)));
      const noteIds=new Set(noteMatches.map(x=>x.note_id));
      const linked=comments.filter(x=>noteIds.has(x.note_id));
      const all=[...commentMatches,...linked];
      const resonance=all.reduce((t,x)=>t+num(x.like_count),0);
      const engagement=noteMatches.reduce((t,x)=>t+num(x.liked_count)+num(x.collected_count)*1.5+num(x.comment_count)*2+num(x.share_count)*2,0);
      const signal=noteMatches.length*8+commentMatches.length*1.5+Math.min(18,Math.log10(resonance+1)*4)+Math.min(20,Math.log10(engagement+1)*4);
      const evidence=all.filter(x=>x.content&&x.content.length>=6).sort((a,b)=>num(b.like_count)-num(a.like_count))[0];
      return {name,words,noteMatches,commentMatches,resonance,signal,evidence};
    }).filter(x=>x.noteMatches.length||x.commentMatches.length);
    const max=Math.max(...results.map(x=>x.signal),1);
    return results.map((x,i)=>({
      id:`media-${i}`,tag:'小红书 · 真实导入',title:`${x.name}：值得继续验证的生活烦恼`,
      score:Math.min(95,Math.max(52,Math.round(52+x.signal/max*40))),
      heat:x.commentMatches.length>=15?'高':x.commentMatches.length>=5?'中高':'中', trend:`${x.noteMatches.length} 篇笔记`, gap:x.commentMatches.length>=10?'待访谈':'待补证',
      summary:`在 ${x.noteMatches.length} 篇相关笔记与 ${x.commentMatches.length} 条直接匹配评论中出现；评论共鸣约 ${Math.round(x.resonance).toLocaleString()}。`,
      quote:(x.evidence?.content||'该主题暂时没有足够长的评论证据。').replace(/[\r\n]+/g,' ').slice(0,100),
      url:x.noteMatches[0] ? String(x.noteMatches[0].note_url||'').split('?')[0] : ''
    })).sort((a,b)=>b.score-a.score);
  }
  function renderMedia() {
    cards.innerHTML=mediaCards.map(x=>`<article class="card" data-opportunity-id="${esc(x.id)}"><span class="tag">${esc(x.tag)}</span><div class="score">${x.score}<small>/100</small></div><h3>${esc(x.title)}</h3><p>${esc(x.summary)}</p><div class="metrics"><div class="metric"><b>${x.heat}</b><span>评论信号</span></div><div class="metric"><b>${esc(x.trend)}</b><span>样本来源</span></div><div class="metric"><b>${x.gap}</b><span>验证状态</span></div></div><div class="bar"><i style="width:${x.score}%"></i></div><div class="quote">“${esc(x.quote)}”</div><button class="secondary research-trigger" data-research-id="${esc(x.id)}" style="width:100%;margin-top:12px">研究这个烦恼</button>${x.url?`<a class="secondary" style="display:block;text-align:center;margin-top:8px;text-decoration:none" href="${esc(x.url)}" target="_blank" rel="noreferrer">查看原始笔记</a>`:''}</article>`).join('');
    document.querySelector('.toolbar h2').textContent='小红书导入：正在浮现的烦恼';
    document.querySelector('.toolbar span').textContent=`${mediaCards.length} 个主题 · 笔记与评论已合并 · ${mediaCards === importedSnapshot ? '2026-11-05 导入快照' : '本地分析'}`;
  }
  async function importMedia(files) {
    const parsed=await Promise.all([...files].map(async f=>({name:f.name,rows:csv(await f.text())})));
    const content=parsed.find(x=>x.rows[0]&&'note_id' in x.rows[0]&&('title' in x.rows[0]||'desc' in x.rows[0]));
    const comments=parsed.find(x=>x.rows[0]&&'comment_id' in x.rows[0]&&'content' in x.rows[0]);
    if(!content||!comments)throw new Error('请选择同时包含 title/desc 的笔记 CSV 与包含 comment_id/content 的评论 CSV。');
    mediaCards=makeCards(content.rows,comments.rows); mediaActive=true;
    result.innerHTML=`<div class="detail" style="margin-top:20px"><div class="evidence"><h4>已识别真实数据</h4><p class="hint">${content.rows.length} 篇笔记 · ${comments.rows.length} 条评论 · 通过 note_id 合并。原始昵称不展示，文件不上传到服务器。</p></div><div class="evidence"><h4>机会分说明</h4><p class="hint">综合主题频次、评论点赞共鸣和笔记互动量，用于排序，不代表平台整体热度。</p></div></div>`;
    radarNav.click(); renderMedia();
  }
  document.querySelector('#chooseFile').onclick=()=>input.click();
  input.onchange=async e=>{try{await importMedia(e.target.files);}catch(err){result.innerHTML=`<p class="hint" style="color:#b6412e;margin-top:18px">导入失败：${esc(err.message)}</p>`;}};
  document.querySelectorAll('.nav button').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.view==='radar'&&mediaActive)setTimeout(renderMedia,0);}));
  mediaCards = importedSnapshot;
  mediaActive = true;
  window.DemandRadarMedia = { getCards: () => mediaCards.slice() };
  setTimeout(renderMedia, 0);
})();

