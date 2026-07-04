<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="เว็บตัวอย่างภาษาไทย">
    <title>เว็บไซต์อย่างเป็นทางการ</title>
    <style>
        :root{--bg:#f7f8fb;--card:#ffffff;--muted:#6b7280;--accent:#0f62fe}
        html,body{height:100%;margin:0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,'Noto Sans Thai',Arial,sans-serif;background:var(--bg);color:#111}
        .page{min-height:100%;display:flex;align-items:center;justify-content:center;padding:2rem}
        .card{background:var(--card);border-radius:12px;box-shadow:0 6px 24px rgba(16,24,40,0.08);padding:40px 48px;text-align:center;max-width:720px;width:100%}
        h1{margin:0 0 12px;font-size:1.6rem}
        p.lead{color:var(--muted);margin:0 0 24px}
        .cta{display:inline-block;padding:14px 22px;font-size:1.05rem;border-radius:10px;background:var(--accent);color:#fff;border:0;cursor:pointer;box-shadow:0 6px 18px rgba(15,98,254,0.18)}
        /* floating heart */
        .floating{position:fixed;pointer-events:none;display:flex;align-items:center;gap:8px;transform-origin:center center}
        .floating .heart{font-size:36px;line-height:1}
        .floating .text{font-size:16px;background:rgba(0,0,0,0.75);color:#fff;padding:6px 10px;border-radius:8px}
        @keyframes popUp {
            0%{transform:translateY(0) scale(0.4);opacity:0}
            40%{transform:translateY(-8px) scale(1.2);opacity:1}
            100%{transform:translateY(-48px) scale(1);opacity:0}
        }
        .animate{animation:popUp 3s cubic-bezier(.22,.9,.33,1) forwards}
    </style>
</head>
<body>
    <main class="page">
        <section class="card" role="main">
            <h1>เว็บไซต์อย่างเป็นทางการ</h1>
            <p class="lead">ยินดีต้อนรับสู่เว็บไซต์ของเรา กรุณาลองใช้ปุ่มด้านล่าง</p>
            <button id="cta" class="cta" aria-label="เฮ้คุณลองกดดู">เฮ้คุณลองกดดู</button>
        </section>
    </main>

    <script>
        (function(){
            const btn = document.getElementById('cta');
            btn.addEventListener('click', function(e){
                const rect = btn.getBoundingClientRect();
                const centerX = rect.left + rect.width/2;
                const centerY = rect.top + rect.height/2;

                const el = document.createElement('div');
                el.className = 'floating animate';
                el.style.left = (centerX - 60) + 'px';
                el.style.top = (centerY - 40) + 'px';
                el.innerHTML = '<div class="heart">❤️</div><div class="text">ขอบคุณที่กด!</div>';
                document.body.appendChild(el);

                setTimeout(()=>{
                    el.remove();
                }, 3000);
            });
        })();
    </script>
</body>
</html>
