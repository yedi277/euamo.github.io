/* ================================================================
   书签管理后台 - 主逻辑
================================================================ */

const STORAGE_KEY = 'navBookmarks';
let bookmarks = [];
let currentCat = 'all';
let parsedBookmarks = null;

// 数据持久化
function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  bookmarks = saved ? JSON.parse(saved) : [{ cat: '默认分类', icon: '📁', items: [] }];
  if (!saved) saveData();
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
}

// 渲染分类标签
function renderTabs() {
  const total = bookmarks.reduce((s, b) => s + b.items.length, 0);
  let html = `<div class="tab ${currentCat === 'all' ? 'active' : ''}" data-cat="all">全部<span class="count">${total}</span></div>`;

  bookmarks.forEach((b, i) => {
    html += `<div class="tab ${currentCat === b.cat ? 'active' : ''}" data-cat="${b.cat}">
      <span>${b.icon} ${b.cat}<span class="count">${b.items.length}</span></span>
      <button class="tab-delete-btn" data-del-cat="${i}">×</button>
    </div>`;
  });

  document.getElementById('categoryTabs').innerHTML = html;
}

function filterByCat(cat) {
  currentCat = cat;
  renderTabs();
  renderList();
}

// 渲染书签列表
function openBookmark(url) { window.open(url, '_blank'); }

function renderList() {
  const list = document.getElementById('bookmarkList');
  const items = [];

  bookmarks.forEach((cat, catIndex) => {
    if (currentCat !== 'all' && currentCat !== cat.cat) return;
    cat.items.forEach((item, itemIndex) => {
      items.push({ cat: cat.cat, catIcon: cat.icon, catIndex, name: item[0], url: item[1], icon: item[2], itemIndex });
    });
  });

  if (items.length === 0) {
    list.innerHTML = `<div class="empty"><div class="empty-icon">📭</div><p>暂无书签</p></div>`;
    return;
  }

  list.innerHTML = items.map(item => `
    <div class="bookmark-item" data-cat="${item.catIndex}" data-item="${item.itemIndex}">
      <span class="drag-handle">⋮⋮</span>
      ${renderIcon(item.icon)}
      <div class="info">
        <div class="name" data-url="${escapeAttr(item.url)}">${item.name}</div>
        <div class="url" data-url="${escapeAttr(item.url)}">${item.url}</div>
      </div>
      <span class="cat-tag">${item.catIcon} ${item.cat}</span>
      <div class="actions">
        <button class="btn btn-primary" data-edit="${item.catIndex},${item.itemIndex}">编辑</button>
        <button class="btn btn-danger" data-delete="${item.catIndex},${item.itemIndex}">删除</button>
      </div>
    </div>
  `).join('');

  initDrag();
}

