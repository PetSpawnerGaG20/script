const express=require("express");
const bodyParser=require("body-parser");
const cors=require("cors");
const app=express();
const PORT=process.env.PORT||3000;

const codes={};

app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({extended:true}));

function rn(l=8){
    const c="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let r=c[Math.random()*c.length|0];
    while(r.length<l)r+=c[Math.random()*c.length|0];
    return r;
}

function obfuscateLuaAdvanced(src){
    const OP1=1,OP2=2,OP9=99;
    const strs=[];
    src.replace(/"([^"]*)"|'([^']*)'/g,(_,a,b)=>{strs.push(a||b)});
    if(strs.length===0)strs.push("VM");
    const K=["print",...strs];
    const BC=[OP1,1,1,OP1,2,2,OP2,1,2,OP9];
    const key=(Math.random()*200|0)+30;
    const enc=BC.map(x=>(x^key)&255);
    const a=rn(),b=rn(),c=rn(),d=rn(),e=rn(),f=rn();
    return `do local ${a}=${key} local ${b}={${K.map(v=>`"${v}"`).join(",")}} local ${c}={${enc.join(",")}} local ${d}={} local ${e}=1 local function ${f}(x)return(x~${a})&255 end while true do local o=${f}(${c}[${e}]);${e}=${e}+1 if o==${OP1} then local r=${f}(${c}[${e}]) local k=${f}(${c}[${e}+1]) ${e}=${e}+2 ${d}[r]=${b}[k] elseif o==${OP2} then local r=${f}(${c}[${e}]) local a=${f}(${c}[${e}+1]) ${e}=${e}+2 ${d}[r](${d}[a]) elseif o==${OP9} then break else local z=0 for i=1,25 do z=z+i end end end end`;
}

app.get("/",(req,res)=>{
res.send(`<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Lua Obfuscator</title><style>body{font-family:Segoe UI,Arial;background:#0f0f0f;color:#e0e0e0;margin:0;padding:20px;display:flex;justify-content:center;align-items:center;min-height:100vh}.card{background:#1c1c1c;width:100%;max-width:500px;padding:25px;border-radius:16px;border:1px solid #333}textarea,input{width:100%;padding:12px;margin-top:10px;border:1px solid #333;border-radius:8px;background:#262626;color:white}textarea{height:150px;font-family:monospace;font-size:12px}button{width:100%;padding:14px;margin-top:20px;background:#7d4cff;border:none;border-radius:8px;color:white;font-size:16px;font-weight:bold;cursor:pointer}.link-box{margin-top:20px;background:#111;padding:15px;border-radius:8px;border:1px solid #333;display:none;word-break:break-all}.link-box a{color:#b983ff}</style></head><body><div class="card"><h2>🔮 Lua Obfuscator</h2><textarea id="code" placeholder="print('Hello')"></textarea><input id="password" placeholder="Пароль"><button id="btn" onclick="gen()">🔒 Обфусцировать</button><div class="link-box" id="box"><div style="font-size:12px;color:#888">Loadstring:</div><a id="link" target="_blank"></a></div></div><script>function gen(){const c=code.value,p=password.value;if(!c||!p)return alert("Введите код и пароль");btn.disabled=true;fetch("/save",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code:c,pass:p})}).then(r=>r.json()).then(d=>{const u=location.origin+"/raw/"+d.id;const s='loadstring(game:HttpGet("'+u+'"))()';box.style.display="block";link.innerText=s;link.href=u;btn.disabled=false})}</script></body></html>`);
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
if(!it)return res.status(404).send("-- not found");
res.set("Content-Type","text/plain");
res.send(it.code);
});

app.listen(PORT,()=>console.log("Server running on http://localhost:"+PORT));