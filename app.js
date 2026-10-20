// app.js - 电脑打印与四化分类排版优化版
let globalChartData = null; 

document.addEventListener("DOMContentLoaded", () => {
  const selectPersonEl = document.getElementById("selectPerson");
  selectPersonEl.innerHTML = "";
  personList.forEach(p => {
    let opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = `${p.name} (${p.solarDate})`;
    selectPersonEl.appendChild(opt);
  });

  selectPersonEl.addEventListener("change", onPersonChange);
  document.getElementById("btnCalc").addEventListener("click", initChart);

  document.getElementById("selectDaxian").addEventListener("change", onDaxianChange);
  document.getElementById("selectLiunian").addEventListener("change", onLiunianChange);
  document.getElementById("selectLiuyue").addEventListener("change", onLiuyueChange);
  document.getElementById("selectRiyun").addEventListener("change", renderLuckOverlay);

  loadPersonToForm(personList[0]);
  initChart();
});

function loadPersonToForm(p) {
  document.getElementById("pName").value = p.name;
  document.getElementById("pDate").value = p.solarDate;
  document.getElementById("pTime").value = p.time;
  document.getElementById("pGender").value = p.gender;
}

function onPersonChange() {
  const selectedId = document.getElementById("selectPerson").value;
  const p = personList.find(item => item.id === selectedId);
  if (p) {
    loadPersonToForm(p);
    initChart();
  }
}

function initChart() {
  const currentPerson = {
    name: document.getElementById("pName").value,
    solarDate: document.getElementById("pDate").value,
    time: document.getElementById("pTime").value,
    gender: document.getElementById("pGender").value
  };

  globalChartData = ZiweiEngine.calculate(currentPerson);
  
  renderChartBase();
  populateDaxianOptions();
  onDaxianChange();
}

function renderChartBase() {
  const result = globalChartData;

  const centerBox = document.getElementById("centerInfo");
  centerBox.innerHTML = `
    <h2>${result.person.name} (${result.person.gender})</h2>
    <div class="center-info-grid">
      <div><b>阳历：</b>${result.person.solarDate} ${result.person.time}</div>
      <div><b>农历：</b>${result.lunar.lunarText} ${result.lunar.hourZhi}时</div>
      <div><b>五行局：</b>${result.wuxingJu}</div>
      <div><b>来因宫：</b><span style="border-bottom:2px solid #000; font-weight:bold;">${result.laiYin}</span></div>
      <div><b>命主：</b>${result.mingZhu}</div>
      <div><b>身主：</b>${result.shenZhu}</div>
      <div><b>命宫：</b>${result.mingZhi}宫</div>
      <div><b>身宫：</b>${result.shenZhi}宫</div>
    </div>
  `;

  const gridMapping = [
    5,  6,  7,  8,  
    4,          9,  
    3,          10, 
    2,  1,  0, 11   
  ];

  gridMapping.forEach((zhiIdx, gridIdx) => {
    const cellData = result.layout[zhiIdx];
    const cellEl = document.getElementById(`cell-${gridIdx}`);
    if (!cellEl) return;

    // 1. 本宫星曜
    let starsHtml = cellData.stars.map(s => {
      let classType = "star-soft";
      if (s.type === "main") classType = "star-main";
      if (s.type === "good") classType = "star-good";
      if (s.type === "bad") classType = "star-bad";

      let sihuaClass = "";
      if (s.birthSiHua === "禄") sihuaClass = "siHua-lu";
      else if (s.birthSiHua === "权") sihuaClass = "siHua-quan";
      else if (s.birthSiHua === "科") sihuaClass = "siHua-ke";
      else if (s.birthSiHua === "忌") sihuaClass = "siHua-ji";

      let sihuaBadge = s.birthSiHua ? `<span class="${sihuaClass}">${s.birthSiHua}</span>` : "";

      return `<span class="star-item ${classType}">${s.name}<span class="bright-tag">${s.brightness}</span>${sihuaBadge}</span>`;
    }).join(" ");

    // 2. 优化后的飞星四化：按 禄、权、科、忌 分类区块整理，打印极度清晰
    let flyingHtml = "";
    if (cellData.flyingSiHua.length > 0) {
      let groups = { "禄": [], "权": [], "科": [], "忌": [] };
      cellData.flyingSiHua.forEach(f => {
        if (groups[f.hua]) {
          groups[f.hua].push(`${f.fromPalace.replace("宫","")}→${f.star}`);
        }
      });

      let groupHtmls = [];
      const huaLabels = { "禄": "禄", "权": "权", "科": "科", "忌": "忌" };
      const huaClassMap = { "禄": "siHua-lu", "权": "siHua-quan", "科": "siHua-ke", "忌": "siHua-ji" };

      for (let type of ["禄", "权", "科", "忌"]) {
        if (groups[type].length > 0) {
          groupHtmls.push(`
            <div class="flying-category-row">
              <span class="flying-type-badge ${huaClassMap[type]}">${huaLabels[type]}</span>
              <span class="flying-content">${groups[type].join("、")}</span>
            </div>
          `);
        }
      }

      flyingHtml = `
        <div class="flying-container">
          <div class="flying-header">四化飞星</div>
          <div class="flying-groups">${groupHtmls.join("")}</div>
        </div>
      `;
    }

    let agesText = cellData.ages.slice(0, 7).join(", ");
    let laiyinBadgeHtml = cellData.isLaiYin ? `<span class="laiyin-badge">来因</span>` : "";

    cellEl.innerHTML = `
      <div>
        <div class="star-box">${starsHtml}</div>
        ${flyingHtml}
      </div>
      <div>
        <div class="ages-box"><span class="ages-title">小限:</span> ${agesText}岁</div>
        <div class="cell-bottom">
          <div class="palace-base-info">
            <span>${cellData.daXian}岁</span>
            <span class="palace-name">${cellData.gan}${cellData.zhi} · ${cellData.name}${laiyinBadgeHtml}</span>
          </div>
          <div class="luck-overlay-container" id="luck-overlay-${zhiIdx}"></div>
        </div>
      </div>
    `;
  });
}

