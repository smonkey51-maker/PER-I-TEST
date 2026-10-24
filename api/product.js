/* Import public product metadata and an image without exposing a generic fetch proxy.
   Requires a valid Google access token already used by ATELIER. */
import dns from 'node:dns/promises';
import net from 'node:net';

const CLIENT_ID=process.env.GOOGLE_CLIENT_ID||'530904624660-3r2eacr82jaae7bio9r78vlol7mosphh.apps.googleusercontent.com';
const ALLOWED=(process.env.ALLOWED_EMAILS||'').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
function publicIp(ip){
  if(net.isIP(ip)===4){const a=ip.split('.').map(Number);return !(a[0]===0||a[0]===10||a[0]===127||a[0]>=224||(a[0]===169&&a[1]===254)||(a[0]===172&&a[1]>=16&&a[1]<=31)||(a[0]===192&&a[1]===168)||(a[0]===100&&a[1]>=64&&a[1]<=127)||(a[0]===192&&a[1]===0)||(a[0]===198&&[18,19].includes(a[1])));}
  if(net.isIP(ip)===6)return !(/^(::|::1$|fe80:|fc|fd|ff|2001:db8:)/i.test(ip)||ip.startsWith('::ffff:'));
  return false;
}
async function validate(value){
  const url=new URL(value);
  if(url.protocol!=='https:'||url.username||url.password||url.port&&url.port!=='443'||url.hostname.length>253)throw Error('È richiesto un URL HTTPS pubblico.');
  if(net.isIP(url.hostname)||url.hostname==='localhost'||url.hostname.endsWith('.local')||url.hostname.endsWith('.internal'))throw Error('Dominio non consentito.');
  const addresses=await dns.lookup(url.hostname,{all:true,verbatim:true});
  if(!addresses.length||addresses.some(a=>!publicIp(a.address)))throw Error('Destinazione non pubblica.');
  return url;
}
async function readResponse(res,limit){
  const declared=Number(res.headers.get('content-length')||0);
  if(declared>limit)throw Error('File troppo grande.');
  const reader=res.body.getReader(),chunks=[];let size=0;
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>limit){await reader.cancel();throw Error('File troppo grande.');}chunks.push(value);}
  return Buffer.concat(chunks.map(x=>Buffer.from(x)),size);
}
async function safeFetch(value,accept,limit){
  let url=await validate(value);
  for(let i=0;i<4;i++){
    const res=await fetch(url.href,{redirect:'manual',headers:{'Accept':accept,'User-Agent':'Mozilla/5.0 (compatible; ATELIER/1.0)'},signal:AbortSignal.timeout(9000)});
    if([301,302,303,307,308].includes(res.status)){const loc=res.headers.get('location');if(!loc)throw Error('Redirect non valido.');url=await validate(new URL(loc,url).href);continue;}
    if(!res.ok)throw Error('Il negozio non ha risposto.');
    return {url,contentType:res.headers.get('content-type')||'',bytes:await readResponse(res,limit)};
  }
  throw Error('Troppi reindirizzamenti.');
}
function meta(html,key){
  const tags=html.match(/<meta\b[^>]*>/gi)||[];
  for(const tag of tags){
    const attrs={};for(const m of tag.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/gs))attrs[m[1].toLowerCase()]=m[3];
    if((attrs.property||attrs.name||'').toLowerCase()===key.toLowerCase())return attrs.content||'';
  }
  return '';
}
function decode(s){return String(s||'').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').trim().slice(0,200);}
async function authorized(req){
  const m=/^Bearer (.+)$/.exec(req.headers.authorization||'');if(!m)return false;
  const r=await fetch('https://oauth2.googleapis.com/tokeninfo?access_token='+encodeURIComponent(m[1]),{signal:AbortSignal.timeout(5000)});
  if(!r.ok)return false;const info=await r.json();
  return (info.aud===CLIENT_ID||info.azp===CLIENT_ID)&&(!ALLOWED.length||ALLOWED.includes(String(info.email||'').toLowerCase()));
}
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST')return res.status(405).json({error:'Metodo non supportato.'});
  try{
    if(!await authorized(req))return res.status(401).json({error:'Accedi con Google per importare un prodotto.'});
    const input=String(req.body?.url||'');if(input.length>2048)return res.status(400).json({error:'URL troppo lungo.'});
    const page=await safeFetch(input,'text/html,image/*',1100000);
    let title='',brand='',price='',image='';
    if(page.contentType.startsWith('image/'))image=page.url.href;
    else if(page.contentType.includes('text/html')){
      const html=page.bytes.toString('utf8');
      title=decode(meta(html,'og:title')||meta(html,'twitter:title')||html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]);
      brand=decode(meta(html,'product:brand')||meta(html,'og:site_name'));
      price=decode(meta(html,'product:price:amount')||meta(html,'og:price:amount'));
      image=meta(html,'og:image:secure_url')||meta(html,'og:image')||meta(html,'twitter:image');
    }else throw Error('Formato del link non supportato.');
    let imageData=null;
    if(image){
      try{
        const picture=await safeFetch(new URL(decode(image),page.url).href,'image/*',5500000);
        if(/^image\/(jpeg|png|webp|gif)/i.test(picture.contentType))imageData='data:'+picture.contentType.split(';')[0]+';base64,'+picture.bytes.toString('base64');
      }catch{/* Metadata is still useful without an accessible photo. */}
    }
    return res.status(200).json({title,brand,price,imageData,source:page.url.origin});
  }catch(e){return res.status(422).json({error:e.message||'Impossibile importare il prodotto.'});}
}
