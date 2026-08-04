// Assi: [Intensità, Dolcezza, Classico(0)-Sperimentale(10), Sociale(0)-Intimo(10)]
// glass: forma del bicchiere per l'illustrazione risultato (rocks, coupe, highball, flute, mug, tiki, wine)
// color: colore approssimativo del liquido
// garnish: guarnizione mostrata accanto al bordo (orange-twist, orange-wheel, lime-wheel, lemon-twist,
//          lemon-wheel, cherry, mint, coffee-beans, pineapple, celery, none)

const STANDARD_DRINKS = [
  { name: "Spritz", axes: [3,6,3,2], desc: "Leggero e solare, porti allegria ovunque tu vada.", ingredients: ["Prosecco", "Aperol", "Soda", "Fetta d'arancia"], glass: "wine", color: "#E8944A", garnish: "orange-wheel" },
  { name: "Negroni", axes: [9,3,2,6], desc: "Deciso e senza compromessi, sai sempre cosa vuoi.", ingredients: ["Gin", "Campari", "Vermouth rosso", "Scorza d'arancia"], glass: "rocks", color: "#A5342E", garnish: "orange-twist" },
  { name: "Americano", axes: [5,5,2,4], desc: "Equilibrato, mediti prima di scegliere.", ingredients: ["Campari", "Vermouth rosso", "Soda", "Fetta d'arancia"], glass: "rocks", color: "#C1432E", garnish: "orange-wheel" },
  { name: "Gin Tonic", axes: [6,2,4,5], desc: "Essenziale e raffinato, ti adatti senza perdere stile.", ingredients: ["Gin", "Acqua tonica", "Lime"], glass: "highball", color: "#DCE8E0", garnish: "lime-wheel" },
  { name: "Mojito", axes: [4,6,3,3], desc: "Spontaneo e fresco, vivi il momento.", ingredients: ["Rum bianco", "Lime", "Zucchero di canna", "Menta", "Soda"], glass: "highball", color: "#CFE8D0", garnish: "mint" },
  { name: "Margarita", axes: [7,4,4,4], desc: "Vivace e audace, ami sorprendere.", ingredients: ["Tequila", "Triple sec", "Succo di lime", "Sale sul bordo"], glass: "coupe", color: "#E8E0A0", garnish: "lime-wheel" },
  { name: "Moscow Mule", axes: [5,4,5,3], desc: "Anticonformista quel tanto che basta, originale con stile.", ingredients: ["Vodka", "Ginger beer", "Succo di lime"], glass: "mug", color: "#E8C97A", garnish: "lime-wheel" },
  { name: "Cosmopolitan", axes: [6,6,3,5], desc: "Elegante e sicuro di sé, brilli in ogni contesto.", ingredients: ["Vodka", "Triple sec", "Succo di mirtillo rosso", "Succo di lime"], glass: "coupe", color: "#D9536B", garnish: "orange-twist" },
  { name: "Piña Colada", axes: [3,9,3,2], desc: "Rilassato e godereccio, il relax è la tua priorità.", ingredients: ["Rum bianco", "Crema di cocco", "Succo d'ananas"], glass: "tiki", color: "#F0E6C8", garnish: "pineapple" },
  { name: "Daiquiri", axes: [6,5,3,6], desc: "Semplice ma raffinato, la sostanza prima di tutto.", ingredients: ["Rum bianco", "Succo di lime", "Sciroppo di zucchero"], glass: "coupe", color: "#EDE9C9", garnish: "lime-wheel" },
  { name: "Whiskey Sour", axes: [7,5,4,7], desc: "Equilibrio tra carattere e dolcezza, complesso quanto basta.", ingredients: ["Bourbon", "Succo di limone", "Sciroppo di zucchero", "Albume (opzionale)"], glass: "rocks", color: "#D9A441", garnish: "cherry" },
  { name: "Old Fashioned", axes: [9,4,1,8], desc: "Classico e solido, i valori prima delle mode.", ingredients: ["Bourbon o rye whiskey", "Zolletta di zucchero", "Angostura bitter", "Scorza d'arancia"], glass: "rocks", color: "#B97A2A", garnish: "orange-twist" },
  { name: "Manhattan", axes: [9,3,2,8], desc: "Intenso e sofisticato, non hai bisogno di alzare la voce.", ingredients: ["Rye whiskey", "Vermouth rosso", "Angostura bitter", "Ciliegina sotto spirito"], glass: "coupe", color: "#8B3A2E", garnish: "cherry" },
  { name: "Cuba Libre", axes: [4,7,2,2], desc: "Diretto e senza fronzoli, vai dritto al punto.", ingredients: ["Rum", "Cola", "Lime"], glass: "highball", color: "#5A3A22", garnish: "lime-wheel" },
  { name: "Bellini", axes: [2,7,3,4], desc: "Delicato e curato, ami i piccoli piaceri raffinati.", ingredients: ["Prosecco", "Purea di pesca bianca"], glass: "flute", color: "#F0B08C", garnish: "none" },
  { name: "Hugo", axes: [2,6,4,2], desc: "Fresco e leggero, prendi la vita con filosofia.", ingredients: ["Prosecco", "Sciroppo di sambuco", "Menta", "Lime", "Soda"], glass: "wine", color: "#DCEAC8", garnish: "mint" },
  { name: "Caipirinha", axes: [6,6,4,2], desc: "Vivace e diretto, energia pura in ogni gesto.", ingredients: ["Cachaça", "Lime", "Zucchero di canna"], glass: "rocks", color: "#E4E8C0", garnish: "lime-wheel" },
  { name: "Tequila Sunrise", axes: [5,7,4,3], desc: "Colorato e ottimista, vedi sempre il lato positivo.", ingredients: ["Tequila", "Succo d'arancia", "Granatina"], glass: "highball", color: "#E8843A", garnish: "orange-wheel" },
  { name: "Bloody Mary", axes: [6,1,6,7], desc: "Deciso e imprevedibile, sorprendi chi ti conosce poco.", ingredients: ["Vodka", "Succo di pomodoro", "Succo di limone", "Tabasco", "Worcestershire", "Sedano"], glass: "highball", color: "#B33A2E", garnish: "celery" },
  { name: "Espresso Martini", axes: [7,5,5,6], desc: "Energico e sofisticato, unisci ambizione e stile.", ingredients: ["Vodka", "Liquore al caffè", "Espresso", "Sciroppo di zucchero"], glass: "coupe", color: "#2E1D14", garnish: "coffee-beans" },
  { name: "Gimlet", axes: [7,3,3,7], desc: "Preciso e riservato, la qualità conta più della quantità.", ingredients: ["Gin", "Succo di lime", "Sciroppo di zucchero"], glass: "coupe", color: "#DDE2A0", garnish: "lime-wheel" },
  { name: "French 75", axes: [6,4,4,6], desc: "Elegante e frizzante, sai farti notare senza sforzo.", ingredients: ["Gin", "Succo di limone", "Sciroppo di zucchero", "Champagne"], glass: "flute", color: "#E8D9A0", garnish: "lemon-twist" },
  { name: "Amaretto Sour", axes: [5,8,4,5], desc: "Dolce ma con carattere, morbido fuori, deciso dentro.", ingredients: ["Amaretto", "Succo di limone", "Sciroppo di zucchero", "Albume (opzionale)"], glass: "rocks", color: "#C77A3A", garnish: "cherry" },
  { name: "Sex on the Beach", axes: [3,8,3,2], desc: "Solare e disinvolto, ami la leggerezza della compagnia.", ingredients: ["Vodka", "Liquore alla pesca", "Succo d'arancia", "Succo di mirtillo rosso"], glass: "highball", color: "#E36B4E", garnish: "orange-wheel" },
  { name: "Long Island Iced Tea", axes: [9,5,5,2], desc: "Intenso e complesso, non ti accontenti del semplice.", ingredients: ["Vodka", "Gin", "Rum", "Tequila", "Triple sec", "Succo di limone", "Cola"], glass: "highball", color: "#6B4226", garnish: "lemon-wheel" },
  { name: "Mai Tai", axes: [6,7,5,3], desc: "Esotico e curioso, cerchi sempre nuove esperienze.", ingredients: ["Rum scuro e agricolo", "Curaçao", "Orgeat", "Succo di lime"], glass: "tiki", color: "#C1592E", garnish: "mint" },
  { name: "Dark 'n' Stormy", axes: [6,5,4,5], desc: "Deciso ma equilibrato, sai gestire ogni tempesta.", ingredients: ["Rum scuro", "Ginger beer", "Lime"], glass: "highball", color: "#6B3A1E", garnish: "lime-wheel" },
  { name: "Campari Spritz", axes: [5,4,3,3], desc: "Amaro e diretto, non hai paura di distinguerti.", ingredients: ["Campari", "Prosecco", "Soda"], glass: "wine", color: "#C6362B", garnish: "orange-wheel" },
  { name: "Sidecar", axes: [7,4,3,7], desc: "Raffinato e deciso, un classico che non passa mai di moda.", ingredients: ["Cognac", "Triple sec", "Succo di limone"], glass: "coupe", color: "#C98A3E", garnish: "lemon-twist" },
  { name: "Kentucky Mule", axes: [7,4,5,5], desc: "Robusto e originale, tradizione con un twist personale.", ingredients: ["Bourbon", "Ginger beer", "Succo di lime"], glass: "mug", color: "#C98A3E", garnish: "lime-wheel" },
];

