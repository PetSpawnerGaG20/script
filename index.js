const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

const codes = {}; // В памяти храним коды и пароль

app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// === ЛОГИКА ОБФУСКАЦИИ (JS версия) ===
function obfuscateLua(sourceCode) {
    // 1. Генерируем случайный ключ
    let key = Math.floor(Math.random() * 999999) + 1;
    const startKey = key;
    
    // 2. Шифруем строку в escape-последовательности Lua (\ddd)
    let encrypted = "";
    for (let i = 0; i < sourceCode.length; i++) {
        const charCode = sourceCode.charCodeAt(i);
        // Простой XOR с изменением ключа (LCG)
        const xorByte = charCode ^ (key % 255);
        
        // Форматируем в \ddd (например \065)
        encrypted += "\\" + xorByte.toString().padStart(3, '0');

        // Обновляем ключ (тот же алгоритм, что будет в Lua)
        key = (key * 1664525 + 1013904223) % 4294967296;
    }

    // 3. Создаем Lua лоадер, который расшифрует это на лету
    // Используем странные имена переменных (_k, _s, _d) чтобы запутать чтение
    return `
-- [[ Protected by Nyoass Locker ]] --
local _k = ${startKey}
local _s = "${encrypted}"

local function _b(a,b) 
    return bit32 and bit32.bxor(a,b) or (function(x,y) 
        local p,c=1,0 while x>0 and y>0 do 
        local rx,ry=x%2,y%2 if rx~=ry then c=c+p end 
        x,y,p=(x-rx)/2,(y-ry)/2,p*2 end 
        if x<y then x=y end while x>0 do 
        local rx=x%2 if rx>0 then c=c+p end 
        x,p=(x-rx)/2,p*2 end return c 
    end)(a,b)
end

local function _d(s, k)
    local r = {}
    for i = 1, #s do
        local b = string.byte(s, i)
        table.insert(r, string.char(_b(b, k % 255)))
        k = (k * 1664525 + 1013904223) % 4294967296
    end
    return table.concat(r)
end

local _c = _d(_s, _k)
local _run = loadstring or load
getfenv().script = nil -- Прячем скрипт из окружения (опционально)
_run(_c)()
`;
}

// --- Главная страница (frontend)
app.get("/", (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Nyoass Lua Obfuscator</title>
<style>
body { font-family: 'Segoe UI', Arial, sans-serif; background:#0f0f0f; color:#e0e0e0; margin:0; padding:20px; display:flex; justify-content:center; align-items:center; min-height:100vh; }
.card { background:#1c1c1c; width:100%; max-width:500px; padding:25px; border-radius:16px; box-shadow:0 0 25px rgba(125,76,255,0.15); border: 1px solid #333; }
h2 { text-align:center; color:#fff; margin-bottom:20px; font-weight:600; }
textarea,input { width:100%; box-sizing:border-box; padding:12px; margin-top:10px; border:1px solid #333; border-radius:8px; background:#262626; color:white; outline:none; transition:.2s; }
textarea:focus, input:focus { border-color:#7d4cff; background:#2f2f2f; }
textarea { height:150px; resize:vertical; font-family:monospace; font-size:12px; }
button { width:100%; padding:14px; margin-top:20px; background:linear-gradient(135deg,#7d4cff,#9b59b6); border:none; border-radius:8px; color:white; font-size:16px; font-weight:bold; cursor:pointer; box-shadow:0 4px 15px rgba(125,76,255,0.4); transition:transform 0.1s, opacity 0.2s; }
button:active { transform:scale(0.98); opacity:0.9; }
.link-box { margin-top:20px; background:#111; padding:15px; border-radius:8px; border:1px solid #333; word-break:break-all; display:none; animation:fadeIn 0.5s; }
.link-box a { color:#b983ff; text-decoration:none; }
.link-box a:hover { text-decoration:underline; }
@keyframes fadeIn { from{opacity:0;transform:translateY(5px);} to{opacity:1;transform:translateY(0);} }
</style>
</head>
<body>
  <div class="card">
    <h2>🔮 Lua Obfuscator & Locker</h2>
    <p style="font-size:12px; color:#888; text-align:center;">Ваш код будет зашифрован и спрятан за паролем</p>
    <textarea id="code" placeholder="print('Hello World') -- Вставьте код"></textarea>
    <input id="password" type="text" placeholder="Придумайте пароль доступа">
    <button onclick="generate()" id="btn">🔒 Обфусцировать и создать ссылку</button>
    <div class="link-box" id="resultBox">
      <div style="font-size:12px; color:#888; margin-bottom:5px;">Ваша ссылка (loadstring):</div>
      <a id="resultLink" target="_blank" href="#">Generating...</a>
    </div>
  </div>

<script>
function generate(){
  const code = document.getElementById("code").value;
  const pass = document.getElementById("password").value;
  const btn = document.getElementById("btn");
  
  if(!code || !pass){ alert("Введите код и пароль!"); return; }
  
  btn.innerText = "⏳ Шифруем...";
  btn.disabled = true;

  fetch("/save", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({code, pass})
  })
  .then(r=>r.json())
  .then(data=>{
    const url = location.origin + "/raw/" + data.id;
    const loadStr = 'loadstring(game:HttpGet("' + url + '"))()';
    
    document.getElementById("resultBox").style.display = "block";
    const linkEl = document.getElementById("resultLink");
    linkEl.innerText = loadStr;
    linkEl.href = url;
    
    btn.innerText = "✅ Готово!";
    setTimeout(() => { btn.disabled = false; btn.innerText = "🔒 Обфусцировать и создать ссылку"; }, 2000);
  });
}
</script>
</body>
</html>`);
});

// --- API: Шифруем и сохраняем
app.post("/save", (req, res) => {
    const { code, pass } = req.body;
    
    // !!! ВОТ ЗДЕСЬ ПРОИСХОДИТ МАГИЯ !!!
    // Мы не сохраняем чистый код, мы сохраняем его обфусцированную версию
    const protectedCode = obfuscateLua(code);

    const id = Math.random().toString(36).substring(2,10);
    codes[id] = { code: protectedCode, pass }; // Сохраняем зашифрованную версию
    
    console.log(`[LOG] New code saved via ID: ${id}`);
    res.json({ id });
});

// --- Страница RAW
app.get("/raw/:id", (req, res) => {
    const { id } = req.params;
    const item = codes[id];
    if(!item) return res.status(404).send("-- Code not found");

    const ua = req.get("User-Agent") || "";
    
    // Если это Roblox, отдаем код сразу
    if(ua.includes("Roblox")) {
        res.set("Content-Type","text/plain");
        return res.send(item.code);
    }

    // Если браузер - просим пароль
    res.send(`<!DOCTYPE html>
<html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Protected</title>
<style>body{background:#111;color:#fff;font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;}input,button{padding:10px;border-radius:5px;border:none;}button{background:#7d4cff;color:white;cursor:pointer;}</style>
</head>
<body>
<form method="POST" action="/raw/${id}/view">
    <h3>🔒 Скрипт защищен</h3>
    <input type="password" name="pass" placeholder="Введите пароль">
    <button type="submit">Открыть код</button>
</form>
</body></html>`);
});

// --- Проверка пароля в браузере (чтобы глазками посмотреть на обфусцированный код)
app.post("/raw/:id/view", (req,res) => {
    const { id } = req.params;
    const { pass } = req.body;
    const item = codes[id];

    if(!item) return res.send("Not found");
    if(pass !== item.pass) return res.send("❌ Неверный пароль");

    res.set("Content-Type","text/plain");
    res.send(item.code); // Отдаем обфусцированный код
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