function populateDaxianOptions() {
  const daxianSelect = document.getElementById("selectDaxian");
  daxianSelect.innerHTML = "";
  const birthYear = parseInt(globalChartData.person.solarDate.split("-")[0], 10);

  globalChartData.layout.forEach((cell, idx) => {
    let startYear = birthYear + cell.daXianStart;
    let endYear = birthYear + cell.daXianEnd;
    let opt = document.createElement("option");
    opt.value = idx; 
    opt.textContent = `${cell.daXian}岁 (${startYear}-${endYear}年) - [${cell.gan}${cell.zhi}]`;
    daxianSelect.appendChild(opt);
  });
}

function onDaxianChange() {
  const daxianZhiIdx = parseInt(document.getElementById("selectDaxian").value, 10);
  const cell = globalChartData.layout[daxianZhiIdx];
  const birthYear = parseInt(globalChartData.person.solarDate.split("-")[0], 10);
  const startYear = birthYear + cell.daXianStart;
  const endYear = birthYear + cell.daXianEnd;

  const liunianSelect = document.getElementById("selectLiunian");
  liunianSelect.innerHTML = "";

  for (let y = startYear; y <= endYear; y++) {
    let ganIdx = (y - 4) % 10; if (ganIdx < 0) ganIdx += 10;
    let zhiIdx = (y - 4) % 12; if (zhiIdx < 0) zhiIdx += 12;
    let ganZhi = ZiweiDict.tianGan[ganIdx] + ZiweiDict.diZhi[zhiIdx];

    let opt = document.createElement("option");
    opt.value = JSON.stringify({ year: y, zhiIdx: zhiIdx, gan: ZiweiDict.tianGan[ganIdx] });
    opt.textContent = `${y}年 (${ganZhi}年)`;
    liunianSelect.appendChild(opt);
  }

  onLiunianChange();
}

