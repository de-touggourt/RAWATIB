// ============================================================
// إعدادات وتهيئة Firebase الموحدة
// مشروع بوابة المستخلفين والمتعاقدين - مديرية التربية لولاية توقرت
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyBqr0Df8o0dFxq54-sf_PSe5pHdxAsur74",
  authDomain: "base2-975d9.firebaseapp.com",
  projectId: "base2-975d9",
  storageBucket: "base2-975d9.firebasestorage.app",
  messagingSenderId: "904023044219",
  appId: "1:904023044219:web:55ff53b162f68cd878f2de",
  measurementId: "G-HHD9ZLGY0Q"
};

// تهيئة Firebase في حال لم يتم تهيئته مسبقاً
if (typeof firebase !== 'undefined') {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  window.db = firebase.firestore();
  console.log("✅ تم الاتصال بنجاح بمشروع Firebase: base2-975d9");
} else {
  console.error("❌ مكتبة Firebase غير محملة في الصفحة!");
}

// دالة مساعدة لجلب إعدادات النظام الحالية (السنة الدراسية، حالة التسجيل)
async function getSystemSettings() {
  try {
    const docRef = window.db.collection("system_settings").doc("general");
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      return docSnap.data();
    } else {
      // إعدادات افتراضية إذا لم تكن موجودة بعد
      const defaultSettings = {
        active_academic_year: "2026-2027",
        academic_years: ["2026-2027", "2025-2026"],
        registration_enabled: true,
        closure_message: "التسجيل مغلق مؤقتاً لانتهاء الآجال المحددة.",
        permissions: {
          allow_director_edit: true,
          allow_director_delete: true
        }
      };
      await docRef.set(defaultSettings);
      return defaultSettings;
    }
  } catch (err) {
    console.warn("تعذر جلب إعدادات النظام من Firebase، استخدام الإعدادات الافتراضية:", err);
    return {
      active_academic_year: "2026-2027",
      academic_years: ["2026-2027"],
      registration_enabled: true,
      closure_message: "التسجيل مغلق مؤقتاً.",
      permissions: { allow_director_edit: true, allow_director_delete: true }
    };
  }
}
