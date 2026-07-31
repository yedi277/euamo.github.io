#!/usr/bin/env node
// =============================================================================
// gen_manifest.js —— 为 player.html 的「manifest 模式」生成每个文件夹的 manifest.json
//
// 两种用法（推荐本地扫描，完全不限流）：
//
//   1) 本地扫描（你要已 clone 仓库到本地，最稳）：
//        node gen_manifest.js C:\path\to\euamo.github.io
//      不传路径则默认用当前目录。会把 manifest.json 直接写进各文件夹。
//
//   2) GitHub API（无需 clone，但需 token 才不会限流）：
//        node gen_manifest.js --api --token ghp_你的Token
//      或设环境变量：  set GITHUB_TOKEN=ghp_xxx && node gen_manifest.js --api
//      会把 manifest.json 写到 ./<文件夹>/manifest.json（自动建目录），你再上传到仓库。
//
// 生成的 manifest.json 内容示例：
//   { "name": "音乐", "path": "music", "generated": "2026-07-31T...", "count": 102, "files": ["a.mp3", "b.mp3"] }
// player.html 读取它即可列出歌单，无需调用 GitHub API。
// =============================================================================

const fs = require('fs');
const path = require('path');
const https = require('https');

// ★ 与 player.html 的 REMOTE_LIBS 保持一致（改了歌单要同步这里）
const FOLDERS = [
  { name: '音乐', path: 'music' },
  { name: '90',   path: '90' },
  { name: '老歌', path: '老歌' },
  { name: 'fzl',  path: 'fzl' },
];

// ★ 仓库信息（API 模式用；本地模式可忽略）
const REPO = 'yedi277/euamo.github.io';
const BRANCH = 'main';

const AUDIO_RE = /\.(mp3|flac|m4a|wav|ogg|aac|opus|wma)$/i;
const isAudio = (n) => AUDIO_RE.test(n);

function fetchJson(url, headers) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers }, (res) => {
      let s = '';
      res.on('data', (d) => (s += d));
      res.on('end', () => {
        try { resolve(JSON.parse(s)); }
        catch (e) { reject(new Error('解析失败: ' + s.slice(0, 160))); }
      });
    }).on('error', reject);
  });
}

// ---- 本地扫描模式 ----
function listViaLocal(root) {
  const out = {};
  for (const f of FOLDERS) {
    const dir = path.join(root, f.path);
    if (!fs.existsSync(dir)) {
      console.log(`  ✗ 本地找不到目录 ${dir}，跳过`);
      out[f.path] = [];
      continue;
    }
    const files = fs.readdirSync(dir).filter(isAudio).sort();
    out[f.path] = files;
    console.log(`  ${f.name} (${f.path}): ${files.length} 首`);
  }
  return out;
}

// ---- GitHub API 模式 ----
async function listViaApi(token) {
  const out = {};
  for (const f of FOLDERS) {
    const url = `https://api.github.com/repos/${REPO}/contents/${encodeURIComponent(f.path)}?ref=${BRANCH}`;
    const headers = { 'Accept': 'application/vnd.github+json', 'User-Agent': 'gen-manifest' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    try {
      const data = await fetchJson(url, headers);
      const files = Array.isArray(data)
        ? data.filter((x) => x.type === 'file' && isAudio(x.name)).map((x) => x.name)
        : [];
      out[f.path] = files;
      console.log(`  ${f.name} (${f.path}): ${files.length} 首`);
    } catch (e) {
      console.log(`  ✗ ${f.name} 拉取失败: ${e.message}`);
      out[f.path] = [];
    }
  }
  return out;
}

async function main() {
  const args = process.argv.slice(2);
  const apiMode = args.includes('--api');
  const tIdx = args.indexOf('--token');
  const token = tIdx >= 0 ? args[tIdx + 1] : (process.env.GITHUB_TOKEN || '');
  const root = args.find((a) => !a.startsWith('--') && a !== token) || process.cwd();

  console.log('gen_manifest.js —— 生成音乐文件夹 manifest.json');
  let lists;
  if (apiMode) {
    console.log(`模式: GitHub API（token ${token ? '已提供' : '未提供 → 可能限流'}）\n`);
    lists = await listViaApi(token);
  } else {
    console.log(`模式: 本地扫描，根目录 = ${root}\n`);
    lists = listViaLocal(root);
  }

  // 写 manifest.json
  for (const f of FOLDERS) {
    const files = lists[f.path] || [];
    const manifest = {
      name: f.name, path: f.path,
      generated: new Date().toISOString(),
      count: files.length,
      files,
    };
    const target = apiMode
      ? path.join(process.cwd(), f.path, 'manifest.json')   // API 模式：建 ./<path>/manifest.json
      : path.join(root, f.path, 'manifest.json');            // 本地模式：直接写进仓库文件夹
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, JSON.stringify(manifest, null, 2));
    console.log(`  ✓ 写出 ${target}  (${files.length} 首)`);
  }

  console.log('\n完成。');
  if (apiMode) console.log('把生成的各 manifest.json 上传到仓库对应文件夹，并部署 Pages；player.html 设 REMOTE_MODE=\'manifest\' 即可。');
  else console.log('commit 并 push 这些 manifest.json，player.html 设 REMOTE_MODE=\'manifest\' 即可（无需 GITHUB_REPO）。');
}

main();
