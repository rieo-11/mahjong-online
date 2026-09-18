const { createClient } = window.supabase;

const $ = (id) => document.getElementById(id);
const lobby = $("lobby"), roomView = $("room");
let roomId = null, myUid = crypto.randomUUID(), mySeat = null;
let selectedIndex = null, roomState = null, channel = null;

const TILE_TYPES = ["1m","2m","3m","4m","5m","6m","7m","8m","9m","1p","2p","3p","4p","5p","6p","7p","8p","9p","1s","2s","3s","4s","5s","6s","7s","8s","9s","1z","2z","3z","4z","5z","6z","7z"];
const SYMBOL = {1:"🀇",2:"🀈",3:"🀉",4:"🀊",5:"🀋",6:"🀌",7:"🀍",8:"🀎",9:"🀏"};
function tileLabel(t){ const n=Number(t[0]),s=t[1]; if(s==="m")return SYMBOL[n]; if(s==="p")return ["","🀙","🀚","🀛","🀜","🀝","🀞","🀟","🀠"][n]; if(s==="s")return ["","🀐","🀑","🀒","🀓","🀔","🀕","🀖","🀗"][n]; return ["","🀀","🀁","🀂","🀃","🀄","🀅","🀆"][n] || t; }

function makeWall(){
  const a=[]; for(const t of TILE_TYPES) for(let i=0;i<4;i++) a.push(t);
  for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}
  return a;
}
function freshState(){
  const wall=makeWall(), players=[];
  for(let i=0;i<4;i++) players.push({uid:null,name:"空席",seat:i,hand:[],score:25000});
  for(let i=0;i<4;i++) players[i].hand=wall.splice(0,13);
  return {players,wall,turn:0,phase:"waiting",discardPile:[],started:false};
}
function cleanState(s){ return JSON.parse(JSON.stringify(s)); }

async function getUser(){
  const {data} = await window.sb.auth.getSession();
  if(!data.session){
    const r=await window.sb.auth.signInAnonymously();
    if(r.error) throw r.error;
  }
  const {data: d} = await window.sb.auth.getUser();
  return d.user;
}
async function loadRoom(id){
  const {data,error}=await window.sb.from("mahjong_rooms").select("*").eq("room_id",id).maybeSingle();
  if(error) throw error;
  return data;
}
async function saveRoom(){
  const {error}=await window.sb.from("mahjong_rooms").upsert({
    room_id:roomId,state:cleanState(roomState),updated_at:new Date().toISOString()
  });
  if(error) throw error;
}
function randomRoom(){return Math.random().toString(36).slice(2,8).toUpperCase()}

async function enterRoom(id, creating=false){
  const user=await getUser(); myUid=user.id; roomId=id.toUpperCase();
  let row=await loadRoom(roomId);
  if(!row){
    if(!creating) throw new Error("その部屋は見つかりません");
    roomState=freshState();
    await saveRoom();
  } else roomState=row.state;

  const name=($("nameInput").value||"ゲスト").trim().slice(0,12);
  let p=roomState.players.find(x=>x.uid===myUid);
  if(!p){
    p=roomState.players.find(x=>!x.uid);
    if(!p) throw new Error("この部屋は満員です");
    p.uid=myUid; p.name=name||"ゲスト";
    const occupied=roomState.players.filter(x=>x.uid).length;
    if(occupied===4 && !roomState.started){
      roomState.started=true; roomState.phase="playing"; roomState.turn=0;
    }
    await saveRoom();
  }
  mySeat=p.seat;
  render();
  lobby.classList.add("hidden"); roomView.classList.remove("hidden");
  history.replaceState({}, "", `${location.pathname}?room=${roomId}`);

  if(channel) await window.sb.removeChannel(channel);
  channel=window.sb.channel(`room:${roomId}`);
  channel.on("postgres_changes",{event:"UPDATE",schema:"public",table:"mahjong_rooms",filter:`room_id=eq.${roomId}`},
    payload=>{roomState=payload.new.state; render();});
  channel.on("postgres_changes",{event:"INSERT",schema:"public",table:"mahjong_rooms",filter:`room_id=eq.${roomId}`},
    payload=>{roomState=payload.new.state; render();});
  await channel.subscribe();
}

function render(){
  if(!roomState)return;
  $("roomIdLabel").textContent=roomId;
  $("wallCount").textContent=roomState.wall.length;
  $("turnLabel").textContent=roomState.started ? `東${roomState.turn+1}局` : "待機中";
  $("gameMessage").textContent=roomState.started ? `現在の手番: ${roomState.players[roomState.turn]?.name||"?"}` : "4人揃うと開始できます";
  for(let i=0;i<4;i++){
    const el=$(`seat${i}`),p=roomState.players[i];
    el.innerHTML=`<div class="player"><b>${p.name}</b><br>${p.score.toLocaleString()}点</div>`;
  }
  const me=roomState.players[mySeat];
  $("hand").innerHTML="";
  (me?.hand||[]).forEach((t,i)=>{
    const d=document.createElement("div"); d.className="tile"+(selectedIndex===i?" selected":""); d.textContent=tileLabel(t);
    d.onclick=()=>{selectedIndex=i;render()}; $("hand").appendChild(d);
  });
  const myTurn=roomState.started && roomState.turn===mySeat;
  $("drawBtn").disabled=!myTurn || me.hand.length!==13 || roomState.wall.length===0;
  $("discardBtn").disabled=!myTurn || selectedIndex===null || me.hand.length!==14;
}

$("createBtn").onclick=async()=>{try{await enterRoom(randomRoom(),true)}catch(e){$("status").textContent=e.message}};
$("joinBtn").onclick=async()=>{try{await enterRoom($("roomInput").value,false)}catch(e){$("status").textContent=e.message}};
$("copyBtn").onclick=async()=>{await navigator.clipboard.writeText(location.href);$("gameMessage").textContent="招待URLをコピーしました！"};
$("drawBtn").onclick=async()=>{
  const s=cleanState(roomState),p=s.players[mySeat];
  if(s.wall.length){p.hand.push(s.wall.pop());await updateAfterAction(s)}
};
$("discardBtn").onclick=async()=>{
  const s=cleanState(roomState),p=s.players[mySeat];
  if(selectedIndex===null)return;
  s.discardPile.push(p.hand.splice(selectedIndex,1)[0]); selectedIndex=null;
  s.turn=(s.turn+1)%4; await updateAfterAction(s);
};
async function updateAfterAction(s){
  roomState=s; render(); await saveRoom();
}

(async()=>{
  const id=new URLSearchParams(location.search).get("room");
  if(id) $("roomInput").value=id;
})();
