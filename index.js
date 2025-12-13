const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
const storage = {};

app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

/* ============== OBFUSCATION CORE ============== */

function layer(src, key) {
    const out = [];
    for (let i = 0; i < src.length; i++) {
        out.push((src.charCodeAt(i) + key + i) % 256);
    }
    return out;
}

function obfuscate(src) {
    const key1 = Math.floor(Math.random() * 150) + 50;
    const key2 = Math.floor(Math.random() * 150) + 50;

    const l1 = layer(src, key1);
    const l2 = layer(l1.map(c => String.fromCharCode(c)).join(""), key2);

    const junk = Array.from({ length: 100 }, () =>
        Math.floor(Math.random() * 255)
    );

    const payload = [...junk, ...l2, ...junk].join(",");

    return `
-- Anti Dump
if not game or not game.HttpGet then return end
if hookfunction or getgc or getrenv then return end

local t={${payload}}
local k1=${key1}
local k2=${key2}
local o={}
local p=1

for i=${junk.length+1},#t-${junk.length} do
    local v=(t[i]-k2-p)%256
    v=(v-k1-p)%256
    o[p]=string.char(v)
    p=p+1
end

local s=table.concat(o)
local f=loadstring(s)
if f then f() end
`;
}

/* ============== FRONTEND ============== */

app.get("/", (req, res) => {
res.send(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width">
<title>Lua Obfuscator</title>
<style>
body{
background:#0b0b0b;
color:#fff;
font-family:Arial;
display:flex;
justify-content:center;
align-items:center;
height:100vh;
margin:0
}
.box{
background:#1a1a1a;
padding:20px;
border-radius:14px;
width:100%;
max-width:540px
}
textarea,input,button{
width:100%;
margin-top:10px;
padding:10px;
background:#242424;
border:none;
color:#fff;
border-radius:8px
}
textarea{
height:170px;
font-family:monospace
}
button{
background:#7d4cff;
font-weight:bold;
cursor:pointer
}
.out{
display:none;
margin-top:15px;
word-break:break-all
}
.copy{
margin-top:8px;
background:#2f2f2f
}
small{opacity:.6}
</style>
</head>
<body>
<div class="box">
<h3>Lua Obfuscator</h3>
<textarea id="code" placeholder="print('Hello Roblox')"></textarea>
<input id="pass" placeholder="Site password">
<button onclick="go()">Obfuscate</button>

<div class="out" id="outBox">
<small>Loadstring:</small>
<div id="result"></div>
<button class="copy" onclick="copy()">Copy</button>
</div>
</div>

<script>
function go(){
if(!code.value||!pass.value){
alert("Enter code and password");
return;
}
fetch("/save",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({
code:code.value,
pass:pass.value
})
})
.then(r=>r.json())
.then(d=>{
const url=location.origin+"/raw/"+d.id+"?pass="+encodeURIComponent(pass.value);
result.innerText='loadstring(game:HttpGet("'+url+'"))()';
outBox.style.display="block";
});
}

function copy(){
navigator.clipboard.writeText(result.innerText);
}
</script>
</body>
</html>`);
});

/* ============== API ============== */

app.post("/save", (req, res) => {
    const { code, pass } = req.body;
    if (!code || !pass)
        return res.status(400).json({ error: "Missing data" });

    const obf = obfuscate(code);
    const id = Math.random().toString(36).slice(2, 10);

    storage[id] = { code: obf, pass };
    res.json({ id });
});

app.get("/raw/:id", (req, res) => {
    const item = storage[req.params.id];
    if (!item) return res.status(404).send("--");

    if (req.query.pass !== item.pass)
        return res.status(403).send("--");

    res.set("Content-Type", "text/plain");
    res.send(item.code);
});

/* ============== START ============== */

app.listen(PORT, () => {
    console.log("Running on http://localhost:" + PORT);
});