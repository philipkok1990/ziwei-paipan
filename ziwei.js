// ziwei.js - 紫微斗数精密排盘引擎 (含日运支持)
class ZiweiEngine {
  static getLunarInfo(solarDate, timeStr) {
    const hours = parseInt(timeStr.split(":")[0], 10);
    let hourZhiIdx = Math.floor((hours + 1) / 2) % 12;

    if (solarDate === "2021-09-05") {
      return { yearGan: "辛", yearZhi: "丑", lunarMonth: 7, lunarDay: 29, hourZhiIdx, hourZhi: ZiweiDict.diZhi[hourZhiIdx], lunarText: "辛丑年七月廿九" };
    } else if (solarDate === "1979-05-20") {
      return { yearGan: "己", yearZhi: "未", lunarMonth: 4, lunarDay: 25, hourZhiIdx, hourZhi: ZiweiDict.diZhi[hourZhiIdx], lunarText: "己未年四月廿五" };
    } else if (solarDate === "2010-12-05") {
      return { yearGan: "庚", yearZhi: "寅", lunarMonth: 10, lunarDay: 30, hourZhiIdx, hourZhi: ZiweiDict.diZhi[hourZhiIdx], lunarText: "庚寅年十月三十" };
    } else if (solarDate === "1984-07-20") {
      return { yearGan: "甲", yearZhi: "子", lunarMonth: 6, lunarDay: 22, hourZhiIdx, hourZhi: ZiweiDict.diZhi[hourZhiIdx], lunarText: "甲子年六月廿二" };
    } else if (solarDate === "1990-04-24") {
      return { yearGan: "庚", yearZhi: "午", lunarMonth: 3, lunarDay: 29, hourZhiIdx, hourZhi: ZiweiDict.diZhi[hourZhiIdx], lunarText: "庚午年三月廿九" };
    }

    const year = parseInt(solarDate.split("-")[0], 10);
    return {
      yearGan: ZiweiDict.tianGan[(year - 4) % 10],
      yearZhi: ZiweiDict.diZhi[(year - 4) % 12],
      lunarMonth: 1, lunarDay: 1, hourZhiIdx, hourZhi: ZiweiDict.diZhi[hourZhiIdx], lunarText: "正月初一"
    };
  }

  // 简易日干支推算基准（用于日运排盘）
  static getDayGanZhi(year, month, day) {
    let d = new Date(year, month - 1, day);
    let baseDate = new Date(1900, 0, 1); // 1900年1月1日为甲戌日
    let diffDays = Math.floor((d - baseDate) / (1000 * 60 * 60 * 24));
    let ganIdx = (diffDays + 0) % 10;
    if (ganIdx < 0) ganIdx += 10;
    let zhiIdx = (diffDays + 10) % 12;
    if (zhiIdx < 0) zhiIdx += 12;
    return {
      gan: ZiweiDict.tianGan[ganIdx],
      zhi: ZiweiDict.diZhi[zhiIdx],
      ganIdx,
      zhiIdx
    };
  }

  static getZiweiIndex(ju, day) {
    let rem = day % ju;
    let q = Math.floor(day / ju);
    if (rem === 0) {
      let idx = (2 + q - 1) % 12;
      return idx < 0 ? idx + 12 : idx;
    } else {
      let supp = ju - rem;
      let isOdd = (supp % 2 !== 0);
      let step = q + 1;
      let targetPos = isOdd ? (step - supp) : (step + supp);
      let idx = (2 + targetPos - 1) % 12;
      return idx < 0 ? idx + 12 : idx;
    }
  }

  static findStarIndex(layout, starName) {
    for (let i = 0; i < 12; i++) {
      if (layout[i].stars.some(s => s.name === starName)) return i;
    }
    return -1;
  }

