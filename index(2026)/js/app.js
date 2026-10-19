/* ================================================================
   个人网址导航 - 主逻辑
================================================================ */

const ENGINE_URLS = {
  baidu:  'https://www.baidu.com/s?wd=',
  bing:   'https://www.bing.com/search?q=',
  so:     'https://www.so.com/s?q=',
  sogou:  'https://www.sogou.com/web?query=',
  google: 'https://www.google.com/search?q=',
  github: 'https://github.com/search?q=',
};

let currentEngine = 'baidu';
let bookmarksLoaded = false;
let bookmarksPromise = null;
let currentCat = 'all';

const panel = document.getElementById('bookmarks');
const searchInput = document.getElementById('search');
const engineInput = document.getElementById('engine-input');
const catWrapEl = document.getElementById('catWrap');

/* ================================================================
   搜索功能
================================================================ */

function doSearch() {
  const q = engineInput.value.trim();
  if (q) window.open(ENGINE_URLS[currentEngine] + encodeURIComponent(q), '_blank');
}

document.querySelectorAll('.engine-tabs button').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelector('.engine-tabs .active').classList.remove('active');
    this.classList.add('active');
    currentEngine = this.dataset.engine;
  });
});

engineInput.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });

/* ================================================================
   书签加载与渲染
================================================================ */

function loadBookmarks() {
  if (bookmarksLoaded) return Promise.resolve();
  if (bookmarksPromise) return bookmarksPromise;
  panel.innerHTML = '<div style="padding:12px;color:var(--muted);">加载中...</div>';
  bookmarksPromise = new Promise(resolve => {
    const s = document.createElement('script');
    s.src = 'js/bookmarks.js';
    s.onload = () => { bookmarksLoaded = true; initCategoryBar(); resolve(); };
    s.onerror = () => { panel.innerHTML = '<div style="padding:12px;color:#dc3545;">加载失败</div>'; };
    document.head.appendChild(s);
  });
  return bookmarksPromise;
}

function renderIcon(icon) {
  if (!icon) return '🔗';
  if (icon.startsWith('data:image') || icon.startsWith('http'))
    return `<img src="${icon}" style="width:16px;height:16px;object-fit:contain;" alt="" loading="lazy">`;
  return icon;
}

function renderBookmarks() {
  const items = currentCat === 'all'
    ? bookmarks.flatMap(b => b.items)
    : bookmarks.find(b => b.cat === currentCat)?.items || [];
  panel.innerHTML = items.map(([name, url, icon]) =>
    `<a class="card" href="${url}" target="_blank" rel="noopener" data-name="${name}" data-url="${url}">
      <span class="icon">${renderIcon(icon)}</span>
      <span class="name">${name}</span>
    </a>`
  ).join('');
}

function initCategoryBar() {
  const bar = document.getElementById('categoryBar');
  if (!bar || typeof bookmarks === 'undefined') return;
  bar.innerHTML = '<div class="cat-tab active" data-cat="all">全部</div>' +
    bookmarks.map(b => `<div class="cat-tab" data-cat="${b.cat}">${b.icon} ${b.cat}</div>`).join('');
  bar.addEventListener('click', e => {
    const tab = e.target.closest('.cat-tab');
    if (tab) filterByCat(tab.dataset.cat);
  });
  bar.addEventListener('keydown', e => {
    const tabs = [...bar.querySelectorAll('.cat-tab')];
    const idx = tabs.indexOf(document.activeElement);
    if (idx === -1) return;
    if (e.key === 'ArrowRight') tabs[(idx + 1) % tabs.length].focus();
    else if (e.key === 'ArrowLeft') tabs[(idx - 1 + tabs.length) % tabs.length].focus();
    else if (e.key === 'Enter') tabs[idx].click();
    else if (e.key === 'Escape') closePanel();
  });
  initCategoryDragScroll();
}

/* ================================================================
   面板控制
================================================================ */

