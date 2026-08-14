function triangle(x, start, peak, end){
  if(start === peak){
    if(x <= peak) return 1;
    if(x >= end) return 0;
    return (end - x) / (end - peak);
  }
  if(peak === end){
    if(x >= peak) return 1;
    if(x <= start) return 0;
    return (x - start) / (peak - start);
  }
  if(x<=start || x>=end) return 0;
  if(x===peak) return 1;
  if(x<peak) return (x-start)/(peak-start);
  return (end-x)/(end-peak);
}

function dslpMemberships(x){
  return {
    Early: triangle(x, 5, 5, 17.5),   
    Mid: triangle(x, 5, 17.5, 30),     
    Late: triangle(x, 17.5, 30, 30)     
  };
}

function siMemberships(x){
  return {
    Mild: triangle(x, 2, 2, 5),        
    Moderate: triangle(x, 2, 5, 8),  
    Severe: triangle(x, 5, 8, 8)      
  };
}

const outputSets = {
  Low:      [0, 0, 25],
  Guarded:  [10, 35, 55],
  Elevated: [40, 60, 80],
  High:     [65, 100, 100]
};

const rules = [
  ["Early","Mild", "Low"],
  ["Early","Moderate", "Low"],
  ["Early","Severe", "Elevated"],
  ["Mid","Mild", "Low"],
  ["Mid","Moderate", "Guarded"],
  ["Mid","Severe", "Elevated"],
  ["Late","Mild", "Elevated"],
  ["Late","Moderate", "High"],
  ["Late","Severe", "High"]
];

function setPeak(label){
  const [, peak] = outputSets[label];
  return peak;
}

function computeFuzzy(dslpVal, siVal){
  const dMem = dslpMemberships(dslpVal);
  const sMem = siMemberships(siVal);

  let num = 0, den = 0;
  let firedList = [];
  rules.forEach(([dSet, sSet, outLabel]) => {
    const strength = Math.min(dMem[dSet], sMem[sSet]);
    if(strength > 0){
      const z = setPeak(outLabel);
      num += strength * z;
      den += strength;
      firedList.push({label: dSet + " & " + sSet + " \u2192 " + outLabel, strength, z});
    }
  });
  const score = den > 0 ? num/den : 0;

  firedList.sort((a,b)=>b.strength-a.strength);
  return {score, dMem, sMem, firedList};
}

function statusFromScore(score){
  if(score < 20) return {label:"Not Yet", color:"#9dbfa4", advice:"Your body's likely resetting after your last period. Rest, hydrate, and ease back into routine."};
  if(score < 40) return {label:"Regular Days", color:"#d9b36c", advice:"Steady days — nothing in particular to prepare for right now."};
  if(score < 60) return {label:"Stay Watchful", color:"#e2a0ac", advice:"Some symptoms showing up. Keep an eye on how you feel and rest if you need to."};
  if(score < 80) return {label:"Coming Soon", color:"#FF9A8A", advice:"Signs point to your period approaching. Might be worth restocking supplies and planning a lighter day."};
  return {label:"Expected Today", color:"#e08a7d", advice:"Strong signs — your period is likely today or very soon. Take it easy and keep essentials close."};
}

function renderMemBars(containerId, mem, color){
  const el = document.getElementById(containerId);
  el.innerHTML = "";
  Object.entries(mem).forEach(([name, val])=>{
    const pct = Math.round(val*100);
    const row = document.createElement('div');
    row.className = 'mem-row';
    row.innerHTML = `
      <span class="mem-name">${name}</span>
      <span class="mem-track"><span class="mem-fill" style="width:${pct}%; background:${color}"></span></span>
      <span class="mem-pct">${pct}%</span>
    `;
    el.appendChild(row);
  });
}

function update(){
  const dslpVal = parseInt(document.getElementById('dslp').value, 10);
  const siVal = parseInt(document.getElementById('si').value, 10);
  document.getElementById('dslpVal').textContent = dslpVal;
  document.getElementById('siVal').textContent = siVal;

  const {score, dMem, sMem, firedList} = computeFuzzy(dslpVal, siVal);
  const status = statusFromScore(score);

  document.getElementById('scoreText').textContent = Math.round(score);
  document.getElementById('statusLabel').textContent = status.label;
  document.getElementById('statusLabel').style.color = status.color;
  document.getElementById('adviceText').textContent = status.advice;

  const barFill = document.getElementById('barFill');
  barFill.style.width = score + '%';
  barFill.style.background = status.color;

  renderMemBars('dslpMem', dMem, '#d9b36c');
  renderMemBars('siMem', sMem, '#e2a0ac');

  const ruleText = firedList.slice(0,3).map(r => `<b>${r.label}</b> (${Math.round(r.strength*100)}%)`).join(', ');
  document.getElementById('ruleFired').innerHTML = ruleText || "—";
}

document.getElementById('dslp').addEventListener('input', update);
document.getElementById('si').addEventListener('input', update);
update();