const SPECIAL_DRINKS = [
  { name: "Last Word", axes: [8,3,8,8], desc: "Complesso ed equilibrato, ogni parte di te ha un ruolo preciso.", ingredients: ["Gin", "Chartreuse verde", "Maraschino", "Succo di lime"], glass: "coupe", color: "#6FA85A", garnish: "none" },
  { name: "Sazerac", axes: [9,3,6,9], desc: "Rituale e intenso, ami fare le cose con metodo.", ingredients: ["Rye whiskey", "Zolletta di zucchero", "Peychaud's bitter", "Risciacquo all'assenzio"], glass: "rocks", color: "#8C4A2A", garnish: "lemon-twist" },
  { name: "Aviation", axes: [7,4,7,7], desc: "Elegante e sorprendente, nascondi profondità non ovvie.", ingredients: ["Gin", "Maraschino", "Crème de violette", "Succo di limone"], glass: "coupe", color: "#C9B8DE", garnish: "cherry" },
  { name: "Penicillin", axes: [8,4,7,7], desc: "Intenso e curativo, trasformi le difficoltà in forza.", ingredients: ["Scotch blended", "Succo di limone", "Sciroppo miele-zenzero", "Scotch torbato a galleggiare"], glass: "rocks", color: "#C98A3E", garnish: "lemon-twist" },
  { name: "Paper Plane", axes: [7,4,7,6], desc: "Bilanciato e moderno, sai stare al passo senza perdere identità.", ingredients: ["Bourbon", "Aperol", "Amaro Nonino", "Succo di limone"], glass: "coupe", color: "#C1732E", garnish: "none" },
  { name: "Vieux Carré", axes: [9,3,6,9], desc: "Stratificato e deciso, la tua storia ha molti capitoli.", ingredients: ["Rye whiskey", "Cognac", "Vermouth rosso", "Bénédictine", "Bitter Peychaud's e Angostura"], glass: "rocks", color: "#7A3A28", garnish: "lemon-twist" },
  { name: "Corpse Reviver No. 2", axes: [7,3,8,7], desc: "Ingannevole ed elegante, più forte di quanto sembri.", ingredients: ["Gin", "Cointreau", "Lillet Blanc", "Succo di limone", "Risciacquo all'assenzio"], glass: "coupe", color: "#E0D08A", garnish: "lemon-twist" },
  { name: "Clover Club", axes: [5,6,7,5], desc: "Delicato mai banale, l'eleganza è nei dettagli.", ingredients: ["Gin", "Sciroppo di lampone", "Succo di limone", "Albume"], glass: "coupe", color: "#D96B8C", garnish: "none" },
  { name: "Boulevardier", axes: [9,3,5,8], desc: "Intenso e sicuro, non temi il carattere forte.", ingredients: ["Bourbon", "Campari", "Vermouth rosso"], glass: "rocks", color: "#9A3A2E", garnish: "orange-twist" },
  { name: "Bramble", axes: [5,6,6,4], desc: "Fresco e strutturato, la semplicità apparente nasconde cura.", ingredients: ["Gin", "Succo di limone", "Sciroppo di zucchero", "Crème de mûre a filo"], glass: "rocks", color: "#B85C8C", garnish: "none" },
  { name: "Naked and Famous", axes: [8,4,8,6], desc: "Audace ed equilibrato, ami l'estremo ma con criterio.", ingredients: ["Mezcal", "Aperol", "Chartreuse gialla", "Succo di lime"], glass: "coupe", color: "#C97A3E", garnish: "none" },
  { name: "White Lady", axes: [7,3,6,7], desc: "Pulito e diretto, la chiarezza è la tua forza.", ingredients: ["Gin", "Cointreau", "Succo di limone"], glass: "coupe", color: "#E8E4C0", garnish: "lemon-twist" },
  { name: "Jungle Bird", axes: [6,6,7,4], desc: "Esotico e strutturato, esplori senza perdere la rotta.", ingredients: ["Rum scuro", "Campari", "Succo d'ananas", "Succo di lime", "Sciroppo di zucchero"], glass: "tiki", color: "#B94A2E", garnish: "pineapple" },
  { name: "Chartreuse Swizzle", axes: [7,5,9,5], desc: "Erbaceo e sperimentale, ami ciò che pochi capiscono.", ingredients: ["Chartreuse verde", "Succo di lime", "Succo d'ananas", "Menta", "Sciroppo di zucchero"], glass: "highball", color: "#7CBE5C", garnish: "mint" },
  { name: "Bee's Knees", axes: [6,6,5,5], desc: "Dolce ma mai scontato, la semplicità fatta bene.", ingredients: ["Gin", "Succo di limone", "Sciroppo di miele"], glass: "coupe", color: "#E0B84A", garnish: "lemon-twist" },
  { name: "Trinidad Sour", axes: [6,4,9,6], desc: "Anticonformista e coraggioso, rompi le regole con metodo.", ingredients: ["Angostura bitter (dose abbondante)", "Orgeat", "Succo di limone", "Rye whiskey"], glass: "coupe", color: "#7A3A2E", garnish: "none" },
  { name: "Oaxaca Old Fashioned", axes: [9,4,8,8], desc: "Affumicato e intenso, la tradizione reinventata.", ingredients: ["Tequila", "Mezcal", "Sciroppo d'agave", "Angostura bitter", "Scorza d'arancia"], glass: "rocks", color: "#A9662E", garnish: "orange-twist" },
  { name: "Bobby Burns", axes: [8,3,6,8], desc: "Fiero e complesso, porti con orgoglio le tue radici.", ingredients: ["Scotch", "Vermouth rosso", "Bénédictine"], glass: "coupe", color: "#B9822E", garnish: "none" },
  { name: "Champs-Élysées", axes: [8,4,7,7], desc: "Raffinato e vivace, l'eleganza francese ti rappresenta.", ingredients: ["Cognac", "Chartreuse verde", "Succo di limone", "Sciroppo di zucchero", "Angostura bitter"], glass: "coupe", color: "#B98A3E", garnish: "none" },
  { name: "Gold Rush", axes: [7,6,5,6], desc: "Caldo e accessibile, la ricercatezza senza pretese.", ingredients: ["Bourbon", "Sciroppo di miele", "Succo di limone"], glass: "rocks", color: "#D9A43E", garnish: "lemon-wheel" },
  { name: "Suffering Bastard", axes: [7,5,6,4], desc: "Intenso e conviviale, resisti a tutto con stile.", ingredients: ["Gin", "Bourbon", "Succo di lime", "Angostura bitter", "Ginger beer"], glass: "highball", color: "#C1732E", garnish: "mint" },
  { name: "Zombie", axes: [9,7,6,3], desc: "Potente e complesso, sotto la superficie nascondi molto.", ingredients: ["Rum chiaro, scuro e overproof", "Succo di lime", "Falernum", "Granatina", "Bitter Angostura e Pernod", "Succo di pompelmo"], glass: "tiki", color: "#A73A2E", garnish: "mint" },
  { name: "Ramos Gin Fizz", axes: [5,6,7,6], desc: "Meticoloso e curato, la pazienza è la tua arte.", ingredients: ["Gin", "Succo di limone e lime", "Zucchero", "Panna", "Albume", "Acqua di fiori d'arancio", "Soda"], glass: "highball", color: "#F0EEDD", garnish: "none" },
  { name: "Blood and Sand", axes: [6,6,6,6], desc: "Equilibrato tra opposti, sai unire mondi diversi.", ingredients: ["Scotch", "Cherry brandy", "Vermouth rosso", "Succo d'arancia"], glass: "coupe", color: "#A9462E", garnish: "cherry" },
  { name: "Widow's Kiss", axes: [8,6,8,8], desc: "Intenso e misterioso, poche persone ti capiscono davvero.", ingredients: ["Calvados", "Bénédictine", "Chartreuse gialla", "Angostura bitter"], glass: "coupe", color: "#B9822E", garnish: "none" },
  { name: "Tuxedo No. 2", axes: [7,3,7,7], desc: "Formale ma tagliente, l'eleganza con un twist amaro.", ingredients: ["Gin", "Vermouth secco", "Maraschino", "Assenzio", "Orange bitter"], glass: "coupe", color: "#E4E4D8", garnish: "lemon-twist" },
  { name: "Hemingway Daiquiri", axes: [5,5,5,5], desc: "Bilanciato e letterario, la semplicità è la tua firma.", ingredients: ["Rum bianco", "Succo di lime", "Succo di pompelmo", "Maraschino"], glass: "coupe", color: "#E8B090", garnish: "lime-wheel" },
  { name: "Improved Whiskey Cocktail", axes: [8,3,6,8], desc: "Classico rivisitato, migliori ciò che già funziona.", ingredients: ["Rye whiskey", "Maraschino", "Sciroppo di zucchero", "Angostura bitter", "Risciacquo all'assenzio"], glass: "rocks", color: "#B9822E", garnish: "lemon-twist" },
  { name: "Kingston Negroni", axes: [9,3,8,7], desc: "Deciso e sperimentale, reinventi le regole senza tradirle.", ingredients: ["Rum giamaicano", "Campari", "Vermouth rosso"], glass: "rocks", color: "#9A3A2E", garnish: "orange-twist" },
  { name: "Between the Sheets", axes: [8,4,6,6], desc: "Ambiguo e affascinante, ti muovi tra più mondi con disinvoltura.", ingredients: ["Cognac", "Rum bianco", "Cointreau", "Succo di limone"], glass: "coupe", color: "#C1873E", garnish: "lemon-twist" },
  { name: "Black Russian", axes: [8,5,5,8], desc: "Diretto e intenso, poche parole, tanta sostanza.", ingredients: ["Vodka", "Liquore al caffè"], glass: "rocks", color: "#2E1D14", garnish: "none" },
  { name: "White Russian", axes: [6,7,4,8], desc: "Morbido ma presente, la dolcezza nasconde carattere.", ingredients: ["Vodka", "Liquore al caffè", "Panna"], glass: "rocks", color: "#C9A87A", garnish: "none" },
  { name: "Colorado Bulldog", axes: [7,6,6,7], desc: "Energico e goloso, unisci gusto e vitalità.", ingredients: ["Vodka", "Liquore al caffè", "Panna", "Cola"], glass: "highball", color: "#8C6B4A", garnish: "none" },
  { name: "Revolver", axes: [8,5,7,8], desc: "Fumoso e magnetico — un gesto scenico (l'arancia flambé) e lasci il segno.", ingredients: ["Bourbon", "Liquore al caffè", "Orange bitter", "Scorza d'arancia flambé"], glass: "coupe", color: "#6B3A22", garnish: "orange-twist" },
  { name: "Jamaican Cocktail", axes: [7,6,7,6], desc: "Morbido ma ricercato, l'eleganza tropicale ti rappresenta.", ingredients: ["Rum giamaicano", "Vermouth secco", "Curaçao", "Succo di lime"], glass: "coupe", color: "#B9822E", garnish: "lime-wheel" },
];