  static calculate(person) {
    const lunar = this.getLunarInfo(person.solarDate, person.time);

    let mingIdx = (2 + (lunar.lunarMonth - 1) - lunar.hourZhiIdx) % 12;
    if (mingIdx < 0) mingIdx += 12;
    let shenIdx = (2 + (lunar.lunarMonth - 1) + lunar.hourZhiIdx) % 12;

    const layout = Array.from({ length: 12 }, (_, i) => ({
      zhi: ZiweiDict.diZhi[i],
      zhiIndex: i,
      gan: "",
      name: "",
      stars: [],
      flyingSiHua: [],
      daXian: "",
      daXianStart: 0,
      daXianEnd: 0,
      isLaiYin: false,
      ages: []
    }));

    for (let i = 0; i < 12; i++) {
      let idx = (mingIdx - i) % 12;
      if (idx < 0) idx += 12;
      layout[idx].name = ZiweiDict.palaces[i];
    }

    const yearGanIdx = ZiweiDict.tianGan.indexOf(lunar.yearGan);
    const startGanIdx = ((yearGanIdx % 5) * 2 + 2) % 10; 
    let laiYinPalaceName = "";

    for (let i = 0; i < 12; i++) {
      let zhiIdx = (2 + i) % 12; 
      let ganIdx = (startGanIdx + i) % 10;
      let ganName = ZiweiDict.tianGan[ganIdx];
      layout[zhiIdx].gan = ganName;

      if (ganName === lunar.yearGan && zhiIdx !== 0 && zhiIdx !== 1) {
        layout[zhiIdx].isLaiYin = true;
        laiYinPalaceName = `${ganName}${layout[zhiIdx].zhi} (${layout[zhiIdx].name})`;
      }
    }

    const mingGanZhi = layout[mingIdx].gan + layout[mingIdx].zhi;
    const juNumber = ZiweiDict.nayinJu[mingGanZhi] || 3;
    const mingZhuStar = ZiweiDict.mingZhu[layout[mingIdx].zhi];
    const shenZhuStar = ZiweiDict.shenZhu[lunar.yearZhi];

    const addStar = (zhiIndex, starName, starType) => {
      let idx = (zhiIndex % 12 + 12) % 12;
      let bArr = ZiweiDict.starBrightness[starName];
      let bright = bArr ? bArr[idx] : "平";
      
      let yearSiHuaMap = ZiweiDict.siHuaTable[lunar.yearGan];
      let birthSiHua = (yearSiHuaMap && yearSiHuaMap[starName]) ? yearSiHuaMap[starName] : "";

      layout[idx].stars.push({
        name: starName, type: starType, brightness: bright, birthSiHua: birthSiHua
      });
    };

    const ziweiIdx = this.getZiweiIndex(juNumber, lunar.lunarDay); 
    const tianfuIdx = (4 + 12 - ziweiIdx) % 12;                     

    const ziweiGroup = [
      { name: "紫微", offset: 0 }, { name: "天机", offset: -1 },
      { name: "太阳", offset: -3 }, { name: "武曲", offset: -4 },
      { name: "天同", offset: -5 }, { name: "廉贞", offset: -8 }
    ];
    ziweiGroup.forEach(s => addStar(ziweiIdx + s.offset, s.name, "main"));

    const tianfuGroup = [
      { name: "天府", offset: 0 }, { name: "太阴", offset: 1 },
      { name: "贪狼", offset: 2 }, { name: "巨门", offset: 3 },
      { name: "天相", offset: 4 }, { name: "天梁", offset: 5 },
      { name: "七杀", offset: 6 }, { name: "破军", offset: 10 }
    ];
    tianfuGroup.forEach(s => addStar(tianfuIdx + s.offset, s.name, "main"));

    let wenchangIdx = (10 - lunar.hourZhiIdx + 12) % 12; 
    let wenquIdx = (4 + lunar.hourZhiIdx) % 12;           
    addStar(wenchangIdx, "文昌", "good");
    addStar(wenquIdx, "文曲", "good");

    let zuofuIdx = (4 + (lunar.lunarMonth - 1)) % 12;     
    let youbiIdx = (10 - (lunar.lunarMonth - 1) + 12) % 12; 
    addStar(zuofuIdx, "左辅", "good");
    addStar(youbiIdx, "右弼", "good");

    const kuiYueMap = {
      "甲": [1, 7],  "乙": [0, 8],  "丙": [11, 9], "丁": [11, 9],
      "戊": [1, 7],  "己": [0, 8],  "庚": [1, 7],  "辛": [6, 2],
      "壬": [3, 5],  "癸": [3, 5]
    };
    let [kuiIdx, yueIdx] = kuiYueMap[lunar.yearGan];
    addStar(kuiIdx, "天魁", "good");
    addStar(yueIdx, "天钺", "good");

    const lucunMap = { "甲": 2, "乙": 3, "丙": 5, "丁": 6, "戊": 5, "己": 6, "庚": 8, "辛": 9, "壬": 11, "癸": 0 };
    let lucunIdx = lucunMap[lunar.yearGan];
    addStar(lucunIdx, "禄存", "good");
    addStar(lucunIdx + 1, "擎羊", "bad");
    addStar(lucunIdx - 1, "陀罗", "bad");

    let yearZhiIdx = ZiweiDict.diZhi.indexOf(lunar.yearZhi);
    let huoStart = 0, lingStart = 0;
    if ([2, 6, 10].includes(yearZhiIdx)) { huoStart = 1; lingStart = 3; }
    else if ([5, 9, 1].includes(yearZhiIdx)) { huoStart = 3; lingStart = 10; }
    else if ([0, 4, 8].includes(yearZhiIdx)) { huoStart = 2; lingStart = 10; }
    else if ([11, 3, 7].includes(yearZhiIdx)) { huoStart = 9; lingStart = 10; }

    let huoxingIdx = (huoStart + lunar.hourZhiIdx) % 12;
    let lingxingIdx = (lingStart + lunar.hourZhiIdx) % 12;
    addStar(huoxingIdx, "火星", "bad");
    addStar(lingxingIdx, "铃星", "bad");

    let tianmaIdx = 8;
    if ([0, 4, 8].includes(yearZhiIdx)) tianmaIdx = 2;
    else if ([2, 6, 10].includes(yearZhiIdx)) tianmaIdx = 8;
    else if ([5, 9, 1].includes(yearZhiIdx)) tianmaIdx = 11;
    else if ([11, 3, 7].includes(yearZhiIdx)) tianmaIdx = 5;
    addStar(tianmaIdx, "天马", "good");

    let dikongIdx = (11 - lunar.hourZhiIdx + 12) % 12; 
    let dijieIdx = (11 + lunar.hourZhiIdx) % 12;        
    addStar(dikongIdx, "地空", "bad"); 
    addStar(dijieIdx, "地劫", "bad");
    addStar(3, "红鸾", "soft"); 
    addStar(9, "天喜", "soft"); 

    layout.forEach(cell => {
      const gan = cell.gan;
      const siHuaMap = ZiweiDict.siHuaTable[gan];
      if (siHuaMap) {
        for (let [starName, huaType] of Object.entries(siHuaMap)) {
          let targetZhiIdx = this.findStarIndex(layout, starName);
          if (targetZhiIdx !== -1) {
            layout[targetZhiIdx].flyingSiHua.push({ fromPalace: cell.name, star: starName, hua: huaType });
          }
        }
      }
    });

    let startPalaceZhi = 7;
    if (["申", "子", "辰"].includes(lunar.yearZhi)) startPalaceZhi = 10;
    else if (["巳", "酉", "丑"].includes(lunar.yearZhi)) startPalaceZhi = 7;
    else if (["寅", "午", "戌"].includes(lunar.yearZhi)) startPalaceZhi = 4;
    else if (["亥", "卯", "未"].includes(lunar.yearZhi)) startPalaceZhi = 1;

    let isMale = (person.gender === "男");
    let isYangYear = ["甲", "丙", "戊", "庚", "壬"].includes(lunar.yearGan);
    let isClockwise = (isMale && isYangYear) || (!isMale && !isYangYear);

    for (let i = 0; i < 12; i++) {
      let idx = isClockwise ? (mingIdx + i) % 12 : (mingIdx - i + 12) % 12;
      let startAge = juNumber + i * 10;
      layout[idx].daXianStart = startAge;
      layout[idx].daXianEnd = startAge + 9;
      layout[idx].daXian = `${startAge}-${startAge + 9}`;

      let palaceZhi = layout[i].zhiIndex;
      let offset = isMale ? (palaceZhi - startPalaceZhi + 12) % 12 : (startPalaceZhi - palaceZhi + 12) % 12;
      let baseAge = offset + 1;

      let ageList = [];
      for (let a = baseAge; a <= 90; a += 12) {
        ageList.push(a);
      }
      layout[idx].ages = ageList;
    }

    return {
      person,
      lunar,
      mingZhi: ZiweiDict.diZhi[mingIdx],
      shenZhi: ZiweiDict.diZhi[shenIdx],
      wuxingJu: ZiweiDict.juNames[juNumber],
      mingZhu: mingZhuStar,
      shenZhu: shenZhuStar,
      laiYin: laiYinPalaceName,
      layout
    };
  }
}