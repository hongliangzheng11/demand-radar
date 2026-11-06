const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const root = path.join(__dirname, 'dist');
const port = 4174;
const types = {'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8'};

http.createServer((req, res) => {
  const pathname = decodeURIComponent((req.url || '/').split('?')[0]);
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