function filterByCat(cat) {
  loadBookmarks().then(() => {
    if (currentCat === cat && panel.classList.contains('show')) { closePanel(); return; }
    currentCat = cat;
    document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.cat-tab[data-cat="${cat}"]`)?.classList.add('active');
    panel.classList.add('show');
    renderBookmarks();
  });
}

function closePanel() { panel.classList.remove('show'); }

function toggleBookmarks() {
  document.getElementById('quickLinks').classList.toggle('hidden');
  document.querySelector('.divider').classList.toggle('collapsed');
  if (panel.classList.contains('show')) closePanel();
}

/* ================================================================
   搜索过滤
================================================================ */

searchInput.addEventListener('input', function() {
  const q = this.value.toLowerCase().trim();
  if (!q) { document.querySelectorAll('.card').forEach(c => c.style.display = ''); return; }
  loadBookmarks().then(() => {
    currentCat = 'all';
    panel.classList.add('show');
    renderBookmarks();
    document.querySelectorAll('.card').forEach(card => {
      const n = (card.dataset.name || '').toLowerCase();
      const u = (card.dataset.url || '').toLowerCase();
      card.style.display = (n.includes(q) || u.includes(q)) ? '' : 'none';
    });
  });
});

searchInput.addEventListener('keydown', e => {
  if (e.key === 'Escape') { searchInput.value = ''; searchInput.dispatchEvent(new Event('input')); searchInput.blur(); }
});

/* ================================================================
   全局事件
================================================================ */

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (panel.classList.contains('show')) closePanel();
    if (weatherPopup.classList.contains('show')) hideWeatherPopup();
  }
});

document.addEventListener('click', e => {
  if (panel.classList.contains('show') && !panel.contains(e.target) && !catWrapEl.contains(e.target)) closePanel();
  if (weatherPopup.classList.contains('show') && !weatherPopup.contains(e.target) && !weatherWidget.contains(e.target)) hideWeatherPopup();
});

/* ================================================================
   暗色模式
================================================================ */

const darkToggle = document.getElementById('darkToggle');

function applyTheme(dark) {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  darkToggle.textContent = dark ? '☀️' : '🌙';
  darkToggle.title = dark ? '切换亮色模式' : '切换暗色模式';
  localStorage.setItem('theme', dark ? 'dark' : 'light');
}

darkToggle.addEventListener('click', () => {
  applyTheme(document.documentElement.getAttribute('data-theme') !== 'dark');
});

(function initTheme() {
  const saved = localStorage.getItem('theme');
  if (saved) { applyTheme(saved === 'dark'); return; }
  applyTheme(!!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches));
})();

if (window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (!localStorage.getItem('theme')) applyTheme(e.matches);
  });
}

/* ================================================================
   天气模块
================================================================ */

const weatherWidget = document.getElementById('weatherWidget');
const weatherPopup  = document.getElementById('weatherPopup');
const weatherTemp   = document.getElementById('weatherTemp');

function getWeatherEmoji(desc) {
  const d = desc.toLowerCase();
  if (d.includes('sun') || d.includes('clear')) return '☀️';
  if (d.includes('partly')) return '⛅';
  if (d.includes('overcast')) return '☁️';
  if (d.includes('cloud')) return '🌥️';
  if (d.includes('drizzle')) return '🌦️';
  if (d.includes('rain') || d.includes('shower')) return '🌧️';
  if (d.includes('thunder') || d.includes('storm')) return '⛈️';
  if (d.includes('snow') || d.includes('sleet')) return '🌨️';
  if (d.includes('fog') || d.includes('mist')) return '🌫️';
  return '🌡️';
}

function parseWeather(data) {
  const c = data.current_condition[0];
  return {
    city: data.nearest_area?.[0]?.areaName?.[0]?.value || '未知',
    temp: c.temp_C + '°C', desc: c.weatherDesc?.[0]?.value || '',
    icon: getWeatherEmoji(c.weatherDesc?.[0]?.value || ''),
    feels: c.FeelsLikeC + '°C', humidity: c.humidity + '%',
    wind: c.windspeedKmph + ' km/h', uv: c.UVIndex, vis: c.visibility + ' km',
    sunrise: data.weather?.[0]?.astronomy?.[0]?.sunrise || '',
    sunset: data.weather?.[0]?.astronomy?.[0]?.sunset || '',
  };
}

let weatherCache = null;

function fetchWeather(showPopup) {
  if (showPopup) showWeatherPopup('<div class="w-loading">加载中…</div>');
  fetch('https://wttr.in/?format=j1')
    .then(r => r.json()).then(data => {
      const w = parseWeather(data);
      weatherTemp.textContent = w.icon + ' ' + w.temp;
      weatherCache = `<div class="w-city">${w.city}</div>
        <div style="font-size:2rem;margin:4px 0;">${w.icon}</div>
        <div style="font-size:1.2rem;font-weight:600;">${w.temp}</div>
        <div class="w-desc">${w.desc}</div>
        <div style="margin-top:8px;line-height:1.7;text-align:left;">
          体感温度&nbsp;&nbsp;${w.feels}<br>湿度&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${w.humidity}<br>
          风速&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${w.wind}<br>能见度&nbsp;&nbsp;&nbsp;${w.vis}<br>
          紫外线&nbsp;&nbsp;&nbsp;${w.uv}<br>日出&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${w.sunrise}<br>
          日落&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${w.sunset}
        </div>
        <a href="https://wttr.in/" target="_blank" rel="noopener">查看完整天气 →</a>`;
      if (showPopup) showWeatherPopup(weatherCache);
    }).catch(() => {
      weatherTemp.textContent = '--°';
      if (showPopup) showWeatherPopup('<div class="w-error">加载失败，请重试</div>');
    });
}

function showWeatherPopup(html) { weatherPopup.innerHTML = html; weatherPopup.classList.add('show'); }
function hideWeatherPopup() { weatherPopup.classList.remove('show'); }

weatherWidget.addEventListener('click', e => {
  e.stopPropagation();
  if (weatherPopup.classList.contains('show')) { hideWeatherPopup(); return; }
  if (weatherCache) { showWeatherPopup(weatherCache); return; }
  fetchWeather(true);
});

setTimeout(() => fetchWeather(false), 1500);

/* ================================================================
   分类导航拖拽滑动 + 滚动边缘渐变
================================================================ */

function updateScrollFade() {
  const bar = document.getElementById('categoryBar');
  if (bar) catWrapEl.classList.toggle('has-overflow', bar.scrollWidth > bar.clientWidth + 2);
}

function initCategoryDragScroll() {
  const bar = document.getElementById('categoryBar');
  if (!bar) return;
  let isDown = false, startX = 0, scrollLeft = 0;

  bar.addEventListener('mousedown', e => {
    if (e.target.closest('.cat-tab')) return;
    isDown = true; bar.classList.add('dragging');
    startX = e.pageX - bar.offsetLeft; scrollLeft = bar.scrollLeft;
  });
  bar.addEventListener('mouseleave', () => { isDown = false; bar.classList.remove('dragging'); });
  bar.addEventListener('mouseup', () => { isDown = false; bar.classList.remove('dragging'); });
  bar.addEventListener('mousemove', e => {
    if (!isDown) return;
    e.preventDefault();
    bar.scrollLeft = scrollLeft - (e.pageX - bar.offsetLeft - startX) * 1.2;
  });
  bar.addEventListener('wheel', e => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { bar.scrollLeft += e.deltaY; e.preventDefault(); }
  }, { passive: false });
  bar.addEventListener('scroll', updateScrollFade, { passive: true });
  updateScrollFade();
}

/* ================================================================
   图片加载错误处理
================================================================ */

document.body.addEventListener('error', e => {
  if (e.target.tagName === 'IMG' && e.target.classList.contains('ql-icon'))
    e.target.style.display = 'none';
}, true);
