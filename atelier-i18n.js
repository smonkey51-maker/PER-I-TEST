/* ATELIER bilingual interface. Translates UI copy, never garment data or user input. */
(() => {
  'use strict';
  const KEY='atelier_language';
  const translations={
    'Oggi':'Today','Settimana':'Week','Guardaroba':'Wardrobe','Aggiungi':'Add','Sezioni':'Sections',
    'Meteo e impegni':'Weather & plans','Il look di oggi':"Today's look",
    'Indosso questo':"Wear this",'Un\'altra idea':'Another idea','Cambia un capo':'Swap an item',
    'Cambia un pezzo':'Swap an item','Scorri':'Swipe','Sopra':'Tops','Sotto':'Bottoms','Scarpe':'Shoes',
    'Capispalla':'Outerwear','Camicie':'Shirts','Accessori':'Accessories','Altro':'Other',
    'Maglieria':'Knitwear','Camicie e T-shirt':'Shirts & T-shirts','Pantaloni e jeans':'Trousers & jeans',
    'Giacche e capispalla':'Jackets & outerwear','Tutto':'All','Tutti':'All','Preferiti':'Favorites',
    'Pronti':'Available','In lavatrice':'In laundry','Per colore':'By color','Mai indossato':'Never worn',
    'La collezione ':'The collection ','La collezione':'The collection',
    'Il tuo guardaroba comincia da qui':'Your wardrobe starts here',
    'Fotografa i capi che ami: ogni mattina ATELIER ti suggerisce come abbinarli, tenendo conto del tempo e dei tuoi impegni.':'Photograph your favorite pieces: every morning ATELIER suggests outfits based on the weather and your plans.',
    'Fotografa i capi che ami: ATELIER li riconosce e li mette in ordine per te.':'Photograph your favorite pieces: ATELIER recognizes and organizes them for you.',
    'Aggiungi il primo capo':'Add your first item',
    'Il meteo orienta la scelta dei capi. La posizione serve solo a leggere le previsioni da Open-Meteo e resta su questo dispositivo.':'Weather helps select your outfit. Your location is used only for Open-Meteo forecasts and stays on this device.',
    'Usa la mia posizione':'Use my location','Scrivi la città':'Enter a city','Città':'City','Imposta':'Set',
    'Un impegno che non è nel calendario?':'Something not on your calendar?',
    'Aggiungi un impegno':'Add an event','Lavoro':'Work','Serata':'Evening out',
    'Cerimonia':'Ceremony','Sport':'Sports','Viaggio':'Travel','Tempo libero':'Leisure',
    'Descrivi un impegno':'Describe an event','Es. cena con Anna':'E.g. dinner with Anna',
    'I prossimi giorni':'Coming days',
    'Un outfit per ogni giorno, in base a impegni e meteo, senza ripetere gli stessi capi. I capi ancora in lavatrice sono segnalati.':'A daily outfit based on your plans and the weather, without repeating items. Laundry is excluded.',
    'Completa il guardaroba':'Complete your wardrobe','Nessun outfit completo disponibile':'No complete outfit available',
    'Cambia outfit':'Change outfit','capi in lavatrice':'items in laundry',
    'Signature looks':'Signature looks','Nuovo look':'New look','Nome del look':'Look name',
    'Composizione':'Composition','Salva look':'Save look','Annulla':'Cancel',
    'Capi dal tuo guardaroba (facoltativo)':'Items from your wardrobe (optional)',
    'Separa i capi con una virgola: quelli che non hai ancora nel guardaroba vengono aggiunti.':'Separate items with commas. Missing items will be added to your wardrobe.',
    'Ancora nessun look. Premi «Nuovo look» per crearne uno.':'No looks yet. Select “New look” to create one.',
    'Aggiungi capi':'Add items',
    'Scegli fino a 40 fotografie, oppure aggiungi un capo senza foto. Le immagini vengono inviate al servizio AI solo quando premi «Analizza».':'Choose up to 40 photos, or add an item without a photo. Photos are sent to the AI service only when you select Analyze.',
    'Scegli le fotografie':'Choose photos','Tocca qui oppure trascina i file':'Tap here or drop files',
    'Analizza le fotografie':'Analyze photos','Compila a mano':'Enter manually',
    'Aggiungi un capo senza foto':'Add an item without a photo','Salva i capi':'Save items',
    'Scegli le foto':'Choose photos','Fino a 40 fotografie · scontorno degli sfondi uniformi':'Up to 40 photos · uniform background removal',
    'Incolla un link':'Paste a link','Importa un’immagine accessibile oppure compila i dati':'Import an accessible image or enter details',
    'Scrivi a mano':'Enter manually','Per un capo senza fotografia':'For an item without a photo',
    'Link del prodotto o di una fotografia':'Product or photo link','Importa':'Import',
    'Scontorna sfondi uniformi sul dispositivo':'Remove uniform backgrounds on this device',
    'Scontorna foto esistenti':'Remove existing photo backgrounds','Ripristina originali':'Restore originals',
    'capi non indossati negli ultimi 90 giorni':'items not worn in the last 90 days',
    'costo per utilizzo':'cost per wear','costo per utilizzo dei capi con prezzo registrato':'cost per wear of priced items',
    'costo per utilizzo · aggiungi i prezzi per calcolarlo':'cost per wear · add prices to calculate',
    'Segna lavati':'Mark as washed','Ispirazione di stile':'Style inspiration',
    'Crea con i miei capi':'Create with my clothes','Cerca i suoi look':'Find their looks',
    'Tipo':'Type','Colore':'Color','Materiale':'Material','Texture':'Texture',
    'Vestibilità':'Fit','Stagione':'Season','Occasioni':'Occasions','Compatibilità':'Compatibility',
    'Marca':'Brand','Prezzo (€)':'Price (€)','Prezzo':'Price','Origine':'Source',
    'Metti in lavatrice':'Send to laundry','Aggiungi ai preferiti':'Add to favorites',
    'Aggiungi foto':'Add photo','Modifica':'Edit','Rimuovi capo':'Remove item',
    'Chiudi':'Close','Rimuovi':'Remove','Apri il prodotto':'Open product',
    'Lavati':'Washed','Tutti lavati':'Mark all washed',
    'Accedi con Google':'Sign in with Google','Sincronizza ora':'Sync now','Esci':'Sign out','Installa app':'Install app',
    'Accedi con Google per ritrovare i tuoi capi su ogni dispositivo.':'Sign in with Google to access your wardrobe across devices.',
    'Imposta il meteo':'Set up weather',
    'Nessuna foto con sfondo uniforme da scontornare.':'No photos with uniform backgrounds to process.',
    'Non ci sono fotografie da ripristinare.':'No original photos to restore.',
    'Dati importati. Verifica la scheda e premi «Salva i capi».':'Data imported. Review the item and select “Save items”.',
    'Leggo i dati del prodotto…':'Reading product details…',
    'Imposta la città nella sezione Oggi per includere il meteo.':'Set your city in Today to include weather.',
    'Collega Google Calendar per includere i tuoi impegni.':'Connect Google Calendar to include your plans.',
    'In lavatrice, esclusi dai suggerimenti':'In laundry, excluded from suggestions',
    'mai':'never'
  };
  const rules=[
    [/^Indossato (\d+) volte$/,'Worn $1 times'],[/^Indossato 1 volta$/,'Worn once'],
    [/^(\d+) capi in lavatrice, esclusi dai suggerimenti$/,'$1 items in laundry, excluded from suggestions'],
    [/^(\d+) capi in lavatrice$/,'$1 items in laundry'],
    [/^(\d+) foto scontornate\. Gli originali sono conservati su questo dispositivo\.$/,'$1 photos processed. Originals are kept on this device.'],
    [/^(\d+) fotografie originali ripristinate\.$/,'$1 original photos restored.'],
    [/^Scontorno (\d+) di (\d+)…$/,'Processing $1 of $2…'],
    [/^In lavatrice · (.+)$/,'In laundry · $1']
  ];
  const attrNames=['placeholder','aria-label','title'];
  const originals=new WeakMap();
  const originalAttrs=new WeakMap();
  let lang=localStorage.getItem(KEY)==='en'?'en':'it';
  let busy=false,scheduled=false;
  const ignoreParent=el=>!!el?.closest('script,style,textarea,option,[contenteditable],#wardrobe .v3-piece strong,#detailTitle,#lookName,#lookParts,#manualText,#inspoName,#weatherCity');
  const translate=s=>{
    if(Object.prototype.hasOwnProperty.call(translations,s))return translations[s];
    for(const [re,replacement] of rules)if(re.test(s))return s.replace(re,replacement);
    return s;
  };
  function nodeText(node){
    if(!node.nodeValue?.trim()||ignoreParent(node.parentElement))return;
    const old=originals.get(node);
    const value=old===undefined?node.nodeValue:(node.nodeValue===old||node.nodeValue===translate(old)?old:node.nodeValue);
    originals.set(node,value);
    const next=lang==='en'?translate(value):value;
    if(node.nodeValue!==next)node.nodeValue=next;
  }
  function attrs(el){
    if(ignoreParent(el))return;
    let map=originalAttrs.get(el);if(!map){map={};originalAttrs.set(el,map);}
    for(const key of attrNames){
      if(!el.hasAttribute(key))continue;
      const current=el.getAttribute(key),old=map[key];
      const source=old===undefined?current:(current===old||current===translate(old)?old:current);
      map[key]=source;
      const next=lang==='en'?translate(source):source;
      if(current!==next)el.setAttribute(key,next);
    }
  }
  function walk(root=document.body){
    if(busy||!root)return;busy=true;
    try{
      if(root.nodeType===Node.TEXT_NODE)nodeText(root);
      else if(root.nodeType===Node.ELEMENT_NODE){
        attrs(root);
        const iterator=document.createTreeWalker(root,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT);
        let n;while((n=iterator.nextNode())){if(n.nodeType===Node.TEXT_NODE)nodeText(n);else attrs(n);}
      }
      document.documentElement.lang=lang;
      const toggle=document.querySelector('#atelierLanguage');
      if(toggle){toggle.textContent=lang==='it'?'EN':'IT';toggle.setAttribute('aria-label',lang==='it'?'Switch to English':'Passa all’italiano');toggle.setAttribute('title',lang==='it'?'English':'Italiano');}
    }finally{busy=false;}
  }
  function schedule(){
    if(scheduled)return;scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;walk();});
  }
  function init(){
    const header=document.querySelector('.top-inner');
    if(!header)return;
    const toggle=document.createElement('button');
    toggle.id='atelierLanguage';toggle.type='button';toggle.className='atelier-language';
    header.append(toggle);
    toggle.addEventListener('click',()=>{
      lang=lang==='it'?'en':'it';localStorage.setItem(KEY,lang);
      walk();document.dispatchEvent(new CustomEvent('atelier:languagechange',{detail:{language:lang}}));
    });
    const observer=new MutationObserver(records=>{
      if(busy)return;
      if(records.some(r=>r.type==='childList'||r.type==='characterData'||(r.type==='attributes'&&attrNames.includes(r.attributeName))))schedule();
    });
    observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:attrNames});
    walk();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.atelierLanguage=()=>lang;
})();