function onLiunianChange() {
  const liuyueSelect = document.getElementById("selectLiuyue");
  liuyueSelect.innerHTML = "";

  for (let m = 1; m <= 12; m++) {
    let opt = document.createElement("option");
    opt.value = m; 
    opt.textContent = `农历 ${m} 月`;
    liuyueSelect.appendChild(opt);
  }

  onLiuyueChange();
}

function onLiuyueChange() {
  const riyunSelect = document.getElementById("selectRiyun");
  riyunSelect.innerHTML = "";

  // 默认生成当前流月对应的 30 天日运选项
  const liunianVal = JSON.parse(document.getElementById("selectLiunian").value);
  const year = liunianVal.year;
  const month = parseInt(document.getElementById("selectLiuyue").value, 10);

  for (let d = 1; d <= 30; d++) {
    let gz = ZiweiEngine.getDayGanZhi(year, month, d);
    let opt = document.createElement("option");
    opt.value = JSON.stringify({ day: d, zhiIdx: gz.zhiIdx, gan: gz.gan });
    opt.textContent = `${month}月${d}日 (${gz.gan}${gz.zhi}日)`;
    riyunSelect.appendChild(opt);
  }

  renderLuckOverlay();
}

function renderLuckOverlay() {
  for (let i = 0; i < 12; i++) {
    let box = document.getElementById(`luck-overlay-${i}`);
    if (box) box.innerHTML = "";
  }

  // 1. 大限
  const daxianMingIdx = parseInt(document.getElementById("selectDaxian").value, 10);
  for (let i = 0; i < 12; i++) {
    let currentZhiIdx = (daxianMingIdx - i) % 12;
    if (currentZhiIdx < 0) currentZhiIdx += 12;
    let pName = ZiweiDict.palaces[i];
    let box = document.getElementById(`luck-overlay-${currentZhiIdx}`);
    if (box) {
      box.innerHTML += `<span class="badge-daxian">大${pName.replace("宫", "")}</span>`;
    }
  }

  // 2. 年运
  const liunianVal = JSON.parse(document.getElementById("selectLiunian").value);
  const liunianMingIdx = liunianVal.zhiIdx;
  for (let i = 0; i < 12; i++) {
    let currentZhiIdx = (liunianMingIdx - i) % 12;
    if (currentZhiIdx < 0) currentZhiIdx += 12;
    let pName = ZiweiDict.palaces[i];
    let box = document.getElementById(`luck-overlay-${currentZhiIdx}`);
    if (box) {
      box.innerHTML += `<span class="badge-liunian">年${pName.replace("宫", "")}</span>`;
    }
  }

  // 3. 月运
  const selectedMonth = parseInt(document.getElementById("selectLiuyue").value, 10);
  const liuyueMingIdx = (liunianMingIdx + (selectedMonth - 1)) % 12;
  for (let i = 0; i < 12; i++) {
    let currentZhiIdx = (liuyueMingIdx - i) % 12;
    if (currentZhiIdx < 0) currentZhiIdx += 12;
    let pName = ZiweiDict.palaces[i];
    let box = document.getElementById(`luck-overlay-${currentZhiIdx}`);
    if (box) {
      box.innerHTML += `<span class="badge-liuyue">月${pName.replace("宫", "")}</span>`;
    }
  }

  // 4. 日运
  const riyunStr = document.getElementById("selectRiyun").value;
  if (riyunStr) {
    const riyunVal = JSON.parse(riyunStr);
    const riyunMingIdx = riyunVal.zhiIdx;
    for (let i = 0; i < 12; i++) {
      let currentZhiIdx = (riyunMingIdx - i) % 12;
      if (currentZhiIdx < 0) currentZhiIdx += 12;
      let pName = ZiweiDict.palaces[i];
      let box = document.getElementById(`luck-overlay-${currentZhiIdx}`);
      if (box) {
        box.innerHTML += `<span class="badge-riyun">日${pName.replace("宫", "")}</span>`;
      }
    }
  }
}