/* ATELIER — Google login + Drive consent, private drive.file access */
(()=>{
let token=null, busy=false, folderIds={}, signedInEmail=localStorage.getItem('atelier_google_email'), clientIdValue=null, refreshTimer=null;
const scope='openid email profile https://www.googleapis.com/auth/drive.file';
const el=id=>document.getElementById(id);
const status=s=>{el('driveStatus').textContent=s};
const setConnected=on=>{el('syncDrive').classList.toggle('hidden',!on);el('disconnectDrive').classList.toggle('hidden',!on);el('connectDrive').classList.toggle('hidden',on);el('accountDescription').textContent=on?'Connesso come '+(signedInEmail||'account Google')+'. I capi vengono sincronizzati con Drive.':'Accedi con Google per ritrovare i tuoi capi su ogni dispositivo.'};
const clientId=async()=>{if(clientIdValue)return clientIdValue;const r=await fetch('/api/config');const j=await r.json().catch(()=>({}));if(!r.ok||!/^\d+-[\w-]+\.apps\.googleusercontent\.com$/.test(j.googleClientId||''))throw Error(j.error||'Client ID Google non configurato sul server.');return clientIdValue=j.googleClientId};
const googleReady=async()=>{for(let i=0;i<50;i++){if(window.google?.accounts?.oauth2)return;await new Promise(r=>setTimeout(r,200))}throw Error('Servizio Google non caricato. Riprova.')};
const auth=async(interactive)=>{const id=await clientId();await googleReady();const hint=signedInEmail?{login_hint:signedInEmail}:{};const result=await new Promise((resolve,reject)=>{const c=google.accounts.oauth2.initTokenClient({client_id:id,scope,...hint,prompt:interactive?(localStorage.getItem('atelier_google_email')?'':'consent'):'none',callback:r=>r.error?reject(Error(r.error)):resolve(r),error_callback:e=>reject(Error(e.type||'Autorizzazione interrotta'))});c.requestAccessToken()});token=result.access_token;clearTimeout(refreshTimer);refreshTimer=setTimeout(()=>auth(false).catch(()=>{token=null;setConnected(false);status('Sessione scaduta: premi Accedi con Google.')}),Math.max(60,(+result.expires_in||3600)-120)*1000);if(!signedInEmail||interactive){const r=await fetch('https://www.googleapis.com/oauth2/v3/userinfo',{headers:{Authorization:'Bearer '+token}});if(!r.ok)throw Error('Impossibile verificare account Google');signedInEmail=(await r.json()).email;localStorage.setItem('atelier_google_email',signedInEmail)}setConnected(true)};
const request=async(path,options={},retried=false)=>{if(!token)throw Error('Accedi con Google.');const r=await fetch('https://www.googleapis.com/drive/v3/'+path,{...options,headers:{Authorization:'Bearer '+token,...options.headers}});if(!r.ok){if(r.status===401&&!retried){await auth(false);return request(path,options,true)}if(r.status===401){token=null;setConnected(false)}throw Error('Google Drive HTTP '+r.status+': '+(await r.text()).slice(0,180))}return r.status===204?null:r.json()};
const list=async(q)=>{let page='',out=[];do{const r=await request('files?'+new URLSearchParams({q,fields:'nextPageToken,files(id,name,mimeType,parents)',pageSize:'1000',...(page?{pageToken:page}:{})}));out.push(...r.files);page=r.nextPageToken||''}while(page);return out};
const upload=async(name,parent,content)=>{const boundary='atelier'+Math.random().toString(36).slice(2);const body='--'+boundary+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'+JSON.stringify({name,mimeType:'application/json',parents:[parent]})+'\r\n--'+boundary+'\r\nContent-Type: application/json\r\n\r\n'+JSON.stringify(content)+'\r\n--'+boundary+'--';const r=await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'multipart/related; boundary='+boundary},body});if(!r.ok)throw Error('Salvataggio Drive non riuscito: '+r.status);return r.json()};
const FOLDER_MIME='application/vnd.google-apps.folder';
// Struttura su Drive: ATELIER/Guardaroba (capi) e ATELIER/Looks (look)
const kinds=[['garment','garments','ATELIER/Guardaroba'],['look','looks','ATELIER/Looks']];
const ensureFolder=async(path='ATELIER')=>{
  if(folderIds[path])return folderIds[path];
  const key='atelier_folder_'+signedInEmail+'_'+path;
  const saved=localStorage.getItem(key);
  if(saved){
    try{const f=await request('files/'+saved+'?fields=id,trashed');if(f&&!f.trashed)return folderIds[path]=saved}catch(e){}
    localStorage.removeItem(key);
  }
  const parts=path.split('/'),name=parts.pop(),parent=parts.length?await ensureFolder(parts.join('/')):null;
  const found=await list("name = '"+name+"' and mimeType = '"+FOLDER_MIME+"' and trashed = false"+(parent?" and '"+parent+"' in parents":''));
  let id=found[0]?.id;
  if(!id){
    const r=await request('files',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,mimeType:FOLDER_MIME,...(parent?{parents:[parent]}:{})})});
    id=r.id;
  }
  localStorage.setItem(key,id);
  return folderIds[path]=id;
};
const cloudFiles=async(path)=>list("'"+await ensureFolder(path)+"' in parents and mimeType = 'application/json' and trashed = false");
const read=async(id)=>{const r=await fetch('https://www.googleapis.com/drive/v3/files/'+id+'?alt=media',{headers:{Authorization:'Bearer '+token}});if(!r.ok)throw Error('Impossibile leggere archivio Drive');return r.json()};
const pool=async(items,size,fn)=>{let next=0;await Promise.all(Array.from({length:Math.min(size,items.length)},async()=>{while(next<items.length)await fn(items[next++])}))};
// Sposta nelle sottocartelle i file salvati in passato direttamente dentro ATELIER
const migrate=async()=>{
  const root=await ensureFolder();
  const legacy=await list("'"+root+"' in parents and mimeType = 'application/json' and trashed = false");
  await pool(legacy,4,async f=>{
    const k=kinds.find(([kind])=>f.name.startsWith(kind+'-'));
    if(!k)return;
    const dest=await ensureFolder(k[2]);
    await request('files/'+f.id+'?'+new URLSearchParams({addParents:dest,removeParents:root,fields:'id'}),{method:'PATCH',headers:{'Content-Type':'application/json'},body:'{}'});
  });
};
const sync=async()=>{
  if(busy||!token)return;
  busy=true;el('syncDrive').disabled=true;
  try{
    status('Sincronizzazione in corso…');
    await migrate();
    let downloaded=0,uploaded=0;
    for(const [kind,store,path] of kinds){
      const remote=await cloudFiles(path),names=new Set(remote.map(f=>f.name));
      const local=await all(store),localIds=new Set(local.map(x=>x.id)),re=new RegExp('^'+kind+'-(.+)\\.json$');
      const missingHere=remote.filter(f=>{const m=re.exec(f.name);return m&&!localIds.has(m[1])});
      await pool(missingHere,5,async f=>{const item=await read(f.id);if(item?.id){await put(item,store);downloaded++}});
      const missingRemote=local.filter(item=>!names.has(kind+'-'+item.id+'.json'));
      const folder=await ensureFolder(path);
      await pool(missingRemote,3,async item=>{await upload(kind+'-'+item.id+'.json',folder,item);uploaded++});
    }
    await renderSaved();await renderLooks();
    status('Sincronizzato · '+downloaded+' scaricati · '+uploaded+' caricati');
  }catch(e){status('Errore: '+e.message)}
  finally{busy=false;el('syncDrive').disabled=false}
};
el('connectDrive').onclick=async()=>{try{status('Accesso Google…');await auth(true);for(const k of kinds)await ensureFolder(k[2]);await sync()}catch(e){status('Errore: '+e.message)}};
el('syncDrive').onclick=sync;
el('disconnectDrive').onclick=()=>{token=null;signedInEmail=null;folderIds={};clearTimeout(refreshTimer);localStorage.removeItem('atelier_google_email');setConnected(false);status('Disconnesso. I dati locali restano sul dispositivo.')};
window.atelierDriveSync=sync;
window.atelierDriveDelete=async(id,kind='garment')=>{
  if(!token){status('Eliminazione solo locale: accedi a Google per sincronizzare.');return}
  try{
    const path=kinds.find(k=>k[0]===kind)[2],files=await cloudFiles(path),f=files.find(f=>f.name===kind+'-'+id+'.json');
    if(f){const r=await fetch('https://www.googleapis.com/drive/v3/files/'+f.id,{method:'DELETE',headers:{Authorization:'Bearer '+token}});if(!r.ok)throw Error('HTTP '+r.status)}
    status('Rimosso dal Drive.');
  }catch(e){status('Eliminazione cloud non riuscita: '+e.message)}
};
document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync()});
if(signedInEmail){status('Accesso automatico…');auth(false).then(sync).catch(()=>{setConnected(false);status('Premi Accedi con Google per ricollegare Drive.')})}
})();
