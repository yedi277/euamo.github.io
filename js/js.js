var mobileAgent = new Array("iphone", "ipod", "android", "mobile", "blackberry", "webos", "incognito", "webmate", "bada", "nokia", "lg", "ucweb", "skyfire");
var browser = navigator.userAgent.toLowerCase();
var isMobile = false;
for (var i = 0; i < mobileAgent.length; i++) {
if (browser.indexOf(mobileAgent[i]) != -1) {
isMobile = true;
location.href = '/index5.html';
break;}}//识别手机标签跳转

(function (win, doc) {
if (!win.addEventListener) return;
var html = document.documentElement;
function setFont() {
var html = document.documentElement;
var cliWidth = html.clientWidth;
var k = 640;
if (cliWidth >= 640){
cliWidth = 640;
}
html.style.fontSize = cliWidth / k * 100 + "px";
}

setFont();
setTimeout(function () {
setFont();
}, 300);
doc.addEventListener('DOMContentLoaded', setFont, false);
win.addEventListener('resize', setFont, false);
win.addEventListener('load', setFont, false);
})(window, document);

function isHidden(oDiv){var vDiv = document.getElementById(oDiv);vDiv.style.display = (vDiv.style.display == 'none')?'block':'none';}
function t1() { document.getElementById('a1').style.display = "block"; document.getElementById('a2').style.display = "none"; document.getElementById('a3').style.display = "none"; }
function t2() { document.getElementById('a1').style.display = "none"; document.getElementById('a2').style.display = "block"; document.getElementById('a3').style.display = "none"; }
function t3() { document.getElementById('a1').style.display = "none"; document.getElementById('a2').style.display = "none"; document.getElementById('a3').style.display = "block"; }
function show(id){
var ul = document.getElementById(id);
if(ul.style.display == "block"){
ul.style.display = "none";
}else{
ul.style.display = "block";
}
} //移动端响应式

copyInnerTextOfCell = (event) => {
let innerText = event.target.innerText;
var tmpInput = document.createElement("input");
document.body.appendChild(tmpInput);
tmpInput.value = innerText;
tmpInput.select();
document.execCommand("cut"); // copy
tmpInput.remove();
alert("复制成功！" + innerText);
} //<p onclick="copyInnerTextOfCell(event)">这是 p 标签内容</p>

function ShowDetail() {
     if (window.top.document.getElementById("rrbay_wzatool")) {
         return false;
     }
    var url = "?url=" + document.location.href;
    window.scrollTo(0, 0);
    location_href('/canyou/index.html'  + url);
}
function location_href(url) { location.href = url }
//无障碍工作条 基于iframe <a title="无障碍通道" href="javascript:;" onclick="ShowDetail()" accesskey="g" onmousedown="ShowDetail()" target="_self">进入无障碍通道</a>。




