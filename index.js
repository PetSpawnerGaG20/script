const express=require("express");
const bodyParser=require("body-parser");
const cors=require("cors");
const app=express();
const PORT=process.env.PORT||3000;
const codes={};

app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({extended:true}));

function obfuscateLuaAdvanced(src){
    const k=Math.floor(Math.random()*200)+50;
    const nums=[];
    for(let i=0;i<src.length;i++){
        nums.push((src.charCodeAt(i)+k+i)%256);
    }
    const junk=new Array(80).fill(0).map(()=>Math.floor(Math.random()*255));
    const payload=[...junk,...nums,...junk].join(",");
    return `loadstring((function()local t={${payload}}local k=${k}local o={}local p=1 for i=${junk.length+1},#t-${junk.length} do o[p]=string.char((t[i]-k-p+256)%256)p=p+1 end return table.concat(o)end)())()`;
}

app.get("/",(req,res)=>{
res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"><title>Lua Obfuscator</title><style>body{background:#0f0f0f;color:#fff;font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0}.c{background:#1c1c1c;padding:20px;border-radius:12px;width:100%;max-width:500px}textarea,input,button{width:100%;margin-top:10px;padding:10px;background:#262626;border:none;color:#fff;border-radius:6px}textarea{height:150px;font-family:monospace}button{background:#7d4cff;font-weight:bold;cursor:pointer}.r{margin-top:15px;display:none;word-break:break-all}</style></head><body><div class="c"><h3>Lua Obfuscator</h3><textarea id="code" placeholder="print('Hello')"></textarea><input id="pass" placeholder="Пароль"><button onclick="g()">Обфусцировать</button><div class="r" id="r"><div style="font-size:12px;opacity:.6">Loadstring:</div><div id="l"></div></div></div><script>function g(){if(!code.value||!pass.value)return alert("Введите код и пароль");fetch("/save",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code:code.value,pass:pass.value})}).then(r=>r.json()).then(d=>{const u=location.origin+"/raw/"+d.id;l.innerText='loadstring(game:HttpGet("'+u+'"))()';r.style.display="block"})}</script></body></html>`);
});

app.post("/save",(req,res)=>{
const {code,pass}=req.body;
const out=obfuscateLuaAdvanced(code);
const id=Math.random().toString(36).slice(2,10);
codes[id]={code:out,pass};
res.json({id});
});

app.get("/raw/:id",(req,res)=>{
const it=codes[req.params.id];
if(!it)return res.status(404).send("--");
res.set("Content-Type","text/plain");
res.send(it.code);
});

app.listen(PORT,()=>console.log("http://localhost:"+PORT));