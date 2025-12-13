const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const app = express();
const PORT = process.env.PORT || 3000;
const storage = {};

app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

/* ================= FRONT ================= */
app.get("/", (req, res) => {
res.send(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width">
<title>Lua Obfuscator</title>
<style>
body{background:#0b0b0b;color:#fff;font-family:Arial;
display:flex;justify-content:center;align-items:center;height:100vh;margin:0}
.box{background:#1a1a1a;padding:20px;border-radius:14px;width:100%;max-width:560px}
textarea,input,button{
width:100%;margin-top:10px;padding:10px;background:#242424;
border:none;color:#fff;border-radius:8px}
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
<h3>Lua Obfuscator (Prometheus)</h3>

<textarea id="code" placeholder="Paste code or upload .txt"></textarea>

<input type="file" id="file" accept=".txt" style="display:none">
<button class="upload" onclick="file.click()">Upload .txt</button>

<input id="pass" placeholder="View password">
<button onclick="go()">Obfuscate</button>

<div class="out" id="out">
<small>Loadstring:</small>
<div id="res"></div>
<button class="copy" onclick="copy()">Copy</button>
<button class="copy" onclick="download()">Download .lua</button>
</div>
</div>

<script>
let currentId = null;

file.onchange=function(){
const f=file.files[0];
if(!f||!f.name.endsWith(".txt")) return alert("Only .txt");
const r=new FileReader();
r.onload=()=>code.value=r.result;
r.readAsText(f);
};

function go(){
if(!code.value||!pass.value) return alert("Missing data");

fetch("/save",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({code:code.value,pass:pass.value})
})
.then(r=>r.json())
.then(d=>{
if(!d.id){
alert("Obfuscation failed. Check server logs.");
return;
}
currentId = d.id;
res.innerText =
'loadstring(game:HttpGet("'+location.origin+'/raw/'+currentId+'"))()';
out.style.display="block";
})
.catch(()=>{
alert("Server error");
});
}

function copy(){
if(!currentId) return;
navigator.clipboard.writeText(res.innerText);
}

function download(){
if(!currentId){
alert("Nothing to download");
return;
}
window.location.href = "/download/" + currentId;
}
</script>
</body>
</html>`);
});

/* ================= PROMETHEUS ================= */
function obfuscatePrometheus(code, cb) {
    const id = Math.random().toString(36).slice(2, 10);
    const inFile = path.join(__dirname, `tmp_${id}.lua`);
    const outFile = path.join(__dirname, `out_${id}.lua`);

    fs.writeFileSync(inFile, code);

    const cmd = `lua prometheus/cli.lua --preset Medium "${inFile}" -o "${outFile}"`;

    exec(cmd, (err) => {
        if (err) return cb(err);

        const result = fs.readFileSync(outFile, "utf8");
        fs.unlinkSync(inFile);
        fs.unlinkSync(outFile);

        cb(null, result);
    });
}

/* ================= SAVE ================= */
app.post("/save", (req, res) => {
    const { code, pass } = req.body;
    if (!code || !pass) return res.status(400).json({ error: "Missing" });

    obfuscatePrometheus(code, (err, obf) => {
        if (err) return res.status(500).json({ error: "Prometheus error" });

        const id = Math.random().toString(36).slice(2, 10);
        storage[id] = { code: obf, pass };
        res.json({ id });
    });
});

/* ================= RAW ================= */
app.get("/raw/:id", (req, res) => {
    const item = storage[req.params.id];
    if (!item) return res.status(404).send("--");

    const ua = req.headers["user-agent"] || "";

    // Roblox / executors
    if (ua.toLowerCase().includes("roblox")) {
        res.set("Content-Type", "text/plain");
        return res.send(item.code);
    }

    // Browser
    res.send(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Protected</title>
<style>
body{background:#0e0e0e;color:#fff;font-family:Arial;
display:flex;justify-content:center;align-items:center;height:100vh;margin:0}
.box{background:#1c1c1c;padding:20px;border-radius:14px;width:100%;max-width:500px}
input,button,textarea{
width:100%;margin-top:10px;padding:10px;
background:#262626;border:none;color:#fff;border-radius:8px}
textarea{height:220px;font-family:monospace;display:none}
button{background:#7d4cff;font-weight:bold}
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
if(p.value !== "${item.pass}") return alert("Wrong password");
c.value = \`${item.code.replace(/`/g,"\\`")}\`;
c.style.display = "block";
cp.style.display = "block";
}
function copy(){navigator.clipboard.writeText(c.value);}
</script>
</body>
</html>`);
});

/* ================= DOWNLOAD ================= */
app.get("/download/:id", (req, res) => {
    const item = storage[req.params.id];
    if (!item) return res.status(404).end();

    res.setHeader("Content-Disposition", "attachment; filename=obfuscated.lua");
    res.setHeader("Content-Type", "text/plain");
    res.send(item.code);
});

/* ================= START ================= */
app.listen(PORT, () =>
    console.log("Running http://localhost:" + PORT)
);