function escapeAttr(s) { return s.replace(/"/g, '&quot;'); }

function renderIcon(icon) {
  if (!icon) return '<span class="icon">🔗</span>';
  if (icon.startsWith('data:image') || icon.startsWith('http'))
    return `<span class="icon"><img src="${icon}" alt="" style="width:20px;height:20px;object-fit:contain;vertical-align:middle;"></span>`;
  return `<span class="icon">${icon}</span>`;
}

// 拖拽排序
let draggedItem = null;

function initDrag() {
  document.querySelectorAll('.bookmark-item').forEach(item => {
    item.draggable = true;
    item.addEventListener('dragstart', () => { draggedItem = item; item.classList.add('dragging'); });
    item.addEventListener('dragover', e => e.preventDefault());
    item.addEventListener('dragend', () => item.classList.remove('dragging'));
    item.addEventListener('drop', e => {
      e.preventDefault();
      if (item === draggedItem) return;
      const fromCat = +draggedItem.dataset.cat, fromItem = +draggedItem.dataset.item;
      const toCat = +item.dataset.cat, toItem = +item.dataset.item;
      const [moved] = bookmarks[fromCat].items.splice(fromItem, 1);
      bookmarks[toCat].items.splice(toItem, 0, moved);
      saveData(); renderList();
    });
  });
}

// 添加/编辑书签弹窗
function fillCatSelect(selected) {
  document.getElementById('bookmarkCat').innerHTML = bookmarks.map(b =>
    `<option value="${b.cat}" ${b.cat === selected ? 'selected' : ''}>${b.icon} ${b.cat}</option>`
  ).join('');
}

function showAddModal() {
  document.getElementById('modalTitle').textContent = '添加书签';
  document.getElementById('editIndex').value = '';
  document.getElementById('bookmarkName').value = '';
  document.getElementById('bookmarkUrl').value = '';
  document.getElementById('bookmarkIcon').value = '🔗';
  fillCatSelect();
  document.getElementById('bookmarkModal').classList.add('show');
}

function editBookmark(catIndex, itemIndex) {
  const item = bookmarks[catIndex].items[itemIndex];
  document.getElementById('modalTitle').textContent = '编辑书签';
  document.getElementById('editIndex').value = `${catIndex},${itemIndex}`;
  document.getElementById('bookmarkName').value = item[0];
  document.getElementById('bookmarkUrl').value = item[1];
  document.getElementById('bookmarkIcon').value = item[2];
  fillCatSelect(bookmarks[catIndex].cat);
  document.getElementById('bookmarkModal').classList.add('show');
}

function saveBookmark(e) {
  e.preventDefault();
  const editIndex = document.getElementById('editIndex').value;
  const catName = document.getElementById('bookmarkCat').value;
  const name = document.getElementById('bookmarkName').value.trim();
  const url = document.getElementById('bookmarkUrl').value.trim();
  const icon = document.getElementById('bookmarkIcon').value.trim() || '🔗';
  const newItem = [name, url, icon];

  if (editIndex) {
    const [oldCatIdx, oldItemIdx] = editIndex.split(',').map(Number);
    if (bookmarks[oldCatIdx].cat === catName) {
      bookmarks[oldCatIdx].items[oldItemIdx] = newItem;
    } else {
      bookmarks[oldCatIdx].items.splice(oldItemIdx, 1);
      bookmarks.find(b => b.cat === catName).items.push(newItem);
    }
  } else {
    bookmarks.find(b => b.cat === catName).items.push(newItem);
  }

  saveData(); closeModal(); renderTabs(); renderList();
}

function deleteBookmark(catIndex, itemIndex) {
  if (!confirm('确定删除这个书签吗？')) return;
  bookmarks[catIndex].items.splice(itemIndex, 1);
  saveData(); renderTabs(); renderList();
}

function closeModal() { document.getElementById('bookmarkModal').classList.remove('show'); }

// 分类管理
function showAddCatModal() {
  document.getElementById('catName').value = '';
  document.getElementById('catIcon').value = '📁';
  document.getElementById('catModal').classList.add('show');
}

function closeCatModal() { document.getElementById('catModal').classList.remove('show'); }

function saveCategory(e) {
  e.preventDefault();
  const name = document.getElementById('catName').value.trim();
  const icon = document.getElementById('catIcon').value.trim() || '📁';
  if (bookmarks.some(b => b.cat === name)) { alert('分类已存在！'); return; }
  bookmarks.push({ cat: name, icon, items: [] });
  saveData(); closeCatModal(); renderTabs(); renderList();
}

function deleteCategory(catIndex) {
  const cat = bookmarks[catIndex];
  if (!confirm(`确定删除分类"${cat.cat}"吗？\n该分类下有 ${cat.items.length} 个书签，删除后无法恢复。`)) return;
  bookmarks.splice(catIndex, 1);
  if (currentCat === cat.cat) currentCat = 'all';
  saveData(); renderTabs(); renderList();
}

// 下载辅助
function triggerDownload(content, filename, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

// 导出功能
function exportData() {
  document.getElementById('exportContent').textContent = `const bookmarks = ${JSON.stringify(bookmarks, null, 2)};`;
  document.getElementById('exportModal').classList.add('show');
}

function closeExportModal() { document.getElementById('exportModal').classList.remove('show'); }

function copyExport() {
  navigator.clipboard.writeText(document.getElementById('exportContent').textContent)
    .then(() => alert('已复制到剪贴板！'));
}

function downloadBookmarksJS() {
  triggerDownload(`const bookmarks = ${JSON.stringify(bookmarks, null, 2)};`, 'bookmarks.js', 'text/javascript;charset=utf-8');
}

function exportHTML() {
  const withIcon = confirm('导出 HTML 书签时是否包含图标？\n\n确定 = 包含图标\n取消 = 不包含图标');
  const date = new Date().toISOString().split('T')[0];
  triggerDownload(generateBookmarkHTML(withIcon), `bookmarks_${date}.html`, 'text/html;charset=utf-8');
}

function generateBookmarkHTML(withIcon) {
  const now = new Date().toLocaleString('zh-CN');
  const ts = Math.floor(Date.now() / 1000);
  let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file. -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>书签</TITLE><H1>书签</H1>
<DL><p>
<DT><H3 ADD_DATE="${ts}">个人网址导航</H3>
<DL><p>
`;

  bookmarks.forEach(cat => {
    html += ` <DT><H3 ADD_DATE="${ts}">${cat.cat}</H3>\n <DL><p>\n`;
    cat.items.forEach(([name, url, icon]) => {
      let iconAttr = '';
      if (withIcon && icon) {
        if (icon.startsWith('http://') || icon.startsWith('https://') || icon.startsWith('data:image')) {
          iconAttr = ` ICON="${icon}"`;
        } else if (icon.length <= 2) {
          iconAttr = ` ICON="data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text x="50" y="50" font-size="80" text-anchor="middle" dominant-baseline="middle">${encodeURIComponent(icon)}</text></svg>"`;
        }
      }
      html += ` <DT><A HREF="${url}" ADD_DATE="${ts}"${iconAttr}>${name}</A>\n`;
    });
    html += ` </DL><p>\n`;
  });

  return html + ` </DL><p>\n</DL><p>\n<!-- 导出时间: ${now} -->\n</html>`;
}

// 导入功能
function showImportModal() {
  document.getElementById('importModal').classList.add('show');
  document.getElementById('importPreview').classList.add('hidden');
  document.getElementById('importFile').value = '';
  parsedBookmarks = null;
}

function closeImportModal() {
  document.getElementById('importModal').classList.remove('show');
  parsedBookmarks = null;
}

function readFile(file) {
  return new Promise(resolve => {
    const r = new FileReader();
    r.onload = e => resolve(e.target.result);
    r.readAsText(file, 'UTF-8');
  });
}

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) readFile(file).then(parseBookmarkHTML);
}

function parseBookmarkHTML(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  parsedBookmarks = [];

  function parseDL(dl, folderName = '未分类') {
    dl.querySelectorAll(':scope > dt').forEach(dt => {
      const h3 = dt.querySelector(':scope > h3');
      const a  = dt.querySelector(':scope > a');
      const subDL = dt.querySelector(':scope > dl');
      if (h3) {
        const folder = h3.textContent.trim() || '未分类';
        if (subDL) parseDL(subDL, folder);
      } else if (a) {
        const name = truncateName(a.textContent.trim());
        const url  = a.href;
        const icon = extractIcon(a.getAttribute('icon'), url);
        if (name && url && url !== 'about:blank') {
          let cat = parsedBookmarks.find(c => c.cat === folderName);
          if (!cat) { cat = { cat: folderName, icon: '📁', items: [] }; parsedBookmarks.push(cat); }
          cat.items.push([name, url, icon]);
        }
      }
    });
  }

  parseDL(doc.querySelector('dl') || doc.body, '导入的书签');

  if (parsedBookmarks.length === 0) {
    const cat = { cat: '导入的书签', icon: '📁', items: [] };
    doc.querySelectorAll('a').forEach(a => {
      const name = truncateName(a.textContent.trim());
      const url  = a.href;
      const icon = extractIcon(a.getAttribute('icon'), url);
      if (name && url && url !== 'about:blank') cat.items.push([name, url, icon]);
    });
    if (cat.items.length > 0) parsedBookmarks.push(cat);
  }

  showImportPreview();
}

function truncateName(name, maxLen = 20) {
  if (!name) return '';
  name = name.trim();
  return name.length <= maxLen ? name : name.slice(0, maxLen) + '...';
}

const FAVICON_MAP = {
  'baidu.com':'🔍','google.com':'🌐','github.com':'🐙',
  'youtube.com':'▶️','bilibili.com':'📺','taobao.com':'🛍️',
  'jd.com':'📦','weibo.com':'🐦','zhihu.com':'💬',
  'qq.com':'🐧','163.com':'📧','aliyun.com':'☁️',
  'steam.com':'🎮','douyu.com':'🐠','acfun.cn':'📺'
};

function getFaviconFromUrl(url) {
  try {
    const domain = new URL(url).hostname;
    for (const [key, icon] of Object.entries(FAVICON_MAP)) {
      if (domain.includes(key)) return icon;
    }
  } catch {}
  return '🔗';
}

function extractIcon(iconAttr, url) {
  const icon = iconAttr?.trim();
  if (!icon) return getFaviconFromUrl(url);
  if (icon.startsWith('data:image') || icon.startsWith('http://') || icon.startsWith('https://')) return icon;
  if (/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]$/u.test(icon)) return icon;
  return getFaviconFromUrl(url);
}

function normalizeUrl(url) {
  try {
    const u = new URL(url);
    return u.hostname + u.pathname.replace(/\/$/, '');
  } catch {
    return url.toLowerCase().replace(/\/$/, '');
  }
}

function getExistingUrls() {
  return new Set(bookmarks.flatMap(cat => cat.items.map(item => normalizeUrl(item[1]))));
}

function showImportPreview() {
  const existingUrls = getExistingUrls();
  let totalCount = 0, newCount = 0, duplicateCount = 0, html = '';

  parsedBookmarks.forEach(cat => {
    const newItems = cat.items.filter(item => !existingUrls.has(normalizeUrl(item[1])));
    const dupItems = cat.items.filter(item =>  existingUrls.has(normalizeUrl(item[1])));
    totalCount += cat.items.length;
    newCount += newItems.length;
    duplicateCount += dupItems.length;

    const renderItems = (arr, cls = '') => arr.map(item => `
      <div class="preview-item ${cls}">
        ${renderIcon(item[2])}
        <span class="name">${item[0]}</span>
        <span class="url">${item[1]}</span>
      </div>`).join('');

    html += `<div class="preview-folder">
      <div class="preview-folder-name">📁 ${cat.cat} <span class="count">(${cat.items.length}个书签)</span></div>
      <div class="preview-items">${renderItems(newItems)}${renderItems(dupItems, 'existing')}</div>
    </div>`;
  });

  document.getElementById('previewContent').innerHTML = html;
  document.getElementById('importStats').innerHTML =
    `共 ${totalCount} 个书签 | ✅ 新增 ${newCount} 个 | 🟡 重复 ${duplicateCount} 个`;
  document.getElementById('importPreview').classList.remove('hidden');

  document.getElementById('targetCategory').innerHTML = bookmarks.map(b =>
    `<option value="${b.cat}">${b.icon} ${b.cat}</option>`
  ).join('');

  document.getElementById('importCategory').onchange = function() {
    document.getElementById('existingCatSelect').classList.toggle('hidden', this.value !== 'existing');
  };
}

function confirmImport() {
  if (!parsedBookmarks?.length) { alert('没有可导入的书签！'); return; }

  const importMode   = document.getElementById('importCategory').value;
  const skipDuplicate = document.getElementById('skipDuplicate').checked;
  const existingUrls = getExistingUrls();
  let imported = 0;

  if (importMode === 'new') {
    parsedBookmarks.forEach(parsedCat => {
      let target = bookmarks.find(b => b.cat === parsedCat.cat);
      if (!target) { target = { cat: parsedCat.cat, icon: parsedCat.icon, items: [] }; bookmarks.push(target); }
      parsedCat.items.forEach(item => {
        if (skipDuplicate && existingUrls.has(normalizeUrl(item[1]))) return;
        target.items.push(item); imported++;
      });
    });
  } else {
    const target = bookmarks.find(b => b.cat === document.getElementById('targetCategory').value);
    if (!target) { alert('请选择目标分类！'); return; }
    parsedBookmarks.forEach(parsedCat => {
      parsedCat.items.forEach(item => {
        if (skipDuplicate && existingUrls.has(normalizeUrl(item[1]))) return;
        target.items.push(item); imported++;
      });
    });
  }

  saveData(); closeImportModal(); renderTabs(); renderList();
  alert(`导入完成！成功导入 ${imported} 个书签。`);
}

// 清空数据
function clearAllData() {
  if (!confirm('⚠️ 确定要清空所有书签数据吗？\n\n此操作不可撤销！')) return;
  if (!confirm('再次确认：真的要删除所有书签吗？')) return;
  bookmarks = []; saveData(); renderTabs(); renderList();
  alert('已清空所有书签数据！');
}

// 事件委托：分类标签 click
document.getElementById('categoryTabs').addEventListener('click', e => {
  const tab = e.target.closest('.tab');
  const delBtn = e.target.closest('.tab-delete-btn');
  if (delBtn) { e.stopPropagation(); deleteCategory(+delBtn.dataset.delCat); return; }
  if (tab) filterByCat(tab.dataset.cat);
});

// 事件委托：书签列表 click
document.getElementById('bookmarkList').addEventListener('click', e => {
  const urlEl = e.target.closest('[data-url]');
  const editBtn = e.target.closest('[data-edit]');
  const delBtn  = e.target.closest('[data-delete]');
  if (urlEl)   { openBookmark(urlEl.dataset.url); return; }
  if (editBtn) { const [c, i] = editBtn.dataset.edit.split(',').map(Number); editBookmark(c, i); return; }
  if (delBtn)  { const [c, i] = delBtn.dataset.delete.split(',').map(Number); deleteBookmark(c, i); }
});

// 弹窗外部点击关闭
document.querySelectorAll('.modal').forEach(modal => {
  modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('show'); });
});

// 导入区域拖放
const importZone = document.getElementById('importZone');
importZone.addEventListener('dragover', e => { e.preventDefault(); importZone.classList.add('dragover'); });
importZone.addEventListener('dragleave', e => { e.preventDefault(); importZone.classList.remove('dragover'); });
importZone.addEventListener('drop', e => {
  e.preventDefault(); importZone.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file && /\.html?$/i.test(file.name)) readFile(file).then(parseBookmarkHTML);
  else alert('请选择 HTML 格式的书签文件！');
});

// 初始化
loadData(); renderTabs(); renderList();
