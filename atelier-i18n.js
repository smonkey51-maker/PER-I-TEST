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
    'Pronti':'Available','Sensazioni':'Feel','Vibrazione leggera':'Light haptics','Un tocco secco quando scegli, indossi o archivi un capo. Funziona su Android.':'A crisp tap when you choose, wear or archive a piece. Works on Android.','In lavatrice':'In laundry','Lavaggio delicato richiesto':'Delicate wash needed','Lavaggio a mano richiesto':'Hand wash needed','Lavasecco richiesto':'Dry cleaning needed','Da trattare':'Needs treatment','Cura':'Care','Automatica':'Automatic','Lavatrice':'Washing machine','Delicato':'Delicate','A mano':'By hand','Lavasecco':'Dry cleaning','Trattamento della pelle':'Leather treatment','Utilizzi prima della cura':'Wears before care','Per colore':'By color','Mai indossato':'Never worn',
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
    'Accedi con Google per ritrovare i tuoi capi su ogni dispositivo e creare le immagini dei capi senza foto.':'Sign in with Google to access your wardrobe across devices and create images for items without a photo.',
    'Disegno provvisorio: l’immagine AI è in arrivo':'Temporary drawing: the AI image is on its way','Disegno provvisorio: accedi con Google per l’immagine AI':'Temporary drawing: sign in with Google for the AI image',
    'Imposta il meteo':'Set up weather',
    'Nessuna foto con sfondo uniforme da scontornare.':'No photos with uniform backgrounds to process.',
    'Non ci sono fotografie da ripristinare.':'No original photos to restore.',
    'Dati importati. Verifica la scheda e premi «Salva i capi».':'Data imported. Review the item and select “Save items”.',
    'Leggo i dati del prodotto…':'Reading product details…',
    'Imposta la città nella sezione Oggi per includere il meteo.':'Set your city in Today to include weather.',
    'Collega Google Calendar per includere i tuoi impegni.':'Connect Google Calendar to include your plans.',
    'In lavatrice, esclusi dai suggerimenti':'In laundry, excluded from suggestions',
    'mai':'never',
    'I tuoi outfit della settimana':'Your outfits for the week','Guardaroba ':'Wardrobe ','I tuoi capi':'Your items',
    'Look ':'Looks ','Look':'Looks','I tuoi outfit salvati':'Your saved outfits','Cerca look…':'Search looks…','Cerca look':'Search looks',
    'Aggiungi capo':'Add item','Opzioni':'Options','Cambia luogo':'Change location','Porta un ombrello.':'Bring an umbrella.',
    'Soleggiato':'Sunny','Poco nuvoloso':'Partly cloudy','Nuvoloso':'Cloudy','Nebbia':'Fog','Pioggia':'Rain','Neve':'Snow','Temporale':'Storm',
    '1 capo in lavatrice':'1 item in laundry','Meteo di oggi':"Today's weather",
    'Impegni di oggi':"Today's plans",'Nessun impegno per oggi.':'No plans today.','Il tuo atelier':'Your atelier',
    'Analizza il look':'Assess the look','Prepara la valigia':'Pack a suitcase','Statistiche':'Statistics',
    'Da te':'Added by you','Tutto il giorno':'All day','Nessun impegno':'No plans',
    'Categoria':'Category','Stile':'Style','Indossato':'Worn','Non ancora':'Not yet','Preferito':'Favorite',
    'Salva modifiche':'Save changes','Automatico':'Automatic','Sobrio':'Understated','Rétro':'Retro','Neutro':'Neutral',
    'Senza foto':'No photo','Senza foto · compila la scheda':'No photo · fill in the details','Scarta':'Discard','Altri dettagli':'More details',
    'Facoltativa':'Optional','Facoltativo':'Optional','Capo da rivedere':'Item to review',
    'Cosa ti manca':"What you're missing",'Il guardaroba è ben bilanciato per il tuo stile.':'Your wardrobe is well balanced for your style.',
    'Capi':'Items','Indossati almeno una volta':'Worn at least once','Utilizzi registrati':'Recorded wears',
    'Il tuo guardaroba in numeri':'Your wardrobe in numbers','I più indossati':'Most worn','Analisi del look':'Look assessment',
    'Giorni di viaggio':'Travel days','Componi valigia':'Pack',
    'Es. Timothée Chalamet':'E.g. Timothée Chalamet','Maglione lilla, gurkha sabbia, sneakers panna':'Lilac sweater, sand gurkha trousers, cream sneakers',
    'Filtra per categoria':'Filter by category','Disponibilità':'Availability','Avanzamento':'Progress','Armadio interattivo':'Interactive wardrobe',
    'Nome di una persona nota':'Name of a well-known person','Domani':'Tomorrow','Vedi i prossimi giorni':'See the coming days',
    'Foto':'Photo','Illustrativa, creata dalla descrizione':'Illustrative, created from the description','Usa la tua foto':'Use your own photo',
    'Creata l’immagine di 1 capo senza foto':'Created the image of 1 item without a photo',
    'Con i capi lavati di adesso non ci sono abbastanza combinazioni diverse per tutti i giorni: alcuni outfit si ripetono. Aggiungi capi o segna come lavati quelli in lavatrice.':'With your clean items right now there are not enough different combinations for every day, so some outfits repeat. Add items or mark the ones in the laundry as washed.',
    'Ispirazione':'Inspiration','L’Ispirazione':'Inspiration','Il tuo curatore d’immagine per la giornata di oggi.':'Your image curator for today.',
    'Componi Look':'Compose a Look','L’intelligenza predittiva sincronizzata sul clima attuale.':'Predictive intelligence in tune with today’s weather.',
    'Caveau':'Vault','Il Caveau ':'The Vault ','Il Caveau':'The Vault','La tua collezione privata digitalizzata.':'Your private collection, digitised.',
    'Pezzi Iconici':'Iconic Pieces','I Pezzi Iconici':'Iconic Pieces','Pezzo Iconico':'Iconic Piece','Aggiungi ai Pezzi Iconici':'Add to Iconic Pieces',
    'I capi chiave attorno a cui costruire la tua identità.':'The key items your identity is built around.',
    'I Pezzi Iconici: i capi chiave attorno a cui costruire la tua identità.':'Iconic Pieces: the key items your identity is built around.',
    'Crea nuovo look':'Create new look','Indietro':'Back',
    'Profilo Sartoriale':'Tailoring Profile','Misure, preferenze di fit e luoghi per il meteo.':'Measurements, fit preferences and places for the weather.',
    'Luoghi per il meteo':'Places for the weather','Nessun luogo impostato: il meteo non orienta ancora gli outfit.':'No place set: the weather does not guide your outfits yet.',
    'Misure':'Measurements','Altezza (cm)':'Height (cm)','Taglia sopra':'Top size','Taglia pantaloni':'Trouser size','Numero di scarpe':'Shoe size',
    'Es. 48':'E.g. 48','Es. 42':'E.g. 42','Restano su questo dispositivo.':'They stay on this device.','Fit preferito':'Preferred fit',
    'Orienta le immagini dei capi senza foto quando la vestibilità non è indicata.':'Guides the images of items without a photo when the fit is not specified.',
    'Il tuo stile':'Your style','Il Diario di Stile':'The Style Diary','La cronologia delle tue scelte estetiche nel tempo.':'The history of your style choices over time.',
    'Consulente di stile':'Style advisor','Immagini per i capi senza foto':'Images for items without a photo',
    'Una foto prodotto creata dalla descrizione, meno di un centesimo l’una.':'A product photo created from the description, under a cent each.',
    'Ritaglio AI degli sfondi complessi':'AI cut-out of busy backgrounds',
    'Per le foto su letti, pavimenti o sfondi non uniformi; pochi centesimi a foto.':'For photos on beds, floors or uneven backgrounds; a few cents per photo.',
    'Accedi con Google per ritrovare i capi su ogni dispositivo e usare il consulente di stile AI.':'Sign in with Google to access your items on every device and use the AI style advisor.',
    'Quando premi «Indosso questo», il look del giorno entra nel Diario.':'When you tap “Wear this”, the day’s look goes into the Diary.',
    'Giorni nel Diario':'Days in the Diary','Capi indossati':'Items worn','Il più scelto':'Most chosen',
    'Suggerimenti':'Suggestions','Giornata fredda: strati caldi e un capospalla pesante.':'Cold day: warm layers and a heavy coat.',
    'Giornata fresca: uno strato leggero sopra e una giacca a portata di mano.':'Cool day: a light layer on top and a jacket close at hand.',
    'Giornata ideale per uno strato leggero.':'A perfect day for a light layer.','Fa caldo: tessuti leggeri e traspiranti, niente capospalla.':'It’s hot: light, breathable fabrics, no outerwear.',
    'Pioggia probabile: capospalla e scarpe che non temono l’acqua.':'Rain likely: outerwear and shoes that can handle water.',
    'Imposta la città nel Profilo Sartoriale: i suggerimenti seguiranno il clima.':'Set your city in the Tailoring Profile and suggestions will follow the weather.',
    'Impegno di lavoro: il look privilegia una sartoria sobria e autorevole.':'Work plans: the look favours understated, authoritative tailoring.',
    'Stasera hai un impegno: tieni a portata un capo più curato.':'You have plans tonight: keep a more polished piece at hand.',
    'Sport in agenda: prepara a parte un cambio comodo.':'Sport on the agenda: pack a comfortable change of clothes.',
    'Primavera':'Spring','Estate':'Summer','Autunno':'Autumn','Inverno':'Winter',
    'Ritaglio AI per sfondi complessi (letti, pavimenti), pochi centesimi a foto':'AI cut-out for busy backgrounds (beds, floors), a few cents per photo',
    'Ritaglio AI delle foto esistenti':'AI cut-out of existing photos','Tutte le foto hanno già lo sfondo rimosso.':'All photos already have their background removed.',
    'Accedi con Google per il ritaglio AI.':'Sign in with Google for the AI cut-out.','Ritaglio AI avviato: le foto si aggiornano man mano.':'AI cut-out started: photos update one by one.',
    'Immagine creata dall’AI':'Image created by AI','Sfondo rimosso da 1 foto':'Background removed from 1 photo',
    'Per il lavoro':'For work','Dopo il lavoro':'After work','Indossato oggi':'Worn today'
  };
  const rules=[
    [/^Indossato (\d+) volte$/,'Worn $1 times'],[/^Indossato 1 volta$/,'Worn once'],
    [/^(\d+) capi in lavatrice, esclusi dai suggerimenti$/,'$1 items in laundry, excluded from suggestions'],
    [/^(\d+) capi in lavatrice$/,'$1 items in laundry'],
    [/^Fermo da (\d+) giorni$/,'Idle for $1 days'],[/^Rispolvero: (.+), fermo da (\d+) giorni\.?$/,'Dusting off: $1, idle for $2 days'],
    [/^Lavatrice · (\d+)\/(\d+) utilizzi$/,'Washing machine · $1/$2 wears'],[/^Delicato · (\d+)\/(\d+) utilizzi$/,'Delicate · $1/$2 wears'],[/^A mano · (\d+)\/(\d+) utilizzi$/,'By hand · $1/$2 wears'],[/^Lavasecco · (\d+)\/(\d+) utilizzi$/,'Dry cleaning · $1/$2 wears'],[/^Trattamento della pelle · (\d+)\/(\d+) utilizzi$/,'Leather treatment · $1/$2 wears'],
    [/^Automatica \((.+)\)$/,'Automatic ($1)'],
    [/^(\d+) foto scontornate\. Gli originali sono conservati su questo dispositivo\.$/,'$1 photos processed. Originals are kept on this device.'],
    [/^(\d+) fotografie originali ripristinate\.$/,'$1 original photos restored.'],
    [/^Scontorno (\d+) di (\d+)…$/,'Processing $1 of $2…'],
    [/^In lavatrice · (.+)$/,'In laundry · $1'],
    [/^Pioggia (\d+)%$/,'Rain $1%'],
    [/^(Buongiorno|Buon pomeriggio|Buonasera|Buonanotte)(, .+)?$/,(m,h,name)=>({'Buongiorno':'Good morning','Buon pomeriggio':'Good afternoon','Buonasera':'Good evening','Buonanotte':'Good night'}[h])+(name||'')],
    [/^Apri (.+)$/,'Open $1'],
    [/^Collegato come (.+)\. I capi si sincronizzano con Google Drive\.$/,'Signed in as $1. Your items sync with Google Drive.'],
    [/^Escursione di (\d+)°: vestiti a strati per la sera\.$/,'A $1° swing: dress in layers for the evening.'],
    [/^Sfondo rimosso da (\d+) foto$/,'Background removed from $1 photos'],
    [/^Create le immagini di (\d+) capi senza foto$/,'Created images for $1 items without a photo'],
    [/^Salva (\d+) capi$/,'Save $1 items'],[/^Salva 1 capo$/,'Save 1 item'],
    [/^(Sobrio|Rétro|Neutro)( \(automatico\))?$/,(m,st,auto)=>({'Sobrio':'Understated','Rétro':'Retro','Neutro':'Neutral'}[st])+(auto?' (automatic)':'')],
    [/^(\d+) volt[ae], l’ultima (oggi|ieri|(\d+) giorni fa)$/,(m,n,when,days)=>n+(n==='1'?' time':' times')+', last '+(when==='oggi'?'today':when==='ieri'?'yesterday':days+' days ago')],
    [/^Da riscoprire: (.+)$/,'Rediscover: $1'],
    [/^Hai (\d+) capi? sopra \(maglieria, camicie, t-shirt\): per cinque giorni senza ripetizioni ne servono almeno 5\.$/,'You have $1 tops (knitwear, shirts, T-shirts): five days without repeats need at least 5.'],
    [/^Hai (\d+) (?:pantaloni o jeans|paio di pantaloni o jeans): ne servono almeno 3 per alternarli\.$/,'You have $1 trousers or jeans: you need at least 3 to rotate.'],
    [/^Hai (\d+) pa(?:ia|io) di scarpe: ne servono almeno 3 tra lavoro e tempo libero\.$/,'You have $1 pairs of shoes: you need at least 3 for work and leisure.'],
    [/^Hai (\d+) capispalla: ne servono almeno 2 \(uno leggero e uno più caldo\)\.$/,'You have $1 outerwear pieces: you need at least 2 (one light, one warmer).'],
    [/^Non hai scarpe da lavoro sobrie \(mocassini, stringate, derby\): per i giorni in ufficio sono la base\.$/,'You have no understated work shoes (loafers, lace-ups, derbies): they are the basis for office days.'],
    [/^Non hai sneakers: servono per il dopo lavoro e il tempo libero\.$/,'You have no sneakers: they are needed after work and for leisure.'],
    [/^Per il lavoro \(sartoriale sobrio e autorevole\) hai solo (\d+) capi tra sopra e pantaloni: te ne servono almeno 3\.$/,'For work (understated, authoritative tailoring) you have only $1 tops and trousers: you need at least 3.'],
    [/^Per il tempo libero \(rétro, più espressivo\) hai solo (\d+) capi con carattere: te ne servono almeno 2\.$/,'For leisure (retro, more expressive) you have only $1 pieces with character: you need at least 2.']
  ];
  // Frasi del saluto e del meteo, tradotte una per una
  const sentences=[
    [/^(Fa freddo|Fa fresco|Il clima è mite|Fa caldo) \((-?\d+)–(-?\d+)°C\)( e può piovere)?$/,(m,f,a,b,r)=>({'Fa freddo':"It's cold",'Fa fresco':"It's cool",'Il clima è mite':"It's mild",'Fa caldo':"It's hot"}[f])+' ('+a+'–'+b+'°C)'+(r?' and it may rain':'')],
    [/^Hai un impegno(, il primo alle (.+))?$/,(m,x,t)=>'You have one plan'+(t?', the first at '+t:'')],
    [/^Hai (\d+) impegni(, il primo alle (.+))?$/,(m,n,x,t)=>'You have '+n+' plans'+(t?', the first at '+t:'')],
    [/^Ti ho preparato un outfit$/,'I picked an outfit for you'],[/^Ecco un’idea per oggi$/,'Here is an idea for today'],
    [/^Meteo: (.+)$/,(m,w)=>'Weather: '+w],[/^Porta un ombrello$/,'Bring an umbrella']
  ];
  // Parti sicure dentro testi composti (meteo e impegni), mai i nomi dei capi
  const fragments=[[/, pioggia (\d+)%/g,', rain $1%'],[/ · Nessun impegno$/,' · No plans'],[/^Nessun impegno$/,'No plans']];
  const bySentence=s=>{
    if(!/\.$/.test(s))return null;
    const parts=s.slice(0,-1).split('. ').map(x=>x.replace(/, pioggia (\d+)%/g,', rain $1%'));
    const out=parts.map(x=>{for(const [re,r] of sentences)if(re.test(x))return x.replace(re,r);return null;});
    return out.every(x=>x!==null)?out.join('. ')+'.':null;
  };
  const attrNames=['placeholder','aria-label','title'];
  const originals=new WeakMap();
  const originalAttrs=new WeakMap();
  let lang=localStorage.getItem(KEY)==='en'?'en':'it';
  let busy=false,scheduled=false;
  const ignoreParent=el=>!!el?.closest('script,style,textarea,option,[contenteditable],#wardrobe .v3-piece strong,#detailTitle,#lookName,#lookParts,#manualText,#inspoName,#weatherCity');
  // Gli attributi dei campi (segnaposto, etichette) si traducono anche dove il testo inserito non va toccato
  const ignoreAttrs=el=>!!el?.closest('script,style,[contenteditable],#wardrobe .v3-piece strong,#detailTitle');
  const translateCore=s=>{
    if(Object.prototype.hasOwnProperty.call(translations,s))return translations[s];
    for(const [re,replacement] of rules)if(re.test(s))return s.replace(re,replacement);
    const sentence=bySentence(s);if(sentence)return sentence;
    let out=s;for(const [re,r] of fragments)out=out.replace(re,r);
    return out;
  };
  // Gli spazi attorno al testo restano dove sono
  const translate=s=>{
    const m=/^(\s*)([\s\S]*?)(\s*)$/.exec(s);
    return m[2]?m[1]+translateCore(m[2])+m[3]:s;
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
    if(ignoreAttrs(el))return;
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
