/* swipe.js — 갤러리 사진을 눌렀을 때 좌우 스와이프로 넘겨보는 기능
   index.html의 기존 내용은 건드리지 않고, 이 파일을 </body> 바로 위에서 불러오기만 하면 됩니다.
   <script src="swipe.js"></script>
   기존 갤러리(#grid 안의 사진 버튼)를 그대로 읽어서 사용합니다. */
(function () {
  var css = '.sw-lb{position:fixed;inset:0;background:rgba(15,22,32,.95);display:none;z-index:99;align-items:center;justify-content:center}'
    + '.sw-lb.open{display:flex}'
    + '.sw-stage{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:56px 12px;touch-action:pan-y;user-select:none;-webkit-user-select:none}'
    + '.sw-stage img{width:auto;max-width:100%;max-height:100%;object-fit:contain;pointer-events:none}'
    + '.sw-x,.sw-nav{position:absolute;background:none;border:0;color:#fff;cursor:pointer;z-index:2;line-height:1;font-family:inherit}'
    + '.sw-x{top:max(10px,env(safe-area-inset-top));right:14px;font-size:2.2rem;padding:6px 10px}'
    + '.sw-nav{top:50%;transform:translateY(-50%);font-size:2.6rem;padding:14px 12px;opacity:.7}'
    + '.sw-prev{left:2px}.sw-next{right:2px}'
    + '.sw-count{position:absolute;top:max(18px,env(safe-area-inset-top));left:0;right:0;text-align:center;color:#B9C6D0;font-size:.9rem;letter-spacing:.2em;pointer-events:none}'
    + '.sw-hint{position:absolute;bottom:calc(22px + env(safe-area-inset-bottom));left:0;right:0;text-align:center;color:#B9C6D0;font-size:.8rem;pointer-events:none;transition:opacity .6s}'
    + '.sw-hint.gone{opacity:0}'
    + '@media (hover:none){.sw-nav{display:none}}'
    + '@media (prefers-reduced-motion:reduce){.sw-hint{transition:none}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var lb = document.createElement('div');
  lb.className = 'sw-lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', '사진 크게 보기');
  lb.innerHTML = '<div class="sw-count"></div>'
    + '<button class="sw-x" type="button" aria-label="닫기">×</button>'
    + '<div class="sw-stage"><img alt="" draggable="false"></div>'
    + '<button class="sw-nav sw-prev" type="button" aria-label="이전 사진">‹</button>'
    + '<button class="sw-nav sw-next" type="button" aria-label="다음 사진">›</button>'
    + '<p class="sw-hint">좌우로 밀어서 넘겨보세요</p>';
  document.body.appendChild(lb);

  var stage = lb.querySelector('.sw-stage'), img = stage.querySelector('img');
  var count = lb.querySelector('.sw-count'), hint = lb.querySelector('.sw-hint');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var list = [], idx = 0, sx = null, dx = 0, moved = false, hintTimer;

  function gallery() { return document.getElementById('grid') || document.querySelector('.grid, .gallery'); }
  function collect() {
    var g = gallery(); if (!g) return [];
    return Array.prototype.map.call(g.querySelectorAll('img'), function (i) { return { src: i.currentSrc || i.src, alt: i.alt || '', el: i }; });
  }
  function show(i, dir) {
    var n = list.length; idx = (i + n) % n;
    img.src = list[idx].src; img.alt = list[idx].alt;
    count.textContent = (idx + 1) + ' / ' + n;
    if (dir && !reduce && img.animate) img.animate([{ transform: 'translateX(' + dir * 48 + 'px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 240, easing: 'ease-out' });
    [idx - 1, idx + 1].forEach(function (k) { new Image().src = list[(k + n) % n].src; });
  }
  function open(i) {
    show(i); lb.classList.add('open'); document.body.style.overflow = 'hidden';
    hint.classList.remove('gone'); clearTimeout(hintTimer);
    hintTimer = setTimeout(function () { hint.classList.add('gone'); }, 2600);
  }
  function close() { lb.classList.remove('open'); document.body.style.overflow = ''; }

  // 기존 갤러리 클릭을 가로채서 스와이프 뷰어로 열기 (기존 코드는 그대로 둠)
  document.addEventListener('click', function (e) {
    var g = gallery(); if (!g || !g.contains(e.target)) return;
    var host = e.target.closest ? e.target.closest('button,.ph') : null;
    var im = e.target.tagName === 'IMG' ? e.target : (host && host.querySelector('img'));
    if (!im) return;
    list = collect();
    var i = list.findIndex(function (o) { return o.el === im; });
    if (i < 0) return;
    e.stopImmediatePropagation(); e.preventDefault();
    open(i);
  }, true);

  lb.querySelector('.sw-x').onclick = close;
  lb.querySelector('.sw-prev').onclick = function () { show(idx - 1, -1); };
  lb.querySelector('.sw-next').onclick = function () { show(idx + 1, 1); };
  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(idx - 1, -1);
    if (e.key === 'ArrowRight') show(idx + 1, 1);
  });

  stage.addEventListener('pointerdown', function (e) {
    sx = e.clientX; dx = 0; moved = false; img.style.transition = 'none';
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener('pointermove', function (e) {
    if (sx === null) return;
    dx = e.clientX - sx; if (Math.abs(dx) > 6) moved = true;
    img.style.transform = 'translateX(' + dx + 'px)';
  });
  stage.addEventListener('pointerup', function () {
    if (sx === null) return;
    var go = Math.abs(dx) > 60;
    img.style.transition = 'transform .18s ease'; img.style.transform = '';
    if (go) { hint.classList.add('gone'); show(idx + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1); }
    else if (!moved) close(); // 그냥 탭하면 닫기
    sx = null;
  });
  stage.addEventListener('pointercancel', function () { img.style.transform = ''; sx = null; });
})();
