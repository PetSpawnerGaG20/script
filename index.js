const express = require("express");
const app = express();

// Главная страница — фронтенд встроен прямо в backend
app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>NYOA { SHOP }</title>
  <style>
    body {
      margin: 0;
      background: #0e0e0e;
      font-family: Arial, sans-serif;
      color: #fff;
      overflow-x: hidden;
    }

    header {
      padding: 25px;
      text-align: center;
      font-size: 34px;
      font-weight: bold;
      letter-spacing: 1px;
    }

    /* падающие пиксельные деньги */
    .money-bg {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: -1;
      overflow: hidden;
    }

    .bill {
      position: absolute;
      font-size: 20px;
      animation: fall linear infinite;
      filter: drop-shadow(0 0 4px #00ff80);
    }

    @keyframes fall {
      0% { transform: translateY(-10%); opacity: 1; }
      100% { transform: translateY(110%); opacity: 0; }
    }

    /* контент */
    .shop-box {
      width: 80%;
      margin: 40px auto;
      padding: 20px;
      background: #1a1a1a;
      border-radius: 12px;
      border: 2px solid #00ff80;
      box-shadow: 0 0 15px #00ff8055;
    }

    .item {
      padding: 12px 0;
      border-bottom: 1px solid #333;
      font-size: 20px;
    }
  </style>
</head>

<body>

<header>💰 NYOA { SHOP } 💰</header>

<div class="money-bg" id="money-bg"></div>

<div class="shop-box">
  <div class="item">💎 Premium Script – 500₽</div>
  <div class="item">⚙️ Auto-Farm Script – 350₽</div>
  <div class="item">🛡️ ESP Full Pack – 250₽</div>
  <div class="item">🎁 Lifetime Bundle – 1200₽</div>
</div>

<script>
  function spawnBills() {
    const container = document.getElementById("money-bg");

    for (let i = 0; i < 12; i++) {
      const bill = document.createElement("div");
      bill.classList.add("bill");
      bill.textContent = "🟩"; // пиксельная купюра
      bill.style.left = Math.random() * 100 + "%";
      bill.style.animationDuration = (3 + Math.random() * 5) + "s";
      container.appendChild(bill);

      setTimeout(() => bill.remove(), 9500);
    }
  }

  spawnBills();
  setInterval(spawnBills, 1100);
</script>

</body>
</html>
  `);
});

// Порт Render автоматически задаёт process.env.PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on", PORT));
