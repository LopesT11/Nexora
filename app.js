(() => {
"use strict";
const $=id=>document.getElementById(id);
const KEY="DEALERS_V23";
const euro=n=>new Intl.NumberFormat("pt-PT",{style:"currency",currency:"EUR"}).format(Number(n)||0);
const round=n=>Math.round((Number(n)||0)*100)/100;
const iso=()=>new Date().toISOString().slice(0,10);
const month=()=>iso().slice(0,7);
const monthLabel=k=>new Intl.DateTimeFormat("pt-PT",{month:"long",year:"numeric"}).format(new Date(k+"-01")).replace(/^./,x=>x.toUpperCase());
const nextMonth=k=>{const d=new Date(k+"-01");d.setMonth(d.getMonth()+1);return d.toISOString().slice(0,7)};
const prevMonth=k=>{const d=new Date(k+"-01");d.setMonth(d.getMonth()-1);return d.toISOString().slice(0,7)};
const daysInMonth=k=>new Date(Number(k.slice(0,4)),Number(k.slice(5,7)),0).getDate();
const accountNames={current:"Conta corrente",savings:"Poupança",yield:"Dinheiro a render",carFund:"Fundo carro",external:"Exterior"};
const defaultData=()=>({balances:{current:0,savings:0,yield:0,carFund:0},transactions:[],reserves:[],bills:[],monthlyBudgets:{},theme:"dark",loan:{initial:0,balance:0,payment:0,rate:0,next:"",history:[]},closedMonths:{}});

let db=load(); let selectedMonth=month(); let activeReserveId=null; let activeTransfer=null; let moveMode="income";

function load(){
 try{
  const raw=JSON.parse(localStorage.getItem(KEY)||"null");
  const d={...defaultData(),...(raw||{})};
  d.balances={...defaultData().balances,...(d.balances||{})};
  d.transactions=Array.isArray(d.transactions)?d.transactions:[];
  d.reserves=Array.isArray(d.reserves)?d.reserves:[];
  d.bills=Array.isArray(d.bills)?d.bills:[];
  d.monthlyBudgets=d.monthlyBudgets&&typeof d.monthlyBudgets==="object"?d.monthlyBudgets:{};
  d.loan={...defaultData().loan,...(d.loan||{})};
  return d;
 }catch{return defaultData()}
}
function save(){localStorage.setItem(KEY,JSON.stringify(db))}
function addTx(t){db.transactions.push({id:crypto.randomUUID(),...t});save()}
function txForMonth(k){return db.transactions.filter(t=>String(t.date||"").slice(0,7)===k)}
function incomeForMonth(k){return db.transactions.filter(t=>t.type==="income"&&t.budgetMonth===k&&t.countsBudget!==false).reduce((s,t)=>s+Number(t.amount||0),0)}
function spentForMonth(k){return db.transactions.filter(t=>t.type==="expense"&&String(t.date||"").slice(0,7)===k).reduce((s,t)=>s+Number(t.amount||0),0)}
function returnedForMonth(k){return db.transactions.filter(t=>t.type==="return"&&String(t.date||"").slice(0,7)===k).reduce((s,t)=>s+Number(t.amount||0),0)}
function pendingReserves(k){return db.reserves.filter(r=>r.month===k&&!r.transferred&&!r.cancelled).reduce((s,r)=>s+Number(r.amount||0),0)}
function savedReserves(){return db.reserves.filter(r=>r.transferred&&!r.cancelled)}
function pendingBills(k){return db.bills.filter(b=>billApplies(b,k)&&!b.payments?.[k])}
function paidBills(k){return db.bills.flatMap(b=>Object.entries(b.payments||{}).filter(([m])=>m===k).map(([m,p])=>({...b,payment:p,paymentMonth:m})))}
function billApplies(b,k){if(b.recurring==="monthly")return true;return b.month===k}
function availableBudget(k){return round(incomeForMonth(k)+returnedForMonth(k)-spentForMonth(k)-pendingReserves(k))}
function moneyAccounts(){const b=db.balances;return round(Number(b.current)+Number(b.savings)+Number(b.yield)+Number(b.carFund))}
function wealthAvailable(){return round(moneyAccounts())}
function reserveDestinationKey(dest){return dest==="savings"?"savings":dest==="yield"?"yield":dest==="carFund"?"carFund":dest==="current"?"current":null}
function autoBudgetMonth(date,kind){
 const d=Number(String(date).slice(8,10)); const k=String(date).slice(0,7);
 if(kind==="salary"&&d>=20)return nextMonth(k);
 if(kind==="bonus"&&d<=20)return k;
 return k;
}
function pct(a,b){return b>0?Math.max(0,Math.min(100,a/b*100)):0}
function datePT(d){if(!d)return "—";return new Date(d+"T12:00:00").toLocaleDateString("pt-PT")}
function iconFor(type){return ({savings:"▣",car:"▤",insurance:"◇",travel:"✦",goal:"◎",other:"•••"})[type]||"▣"}

function render(){
 $("monthButton").textContent=monthLabel(selectedMonth)+"⌄";
 $("monthRange").textContent=`01/${selectedMonth.slice(5)}/${selectedMonth.slice(0,4)} até ${daysInMonth(selectedMonth)}/${selectedMonth.slice(5)}/${selectedMonth.slice(0,4)} (${daysInMonth(selectedMonth)} dias)`;
 const income=incomeForMonth(selectedMonth),spent=spentForMonth(selectedMonth),returned=returnedForMonth(selectedMonth),reserve=pendingReserves(selectedMonth),avail=availableBudget(selectedMonth);
 const today=new Date(); const currentK=month(); const isCurrent=selectedMonth===currentK;
 const dayLeft=isCurrent?Math.max(1,daysInMonth(selectedMonth)-today.getDate()+1):daysInMonth(selectedMonth);
 $("availableValue").textContent=euro(avail); $("dailyValue").textContent=euro(avail/dayLeft); $("daysLeft").textContent=dayLeft;
 $("receivedValue").textContent=euro(income); $("receivedCount").textContent=`${db.transactions.filter(t=>t.type==="income"&&t.budgetMonth===selectedMonth&&t.countsBudget!==false).length} movimentos`;
 const next=nextMonth(selectedMonth);
 const nextIncome=incomeForMonth(next);
 $("nextIncomeValue").textContent=euro(nextIncome); $("nextIncomeText").textContent=nextIncome?monthLabel(next):"Nenhuma receita prevista";
 $("stateReceived").textContent=euro(income);$("stateSpent").textContent=euro(spent);$("stateReserve").textContent=euro(reserve);$("stateReturned").textContent=euro(returned);$("stateAvailable").textContent=euro(avail);
 $("stateReceivedPct").textContent=`${Math.round(pct(income,income||1))}%`; $("stateSpentPct").textContent=`${Math.round(pct(spent,income))}%`; $("stateReservePct").textContent=`${Math.round(pct(reserve,income))}%`; $("stateReturnedPct").textContent=`${Math.round(pct(returned,income))}%`; $("stateAvailablePct").textContent=`${Math.round(pct(avail,income))}%`;
 $("availablePct").textContent=`${Math.round(pct(avail,income))}%`;
 $("budgetDonut").style.background=`conic-gradient(var(--brand) ${pct(avail,income)*3.6}deg,var(--card2) 0)`;
 $("budgetProgress").style.width=`${Math.min(100,pct(spent+reserve,income))}%`;
 $("reserveTotal").textContent=euro(reserve);
 const bills=pendingBills(selectedMonth);$("billTotal").textContent=euro(bills.reduce((s,b)=>s+Number(b.amount||0),0));$("billCount").textContent=`${bills.length} ${bills.length===1?"despesa":"despesas"}`;
 renderReserves();renderExpenses();renderWealth();renderCar();renderInsights();renderActivity();
}
function renderReserves(){
 const list=$("reserveList"); const arr=db.reserves.filter(r=>r.month===selectedMonth&&!r.cancelled&&!r.transferred);
 if(!arr.length){list.innerHTML='<div class="muted" style="padding:14px 0;font-size:11px">Nenhuma reserva pendente neste mês.</div>';return}
 list.innerHTML=arr.map(r=>`<article class="reserve-row"><span class="reserve-icon">${iconFor(r.type)}</span><div class="reserve-main"><strong>${esc(r.name)}</strong><small>${r.objective?esc(r.objective):"Reserva pendente"}</small><div class="reserve-actions"><button class="mini-btn" data-edit-reserve="${r.id}">Editar</button><button class="mini-btn warning" data-withdraw-reserve="${r.id}">Retirar</button><button class="mini-btn primary" data-transfer-reserve="${r.id}">Transferir</button><button class="mini-btn danger" data-cancel-reserve="${r.id}">Cancelar</button></div></div><div class="reserve-value"><strong>${euro(r.amount)}</strong><small>${r.period==="monthly"?"Mensal":r.period==="annual"?"Anual":"Uma vez"}</small></div></article>`).join("");
}
function renderExpenses(){
 const pending=pendingBills(selectedMonth),paid=paidBills(selectedMonth);
 $("expensePendingTotal").textContent=euro(pending.reduce((s,b)=>s+Number(b.amount||0),0));
 $("expenseList").innerHTML=pending.length?pending.map((b,i)=>`<article class="bill-row"><span class="row-icon">${i%2?"▤":"▥"}</span><div class="row-main"><strong>${esc(b.description)}</strong><small>${b.dueDay?`Dia ${b.dueDay} · `:""}${b.recurring==="monthly"?"mensal":"apenas este mês"}</small><div class="row-actions"><button class="mini-btn primary" data-pay-bill="${b.id}">Pagar</button><button class="mini-btn danger" data-delete-bill="${b.id}">Eliminar</button></div></div><div class="row-value"><strong class="red-text">${euro(b.amount)}</strong><small class="red-text">Por pagar</small></div></article>`).join(""):'<div class="muted" style="padding:16px 0;font-size:11px">Não existem despesas por pagar neste mês.</div>';
 $("paidExpenseList").innerHTML=paid.length?paid.map(b=>`<article class="bill-row"><span class="row-icon">✓</span><div class="row-main"><strong>${esc(b.description)}</strong><small>${datePT(b.payment.date)} · Paga</small></div><div class="row-value"><strong class="green-text">${euro(b.payment.amount)}</strong></div></article>`).join(""):'<div class="muted" style="padding:16px 0;font-size:11px">Ainda não existem despesas pagas neste mês.</div>';
}
function renderWealth(){
 $("wealthAvailable").textContent=euro(wealthAvailable());$("wealthWithReserve").textContent=euro(round(wealthAvailable()+pendingReserves(selectedMonth)));
 const b=db.balances;
 $("balanceGrid").innerHTML=[["Conta corrente","current"],["Poupança","savings"],["Dinheiro a render","yield"],["Fundo carro","carFund"]].map(([n,k])=>`<article class="balance-card"><span>${n}</span><strong>${euro(b[k])}</strong></article>`).join("");
 const saved=savedReserves();
 $("savedReserveList").innerHTML=saved.length?saved.map(r=>`<article class="reserve-row"><span class="reserve-icon">${iconFor(r.type)}</span><div class="reserve-main"><strong>${esc(r.name)}</strong><small>Guardado · ${accountNames[r.destination]||r.destination}</small></div><div class="reserve-value"><strong class="green-text">${euro(r.savedAmount||r.amount)}</strong></div></article>`).join(""):'<div class="muted" style="padding:14px 0;font-size:11px">Ainda não tens reservas transferidas.</div>';
}
function renderCar(){
 const l=db.loan; $("carBalance").textContent=euro(l.balance);$("carPayment").textContent=euro(l.payment);$("carInitial").textContent=euro(l.initial);$("carNext").textContent=l.next?datePT(l.next):"—";$("carProgress").style.width=`${l.initial?pct(l.initial-l.balance,l.initial):0}%`;
 const h=Array.isArray(l.history)?[...l.history].reverse():[];
 $("carHistory").innerHTML=h.length?h.map(x=>`<article class="history-row"><span class="row-icon">◎</span><div class="row-main"><strong>${esc(x.desc||"Prestação mensal")}</strong><small>${datePT(x.date)}</small></div><div class="row-value"><strong>${euro(x.amount||x.total)}</strong></div></article>`).join(""):'<div class="muted" style="padding:14px 0;font-size:11px">Ainda não existem pagamentos registados.</div>';
}
function renderInsights(){
 const inc=incomeForMonth(selectedMonth),exp=spentForMonth(selectedMonth),res=pendingReserves(selectedMonth);
 $("insIncome").textContent=euro(inc);$("insExpense").textContent=euro(exp);$("insReserve").textContent=euro(res);$("insRate").textContent=`${Math.round(pct(availableBudget(selectedMonth),inc))}%`;
}
function renderActivity(){
 const arr=[...txForMonth(selectedMonth)].sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,10);
 $("activityList").innerHTML=arr.length?arr.map(t=>`<article class="activity-row"><span class="row-icon">${t.type==="income"?"↓":t.type==="expense"?"↑":"↔"}</span><div class="row-main"><strong>${esc(t.description||"Movimento")}</strong><small>${datePT(t.date)} · ${esc(t.category||"Movimento")}</small></div><div class="row-value"><strong class="${t.type==="income"?"green-text":t.type==="expense"?"red-text":""}">${t.type==="income"?"+":t.type==="expense"?"−":""}${euro(t.amount)}</strong></div></article>`).join(""):'<div class="muted" style="padding:14px 0;font-size:11px">Sem atividade neste mês.</div>';
}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function open(id){$(id).showModal()}
function closeDialogs(){document.querySelectorAll("dialog[open]").forEach(d=>d.close())}

document.addEventListener("click",e=>{
 const pageBtn=e.target.closest("[data-page]"); if(pageBtn&&!pageBtn.closest("dialog")){showPage(pageBtn.dataset.page);return}
 const openBtn=e.target.closest("[data-open]");if(openBtn){open(openBtn.dataset.open);return}
 const close=e.target.closest("[data-close]");if(close){close.closest("dialog").close();return}
 const edit=e.target.closest("[data-edit-reserve]");if(edit)startEdit(edit.dataset.editReserve);
 const wd=e.target.closest("[data-withdraw-reserve]");if(wd)startWithdraw(wd.dataset.withdrawReserve);
 const tr=e.target.closest("[data-transfer-reserve]");if(tr)startTransfer(tr.dataset.transferReserve);
 const ca=e.target.closest("[data-cancel-reserve]");if(ca)startCancel(ca.dataset.cancelReserve);
 const pb=e.target.closest("[data-pay-bill]");if(pb)startPayBill(pb.dataset.payBill);
 const dbb=e.target.closest("[data-delete-bill]");if(dbb)deleteBill(dbb.dataset.deleteBill);
});
function showPage(p){document.querySelectorAll(".page").forEach(x=>x.classList.toggle("active",x.id==="page-"+p));document.querySelectorAll(".bottom-nav button[data-page]").forEach(x=>x.classList.toggle("active",x.dataset.page===p));window.scrollTo({top:0,behavior:"smooth"})}

$("themeToggle").onclick=()=>{db.theme=db.theme==="dark"?"light":"dark";document.documentElement.dataset.theme=db.theme;save()};
$("monthButton").onclick=()=>{renderMonthOptions();open("incomeMonthDialog")};
function renderMonthOptions(){const months=[];let k=month();for(let i=-6;i<=6;i++){let d=new Date(k+"-01");d.setMonth(d.getMonth()+i);let x=d.toISOString().slice(0,7);months.push(x)}$("monthOptions").innerHTML=months.map(k=>`<button class="month-option ${k===selectedMonth?"active":""}" data-month-option="${k}">${monthLabel(k)}</button>`).join("")}
$("monthOptions").addEventListener("click",e=>{const b=e.target.closest("[data-month-option]");if(!b)return;selectedMonth=b.dataset.monthOption;$("incomeMonthDialog").close();render()});

document.querySelectorAll(".tabs button").forEach(b=>b.onclick=()=>{moveMode=b.dataset.mode;document.querySelectorAll(".tabs button").forEach(x=>x.classList.remove("active"));b.classList.add("active");updateMovementMode()});
function updateMovementMode(){
 const income=moveMode==="income", transfer=moveMode==="transfer";
 $("toField").hidden=!transfer;$("kindField").hidden=!income;$("categoryField").hidden=transfer;$("budgetChoice").hidden=!income;
 $("movementIntro").innerHTML=income?"↓ <span><b>Dinheiro a entrar</b><small>Regista aqui os teus recebimentos</small></span>":transfer?"↔ <span><b>Transferir dinheiro</b><small>Move dinheiro entre contas</small></span>":"↑ <span><b>Dinheiro a sair</b><small>Regista aqui as tuas despesas</small></span>";
 $("movementSubmit").textContent=income?"Guardar receita":transfer?"Guardar transferência":"Guardar despesa";
}
$("movementForm").addEventListener("submit",e=>{
 e.preventDefault();const amount=round($("mAmount").value),date=$("mDate").value,desc=$("mDesc").value.trim();if(!(amount>0)||!date)return;
 if(moveMode==="income"){
  const kind=$("mKind").value, choice=document.querySelector('input[name="budgetMonth"]:checked')?.value||"auto";let bm=choice==="current"?month():choice==="next"?nextMonth(month()):autoBudgetMonth(date,kind);
  db.balances.current=round(db.balances.current+amount);addTx({type:"income",description:desc,amount,date,category:$("mCategory").value||kind,budgetMonth:bm,countsBudget:true,kind});
 }else if(moveMode==="expense"){
  const from=$("mFrom").value;if(Number(db.balances[from]||0)<amount)return alert("Saldo insuficiente.");db.balances[from]=round(db.balances[from]-amount);addTx({type:"expense",description:desc,amount,date,category:$("mCategory").value||"Outros"});
 }else{
  const from=$("mFrom").value,to=$("mTo").value;if(from===to)return alert("Escolhe contas diferentes.");if(Number(db.balances[from]||0)<amount)return alert("Saldo insuficiente.");db.balances[from]=round(db.balances[from]-amount);if(to!=="external")db.balances[to]=round(db.balances[to]+amount);addTx({type:"transfer",description:desc,amount,date,from,to});
 }
 save();e.target.reset();$("mDate").value=iso();$("movementDialog").close();render();
});
$("rDate").value=iso();
$("reserveForm").addEventListener("submit",e=>{e.preventDefault();const amount=round($("rAmount").value);if(!(amount>0))return;db.reserves.push({id:crypto.randomUUID(),name:$("rName").value.trim(),amount,month:selectedMonth,type:$("rType").value,destination:$("rDestination").value,period:$("rPeriod").value,date:$("rDate").value,transferred:false,cancelled:false});save();e.target.reset();$("rDate").value=iso();$("reserveDialog").close();render()});

function startEdit(id){const r=db.reserves.find(x=>x.id===id);if(!r)return;$("editReserveId").value=id;$("editName").value=r.name;$("editAmount").value=r.amount;open("editReserveDialog")}
$("editReserveForm").addEventListener("submit",e=>{e.preventDefault();const r=db.reserves.find(x=>x.id===$("editReserveId").value);if(!r)return;r.name=$("editName").value.trim();r.amount=round($("editAmount").value);save();$("editReserveDialog").close();render()});
function startWithdraw(id){const r=db.reserves.find(x=>x.id===id);if(!r)return;$("withdrawId").value=id;$("withdrawName").textContent=r.name;$("withdrawCurrent").textContent=euro(r.amount);$("withdrawAmount").value="";$("withdrawMax").onclick=()=>$("withdrawAmount").value=r.amount;open("withdrawReserveDialog")}
$("withdrawForm").addEventListener("submit",e=>{e.preventDefault();const r=db.reserves.find(x=>x.id===$("withdrawId").value),a=round($("withdrawAmount").value);if(!r||a<=0||a>r.amount)return alert("Valor inválido.");r.amount=round(r.amount-a);db.balances.current=round(db.balances.current+a);if(r.amount<=0)r.cancelled=true;save();$("withdrawReserveDialog").close();render()});
function startTransfer(id){const r=db.reserves.find(x=>x.id===id);if(!r)return;activeTransfer=r;$("transferReserveName").textContent=r.name;$("transferReserveValue").textContent=euro(r.amount);$("tAmount").value=r.amount;open("transferDialog")}
$("tMax").onclick=()=>{if(activeTransfer)$("tAmount").value=activeTransfer.amount};
$("transferForm").addEventListener("submit",e=>{e.preventDefault();if(!activeTransfer)return;const a=round($("tAmount").value);if(a<=0||a>activeTransfer.amount)return alert("Valor inválido.");$("confirmTransferTitle").textContent=`Vais transferir ${euro(a)}`;$("confirmTransferText").textContent=`De: Reserva pendente — ${activeTransfer.name} · Para: ${accountNames[$("tDestination").value]||$("tDestination").value}`;activeTransfer.transferAmount=a;activeTransfer.transferDestination=$("tDestination").value;$("transferDialog").close();open("confirmTransferDialog")});
$("confirmTransferBtn").onclick=()=>{if(!activeTransfer)return;const a=activeTransfer.transferAmount,d=activeTransfer.transferDestination,key=reserveDestinationKey(d);if(key){db.balances[key]=round(db.balances[key]+a)}activeTransfer.amount=round(activeTransfer.amount-a);if(activeTransfer.amount<=0)activeTransfer.transferred=true;activeTransfer.savedAmount=round((activeTransfer.savedAmount||0)+a);save();$("confirmTransferDialog").close();activeTransfer=null;render()};

function startCancel(id){const r=db.reserves.find(x=>x.id===id);if(!r)return;activeReserveId=id;$("cancelReserveText").textContent=`Reserva: ${r.name} · ${euro(r.amount)}`;open("cancelReserveDialog")}
$("confirmCancelReserve").onclick=()=>{const r=db.reserves.find(x=>x.id===activeReserveId);if(r){r.cancelled=true;db.balances.current=round(db.balances.current+r.amount);save()}$("cancelReserveDialog").close();activeReserveId=null;render()};

$("billForm").addEventListener("submit",e=>{e.preventDefault();db.bills.push({id:crypto.randomUUID(),description:$("bDesc").value.trim(),amount:round($("bAmount").value),day:Number($("bDay").value)||null,category:$("bCategory").value,recurring:$("bRecurring").value,month:selectedMonth,payments:{}});save();e.target.reset();$("billCategory").value="Contas";$("billDialog").close();render()});
function startPayBill(id){const b=db.bills.find(x=>x.id===id);if(!b)return;$("payBillId").value=id;$("payBillName").textContent=b.description;$("payBillExpected").textContent=euro(b.amount);$("payBillAmount").value=b.amount;$("payBillDate").value=iso();open("payBillDialog")}
$("payBillForm").addEventListener("submit",e=>{e.preventDefault();const b=db.bills.find(x=>x.id===$("payBillId").value),a=round($("payBillAmount").value),src=$("payBillSource").value;if(!b||a<=0)return;if(Number(db.balances[src]||0)<a)return alert("Saldo insuficiente.");db.balances[src]=round(db.balances[src]-a);b.payments=b.payments||{};b.payments[String($("payBillDate").value).slice(0,7)]={amount:a,date:$("payBillDate").value,source:src};addTx({type:"expense",description:b.description,amount:a,date:$("payBillDate").value,category:b.category||"Contas"});save();$("payBillDialog").close();render()});
function deleteBill(id){if(!confirm("Eliminar esta despesa por pagar?"))return;db.bills=db.bills.filter(x=>x.id!==id);save();render()}

$("carForm").addEventListener("submit",e=>{e.preventDefault();db.loan={initial:round($("cInitial").value),balance:round($("cBalance").value),payment:round($("cPayment").value),rate:round($("cRate").value),next:$("cNext").value,history:db.loan.history||[]};save();$("carDialog").close();render()});
$("closeMonthBtn").onclick=()=>open("closeDialog");
$("confirmCloseMonth").onclick=()=>{db.closedMonths[selectedMonth]=true;save();$("closeDialog").close();render()};

$("mDate").value=iso();$("cInitial").value=db.loan.initial||0;$("cBalance").value=db.loan.balance||0;$("cPayment").value=db.loan.payment||0;$("cRate").value=db.loan.rate||0;$("cNext").value=db.loan.next||"";
document.documentElement.dataset.theme=db.theme||"dark";updateMovementMode();render();
if("serviceWorker"in navigator)navigator.serviceWorker.register("sw.js?v=28.0.0").catch(()=>{});
})();