// Ogni domanda ha 3 opzioni, ognuna con un delta [Int, Dolc, C-S, S-I] da sommare al profilo (partenza 5,5,5,5)
const STANDARD_QUESTIONS = [
  { q: "Serata perfetta?", options: [
    { t: "Casa, pochi amici", d: [1,0,0,3] },
    { t: "Locale pieno di gente", d: [0,1,0,-3] },
    { t: "Qualcosa di improvvisato", d: [0,1,2,0] },
  ]},
  { q: "Al lavoro sei quello che...", options: [
    { t: "Decide in fretta", d: [3,0,0,0] },
    { t: "Media tra le parti", d: [-1,0,0,1] },
    { t: "Porta energia al team", d: [0,1,0,-2] },
  ]},
  { q: "Il tuo rapporto con le regole?", options: [
    { t: "Le rispetto se hanno senso", d: [0,0,2,0] },
    { t: "Mi danno struttura", d: [0,0,-3,1] },
    { t: "Meglio chiedere scusa dopo", d: [0,-1,3,0] },
  ]},
  { q: "Cosa non sopporti?", options: [
    { t: "L'indecisione", d: [2,0,0,0] },
    { t: "La noia", d: [0,1,2,0] },
    { t: "La superficialità", d: [0,0,-1,2] },
  ]},
  { q: "Sotto pressione come reagisci?", options: [
    { t: "Mi concentro e vado dritto", d: [3,0,0,1] },
    { t: "Mi appoggio agli altri", d: [0,0,0,-2] },
    { t: "Trovo un'alternativa", d: [0,0,2,0] },
  ]},
  { q: "Il tuo viaggio ideale?", options: [
    { t: "Città d'arte pianificata", d: [0,0,-2,1] },
    { t: "Spiaggia e relax", d: [-2,2,0,0] },
    { t: "Scoperta in gruppo", d: [0,0,1,-2] },
  ]},
  { q: "Il tuo gusto preferito?", options: [
    { t: "Amaro e deciso", d: [2,-3,0,0] },
    { t: "Dolce e fruttato", d: [0,3,0,0] },
    { t: "Fresco e agrumato", d: [0,-1,1,0] },
  ]},
  { q: "Come ti descrivono gli amici?", options: [
    { t: "Affidabile", d: [0,0,-2,1] },
    { t: "Solare", d: [0,1,0,-2] },
    { t: "Imprevedibile", d: [0,0,3,0] },
  ]},
];

