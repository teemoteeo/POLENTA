#!/bin/zsh
# Percorre la demo nell'app (browser di cmux) con i tempi della registrazione: Moon → Aristarchus → Rover →
# Best on Earth (scroll) → Unexplored (scroll) → Near you Torino 1.500 → 3.000 km → primo risultato → scheda (scroll).
# Un cursore a freccia, come quello del computer, scivola su ogni elemento e clicca (senza effetti).
# Nasconde l'etichetta nera dei km accanto al pin (.dist), finché la modifica di Timoteo non è su main.
# Uso: demo-drive.sh <surface>   (la app deve essere già aperta sulla schermata iniziale)
S=${1:?surface del browser con la app}
js() { cmux browser $S eval "$1" >/dev/null 2>&1 }
HELP='window.__btn=(sel,t)=>[...document.querySelectorAll(sel)].find(b=>b.textContent.trim().startsWith(t));
window.__scroll=(to,ms)=>{const p=document.querySelector(".panel"),a=p.scrollTop,b=to==="end"?p.scrollHeight-p.clientHeight:to,t0=performance.now();
const f=n=>{const k=Math.min(1,(n-t0)/ms),e=k<.5?2*k*k:1-(-2*k+2)**2/2;p.scrollTop=a+(b-a)*e;if(k<1)requestAnimationFrame(f)};requestAnimationFrame(f)};
document.getElementById("__demo_css")?.remove();
document.head.appendChild(Object.assign(document.createElement("style"),{id:"__demo_css",textContent:".dist{display:none!important}"}));
document.getElementById("__cur")?.remove();
window.__cur=document.body.appendChild(Object.assign(document.createElement("div"),{id:"__cur"}));
__cur.innerHTML="<svg width=\"30\" height=\"44\" viewBox=\"-1 -1 19 28\"><path d=\"M0 0 L0 22 L5.6 16.8 L9.4 25.6 L13 24 L9.3 15.4 L16.6 15.4 Z\" fill=\"#000\" stroke=\"#fff\" stroke-width=\"1.5\" stroke-linejoin=\"round\"/></svg>";
__cur.style.cssText="position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;filter:drop-shadow(0 2px 3px rgba(0,0,0,.45));transform:translate(1180px,560px);transition:transform .8s cubic-bezier(.4,0,.2,1)";
window.__moveTo=el=>{const r=el.getBoundingClientRect();__cur.style.transform="translate("+(r.left+Math.min(r.width/2,120))+"px,"+(r.top+r.height/2)+"px)"};
window.__click=el=>{__moveTo(el);setTimeout(()=>el.click(),850)};"ok"'
js "$HELP"
echo "start $(date +%s.%N)"
sleep 1.5; js "__click(document.querySelector('button.planet[data-w=moon]'))"                 # Moon
sleep 4.5; js "__click(__btn('.panel button','Aristarchus Plateau'))"                          # sito
sleep 6.5; js "__click(__btn('.panel button','Rover mobility'))"                               # test → la Terra
sleep 5.5; js "__moveTo(document.querySelector('.panel')); __scroll('end',2200)"               # Best on Earth, scroll veloce
sleep 3.2; js "__scroll(0,1000)"
sleep 1.6; js "__click(__btn('.seg button','Unexplored'))"                                     # Unexplored
sleep 2.4; js "__moveTo(document.querySelector('.panel')); __scroll('end',3000)"
sleep 4.0; js "__scroll(0,1000)"
sleep 1.4; js "__click(__btn('.seg button','Near you'))"                                       # Near you · Turin · 1.500 km
sleep 6.3; js "__click(__btn('.seg button','3,000 km'))"                                       # 3.000 km
sleep 5.8; js "__click(document.querySelector('button.res'))"                                  # primo risultato → scheda
sleep 4.8; js "__moveTo(document.querySelector('.panel')); __scroll('end',9000)"               # scheda, scroll lento
sleep 10.5
echo "end $(date +%s.%N)"
