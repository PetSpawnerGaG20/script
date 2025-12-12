// =============================== // FULL NYOA.SS PIXEL MONEY SITE // (Frontend + Backend in one server) // ===============================

const express = require("express"); const bodyParser = require("body-parser"); const cors = require("cors"); const app = express(); const PORT = process.env.PORT || 3000;

// =========================== //     ADMIN KEY // =========================== const ADMIN_KEY = "SlivkineepyScripts";

// =========================== //      MEMORY DATABASE // =========================== const codes = {}; const securityLogs = [];

// =========================== //      MIDDLEWARE // =========================== app.use(cors()); app.use(bodyParser.json()); app.use(express.urlencoded({ extended: true }));

// Anti-Spam const rateLimitMap = {}; app.use((req, res, next) => { const ip = req.ip; const now = Date.now(); if (rateLimitMap[ip] && now - rateLimitMap[ip] < 800) { return res.status(429).send("Too many requests"); } rateLimitMap[ip] = now; next(); });

function logSecurity(req) { securityLogs.push({ time: new Date().toISOString(), ip: req.ip, ua: req.get("User-Agent") || "Unknown", path: req.originalUrl }); if (securityLogs.length > 500) securityLogs.shift(); }

// =========================== //          FRONT PAGE // =========================== app.get('/', (req, res) => { logSecurity(req);

res.send(`

<!DOCTYPE html><html>
<head>
<title>Nyoa.Ss</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
body { margin:0; background:#0d0d0d; color:white; font-family:Arial }
.header{ text-align:center;padding:40px 0; }
.header img{ width:260px;image-rendering:pixelated; }
.navbar{ display:flex;justify-content:center;gap:20px;background:#111;padding:15px;position:sticky;top:0; }
.navbar div{ padding:10px 20px;background:#191919;border-radius:10px;cursor:pointer;transition:.15s;box-shadow:0 0 10px rgba(125,76,255,.3);} 
.navbar div:hover{ background:#222; }
.section{ display:none;padding:25px;max-width:800px;margin:auto; }
.active{ display:block; }
.card{ background:#161616;padding:20px;border-radius:15px;box-shadow:0 0 25px rgba(125,76,255,.3);} 
</style>
</head>
<body><div class="header">
<h1 style="color:#b077ff;font-size:42px">Nyoa.Ss</h1>
<img src="https://i.ibb.co/5BvRZqJ/pixelmoney.png">
</div><div class="navbar">
  <div onclick="openTab('scripts')">Scripts</div>
  <div onclick="openTab('about')">About Us</div>
  <div onclick="openTab('don')">Donations</div>
</div><!-- SCRIPTS TAB --><div id="scripts" class="section active">
<div class="card">
<h2>Scripts</h2>
<textarea id="code" placeholder="Paste script..." style="width:100%;height:150px;background:#222;color:white;border:none;border-radius:10px;padding:10px"></textarea>
<input id="password" placeholder="Password 8–15 chars" style="width:100%;margin-top:10px;padding:10px;border-radius:10px;background:#222;color:white;border:none;">
<button onclick="gen()" style="width:100%;margin-top:15px;padding:12px;background:#7d4cff;border:none;border-radius:10px;color:white;cursor:pointer;">Generate</button>
<div id="res" style="margin-top:15px;background:#111;padding:10px;border-radius:12px;display:none;word-break:break-all"></div>
</div></div><!-- ABOUT US --><div id="about" class="section">
<div class="card">
<h2>About Us</h2>
<p>Nyoa.Ss — Roblox scripts, tools, and utilities. Providing pixel-style UI and secure cloud storage.</p>
</div></div><!-- DONATIONS --><div id="don" class="section">
<div class="card">
<h2>Donations</h2>
<p>You can place your donation info here.</p>
</div></div><script>
function openTab(id){document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));document.getElementById(id).classList.add('active');}
function gen(){
const c = code.value;
const p = password.value;
if(p.length < 8 || p.length > 15){ alert('Password must be 8-15 characters'); return; }
fetch('/save',{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ code:c, pass:p }) })
.then(r=>r.json()).then(d=>{
res.style.display='block';
res.innerText = `loadstring(game:HttpGet("${location.origin}/raw/${d.id}"))()`;
}); }
</script></body></html>`);
});// SAVE app.post('/save', (req,res)=>{ logSecurity(req); const { code, pass } = req.body; if(pass.length < 8 || pass.length > 15) return res.json({ error:"Password length must be 8-15" }); const id = Math.random().toString(36).substring(2,10); codes[id] = { code, pass }; res.json({ id }); });

// RAW app.get('/raw/:id', (req,res)=>{ logSecurity(req); const item = codes[req.params.id]; if(!item) return res.status(404).send("Not found"); const ua = req.get("User-Agent") || ""; if(!ua.includes("Roblox")) return res.send(<form method='GET' action='/raw/${req.params.id}/check'><input name='pass' type='password'><button>Open</button></form>); res.set("Content-Type","text/plain"); res.send(item.code); });

// CHECK app.get('/raw/:id/check', (req,res)=>{ logSecurity(req); const item = codes[req.params.id]; if(!item) return res.send("Not found"); if(req.query.pass !== item.pass) return res.send("Wrong password"); res.set("Content-Type","text/plain"); res.send(item.code); });

// ADMIN app.get('/admin', (req,res)=>{ logSecurity(req); if(req.query.key !== ADMIN_KEY) return res.status(403).send("Wrong key"); let html = ""; securityLogs.forEach(l=>{ html += <div><b>Time:</b> ${l.time}<br><b>IP:</b> ${l.ip}<hr></div>; }); res.send(html); });

app.listen(PORT, ()=> console.log("Server running on", PORT));
