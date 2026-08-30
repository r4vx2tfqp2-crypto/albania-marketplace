// Shared product-category constants, extracted from AddProduct.jsx so
// EditProduct.jsx (and any other page needing category-aware sizes/colors/
// details) can reuse the exact same source of truth instead of drifting out
// of sync with a second hand-copied version.

export const CATEGORIES = [
  { key: "shoes", label: "Kepuce & Sandale", icon: "👟" },
  { key: "clothes", label: "Rroba & Mode", icon: "👕" },
  { key: "electronics", label: "Elektronike", icon: "📱" },
  { key: "beauty", label: "Bukuri & Kozmetike", icon: "💄" },
  { key: "home", label: "Shtepi & Jetese", icon: "🏠" },
  { key: "sports", label: "Sporte & Fitness", icon: "⚽" },
  { key: "gifts", label: "Dhurata", icon: "🎁" },
  { key: "construction", label: "Vegla & Ndertim", icon: "🔨" },
];

// key -> Albanian label, derived from CATEGORIES so it can't drift out of
// sync with the picker options above. Used anywhere a raw category slug
// (e.g. "shoes") needs to be shown to a buyer/seller instead of the slug
// itself.
export const CATEGORY_LABELS = Object.fromEntries(CATEGORIES.map(c => [c.key, c.label]));

export const PRESET_SIZES = {
  shoes: ["35","36","37","38","39","40","41","42","43","44","45"],
  clothes: ["XS","S","M","L","XL","XXL","XXXL"],
  sports: ["XS","S","M","L","XL","XXL"],
  default: [],
};

export const PRESET_COLORS = ["E zeze","E bardhe","Gri","Kafe","E kuqe","Blu","E gjelber","Verdhe","Portokalli","Rozë","Vjollce","Ari","Argjend"];

