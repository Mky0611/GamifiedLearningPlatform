const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, 'FrontEnd');
const PORT = Number(process.env.PORT || 4173);
const MIME = {
  '.html':'text/html; charset=utf-8',
  '.css':'text/css; charset=utf-8',
  '.js':'application/javascript; charset=utf-8',
  '.png':'image/png',
  '.jpg':'image/jpeg',
  '.jpeg':'image/jpeg',
  '.gif':'image/gif',
  '.webp':'image/webp',
  '.svg':'image/svg+xml',
  '.ico':'image/x-icon'
};
function send(res,status,body,type='text/plain; charset=utf-8'){res.writeHead(status,{ 'Content-Type': type });res.end(body)}
function resolvePath(urlPath){
  const clean = decodeURIComponent((urlPath || '/').split('?')[0]);
  if(clean === '/' || clean === '/app' || clean === '/app/' || clean === '/app/home') return path.join(ROOT,'src/pages/home.html');
  if(clean === '/app/auth') return path.join(ROOT,'src/pages/auth.html');
  if(clean === '/app/minigame') return path.join(ROOT,'src/pages/minigame.html');
  if(clean === '/app/quiz') return path.join(ROOT,'src/pages/quiz.html');
  if(clean === '/app/memory') return path.join(ROOT,'src/pages/memory.html');
  if(clean === '/app/speed-math') return path.join(ROOT,'src/pages/speed-math.html');
  if(clean === '/app/code-puzzle') return path.join(ROOT,'src/pages/code-puzzle.html');
  if(clean === '/app/volcard') return path.join(ROOT,'src/pages/volcard.html');
  if(clean.startsWith('/ui/')) return path.join(ROOT, clean.slice(4));
  if(clean.startsWith('/assets/')) return path.join(ROOT, clean.slice(1));
  if(clean.startsWith('/src/')) return path.join(ROOT, clean.slice(1));
  return null;
}
http.createServer((req,res)=>{
  const filePath = resolvePath(req.url);
  if(!filePath) return send(res,404,'Not found');
  if(!filePath.startsWith(ROOT)) return send(res,403,'Forbidden');
  fs.readFile(filePath,(err,data)=>{
    if(err) return send(res,404,`Missing file: ${filePath}`);
    send(res,200,data,MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream');
  });
}).listen(PORT,()=>console.log(`Preview server running at http://127.0.0.1:${PORT}`));