const SPECIAL_QUESTIONS = [
  { q: "Il tuo bar ideale?", options: [
    { t: "Speakeasy nascosto", d: [0,0,3,2] },
    { t: "Rooftop panoramico", d: [0,1,0,-2] },
    { t: "Locale storico", d: [0,0,-2,1] },
  ]},
  { q: "Cosa cerchi davvero in un drink?", options: [
    { t: "Complessità di gusto", d: [0,0,3,0] },
    { t: "Equilibrio perfetto", d: [-1,0,1,0] },
    { t: "Un sorso che sorprende", d: [0,1,2,0] },
  ]},
  { q: "Il tuo rapporto con il tempo?", options: [
    { t: "Pazienza, il meglio arriva piano", d: [2,0,0,2] },
    { t: "Voglio risultati subito", d: [0,1,-1,0] },
    { t: "Il percorso conta più del risultato", d: [0,0,2,0] },
  ]},
  { q: "Il tuo stile?", options: [
    { t: "Elegante e misurato", d: [0,0,-1,3] },
    { t: "Audace, fuori standard", d: [1,0,3,0] },
    { t: "Versatile, mi adatto", d: [0,1,0,0] },
  ]},
  { q: "Un difetto che ti riconosci?", options: [
    { t: "Sono esigente", d: [0,0,1,2] },
    { t: "Sono impulsivo", d: [2,-1,0,0] },
    { t: "Overthinking", d: [0,0,0,3] },
  ]},
  { q: "Cosa apprezzi in una serata tra amici intimi?", options: [
    { t: "Conversazioni profonde", d: [0,0,0,3] },
    { t: "Racconti e risate", d: [0,1,0,-1] },
    { t: "Silenzi comodi", d: [1,0,0,2] },
  ]},
  { q: "Quale ingrediente ti intriga di più?", options: [
    { t: "Amari ed erbe forti", d: [2,-3,0,0] },
    { t: "Caffè e tostato", d: [1,0,0,2] },
    { t: "Affumicato / mezcal", d: [1,0,3,0] },
  ]},
  { q: "Cosa ti rappresenta di più?", options: [
    { t: "Precisione classica", d: [0,0,-3,0] },
    { t: "Sperimentazione controllata", d: [0,0,3,1] },
    { t: "Intensità pura", d: [3,0,0,0] },
  ]},
];