export const CATEGORY_DETAILS = {
  shoes: [
    { key: "brand", label: "Marka", placeholder: "Nike, Adidas, Zara, Puma..." },
    { key: "model", label: "Modeli", placeholder: "Air Max 270, Stan Smith..." },
    { key: "material", label: "Materiali", placeholder: "Lekure, Mesh, Sintetik, Suede..." },
    { key: "gender", label: "Gjinia", type: "select", options: ["Burra", "Gra", "Femije Djale", "Femije Vajze", "Unisex"] },
    { key: "condition", label: "Gjendja", type: "select", options: ["I ri me etikete", "I ri pa etikete", "Si i ri", "I perdorur mire", "I perdorur"] },
    { key: "sole", label: "Sholla", placeholder: "Gome, EVA, TPR..." },
    { key: "closure", label: "Mbyllja", type: "select", options: ["Lidhese", "Velcro", "Rreshqitese", "Pa mbyllje"] },
    { key: "season", label: "Sezoni", type: "select", options: ["Te gjitha stinet", "Vere", "Dimer", "Pranvere/Vjeshte"] },
    { key: "country", label: "Vendi i prodhimit", placeholder: "Itali, Turqi, Kine..." },
  ],
  clothes: [
    { key: "brand", label: "Marka", placeholder: "Zara, H&M, Nike, Gucci..." },
    { key: "material", label: "Materiali", placeholder: "100% Pambuk, Liri, Poliester, Lesh..." },
    { key: "gender", label: "Gjinia", type: "select", options: ["Burra", "Gra", "Femije Djale", "Femije Vajze", "Unisex"] },
    { key: "condition", label: "Gjendja", type: "select", options: ["I ri me etikete", "I ri pa etikete", "Si i ri", "I perdorur mire", "I perdorur"] },
    { key: "fit", label: "Forma", type: "select", options: ["Regular", "Slim Fit", "Oversized", "Loose", "Skinny"] },
    { key: "season", label: "Sezoni", type: "select", options: ["Te gjitha stinet", "Vere", "Dimer", "Pranvere/Vjeshte"] },
    { key: "care", label: "Kujdesi", placeholder: "Laj ne makine 30°, Pastrim kimik..." },
    { key: "country", label: "Vendi i prodhimit", placeholder: "Itali, Turqi, Bangladesh..." },
  ],
  electronics: [
    { key: "brand", label: "Marka", placeholder: "Apple, Samsung, Sony, Xiaomi..." },
    { key: "model", label: "Modeli", placeholder: "iPhone 15 Pro, Galaxy S24, MacBook Air..." },
    { key: "storage", label: "Kapaciteti", placeholder: "64GB, 128GB, 256GB, 512GB, 1TB..." },
    { key: "ram", label: "RAM", placeholder: "4GB, 6GB, 8GB, 12GB, 16GB..." },
    { key: "processor", label: "Procesori", placeholder: "Apple M3, Snapdragon 8 Gen 3..." },
    { key: "screen", label: "Ekrani", placeholder: "6.1 inch, OLED, 120Hz..." },
    { key: "battery", label: "Bateria", placeholder: "4000mAh, 5000mAh..." },
    { key: "camera", label: "Kamera", placeholder: "48MP, 108MP, Triple Camera..." },
    { key: "connectivity", label: "Lidhshmeria", placeholder: "5G, WiFi 6, Bluetooth 5.3..." },
    { key: "condition", label: "Gjendja", type: "select", options: ["I ri me kuti", "I ri pa kuti", "I rinovuar", "I perdorur mire", "I perdorur"] },
    { key: "warranty", label: "Garancia", placeholder: "1 vit, 2 vjet, Pa garanci..." },
    { key: "accessories", label: "Aksesore te perfshire", placeholder: "Karikues, Kufje, Kuti origjinale..." },
    { key: "country", label: "Vendi i prodhimit", placeholder: "SHBA, Kore e Jugut, Kine..." },
  ],
  beauty: [
    { key: "brand", label: "Marka", placeholder: "L Oreal, Maybelline, MAC, Dior..." },
    { key: "product_type", label: "Lloji i produktit", type: "select", options: ["Fondante", "Buzekuq", "Maskara", "Hije sysh", "Parfum", "Krem", "Serum", "Shampo", "Kondicionues", "Lak thonjsh", "Bronzer", "Blush", "Primer", "Concealer", "Toner", "Moisturizer"] },
    { key: "volume", label: "Volumi/Sasia", placeholder: "30ml, 50ml, 100ml, 200ml..." },
    { key: "skin_type", label: "Tipi i lekures", type: "select", options: ["Te gjitha tipet", "Lekure e thate", "Lekure yndyrore", "Lekure e kombinuar", "Lekure e ndjeshme", "Lekure normale"] },
    { key: "ingredients", label: "Perberesit kryesore", placeholder: "Acid Hyaluronik, Vitamin C, Retinol..." },
    { key: "finish", label: "Finish", type: "select", options: ["Mat", "Shkellqyes", "Saten", "Natyral"] },
    { key: "spf", label: "SPF", placeholder: "SPF 15, SPF 30, SPF 50, Pa SPF..." },
    { key: "expiry", label: "Data e skadimit", placeholder: "12/2026, 06/2027..." },
    { key: "origin", label: "Origjina", placeholder: "France, USA, Korea, Italy..." },
    { key: "condition", label: "Gjendja", type: "select", options: ["I ri i pahapur", "I ri i hapur", "I perdorur pak"] },
  ],
  home: [
    { key: "brand", label: "Marka", placeholder: "IKEA, Ashley, BoConcept..." },
    { key: "furniture_type", label: "Lloji", type: "select", options: ["Divan/Sofa", "Karrige", "Tavoline", "Krevat", "Dollap", "Raft", "Komode", "Pasqyre", "Llamba", "Tapete", "Perde", "Jasteke", "Takeme kuzhine", "Dekor"] },
    { key: "material", label: "Materiali", placeholder: "Dru masiv, MDF, Metal, Qelq, Plastike..." },
    { key: "dimensions", label: "Permasat (GxLxA)", placeholder: "120x60x75 cm..." },
    { key: "weight", label: "Pesha", placeholder: "5 kg, 15 kg, 50 kg..." },
    { key: "assembly", label: "Montimi", type: "select", options: ["Gati per perdorim", "Kerkon montim", "Montim i lehte"] },
    { key: "condition", label: "Gjendja", type: "select", options: ["I ri ne kuti", "I ri pa kuti", "Si i ri", "I perdorur mire", "I perdorur"] },
    { key: "room", label: "Dhoma", type: "select", options: ["Dhome ndenje", "Dhome gjumi", "Kuzhine", "Banjo", "Ballkon", "Zyre", "Dhome femijesh"] },
    { key: "style", label: "Stili", type: "select", options: ["Modern", "Klasik", "Skandinav", "Industrial", "Rustik", "Minimal"] },
  ],
  sports: [
    { key: "brand", label: "Marka", placeholder: "Nike, Adidas, Puma, Under Armour..." },
    { key: "sport_type", label: "Sporti", type: "select", options: ["Futboll", "Basketboll", "Tenis", "Volejboll", "Not", "Vrapim", "Çiklizem", "Fitness/Gym", "Boks", "Karate/Arte Lufte", "Skiing", "Hiking", "Yoga", "Tjeter"] },
    { key: "product_type", label: "Lloji i produktit", type: "select", options: ["Kepuce sportive", "Rroba sportive", "Topi", "Racketë", "Doreza", "Elmet", "Çante sportive", "Pajisje fitness", "Biciklete", "Aksesore"] },
    { key: "material", label: "Materiali", placeholder: "Dri-Fit, Gore-Tex, Neoprene..." },
    { key: "gender", label: "Gjinia", type: "select", options: ["Burra", "Gra", "Femije", "Unisex"] },
    { key: "condition", label: "Gjendja", type: "select", options: ["I ri me etikete", "I ri pa etikete", "Si i ri", "I perdorur mire"] },
    { key: "level", label: "Niveli", type: "select", options: ["Fillestar", "Mesem", "Profesionist"] },
  ],
  construction: [
    { key: "brand", label: "Marka", placeholder: "Bosch, Makita, DeWalt, Stanley..." },
    { key: "product_type", label: "Lloji i produktit", type: "select", options: ["Vegla elektrike", "Vegla dore", "Materiale ndertimi", "Pajisje hidraulike", "Pajisje elektrike", "Bojera & Llac", "Dyer & Dritare", "Pllaka & Mozaik", "Pompa & Tubacione", "Skela & Mbajtese", "Pajisje korriku", "Tjeter"] },
    { key: "power", label: "Fuqia", placeholder: "500W, 1200W, 18V..." },
    { key: "condition", label: "Gjendja", type: "select", options: ["I ri ne kuti", "I ri pa kuti", "Si i ri", "I perdorur mire", "I perdorur"] },
    { key: "material", label: "Materiali", placeholder: "Celik, Alumin, Plastike..." },
    { key: "dimensions", label: "Permasat/Kapaciteti", placeholder: "20cm, 5L, 2m..." },
    { key: "warranty", label: "Garancia", placeholder: "1 vit, 2 vjet, Pa garanci..." },
    { key: "accessories", label: "Aksesore te perfshire", placeholder: "Karikues, Valixhe, Bit set..." },
  ],
  gifts: [
    { key: "occasion", label: "Rasti", type: "select", options: ["Ditelindja", "Dasma", "Vjetori", "Dita e Nenes", "Dita e Babait", "Krishtlindja", "Viti i Ri", "Dita e Shën Valentinit", "Diplomim", "Lindja e femijës", "Tjeter"] },
    { key: "recipient", label: "Per kend", type: "select", options: ["Per te", "Per te", "Per çifte", "Per femije", "Per mik/shoqe", "Per koleg", "Per familje"] },
    { key: "material", label: "Materiali", placeholder: "Dru, Qelq, Metal, Tekstil, Leter..." },
    { key: "dimensions", label: "Permasat", placeholder: "20x15x10 cm..." },
    { key: "includes", label: "Perfshine", placeholder: "Kuti dhurate, Fjongo, Kartoline..." },
    { key: "personalization", label: "Personalizim", type: "select", options: ["I disponueshme", "Nuk ofrohet"] },
    { key: "condition", label: "Gjendja", type: "select", options: ["I ri", "Si i ri"] },
  ],
};
