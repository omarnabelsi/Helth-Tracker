/**
 * VitalSense AI — Full Lebanese Food Database
 * Each entry: { id, name, arabicName, category, caloriesPer100g, proteinPer100g, carbsPer100g, fatPer100g, serving, tags }
 * Nutritional values normalized to 100g for precision tracking.
 */

const lebaneseFoods = [
  // ═══════════════════════════════════════════
  //  MAIN DISHES (Normalized to 100g)
  // ═══════════════════════════════════════════
  { id: "m01", name: "Baba Ghanouj", arabicName: "بابا غنوج", category: "main", caloriesPer100g: 90, proteinPer100g: 2, carbsPer100g: 6, fatPer100g: 7, serving: "1 cup (200g)", tags: ["vegetarian", "low-fat"] },
  { id: "m02", name: "Batata Mahchi", arabicName: "بطاطا محشي", category: "main", caloriesPer100g: 128, proteinPer100g: 4.8, carbsPer100g: 15.2, fatPer100g: 5.6, serving: "2 pieces (250g)", tags: [] },
  { id: "m03", name: "Borgul bi Banadoura", arabicName: "برغل بالبندورة", category: "main", caloriesPer100g: 130, proteinPer100g: 4, carbsPer100g: 24, fatPer100g: 2.5, serving: "1 cup (200g)", tags: ["vegetarian", "low-fat"] },
  { id: "m04", name: "Chichbarak", arabicName: "شيشبرك", category: "main", caloriesPer100g: 126, proteinPer100g: 6, carbsPer100g: 11.6, fatPer100g: 6, serving: "6 pieces (300g)", tags: [] },
  { id: "m05", name: "Falafel", arabicName: "فلافل", category: "main", caloriesPer100g: 226, proteinPer100g: 9.3, carbsPer100g: 21.3, fatPer100g: 12, serving: "6 pieces (150g)", tags: ["vegetarian", "high-protein"] },
  { id: "m06", name: "Fatayer Sabanikh", arabicName: "فطاير سبانخ", category: "main", caloriesPer100g: 186, proteinPer100g: 5.3, carbsPer100g: 20, fatPer100g: 9.3, serving: "3 pieces (150g)", tags: ["vegetarian"] },
  { id: "m07", name: "Fattat Hommos", arabicName: "فتّة حمّص", category: "main", caloriesPer100g: 120, proteinPer100g: 4.5, carbsPer100g: 12, fatPer100g: 6.2, serving: "1 bowl (350g)", tags: ["vegetarian"] },
  { id: "m08", name: "Fattoush", arabicName: "فتّوش", category: "main", caloriesPer100g: 60, proteinPer100g: 1.3, carbsPer100g: 7.3, fatPer100g: 3, serving: "1 large bowl (300g)", tags: ["vegetarian", "low-fat"] },
  { id: "m09", name: "Foul Moudamas", arabicName: "فول مدمّس", category: "main", caloriesPer100g: 112, proteinPer100g: 6.4, carbsPer100g: 15.2, fatPer100g: 2.4, serving: "1 bowl (250g)", tags: ["vegetarian", "high-protein", "low-fat"] },
  { id: "m10", name: "Hindbe bil Zet", arabicName: "هندبة بالزيت", category: "main", caloriesPer100g: 75, proteinPer100g: 2, carbsPer100g: 4, fatPer100g: 6, serving: "1 plate (200g)", tags: ["vegetarian", "low-fat"] },
  { id: "m11", name: "Hommos bi Tahini", arabicName: "حمّص بالطحينة", category: "main", caloriesPer100g: 175, proteinPer100g: 6, carbsPer100g: 16, fatPer100g: 10, serving: "1 cup (200g)", tags: ["vegetarian", "high-protein"] },
  { id: "m12", name: "Kafta wa Batata", arabicName: "كفتة وبطاطا", category: "main", caloriesPer100g: 128, proteinPer100g: 6.8, carbsPer100g: 8.5, fatPer100g: 7.4, serving: "1 serving (350g)", tags: ["high-protein"] },
  { id: "m13", name: "Kebba bil Sayniya", arabicName: "كبّة بالصينية", category: "main", caloriesPer100g: 210, proteinPer100g: 11, carbsPer100g: 14, fatPer100g: 12, serving: "1 slice (200g)", tags: ["high-protein"] },
  { id: "m14", name: "Koussa Mahchi", arabicName: "كوسا محشي", category: "main", caloriesPer100g: 124, proteinPer100g: 5.6, carbsPer100g: 11.2, fatPer100g: 6.4, serving: "3 pieces (250g)", tags: [] },
  { id: "m15", name: "Lahm bil Ajin", arabicName: "لحم بعجين", category: "main", caloriesPer100g: 211, proteinPer100g: 10, carbsPer100g: 21, fatPer100g: 8.8, serving: "3 pieces (180g)", tags: ["high-protein"] },
  { id: "m16", name: "Loubia bil Zet", arabicName: "لوبيا بالزيت", category: "main", caloriesPer100g: 88, proteinPer100g: 3.2, carbsPer100g: 11.2, fatPer100g: 4, serving: "1 bowl (250g)", tags: ["vegetarian", "low-fat"] },
  { id: "m17", name: "Malfouf Mahchi", arabicName: "ملفوف محشي", category: "main", caloriesPer100g: 120, proteinPer100g: 4.8, carbsPer100g: 12.8, fatPer100g: 5.6, serving: "6 rolls (250g)", tags: [] },
  { id: "m18", name: "Moujadara", arabicName: "مجدّرة", category: "main", caloriesPer100g: 113, proteinPer100g: 4.6, carbsPer100g: 17.3, fatPer100g: 2.6, serving: "1 bowl (300g)", tags: ["vegetarian", "high-protein", "low-fat"] },
  { id: "m19", name: "Moghrabia", arabicName: "مغربية", category: "main", caloriesPer100g: 112, proteinPer100g: 5.5, carbsPer100g: 12.5, fatPer100g: 4.5, serving: "1 bowl (400g)", tags: ["high-protein"] },
  { id: "m20", name: "Mousaka Batinjan", arabicName: "مسقعة باذنجان", category: "main", caloriesPer100g: 116, proteinPer100g: 4, carbsPer100g: 8, fatPer100g: 8, serving: "1 serving (300g)", tags: ["vegetarian"] },
  { id: "m21", name: "Riz a Dajaj", arabicName: "رز بالدجاج", category: "main", caloriesPer100g: 137, proteinPer100g: 9.1, carbsPer100g: 14.8, fatPer100g: 4, serving: "1 plate (350g)", tags: ["high-protein"] },
  { id: "m22", name: "Riz bi Lahma", arabicName: "رز باللحمة", category: "main", caloriesPer100g: 148, proteinPer100g: 8, carbsPer100g: 15.7, fatPer100g: 5.7, serving: "1 plate (350g)", tags: ["high-protein"] },
  { id: "m23", name: "Sayadia", arabicName: "صيادية", category: "main", caloriesPer100g: 125, proteinPer100g: 8.5, carbsPer100g: 12.8, fatPer100g: 4, serving: "1 plate (350g)", tags: ["high-protein"] },
  { id: "m24", name: "Shawarma Dajaj", arabicName: "شاورما دجاج", category: "main", caloriesPer100g: 210, proteinPer100g: 14, carbsPer100g: 19, fatPer100g: 8, serving: "1 wrap (200g)", tags: ["high-protein"] },
  { id: "m25", name: "Shawarma Lahma", arabicName: "شاورما لحمة", category: "main", caloriesPer100g: 240, proteinPer100g: 13, carbsPer100g: 18, fatPer100g: 12, serving: "1 wrap (200g)", tags: ["high-protein"] },
  { id: "m26", name: "Tabboula", arabicName: "تبّولة", category: "main", caloriesPer100g: 60, proteinPer100g: 1.5, carbsPer100g: 8, fatPer100g: 2.5, serving: "1 bowl (200g)", tags: ["vegetarian", "low-fat"] },
  { id: "m27", name: "Warak Enab", arabicName: "ورق عنب", category: "main", caloriesPer100g: 140, proteinPer100g: 4, carbsPer100g: 16, fatPer100g: 7, serving: "8 pieces (200g)", tags: ["vegetarian"] },
  { id: "m28", name: "Yakhnat Bamia", arabicName: "يخنة بامية", category: "main", caloriesPer100g: 100, proteinPer100g: 5.7, carbsPer100g: 6.2, fatPer100g: 5.7, serving: "1 bowl (350g)", tags: [] },
  { id: "m29", name: "Yakhnat Fassoulia", arabicName: "يخنة فاصوليا", category: "main", caloriesPer100g: 108, proteinPer100g: 6.2, carbsPer100g: 8.5, fatPer100g: 5.1, serving: "1 bowl (350g)", tags: ["high-protein"] },
  { id: "m30", name: "Yakhnat Mouloukhia", arabicName: "يخنة ملوخية", category: "main", caloriesPer100g: 102, proteinPer100g: 6.8, carbsPer100g: 5.1, fatPer100g: 6.2, serving: "1 bowl (350g)", tags: ["high-protein"] },
  { id: "m31", name: "Beid bil Awarma", arabicName: "بيض بالقاورما", category: "main", caloriesPer100g: 233, proteinPer100g: 14.6, carbsPer100g: 2.6, fatPer100g: 18.6, serving: "2 eggs (150g)", tags: ["high-protein"] },
  { id: "m32", name: "Grilled Steak", arabicName: "ستيك مشوي", category: "main", caloriesPer100g: 225, proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 12, serving: "200g", tags: ["high-protein"] },
  { id: "m33", name: "Grilled Chicken", arabicName: "دجاج مشوي", category: "main", caloriesPer100g: 190, proteinPer100g: 24, carbsPer100g: 0, fatPer100g: 9, serving: "200g", tags: ["high-protein"] },
  { id: "m34", name: "Labneh", arabicName: "لبنة", category: "main", caloriesPer100g: 120, proteinPer100g: 8, carbsPer100g: 6, fatPer100g: 8, serving: "100g", tags: ["vegetarian", "high-protein"] },
  { id: "m35", name: "Manoushe Zaatar", arabicName: "منقوشة زعتر", category: "main", caloriesPer100g: 213, proteinPer100g: 5.3, carbsPer100g: 28, fatPer100g: 9.3, serving: "1 piece (150g)", tags: ["vegetarian"] },

  // ═══════════════════════════════════════════
  //  DESSERTS
  // ═══════════════════════════════════════════
  { id: "d01", name: "Baklava Mixed", arabicName: "بقلاوة مشكّلة", category: "dessert", caloriesPer100g: 480, proteinPer100g: 5, carbsPer100g: 55, fatPer100g: 26, serving: "3 pieces (75g)", tags: [] },
  { id: "d02", name: "Baklava Mixed Light", arabicName: "بقلاوة مشكّلة لايت", category: "dessert", caloriesPer100g: 320, proteinPer100g: 4.5, carbsPer100g: 45, fatPer100g: 14, serving: "3 pieces (75g)", tags: ["low-fat"] },
  { id: "d03", name: "Barazik", arabicName: "برازق", category: "dessert", caloriesPer100g: 420, proteinPer100g: 6, carbsPer100g: 52, fatPer100g: 22, serving: "4 pieces (60g)", tags: [] },
  { id: "d04", name: "Boundoukia", arabicName: "بندقيّة", category: "dessert", caloriesPer100g: 440, proteinPer100g: 6, carbsPer100g: 48, fatPer100g: 24, serving: "4 pieces (50g)", tags: [] },
  { id: "d05", name: "Daoukia", arabicName: "داوقيّة", category: "dessert", caloriesPer100g: 410, proteinPer100g: 7, carbsPer100g: 45, fatPer100g: 22, serving: "4 pieces (60g)", tags: [] },
  { id: "d06", name: "Foustoukia", arabicName: "فستقيّة", category: "dessert", caloriesPer100g: 460, proteinPer100g: 10, carbsPer100g: 42, fatPer100g: 28, serving: "4 pieces (60g)", tags: [] },
  { id: "d07", name: "Ghourayba", arabicName: "غريبة", category: "dessert", caloriesPer100g: 450, proteinPer100g: 4.5, carbsPer100g: 52, fatPer100g: 24, serving: "3 pieces (45g)", tags: [] },
  { id: "d08", name: "Halawa", arabicName: "حلاوة", category: "dessert", caloriesPer100g: 516, proteinPer100g: 13, carbsPer100g: 46, fatPer100g: 32, serving: "50g", tags: [] },
  { id: "d09", name: "Halawa Light", arabicName: "حلاوة لايت", category: "dessert", caloriesPer100g: 380, proteinPer100g: 12, carbsPer100g: 42, fatPer100g: 18, serving: "50g", tags: ["low-fat"] },
  { id: "d10", name: "Halawat El Jiben", arabicName: "حلاوة الجبن", category: "dessert", caloriesPer100g: 280, proteinPer100g: 6, carbsPer100g: 32, fatPer100g: 14, serving: "2 pieces (120g)", tags: [] },
  { id: "d11", name: "Ish el Bulbul", arabicName: "عش البلبل", category: "dessert", caloriesPer100g: 460, proteinPer100g: 6, carbsPer100g: 48, fatPer100g: 26, serving: "3 pieces (60g)", tags: [] },
  { id: "d12", name: "Kallaj Kashta", arabicName: "قلاّج قشطة", category: "dessert", caloriesPer100g: 220, proteinPer100g: 4, carbsPer100g: 24, fatPer100g: 12, serving: "2 pieces (140g)", tags: [] },
  { id: "d13", name: "Karabij Joz", arabicName: "كرابيج جوز", category: "dessert", caloriesPer100g: 380, proteinPer100g: 6, carbsPer100g: 42, fatPer100g: 20, serving: "4 pieces (80g)", tags: [] },
  { id: "d14", name: "Katayef Kashta", arabicName: "قطايف قشطة", category: "dessert", caloriesPer100g: 240, proteinPer100g: 4.5, carbsPer100g: 32, fatPer100g: 10, serving: "3 pieces (150g)", tags: [] },
  { id: "d15", "name": "Kounafa Kashta", "arabicName": "كنافة قشطة", "category": "dessert", "caloriesPer100g": 310, "proteinPer100g": 5.8, "carbsPer100g": 35.5, "fatPer100g": 16.3, "serving": "1 slice (135g)", "tags": [] },
  { id: "d16", name: "Kounafa bil Jiben", arabicName: "كنافة بالجبن", category: "dessert", caloriesPer100g: 330, proteinPer100g: 8, carbsPer100g: 34.5, fatPer100g: 17.8, serving: "1 slice (120g)", tags: [] },
  { id: "d17", name: "Maakaron", arabicName: "معكرون", category: "dessert", caloriesPer100g: 350, proteinPer100g: 5.3, carbsPer100g: 42.6, fatPer100g: 17.3, serving: "4 pieces (75g)", tags: [] },
  { id: "d18", name: "Moushabak", arabicName: "مشبّك", category: "dessert", caloriesPer100g: 380, proteinPer100g: 4, carbsPer100g: 48, fatPer100g: 18, serving: "4 pieces (90g)", tags: [] },
  { id: "d19", name: "Maamoul Tamer", arabicName: "معمول تمر", category: "dessert", caloriesPer100g: 360, proteinPer100g: 6, carbsPer100g: 48, fatPer100g: 16, serving: "2 pieces (50g)", tags: [] },
  { id: "d20", name: "Maamoul Mad Kashta", arabicName: "معمول مدّ قشطة", category: "dessert", caloriesPer100g: 280, proteinPer100g: 5, carbsPer100g: 32, fatPer100g: 14, serving: "1 piece (100g)", tags: [] },
  { id: "d21", name: "Maamoul Mad Joz", arabicName: "معمول مدّ جوز", category: "dessert", caloriesPer100g: 300, proteinPer100g: 6, carbsPer100g: 30, fatPer100g: 18, serving: "1 piece (100g)", tags: [] },
  { id: "d22", name: "Maamoul Foustok", arabicName: "معمول فستق", category: "dessert", caloriesPer100g: 360, proteinPer100g: 8.7, carbsPer100g: 35, fatPer100g: 21, serving: "2 pieces (80g)", tags: [] },
  { id: "d23", name: "Maamoul Joz", arabicName: "معمول جوز", category: "dessert", caloriesPer100g: 340, proteinPer100g: 7.5, carbsPer100g: 35, fatPer100g: 18.7, serving: "2 pieces (80g)", tags: [] },
  { id: "d24", name: "Madlouka", arabicName: "مدلوقة", category: "dessert", caloriesPer100g: 210, proteinPer100g: 3.3, carbsPer100g: 26.6, fatPer100g: 10.6, serving: "1 bowl (150g)", tags: [] },
  { id: "d25", name: "Mafrouka Kashta", arabicName: "مفروكة قشطة", category: "dessert", caloriesPer100g: 316, proteinPer100g: 5, carbsPer100g: 35, fatPer100g: 17, serving: "1 slice (120g)", tags: [] },
  { id: "d26", name: "Mafrouka Foustok", arabicName: "مفروكة فستق", category: "dessert", caloriesPer100g: 340, proteinPer100g: 7, carbsPer100g: 33, fatPer100g: 20, serving: "1 slice (120g)", tags: [] },
  { id: "d27", name: "Moufattaka", arabicName: "مفتّقة", category: "dessert", caloriesPer100g: 233, proteinPer100g: 5.3, carbsPer100g: 25.3, fatPer100g: 12, serving: "1 bowl (150g)", tags: [] },
  { id: "d28", name: "Mouhallabiya", arabicName: "مهلّبيّة", category: "dessert", caloriesPer100g: 125, proteinPer100g: 3.7, carbsPer100g: 18.7, fatPer100g: 3.7, serving: "1 bowl (160g)", tags: ["low-fat"] },
  { id: "d30", name: "Nammoura", arabicName: "نمّورة", category: "dessert", caloriesPer100g: 312, proteinPer100g: 5, carbsPer100g: 45, fatPer100g: 12.5, serving: "1 piece (80g)", tags: [] },
  { id: "d31", name: "Osmaliya", arabicName: "عثمليّة", category: "dessert", caloriesPer100g: 300, proteinPer100g: 5, carbsPer100g: 35, fatPer100g: 15, serving: "1 slice (120g)", tags: [] },
  { id: "d32", name: "Riz bil Halib", arabicName: "رز بالحليب", category: "dessert", caloriesPer100g: 137, proteinPer100g: 3.7, carbsPer100g: 22.5, fatPer100g: 3.7, serving: "1 bowl (160g)", tags: ["low-fat"] },
  { id: "d33", name: "Saniora", arabicName: "صنيورة", category: "dessert", caloriesPer100g: 480, proteinPer100g: 8, carbsPer100g: 52, fatPer100g: 26, serving: "3 pieces (50g)", tags: [] },
  { id: "d34", name: "Sfouf", arabicName: "صفوف", category: "dessert", caloriesPer100g: 287, proteinPer100g: 5, carbsPer100g: 42.5, fatPer100g: 10.6, serving: "1 piece (80g)", tags: [] },
  { id: "d35", name: "Shaaybiyat", arabicName: "شعيبيّات", category: "dessert", caloriesPer100g: 340, proteinPer100g: 5, carbsPer100g: 38, fatPer100g: 20, serving: "3 pieces (100g)", tags: [] },
  { id: "d36", name: "Ward el Sham", arabicName: "ورد الشام", category: "dessert", caloriesPer100g: 400, proteinPer100g: 6.6, carbsPer100g: 45.3, fatPer100g: 21.3, serving: "3 pieces (75g)", tags: [] },
  { id: "d37", name: "Znoud el Sitt", arabicName: "زنود الست", category: "dessert", caloriesPer100g: 360, proteinPer100g: 5, carbsPer100g: 40, fatPer100g: 20, serving: "3 pieces (100g)", tags: [] },
]

export default lebaneseFoods
