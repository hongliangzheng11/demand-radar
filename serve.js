const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const dns = require('dns').promises;
const net = require('net');
const https = require('https');

const root = path.join(__dirname, 'dist');
const port = 4174;
const types = {'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8'};

http.createServer((req, res) => {
  const pathname = decodeURIComponent((req.url || '/').split('?')[0]);
  if (pathname === '/api/local-model') {
    const allowedOrigins = [`http://127.0.0.1:${port}`, `http://localhost:${port}`];
    if (req.method !== 'POST' || !allowedOrigins.includes(req.headers.origin) || req.headers['content-type'] !== 'application/json') { res.writeHead(403); return res.end('Forbidden'); }
    let body = ''; req.setEncoding('utf8');
    req.on('data', chunk => { body += chunk; if (body.length > 150000) req.destroy(); });
    req.on('end', async () => {
      try {
        const {model, messages} = JSON.parse(body);
        if (typeof model !== 'string' || !/^[a-zA-Z0-9_.:/-]{1,100}$/.test(model) || !Array.isArray(messages) || messages.length !== 2 || messages.some((m,i)=>m?.role !== ['system','user'][i] || typeof m.content !== 'string' || m.content.length > 30000)) throw Error('本地模型请求格式不正确。');
        const response = await fetch('http://127.0.0.1:11434/api/chat', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model,messages,format:'json',stream:false,think:false,options:{num_ctx:8192,temperature:0.2}}),signal:AbortSignal.timeout(600000)});
        const result = await response.text();
        res.writeHead(response.status, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}); res.end(result);
      } catch (err) { res.writeHead(503, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}); res.end(JSON.stringify({error:'无法连接本机 Ollama，请确认已启动并下载所选模型。'})); }
    });
    return;
  }
  if (pathname === '/api/ai-analysis') {
    const origin = req.headers.origin;
    if (req.method !== 'POST' || ![`http://127.0.0.1:${port}`, `http://localhost:${port}`].includes(origin) || req.headers['content-type'] !== 'application/json') { res.writeHead(403); return res.end('Forbidden'); }
    let body = ''; req.setEncoding('utf8');
    req.on('data', chunk => { body += chunk; if (body.length > 150000) req.destroy(); });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body), target = new URL(payload.url);
        if (target.protocol !== 'https:' || target.username || target.password || net.isIP(target.hostname) || target.hostname === 'localhost' || target.hostname.endsWith('.localhost') || target.hostname.endsWith('.local')) throw Error('API 地址必须是公网 HTTPS 域名。');
        const addresses = await dns.lookup(target.hostname, {all:true});
        if (!addresses.length || addresses.some(({address,family}) => family === 6 ? !/^[23][0-9a-f]{0,3}:/i.test(address) : /^(127\.|10\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.|2(?:2[4-9]|3\d|4\d|5[0-5])\.)/.test(address))) throw Error('API 地址不能指向本机或内网。');
        if (typeof payload.key !== 'string' || !payload.key || typeof payload.request !== 'object') throw Error('请求格式不正确。');
        const result = await new Promise((resolve, reject) => {
          const address = addresses[0];
          const upstream = https.request(target, {method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${payload.key}`}, lookup:(_host,_options,callback)=>callback(null,address.address,address.family), timeout:120000}, response=>{
            let chunks='', size=0; response.setEncoding('utf8');
            response.on('data', chunk=>{size+=chunk.length;if(size>2_000_000){upstream.destroy(Error('响应过大。'));return;}chunks+=chunk;});
            response.on('end',()=>resolve({status:response.statusCode,body:chunks}));
          });
          upstream.on('timeout',()=>upstream.destroy(Error('请求超时。'))); upstream.on('error',reject);
          upstream.end(JSON.stringify(payload.request));
        });
        res.writeHead(result.status, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}); res.end(result.body);
      } catch (err) { res.writeHead(400, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}); res.end(JSON.stringify({error:err.message})); }
    });
    return;
  }
  if (pathname === '/api/sqlite-import') {
    if (req.method !== 'GET' || (req.headers.origin && req.headers.origin !== `http://127.0.0.1:${port}` && req.headers.origin !== `http://localhost:${port}`)) {
      res.writeHead(403); return res.end('Forbidden');
    }
    const script = `import sqlite3,json,sys
db=sqlite3.connect('file:D:/MediaCrawler-Fork-Test/database/sqlite_tables.db?mode=ro',uri=True,timeout=10)
db.row_factory=sqlite3.Row
db.execute('BEGIN')
notes=[dict(r) for r in db.execute('SELECT note_id,title,"desc",tag_list,note_url,liked_count,collected_count,comment_count,share_count FROM xhs_note')]
comments=[dict(r) for r in db.execute('SELECT comment_id,note_id,content,like_count FROM xhs_note_comment')]
print(json.dumps(dict(platform='小红书',contents=notes,comments=comments),ensure_ascii=False))`;
    execFile('D:\\MediaCrawler-Fork-Test\\.venv\\Scripts\\python.exe', ['-c', script], {maxBuffer: 100 * 1024 * 1024, timeout: 30000, env: {...process.env, PYTHONIOENCODING: 'utf-8'}}, (error, stdout) => {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      if (error) { res.writeHead(500); return res.end(JSON.stringify({detail:'无法读取小红书数据库，请确认爬虫数据库存在且可访问。'})); }
      res.end(stdout);
    });
    return;
  }
  const name = pathname === '/' ? 'index.html' : pathname.replace(/^[/\\]+/, '');
  const file = path.resolve(root, name);
  if (!file.startsWith(root + path.sep) && file !== path.join(root, 'index.html')) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file, (error, data) => {
    if (error) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, {'Content-Type': types[path.extname(file)] || 'application/octet-stream'});
    res.end(data);
  });
}).listen(port, '127.0.0.1', () => console.log(`Demand Radar is running at http://127.0.0.1:${port}`));
