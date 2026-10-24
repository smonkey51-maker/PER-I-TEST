/* ATELIER immersive shell: runs independently of wardrobe data and network. */
(() => {
 const opening=document.getElementById('atelierOpening');
 let done=false;
 function finish(){if(done)return;done=true;opening?.classList.add('is-finished');setTimeout(()=>opening?.remove(),360)}
 function start(){
   // The legacy intro is superseded by the visible HTML opening scene.
   try{sessionStorage.setItem('atelier_intro_seen','1')}catch{}
   if(!opening)return;
   if(matchMedia('(prefers-reduced-motion: reduce)').matches){opening.remove();return}
   requestAnimationFrame(()=>requestAnimationFrame(()=>opening.classList.add('is-opening')));
   setTimeout(finish,1650);
 }
 start();
 // Never trap the user behind an animation, even if a stylesheet fails.
 setTimeout(finish,2800);
 opening?.addEventListener('click',finish);
 function layout(){
   const home=document.querySelector('#view-today'),greet=home?.querySelector('.greet');
   if(!home||!greet)return;
   const weather=document.querySelector('#weather'),agenda=document.querySelector('#agenda');
   if(weather&&agenda&&!document.querySelector('.atelier-context')){
     const details=document.createElement('details');details.className='atelier-context';
     const summary=document.createElement('summary');summary.textContent='Meteo e impegni';details.append(summary,weather,agenda);
     const stage=document.querySelector('#atelierStage');
     if(stage)stage.after(details);else greet.after(details);
   }
   const outfit=home.querySelector('#todayContent>.idea-card:first-child');
   if(outfit){
     const heading=outfit.querySelector('h2');if(heading)heading.textContent='La proposta di oggi';
     const swap=outfit.querySelector('#atelierSwap');if(swap)swap.textContent='Cambia un capo';
   }
   const add=document.querySelector('.tab[data-tab="add"]');if(add)add.textContent='Aggiungi';
   const wardrobe=document.querySelector('.tab[data-tab="wardrobe"]');if(wardrobe)wardrobe.textContent='Armadio';
   const title=document.querySelector('#view-wardrobe .view-head h1');if(title&&title.firstChild?.nodeType===3)title.firstChild.textContent='Il tuo armadio ';
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(layout,0),{once:true});else setTimeout(layout,0);
})();
