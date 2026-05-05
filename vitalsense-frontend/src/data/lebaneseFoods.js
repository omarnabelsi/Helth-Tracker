/**
 * VitalSense AI — Full Lebanese Food Database
 * Each entry: { id, name, arabicName, category, calories, protein, carbs, fat, serving, tags }
 * Nutritional values are estimated per typical serving.
 */

const lebaneseFoods = [
  // ═══════════════════════════════════════════
  //  MAIN DISHES
  // ═══════════════════════════════════════════
  { id: "m01", name: "Baba Ghanouj", arabicName: "بابا غنوج", category: "main", calories: 180, protein: 4, carbs: 12, fat: 14, serving: "1 cup (200g)", tags: ["vegetarian", "low-fat"] },
  { id: "m02", name: "Batata Mahchi", arabicName: "بطاطا محشي", category: "main", calories: 320, protein: 12, carbs: 38, fat: 14, serving: "2 pieces", tags: [] },
  { id: "m03", name: "Borgul bi Banadoura", arabicName: "برغل بالبندورة", category: "main", calories: 260, protein: 8, carbs: 48, fat: 5, serving: "1 cup", tags: ["vegetarian", "low-fat"] },
  { id: "m04", name: "Chichbarak", arabicName: "شيشبرك", category: "main", calories: 380, protein: 18, carbs: 35, fat: 18, serving: "6 pieces + yogurt", tags: [] },
  { id: "m05", name: "Falafel", arabicName: "فلافل", category: "main", calories: 340, protein: 14, carbs: 32, fat: 18, serving: "6 pieces", tags: ["vegetarian", "high-protein"] },
  { id: "m06", name: "Fatayer Sabanikh", arabicName: "فطاير سبانخ", category: "main", calories: 280, protein: 8, carbs: 30, fat: 14, serving: "3 pieces", tags: ["vegetarian"] },
  { id: "m07", name: "Fattat Hommos", arabicName: "فتّة حمّص", category: "main", calories: 420, protein: 16, carbs: 42, fat: 22, serving: "1 bowl", tags: ["vegetarian"] },
  { id: "m08", name: "Fattoush", arabicName: "فتّوش", category: "main", calories: 180, protein: 4, carbs: 22, fat: 9, serving: "1 large bowl", tags: ["vegetarian", "low-fat"] },
  { id: "m09", name: "Foul Moudamas", arabicName: "فول مدمّس", category: "main", calories: 280, protein: 16, carbs: 38, fat: 6, serving: "1 bowl", tags: ["vegetarian", "high-protein", "low-fat"] },
  { id: "m10", name: "Hindbe bil Zet", arabicName: "هندبة بالزيت", category: "main", calories: 150, protein: 4, carbs: 8, fat: 12, serving: "1 plate", tags: ["vegetarian", "low-fat"] },
  { id: "m11", name: "Hommos bi Tahini", arabicName: "حمّص بالطحينة", category: "main", calories: 350, protein: 12, carbs: 32, fat: 20, serving: "1 cup", tags: ["vegetarian", "high-protein"] },
  { id: "m12", name: "Kafta wa Batata", arabicName: "كفتة وبطاطا", category: "main", calories: 450, protein: 24, carbs: 30, fat: 26, serving: "1 serving", tags: ["high-protein"] },
  { id: "m13", name: "Kebba bil Sayniya", arabicName: "كبّة بالصينية", category: "main", calories: 420, protein: 22, carbs: 28, fat: 24, serving: "1 slice (200g)", tags: ["high-protein"] },
  { id: "m14", name: "Koussa Mahchi", arabicName: "كوسا محشي", category: "main", calories: 310, protein: 14, carbs: 28, fat: 16, serving: "3 pieces", tags: [] },
  { id: "m15", name: "Lahm bil Ajin", arabicName: "لحم بعجين", category: "main", calories: 380, protein: 18, carbs: 38, fat: 16, serving: "3 pieces", tags: ["high-protein"] },
  { id: "m16", name: "Loubia bil Zet", arabicName: "لوبيا بالزيت", category: "main", calories: 220, protein: 8, carbs: 28, fat: 10, serving: "1 bowl", tags: ["vegetarian", "low-fat"] },
  { id: "m17", name: "Malfouf Mahchi", arabicName: "ملفوف محشي", category: "main", calories: 300, protein: 12, carbs: 32, fat: 14, serving: "6 rolls", tags: [] },
  { id: "m18", name: "Moujadara", arabicName: "مجدّرة", category: "main", calories: 340, protein: 14, carbs: 52, fat: 8, serving: "1 bowl", tags: ["vegetarian", "high-protein", "low-fat"] },
  { id: "m19", name: "Moghrabia", arabicName: "مغربية", category: "main", calories: 450, protein: 22, carbs: 50, fat: 18, serving: "1 bowl", tags: ["high-protein"] },
  { id: "m20", name: "Mousaka Batinjan", arabicName: "مسقعة باذنجان", category: "main", calories: 350, protein: 12, carbs: 24, fat: 24, serving: "1 serving", tags: ["vegetarian"] },
  { id: "m21", name: "Riz a Dajaj", arabicName: "رز بالدجاج", category: "main", calories: 480, protein: 32, carbs: 52, fat: 14, serving: "1 plate", tags: ["high-protein"] },
  { id: "m22", name: "Riz bi Lahma", arabicName: "رز باللحمة", category: "main", calories: 520, protein: 28, carbs: 55, fat: 20, serving: "1 plate", tags: ["high-protein"] },
  { id: "m23", name: "Sayadia", arabicName: "صيادية", category: "main", calories: 440, protein: 30, carbs: 45, fat: 14, serving: "1 plate", tags: ["high-protein"] },
  { id: "m24", name: "Shawarma Dajaj", arabicName: "شاورما دجاج", category: "main", calories: 420, protein: 28, carbs: 38, fat: 16, serving: "1 wrap", tags: ["high-protein"] },
  { id: "m25", name: "Shawarma Lahma", arabicName: "شاورما لحمة", category: "main", calories: 480, protein: 26, carbs: 36, fat: 24, serving: "1 wrap", tags: ["high-protein"] },
  { id: "m26", name: "Tabboula", arabicName: "تبّولة", category: "main", calories: 120, protein: 3, carbs: 16, fat: 5, serving: "1 bowl", tags: ["vegetarian", "low-fat"] },
  { id: "m27", name: "Warak Enab", arabicName: "ورق عنب", category: "main", calories: 280, protein: 8, carbs: 32, fat: 14, serving: "8 pieces", tags: ["vegetarian"] },
  { id: "m28", name: "Yakhnat Bamia", arabicName: "يخنة بامية", category: "main", calories: 350, protein: 20, carbs: 22, fat: 20, serving: "1 bowl", tags: [] },
  { id: "m29", name: "Yakhnat Fassoulia", arabicName: "يخنة فاصوليا", category: "main", calories: 380, protein: 22, carbs: 30, fat: 18, serving: "1 bowl", tags: ["high-protein"] },
  { id: "m30", name: "Yakhnat Mouloukhia", arabicName: "يخنة ملوخية", category: "main", calories: 360, protein: 24, carbs: 18, fat: 22, serving: "1 bowl", tags: ["high-protein"] },

  // ═══════════════════════════════════════════
  //  DESSERTS
  // ═══════════════════════════════════════════
  { id: "d01", name: "Baklava Mixed", arabicName: "بقلاوة مشكّلة", category: "dessert", calories: 350, protein: 6, carbs: 42, fat: 18, serving: "3 pieces", tags: [] },
  { id: "d02", name: "Baklava Mixed Light", arabicName: "بقلاوة مشكّلة لايت", category: "dessert", calories: 220, protein: 5, carbs: 30, fat: 10, serving: "3 pieces", tags: ["low-fat"] },
  { id: "d03", name: "Barazik", arabicName: "برازق", category: "dessert", calories: 280, protein: 5, carbs: 32, fat: 16, serving: "4 pieces", tags: [] },
  { id: "d04", name: "Boundoukia", arabicName: "بندقيّة", category: "dessert", calories: 240, protein: 4, carbs: 28, fat: 14, serving: "4 pieces", tags: [] },
  { id: "d05", name: "Daoukia", arabicName: "داوقيّة", category: "dessert", calories: 260, protein: 5, carbs: 30, fat: 14, serving: "4 pieces", tags: [] },
  { id: "d06", name: "Foustoukia", arabicName: "فستقيّة", category: "dessert", calories: 290, protein: 7, carbs: 28, fat: 18, serving: "4 pieces", tags: [] },
  { id: "d07", name: "Ghourayba", arabicName: "غريبة", category: "dessert", calories: 200, protein: 3, carbs: 24, fat: 11, serving: "3 pieces", tags: [] },
  { id: "d08", name: "Halawa", arabicName: "حلاوة", category: "dessert", calories: 310, protein: 8, carbs: 28, fat: 20, serving: "50g", tags: [] },
  { id: "d09", name: "Halawa Light", arabicName: "حلاوة لايت", category: "dessert", calories: 210, protein: 7, carbs: 24, fat: 10, serving: "50g", tags: ["low-fat"] },
  { id: "d10", name: "Halawat El Jiben", arabicName: "حلاوة الجبن", category: "dessert", calories: 340, protein: 8, carbs: 38, fat: 18, serving: "2 pieces", tags: [] },
  { id: "d11", name: "Ish el Bulbul", arabicName: "عش البلبل", category: "dessert", calories: 280, protein: 5, carbs: 30, fat: 16, serving: "3 pieces", tags: [] },
  { id: "d12", name: "Kallaj Kashta", arabicName: "قلاّج قشطة", category: "dessert", calories: 320, protein: 6, carbs: 36, fat: 18, serving: "2 pieces", tags: [] },
  { id: "d13", name: "Karabij Joz maa Crema", arabicName: "كرابيج جوز مع كريما", category: "dessert", calories: 300, protein: 6, carbs: 34, fat: 16, serving: "4 pieces", tags: [] },
  { id: "d14", name: "Katayef Kashta", arabicName: "قطايف قشطة", category: "dessert", calories: 360, protein: 7, carbs: 40, fat: 20, serving: "3 pieces", tags: [] },
  { id: "d15", name: "Kounafa Kashta maa Kaak", arabicName: "كنافة قشطة مع كعك", category: "dessert", calories: 420, protein: 8, carbs: 48, fat: 22, serving: "1 slice", tags: [] },
  { id: "d16", name: "Kounafa bil Jiben", arabicName: "كنافة بالجبن", category: "dessert", calories: 400, protein: 10, carbs: 44, fat: 20, serving: "1 slice", tags: [] },
  { id: "d17", name: "Maakaron", arabicName: "معكرون", category: "dessert", calories: 260, protein: 4, carbs: 32, fat: 14, serving: "4 pieces", tags: [] },
  { id: "d18", name: "Maakroun wa Moushabak", arabicName: "معكرون ومشبّك", category: "dessert", calories: 340, protein: 4, carbs: 44, fat: 16, serving: "4 pieces", tags: [] },
  { id: "d19", name: "Maamoul Tamer", arabicName: "معمول تمر", category: "dessert", calories: 180, protein: 3, carbs: 24, fat: 8, serving: "2 pieces", tags: [] },
  { id: "d20", name: "Maamoul Mad Kashta", arabicName: "معمول مدّ قشطة", category: "dessert", calories: 280, protein: 5, carbs: 32, fat: 16, serving: "1 piece", tags: [] },
  { id: "d21", name: "Maamoul Mad Joz", arabicName: "معمول مدّ جوز", category: "dessert", calories: 300, protein: 6, carbs: 30, fat: 18, serving: "1 piece", tags: [] },
  { id: "d22", name: "Maamoul Foustok", arabicName: "معمول فستق", category: "dessert", calories: 290, protein: 7, carbs: 28, fat: 18, serving: "2 pieces", tags: [] },
  { id: "d23", name: "Maamoul Joz", arabicName: "معمول جوز", category: "dessert", calories: 270, protein: 6, carbs: 28, fat: 16, serving: "2 pieces", tags: [] },
  { id: "d24", name: "Madlouka", arabicName: "مدلوقة", category: "dessert", calories: 320, protein: 5, carbs: 40, fat: 16, serving: "1 bowl", tags: [] },
  { id: "d25", name: "Mafrouka Kashta", arabicName: "مفروكة قشطة", category: "dessert", calories: 380, protein: 6, carbs: 42, fat: 22, serving: "1 slice", tags: [] },
  { id: "d26", name: "Mafrouka Foustok", arabicName: "مفروكة فستق", category: "dessert", calories: 390, protein: 8, carbs: 40, fat: 22, serving: "1 slice", tags: [] },
  { id: "d27", name: "Moufattaka", arabicName: "مفتّقة", category: "dessert", calories: 350, protein: 8, carbs: 38, fat: 20, serving: "1 bowl", tags: [] },
  { id: "d28", name: "Mouhallabiya", arabicName: "مهلّبيّة", category: "dessert", calories: 200, protein: 6, carbs: 30, fat: 6, serving: "1 bowl", tags: ["low-fat"] },
  { id: "d29", name: "Moushabak", arabicName: "مشبّك", category: "dessert", calories: 320, protein: 3, carbs: 42, fat: 16, serving: "4 pieces", tags: [] },
  { id: "d30", name: "Nammoura", arabicName: "نمّورة", category: "dessert", calories: 250, protein: 4, carbs: 36, fat: 10, serving: "1 piece", tags: [] },
  { id: "d31", name: "Osmaliya", arabicName: "عثمليّة", category: "dessert", calories: 360, protein: 6, carbs: 42, fat: 20, serving: "1 slice", tags: [] },
  { id: "d32", name: "Riz bil Halib", arabicName: "رز بالحليب", category: "dessert", calories: 220, protein: 6, carbs: 36, fat: 6, serving: "1 bowl", tags: ["low-fat"] },
  { id: "d33", name: "Saniora", arabicName: "صنيورة", category: "dessert", calories: 240, protein: 4, carbs: 30, fat: 12, serving: "3 pieces", tags: [] },
  { id: "d34", name: "Sfouf", arabicName: "صفوف", category: "dessert", calories: 230, protein: 4, carbs: 34, fat: 10, serving: "1 piece", tags: [] },
  { id: "d35", name: "Shaaybiyat", arabicName: "شعيبيّات", category: "dessert", calories: 340, protein: 5, carbs: 38, fat: 20, serving: "3 pieces", tags: [] },
  { id: "d36", name: "Ward el Sham", arabicName: "ورد الشام", category: "dessert", calories: 300, protein: 5, carbs: 34, fat: 16, serving: "3 pieces", tags: [] },
  { id: "d37", name: "Znoud el Sitt", arabicName: "زنود الست", category: "dessert", calories: 360, protein: 5, carbs: 40, fat: 20, serving: "3 pieces", tags: [] },
]

export default lebaneseFoods
