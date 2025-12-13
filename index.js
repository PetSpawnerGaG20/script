const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
const storage = {};

app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

/* ================= OBFUSCATION ================= */

function obfuscate(src) {
    const k1 = Math.floor(Math.random() * 120) + 60;
    const k2 = Math.floor(Math.random() * 120) + 60;

    const layer = (s, k) =>
        [...s].map((c, i) => (c.charCodeAt(0) + k + i) % 256);

    const l1 = layer(src, k1);
    const l2 = layer(String.fromCharCode(...l1), k2);

    const junk = Array.from({ length: 120 }, () =>
        Math.floor(Math.random() * 255)
    );

    const payload = [...junk, ...l2, ...junk].join(",");

    return `
-- Anti Dump
if getgc or hookfunction or getrenv then return end

local t={${payload}}
local o={}
local p=1
local k1=${k1}
local k2=${k2}

for i=${junk.length+1},#t-${junk.length} do
    local v=(t[i]-k2-p)%256
    v=(v-k1-p)%256
    o[p]=string.char(v)
    p=p+1
end

local f=loadstring(table.concat(o))
if f then f() end
`;
}

/* ================= FRONT ================= */

app.get("/", (req, res) => {
res.send(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width">
<title>Lua Obfuscator</title>
<style>
body{
background:#0b0b0b;color:#fff;font-family:Arial;
display:flex;justify-content:center;align-items:center;
height:100vh;margin:0
}
.box{
background:#1a1a1a;padding:20px;border-radius:14px;
width:100%;max-width:540px
}
textarea,input,button{
width:100%;margin-top:10px;padding:10px;
background:#242424;border:none;color:#fff;border-radius:8px
}
textarea{height:170px;font-family:monospace}
button{background:#7d4cff;font-weight:bold;cursor:pointer}
.upload{background:#2f2f2f}
.out{display:none;margin-top:15px;word-break:break-all}
.copy{background:#2f2f2f;margin-top:8px}
small{opacity:.6}
</style>
</head>
<body>
<div class="box">
<h3>Lua Obfuscator</h3>

<textarea id="code" placeholder="Paste code or upload .txt file"></textarea>

<input type="file" id="file" accept=".txt" style="display:none">
<button class="upload" onclick="file.click()">Upload .txt file</button>

<input id="pass" placeholder="View password">
<button onclick="go()">Obfuscate</button>

<div class="out" id="out">
<small>Loadstring:</small>
<div id="res"></div>
<button class="copy" onclick="copy()">Copy</button>
</div>
</div>

<script>
file.onchange=function(){
const f=file.files[0];
if(!f) return;
if(!f.name.endsWith(".txt")){
alert("Only .txt files allowed");
file.value="";
return;
}
const r=new FileReader();
r.onload=()=>{code.value=r.result};
r.readAsText(f);
};

function go(){
if(!code.value||!pass.value)return alert("Enter code and password");
fetch("/save",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({code:code.value,pass:pass.value})
})
.then(r=>r.json())
.then(d=>{
res.innerText='loadstring(game:HttpGet("'+location.origin+'/raw/'+d.id+'"))()';
out.style.display="block";
});
}

function copy(){
navigator.clipboard.writeText(res.innerText);
}
</script>
</body>
</html>`);
});

/* ================= API ================= */

app.post("/save",(req,res)=>{
    const {code,pass}=req.body;
    if(!code||!pass) return res.status(400).json({error:"Missing"});
    const id=Math.random().toString(36).slice(2,10);
    storage[id]={code:obfuscate(code),pass};
    res.json({id});
});

/* ================= RAW ================= */

app.get("/raw/:id",(req,res)=>{
    const item=storage[req.params.id];
    if(!item) return res.status(404).send("--");

    const accept=req.headers.accept||"";

    // ROBLOX
    if(!accept.includes("text/html")){
        res.set("Content-Type","text/plain");
        return res.send(item.code);
    }

    // BROWSER (PASSWORD)
    res.send(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Protected</title>
<style>
body{
background:#0e0e0e;color:#fff;font-family:Arial;
display:flex;justify-content:center;align-items:center;
height:100vh;margin:0
}
.box{
background:#1c1c1c;padding:20px;border-radius:14px;
width:100%;max-width:500px
}
input,button,textarea{
width:100%;margin-top:10px;padding:10px;
background:#262626;border:none;color:#fff;border-radius:8px
}
textarea{height:200px;font-family:monospace;display:none}
button{background:#7d4cff;font-weight:bold;cursor:pointer}
</style>
</head>
<body>
<div class="box">
<h3>Enter password</h3>
<input id="p" placeholder="Password">
<button onclick="unlock()">Unlock</button>
<textarea id="c"></textarea>
<button id="cp" style="display:none" onclick="copy()">Copy</button>
</div>

<script>
function unlock(){
if(p.value!=="${item.pass}") return alert("Wrong password");
c.value=\`${item.code.replace(/`/g,"\\`")}\`;
c.style.display="block";
cp.style.display="block";
}
function copy(){
navigator.clipboard.writeText(c.value);
}
</script>
</body>
</html>`);
});

/* ================= START ================= */

app.listen(PORT,()=>console.log("Running http://localhost:"+PORT));