/* ATELIER Google Drive sync — OAuth browser token, drive.file scope */
(()=>{
let token=null, client=null, busy=false;
const folderName='ATELIER', scope='https://www.googleapis.com/auth/drive.file';
const el=(id)=>document.getElementById(id);
const status=(s)=>{el('driveStatus').textContent=s};
const auth=async()=>{const id=el('googleClientId').value.trim();if(!/^\d+-[\w-]+\.apps\.googleusercontent\.com$/.test(id))throw Error('Inserisci un OAuth Client ID Google valido.');localStorage.setItem('atelier_google_client_id',id);if(!window.google?.accounts?.oauth2)throw Error('Google Identity Services non è stato caricato.');return new Promise((resolve,reject)=>{client=google.accounts.oauth2.initTokenClient({client_id:id,scope,prompt:'consent',callback:r=>r.error?reject(Error(r.error)):((token=r.access_token),resolve())});client.requestAccessToken()})};
const request=async(path,options={})=>{if(!token)throw Error('Collega prima Google Drive.');const r=await fetch('https://www.googleapis.com/drive/v3/'+path,{...options,headers:{Authorization:'Bearer '+token,...options.headers}});if(!r.ok){if(r.status===401)token=null;throw Error('Google Drive HTTP '+r.status+': '+(await r.text()).slice(0,180))}return r.status===204?null:r.json()};
const list=async(q)=>{let page='',out=[];do{const r=await request('files?'+new URLSearchParams({q,fields:'nextPageToken,files(id,name,mimeType,parents)',pageSize:'1000',...(page?{pageToken:page}:{})}));out.push(...r.files);page=r.nextPageToken||''}while(page);return out};
const upload=async(name,parent,content,existing)=>{const metadata={name,mimeType:'application/json',parents:[parent]};const boundary='atelier'+Math.random().toString(36).slice(2);const body='--'+boundary+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'+JSON.stringify(existing?{name}:metadata)+'\r\n--'+boundary+'\r\nContent-Type: application/json\r\n\r\n'+JSON.stringify(content)+'\r\n--'+boundary+'--';const endpoint=existing?'https://www.googleapis.com/upload/drive/v3/files/'+existing+'?uploadType=multipart':'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';const r=await fetch(endpoint,{method:existing?'PATCH':'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'multipart/related; boundary='+boundary},body});if(!r.ok)throw Error('Salvataggio Drive non riuscito: '+r.status);return r.json()};
let folderId=null;
const ensureFolder=async()=>{if(folderId)return folderId;const folders=await list("name = 'ATELIER' and mimeType = 'application/vnd.google-apps.folder' and trashed = false");if(folders.length)return folderId=folders[0].id;const r=await request('files',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:folderName,mimeType:'application/vnd.google-apps.folder'})});return folderId=r.id};
const cloudFiles=async()=>list("'"+await ensureFolder()+"' in parents and mimeType = 'application/json' and trashed = false");
const read=async(id)=>{const r=await fetch('https://www.googleapis.com/drive/v3/files/'+id+'?alt=media',{headers:{Authorization:'Bearer '+token}});if(!r.ok)throw Error('Impossibile leggere archivio Drive');return r.json()};
const sync=async()=>{if(busy||!token)return;busy=true;el('syncDrive').disabled=true;try{status('Sincronizzazione in corso…');const remote=await cloudFiles();const map=new Map(remote.map(f=>[f.name,f.id]));const local=await all();const localIds=new Set(local.map(x=>x.id));let downloaded=0,uploaded=0;
for(const f of remote){if(!f.name.startsWith('garment-'))continue;const item=await read(f.id);if(item?.id&&!localIds.has(item.id)){await put(item);downloaded++}}
for(const item of local){const name='garment-'+item.id+'.json';if(!map.has(name)){await upload(name,await ensureFolder(),item);uploaded++}}
await renderSaved();status('Sincronizzato · '+downloaded+' scaricati · '+uploaded+' caricati');}catch(e){status('Errore: '+e.message)}finally{busy=false;el('syncDrive').disabled=false}};
el('googleClientId').value=localStorage.getItem('atelier_google_client_id')||'';
el('connectDrive').onclick=async()=>{try{status('Autorizzazione Google…');await auth();status('Drive collegato.');await sync()}catch(e){status('Errore: '+e.message)}};
el('syncDrive').onclick=sync;
window.atelierDriveSync=sync;
window.atelierDriveDelete=async(id)=>{if(!token)return;try{const files=await cloudFiles();const f=files.find(f=>f.name==='garment-'+id+'.json');if(f){await fetch('https://www.googleapis.com/drive/v3/files/'+f.id,{method:'DELETE',headers:{Authorization:'Bearer '+token}})}}catch(e){status('Eliminazione cloud non riuscita: '+e.message)}};
})();
