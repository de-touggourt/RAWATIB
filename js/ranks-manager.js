// ============================================================
// محرك تسيير وتوليد الرتب والرموز التلقائية
// (Grade Codes & Administration Codes Manager)
// ============================================================

// الخريطة الافتراضية للرتب والرموز
const DEFAULT_RANKS_CONFIG = {
  // 1. التعليم الابتدائي
  "ابتدائي_ليسانس_مستخلف": {
    title: "أستاذ التعليم الابتدائي مستخلف(ة)",
    gradeCode: "1006",
    adminCode: "10"
  },
  "ابتدائي_ليسانس_متعاقد": {
    title: "أستاذ التعليم الابتدائي متعاقد(ة)",
    gradeCode: "1006",
    adminCode: "10"
  },
  "ابتدائي_ماستر_مستخلف": {
    title: "أستاذ التعليم الابتدائي قسم أول مستخلف(ة)",
    gradeCode: "1007",
    adminCode: "10"
  },
  "ابتدائي_ماستر_متعاقد": {
    title: "أستاذ التعليم الابتدائي قسم أول متعاقد(ة)",
    gradeCode: "1007",
    adminCode: "10"
  },

  // 2. التعليم المتوسط
  "متوسط_ليسانس_مستخلف": {
    title: "أستاذ التعليم المتوسط مستخلف(ة)",
    gradeCode: "3012",
    adminCode: "30"
  },
  "متوسط_ليسانس_متعاقد": {
    title: "أستاذ التعليم المتوسط متعاقد(ة)",
    gradeCode: "3012",
    adminCode: "30"
  },
  "متوسط_ماستر_مستخلف": {
    title: "أستاذ التعليم المتوسط قسم أول مستخلف(ة)",
    gradeCode: "3020",
    adminCode: "30"
  },
  "متوسط_ماستر_متعاقد": {
    title: "أستاذ التعليم المتوسط قسم أول متعاقد(ة)",
    gradeCode: "3020",
    adminCode: "30"
  },

  // 3. التعليم الثانوي
  "ثانوي_ليسانس_مستخلف": {
    title: "أستاذ التعليم الثانوي مستخلف(ة)",
    gradeCode: "5021",
    adminCode: "50"
  },
  "ثانوي_ليسانس_متعاقد": {
    title: "أستاذ التعليم الثانوي متعاقد(ة)",
    gradeCode: "5020",
    adminCode: "50"
  },
  "ثانوي_ماستر_مستخلف": {
    title: "أستاذ التعليم الثانوي قسم أول مستخلف(ة)",
    gradeCode: "5024",
    adminCode: "50"
  },
  "ثانوي_ماستر_متعاقد": {
    title: "أستاذ التعليم الثانوي قسم أول متعاقد(ة)",
    gradeCode: "5024",
    adminCode: "50"
  }
};

let cachedRanksConfig = null;

// جلب إعدادات الرتب من Firestore أو استخدام الافتراضية
async function getRanksConfig() {
  if (cachedRanksConfig) return cachedRanksConfig;

  if (window.db) {
    try {
      const docSnap = await window.db.collection("ranks_settings").doc("mapping").get();
      if (docSnap.exists) {
        cachedRanksConfig = { ...DEFAULT_RANKS_CONFIG, ...docSnap.data() };
        return cachedRanksConfig;
      }
    } catch (e) {
      console.warn("استخدام الرتب الافتراضية لتعذر الاتصال:", e);
    }
  }

  cachedRanksConfig = DEFAULT_RANKS_CONFIG;
  return cachedRanksConfig;
}

// دالة توليد الرتبة ورمز الرتبة ورمز الإدارة آلياً
function computeRank(level, diploma, statusType) {
  if (!level || !diploma || !statusType) {
    return {
      rankTitle: "",
      gradeCode: "",
      adminCode: ""
    };
  }

  // تنظيف المدخلات (مستخلف/مستخلفة -> مستخلف)
  const cleanStatus = statusType.includes("مستخلف") ? "مستخلف" : "متعاقد";
  const cleanDiploma = diploma.includes("ماستر") ? "ماستر" : "ليسانس";
  const cleanLevel = level.trim();

  const key = `${cleanLevel}_${cleanDiploma}_${cleanStatus}`;
  const config = (cachedRanksConfig || DEFAULT_RANKS_CONFIG)[key];

  if (config) {
    return {
      rankTitle: config.title,
      gradeCode: config.gradeCode,
      adminCode: config.adminCode
    };
  }

  // التوليد الاحتياطي في حال عدم التطابق التام
  let title = `أستاذ التعليم ال${cleanLevel}`;
  if (cleanDiploma === "ماستر") title += " قسم أول";
  title += cleanStatus === "مستخلف" ? " مستخلف(ة)" : " متعاقد(ة)";

  let gr = "1006";
  let adm = "10";
  if (cleanLevel === "متوسط") { gr = cleanDiploma === "ماستر" ? "3020" : "3012"; adm = "30"; }
  if (cleanLevel === "ثانوي") { gr = cleanDiploma === "ماستر" ? "5024" : "5020"; adm = "50"; }

  return {
    rankTitle: title,
    gradeCode: gr,
    adminCode: adm
  };
}

// حفظ أو تحديث خريطة الرتب من لوحة الإدارة
async function saveRanksConfig(newConfig) {
  if (!window.db) throw new Error("قاعدة البيانات غير مهيأة");
  await window.db.collection("ranks_settings").doc("mapping").set(newConfig);
  cachedRanksConfig = newConfig;
}
