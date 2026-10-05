export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    // لاگین
    if (url.pathname === "/api/login" && request.method === "POST") {
      const { password } = await request.json();
      if (password === env.ADMIN_PASSWORD) {
        return new Response(JSON.stringify({ success: true, token: env.ADMIN_PASSWORD }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      return new Response(JSON.stringify({ success: false, message: "رمز اشتباه" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // گرفتن لیست کاربران
    if (url.pathname === "/api/users" && request.method === "GET") {
      if (request.headers.get("Authorization") !== `Bearer ${env.ADMIN_PASSWORD}`) {
        return new Response("Unauthorized", { status: 401, headers: corsHeaders });
      }
      const { results } = await env.DB.prepare("SELECT * FROM users").all();
      return new Response(JSON.stringify(results), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ساخت کاربر جدید
    if (url.pathname === "/api/users" && request.method === "POST") {
      if (request.headers.get("Authorization") !== `Bearer ${env.ADMIN_PASSWORD}`) {
        return new Response("Unauthorized", { status: 401, headers: corsHeaders });
      }
      const { email, traffic_limit, expire_days } = await request.json();
      const uuid = crypto.randomUUID();
      const expire_date = Date.now() + (expire_days * 24 * 60 * 60 * 1000);
      
      await env.DB.prepare(
        "INSERT INTO users (id, uuid, email, traffic_limit, expire_date, created_at) VALUES (?, ?, ?, ?, ?, ?)"
      ).bind(crypto.randomUUID(), uuid, email, traffic_limit, expire_date, Date.now()).run();
      
      return new Response(JSON.stringify({ success: true, uuid }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // صفحه اصلی پنل
    return new Response(getHTML(), {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }
};

function getHTML() {
  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>پنل من</title>
<style>
body{font-family:Tahoma;padding:15px;background:#0f172a;color:#fff;margin:0}
h1{font-size:20px;text-align:center}
input,button{width:100%;padding:12px;margin:6px 0;border-radius:8px;border:1px solid #334155;box-sizing:border-box;font-size:14px}
button{background:#10b981;color:#fff;border:none;font-weight:bold}
.user{background:#1e293b;padding:10px;border-radius:8px;margin:8px 0;font-size:12px;word-break:break-all}
</style>
</head>
<body>
<h1>پنل مدیریت من</h1>
<div id="login">
  <input type="password" id="pass" placeholder="رمز عبور">
  <button onclick="login()">ورود</button>
</div>
<div id="panel" style="display:none">
  <input type="email" id="email" placeholder="ایمیل کاربر">
  <input type="number" id="traffic" placeholder="حجم به بایت">
  <input type="number" id="days" placeholder="تعداد روز">
  <button onclick="createUser()">ساخت کاربر</button>
  <h3>کاربران:</h3>
  <div id="users"></div>
</div>
<script>
let token="";
async function login(){
  const r=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:document.getElementById('pass').value})});
  const d=await r.json();
  if(d.success){token=d.token;document.getElementById('login').style.display='none';document.getElementById('panel').style.display='block';load();}
  else alert('رمز اشتباه');
}
async function createUser(){
  const r=await fetch('/api/users',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({email:document.getElementById('email').value,traffic_limit:parseInt(document.getElementById('traffic').value),expire_days:parseInt(document.getElementById('days').value)})});
  const d=await r.json();
  if(d.success){alert('ساخته شد: '+d.uuid);load();}
}
async function load(){
  const r=await fetch('/api/users',{headers:{'Authorization':'Bearer '+token}});
  const u=await r.json();
  document.getElementById('users').innerHTML=u.map(x=>'<div class="user">'+x.email+'<br>UUID: '+x.uuid+'</div>').join('');
}
</script>
</body>
</html>`;
  }
