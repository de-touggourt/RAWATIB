// ============================================================
// 🔒 SYSTEM GUARD V3.0: نظام الأرقام (1=نشط، 2=إدارة، 0=غلق)
// ============================================================

const LOCAL_VERSION = "1.0.7"; 
let CURRENT_SYSTEM_MODE = 1; // متغير عام لحفظ الحالة
let isSecretLoginActive = false; // متغير لمنع المقاطعة أثناء الدخول السري

const SYSTEM_CONFIG = {
    versionFile: "version.json",
    settingsFile: "settings.json",
    checkInterval: 5000 // فحص كل 5 ثواني
};


// متغيرات لعد النقرات السرية
let secretClickCount = 0;
let secretClickTimer = null;

// دالة معالجة النقرات
window.handleSecretClick = function() {
    secretClickCount++;
    
    // إعادة تعيين العداد إذا توقف النقر لأكثر من ثانية (لضمان أن النقرات متتالية)
    if (secretClickTimer) clearTimeout(secretClickTimer);
    secretClickTimer = setTimeout(() => {
        secretClickCount = 0;
    }, 1000);

    // إذا وصل العدد لـ 10 نقرات
    if (secretClickCount >= 10) {
        secretClickCount = 0; // تصفير العداد
        triggerSecretAdminLogin(); // تشغيل نافذة الدخول
    }
};


// متغير عالمي لحفظ معرف المؤقت لإيقافه لاحقاً
window.systemCheckIntervalId = null; 

async function performSystemCheck() {
    try {
        // 👇👇👇 إذا كنا نحاول الدخول السري، توقف ولا تفعل شيئاً
        if (typeof isSecretLoginActive !== 'undefined' && isSecretLoginActive) return;
        // 👆👆👆

        // ❌ تم حذف سطر "admin_bypass" من هنا لكي يتم تحديث حالة النظام دائماً حتى للمشرف

        const docSnap = await db.collection("config").doc("pass").get();
        
        if (docSnap.exists) {
            const data = docSnap.data();
            const mode = data.status; 
            
            CURRENT_SYSTEM_MODE = mode; // ✅ ستبقى الحالة 0 (مغلق) حتى للمشرف
            
            const ccpInput = document.getElementById("ccpInput");
            const loginBtn = document.getElementById("loginBtn");
            const adminBtn = document.querySelector("button[onclick='openAdminModal()']");
            const container = document.getElementById("interfaceCard");
            const isAdmin = sessionStorage.getItem("admin_bypass") === "true"; // هل المستخدم أدمن؟

            // --- الحالة 0: غلق كلي (صيانة) ---
            if (mode == 0) {
                
                // 👇👇👇 التعديل الجديد: التفريق بين المشرف والزائر 👇👇👇
                if (isAdmin) {
                    // إذا كان أدمن: أظهر المحتوى وأغلق نافذة التنبيه إن وجدت
                    if (container) container.style.display = "block";
                    if (Swal.isVisible() && Swal.getTitle()?.textContent.includes('المنصة مغلقة')) {
                        Swal.close();
                    }
                } else {
                    // إذا كان زائراً عادياً: أخفِ المحتوى وأظهر نافذة الغلق
                    if (container) container.style.display = "none";
                    
                    const isClosedPopupVisible = Swal.isVisible() && Swal.getTitle()?.textContent.includes('المنصة مغلقة');

                    if (!isClosedPopupVisible) {
                        Swal.fire({
                            icon: 'warning',
                            title: '<span style="cursor: default; user-select: none;" onclick="handleSecretClick()">المنصة مغلقة</span>',
                            html: `
                                <div style="text-align: center; direction: rtl; line-height: 1.8;">
                                    <p style="margin-bottom: 15px; font-size: 1.1em; color: #34495e;">
                                        ننهي إلى علمكم أن المنصة مغلقة حالياً نظراً
                                        <br>
                                        <b style="color: #c0392b;">لانتهاء الآجال المحددة</b>.
                                    </p>
                                    <div style="margin: 15px auto; width: 60%; height: 1px; background-color: #e0e0e0;"></div>
                                    <p style="font-size: 1em; color: #555;">
                                        لأي استفسار، يرجى التواصل مع
                                        <br>
                                        <span style="color: #7f8c8d; font-size: 0.9em;">مسؤول الرقمنة بمديرية التربية</span>
                                        <br>
                                        <strong style="color: #1a5276; font-size: 1.2em; display: block; margin-top: 5px;">
                                            السيد: جديرة محمد الحبيب
                                        </strong>
                                    </p>
                                    <div style="margin-top: 15px; direction: ltr;">
                                        <a href="tel:0664446349" style="display: inline-block; text-decoration: none; color: #fff; background-color: #2980b9; padding: 8px 25px; border-radius: 50px; font-weight: bold; font-size: 1.2em; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                                            📞 0664 44 63 49
                                        </a>
                                    </div>
                                </div>
                            `,
                            allowOutsideClick: false,
                            allowEscapeKey: false,
                            showConfirmButton: false,
                            width: '450px'
                        });
                    }
                }
                return; // الخروج من الدالة بعد معالجة حالة الغلق
            }

            // ... باقي الحالات (1 و 2) تبقى كما هي دون تغيير ...
            if (mode == 2) {
                if(ccpInput) ccpInput.style.display = "none";
                if(loginBtn) loginBtn.style.display = "none";
                if(adminBtn) {
                    adminBtn.style.display = "inline-block";
                    adminBtn.style.width = "100%"; 
                    adminBtn.innerHTML = `<i class="fas fa-user-shield"></i> بوابة الإدارة (التسجيل مغلق حالياً)`;
                }
            } 
            else if (mode == 1) {
                if(ccpInput) ccpInput.style.display = "block";
                if(loginBtn) loginBtn.style.display = "inline-block";
                if(adminBtn) {
                    adminBtn.style.display = "inline-block";
                    adminBtn.style.width = ""; 
                    adminBtn.innerHTML = `<i class="fas fa-file-alt"></i> استخراج القوائم والاستمارات`;
                }
                if (Swal.isVisible() && Swal.getTitle()?.textContent.includes('المنصة مغلقة')) Swal.close();
            }
        }
    } catch (error) {
        console.warn("فشل فحص حالة النظام:", error);
    }
}

// تشغيل النظام
document.addEventListener("DOMContentLoaded", () => {
    performSystemCheck();
    // حفظنا الـ ID هنا 👇
    window.systemCheckIntervalId = setInterval(performSystemCheck, SYSTEM_CONFIG.checkInterval);
});

// ============================================================
// نهاية كود نظام الحماية
// ============================================================
// ============================================================
// كود استقبال الإشارة السرية (postMessage)
// ============================================================
window.addEventListener("message", (event) => {
    if (event.data === "AUTH_Dir55@tggt") {
        const overlay = document.getElementById("systemLoginOverlay");
        const container = document.getElementById("interfaceCard");
        
        if(overlay) overlay.style.display = 'none';

        if(container && typeof SECURE_INTERFACE_HTML !== 'undefined') {
            if (!container.classList.contains("show-content")) {
                container.innerHTML = SECURE_INTERFACE_HTML;
                container.classList.add("show-content");
                container.style.display = "block";

                const ccpInp = document.getElementById("ccpInput");
                if(ccpInp) {
                    ccpInp.addEventListener("keypress", function(e) {
                        if (e.key === "Enter") { e.preventDefault(); document.getElementById("loginBtn").click(); }
                    });
                }
                
                const Toast = Swal.mixin({toast: true, position: 'top-end', showConfirmButton: false, timer: 3000});
                Toast.fire({ icon: 'success', title: 'تم الاتصال الآمن بلوحة التحكم' });
            }
        }
    }
});


// --- الثوابت المخفية (HTML المحمي) ---
const SECURE_INTERFACE_HTML = `
    <div class="page-header" id="mainHeader">
      <div class="header-text">
        الجمهورية الجزائرية الديمقراطية الشعبية<br>
        وزارة التربية الوطنية<br>
      </div>
      
      <div class="logo-wrapper">
        <img src="https://lh3.googleusercontent.com/d/1BqWoqh1T1lArUcwAGNF7cGnnN83niKVl" alt="شعار اللجنة" class="header-logo">
      </div>

      <h2 class="gradient-title">
        مديرية التربية لولاية توقرت<br>
        <span class="highlight-text">المنصة الرقمية</span>
      </h2>
      
      <div id="loginSection">
        <input type="text" id="ccpInput" placeholder="أدخل رقم الحساب الجاري (من 10 إلى 12 رقماً)" maxlength="12" oninput="valNum(this)">
        <button class="btn-main" id="loginBtn" onclick="checkEmployee()">تسجيل الدخول</button>
        
        <button class="btn-main" onclick="openAdminModal()" 
                style="background: #fff; color: #2575fc; border: 2px solid #2575fc; margin-top: 10px; font-weight:bold;">
          <i class="fas fa-file-alt"></i> استخراج القوائم والاستمارات
        </button>

        <button class="btn-main" onclick="goToProfessionalCardsMain()" 
                style="background: #17a2b8; color: #fff; border: 2px solid #17a2b8; margin-top: 10px; font-weight:bold;">
          <i class="fas fa-id-badge"></i> استخراج البطاقات المهنية
        </button>
        </div>
    </div>

    <div id="formSection" style="display: none;">
      <h2 class="gradient-title" style="margin-bottom: 20px; font-size:20px;">استمارة تحديث بيانات الموظفين</h2>

      <input type="hidden" id="mtrField">
      <input type="hidden" id="admField">
      <input type="hidden" id="grField">

      <div class="section-divider"><span class="section-title">البيانات الشخصية للموظف</span></div>

      <div class="info-grid">
        <div class="outer-group">
          <label>رقم الحساب الجاري CCP:</label>
          <input type="text" id="ccpField" class="readonly-field">
        </div>
        <div class="outer-group">
          <label>رقم الضمان الاجتماعي:</label>
          <input type="text" id="assField" class="readonly-field">
        </div>
        <div class="outer-group">
          <label>اللقب:</label>
          <input type="text" id="fmnField" class="editable-field" oninput="valAr(this); removeError(this)">
        </div>
        <div class="outer-group">
          <label>الاسم:</label>
          <input type="text" id="frnField" class="editable-field" oninput="valAr(this); removeError(this)">
        </div>
        <div class="outer-group">
          <label>تاريخ الميلاد:</label>
          <input type="date" id="dizField" class="editable-field" onchange="removeError(this)">
        </div>
        <div class="outer-group">
          <label>الوظيفة:</label>
          <input type="text" id="jobField" class="readonly-field">
        </div>
      </div>

      <div class="section-divider"><span class="section-title">بيانات الموظف المهنية</span></div>

      <div class="outer-group" style="margin-bottom: 20px;">
        <label>الطور:</label>
       <select id="levelField" onchange="resetGeoFields(); updateWorkPlace(); removeError(this)">
          <option value="">-- اختر --</option>
          <option value="ابتدائي">ابتدائي</option>
          <option value="متوسط">متوسط</option>
          <option value="ثانوي">ثانوي</option>
          <option value="مديرية التربية">مديرية التربية</option>
        </select>
      </div>

      <div class="info-grid">
        <div class="outer-group">
          <label>الدائرة</label>
          <select id="daairaField" onchange="updBal(); updateWorkPlace(); removeError(this)">
            <option value="">-- اختر --</option>
            <option value="توقرت">توقرت</option>
            <option value="تماسين">تماسين</option>
            <option value="المقارين">المقارين</option>
            <option value="الحجيرة">الحجيرة</option>
            <option value="الطيبات">الطيبات</option>
          </select>
        </div>
        <div class="outer-group">
          <label>البلدية</label>
          <select id="baladiyaField" onchange="updateWorkPlace(); removeError(this)">
            <option value="">-- اختر --</option>
          </select>
        </div>
      </div>

      <div class="outer-group">
        <label>مؤسسة العمل:</label>
        <div id="institutionArea">
          <input readonly placeholder="..." class="readonly-field">
        </div>
        <input type="hidden" id="institutionCodeField">
      </div>

      <div class="section-divider"><span class="section-title">معلومات الاتصال والهوية</span></div>

      <div class="info-grid">
        <div class="outer-group">
          <label>رقم الهاتف (10 أرقام)</label>
          <input type="text" id="phoneField" maxlength="10" oninput="valNum(this); removeError(this)" dir="ltr" placeholder="06XXXXXXXX">
        </div>
        <div class="outer-group">
          <label>رقم التعريف الوطني (NIN)</label>
          <input type="text" id="ninField" maxlength="18" oninput="valNum(this); removeError(this)" placeholder="رقم البطاقة البيومترية 18 رقم">
        </div>
      </div>

      <button class="btn-main" onclick="submitRegistration()">حفظ وتأكيد المعلومات</button>
      <button class="btn-main" style="background: #6c757d; margin-top: 10px;" onclick="resetInterface()">إلغاء / خروج</button>
    </div>
`;

// 🛑🛑🛑 ضع رابط لوحة التحكم الخاصة بك هنا 🛑🛑🛑
const ADMIN_DASHBOARD_URL = "admin0955tggt.html"; 

// --- إعدادات Firebase ---
const firebaseConfig = {
  apiKey: "AIzaSyAkQz9pB2ZNlYIvdlTRvi4try3D8LLXS4g",
  authDomain: "databaseemploye.firebaseapp.com",
  projectId: "databaseemploye",
  storageBucket: "databaseemploye.firebasestorage.app",
  messagingSenderId: "408231477466",
  appId: "1:408231477466:web:e3bf5bd3eaca7cdcd3a5e3",
  measurementId: "G-DW8QJ5B231"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 🛑🛑🛑 استبدل هذا الرابط برابط السكريبت الخاص بك 🛑🛑🛑
const scriptURL = "https://script.google.com/macros/s/AKfycbyXEdCPd-rrImLFLZObPXbeELUqj71mknOOFB7sjMCh6JQE-L7yMIsgFlFXrA5-VTUjRg/exec";

// --- خريطة الرتب ---
const gradeMap = {
    "1006": "أستاذ إبتدائي (متعاقد)",
    "1007": "أستاذ تعليم إبتدائي قسم أول",
    "1008": "أستاذ تعليم إبتدائي قسم ثان",
    "1009": "أستاذ مميز في التعليم الإبتدائي",
    "1010": "أستاذ التعليم الإبتدائي",
    "2021": "ناظر في التعليم الإبتدائي",
    "2031": "مربي متخصص رئيسي في الدعم",
    "2100": "مدير مدرسة إبتدائية",
    "3010": "أستاذ مميز في التعليم المتوسط",
    "3005": "أستاذ التعليم المتوسط قسم ثاني",
    "3001": "أستاذ التعليم المتوسط قسم أول",
    "3012": "أستاذ التعليم المتوسط / متعاقد",
    "3020": "أستاذ ت م متعاقد ق 01 (13)",
    "4000": "مدير متوسطة",
    "4006": "ناظر في التعليم المتوسط",
    "5019": "أستاذ تعليم ثانوي",
    "5020": "أستاذ تعليم ثانوي (متعاقد)",
    "5021": "أستاذ تعليم ثانوي مستخلف",
    "5022": "أستاذ مميز في التعليم الثانوي",
    "5023": "أستاذ التعليم الثانوي قسم ثان",
    "5024": "أستاذ التعليم الثانوي قسم أول",
    "6001": "مدير ثانوية",
    "6004": "ناظر في التعليم الثانوي",
    "4030": "مستشار التربية",
    "4031": "مستشار توجيه وارشاد مدرسي",
    "4032": "مستشار محلل لتوجيه والارشاد",
    "4033": "مستشار رئيسي للتوجيه",
    "4034": "مستشار رئيس للتوجيه",
    "6003": "مستشار رئيس توجيه وارشاد",
    "6008": "مستشار محلل توجيه وارشاد",
    "6009": "مستشار رئيسي توجيه وارشاد",
    "6025": "مستشار للتوجيه المدرسي",
    "6035": "مستشار للتربية",
    "7160": "مستشار محلل للتوجيه والإرشاد المدرسي",
    "7025": "مفتش التعليم الثانوي للتوجيه والإرشاد",
    "4025": "مقتصد",
    "4040": "نائب مقتصد مسير",
    "4060": "نائب مقتصد",
    "4065": "مساعد رئيسي للمصالح الاقتصادية",
    "6010": "مقتصد رئيسي",
    "6015": "مقتصد",
    "6085": "نائب مقتصد",
    "7220": "نائب مقتصد",
    "7260": "م مصالح اقتصادية رئيسي",
    "4087": "مشرف تربية",
    "4088": "مشرف رئيسي للتربية",
    "4089": "مشرف رئيس للتربية",
    "4090": "مشرف عام للتربية",
    "4085": "مساعد رئيسي للتربية",
    "6006": "مشرف رئيس للتربية",
    "6007": "مشرف عام للتربية",
    "6117": "مشرف رئيسي للتربية",
    "6118": "مشرف للتربية",
    "4072": "ملحق بالمخبر",
    "4076": "ملحق رئيسي للمخبر",
    "4077": "ملحق رئيس بالمخابر",
    "4078": "ملحق مشرف بالمخابر",
    "6046": "ملحق رئيسي للمخبر",
    "6047": "ملحق مشرف بالمخابر",
    "6048": "ملحق رئيس بالمخابر",
    "7005": "مدير التربية",
    "7682": "مدير التربية",
    "7011": "الأمين العام",
    "7013": "رئيس مصلحة بمديرية التربية",
    "7071": "رئيس مصلحة بمديرية التربية",
    "7073": "رئيس مكتب",
    "7074": "رئيس مكتب",
    "7023": "مفتش التعليم المتوسط تخصص مواد",
    "7024": "مفتش التعليم الثانوي تخصص مواد",
    "7036": "مفتش تعليم متوسط تخصص إدارة",
    "7044": "مفتش ت.إ تخصص إدارة مدارس ابتدائي",
    "7045": "مفتش تغذية مدرسية",
    "7046": "مفتش التغذية المدرسية",
    "7047": "مفتش التعليم الابتدائي تخصص مواد",
    "7042": "مفتش التغذية المدرسية",
    "6081": "ملحق إدارة",
    "7210": "ملحق إدارة",
    "7155": "ملحق إدارة رئيسي",
    "6100": "عون إدارة رئيسي",
    "6185": "عون إدارة",
    "7311": "عون إدارة",
    "8380": "عون إدارة",
    "6194": "كاتب مديرية",
    "6195": "كاتب",
    "6215": "عون حفظ بيانات",
    "7345": "عون حجز بيانات",
    "6082": "مساعد وثائقي أمين محفوظات",
    "6083": "أمين وثائقي للمحفوظات رئيسي",
    "7271": "مساعد وثائقي أمين محفوظات",
    "7075": "مهندس دولة في الإعلام الآلي",
    "7095": "مهندس مستوى أول في الإحصاء",
    "7105": "تقني سامي في الاعلام الآلي",
    "7150": "تقني سامي في الاعلام الآلي مستوى 3",
    "7099": "متصرف محلل",
    "7100": "متصرف",
    "7445": "متصرف محلل",
    "6038": "ممرض حاصل على شهادة دولة",
    "6041": "ممرض للصحة العمومية",
    "7032": "نفساني عيادي للصحة العمومية",
    "7033": "نفساني عيادي للصحة العمومية",
    "6140": "رئيس فرقة للامن و الوقاية",
    "6165": "عون أمن ووقاية",
    "6225": "عون أمن ووقاية",
    "6201": "سائق سيارة مستوى أول",
    "6110": "عامل مهني خارج الصنف",
    "6155": "عامل مهني الصنف 1",
    "6161": "عامل مهني مستوى ثالث",
    "6205": "عامل مهني الصنف 2",
    "6221": "عامل مهني مستوى ثاني",
    "6241": "عامل مهني مستوى أول",
    "7280": "عامل مهني مستوى أول",
    "7310": "عامل مهني مستوى أول",
    "7434": "عامل مهني مستوى 1"
};

const baladiyaMap = { "توقرت": ["توقرت", "النزلة", "تبسبست", "الزاوية العابدية"], "تماسين": ["تماسين", "بلدة عمر"], "المقارين": ["المقارين", "سيدي سليمان"], "الحجيرة": ["الحجيرة", "العالية"], "الطيبات": ["الطيبات", "المنقر", "ابن ناصر"] };

window.primarySchoolsByBaladiya = {
  "ابن ناصر": [{ name: "إبتدائية عبد الحميد بن باديس - إبن ناصر" }, { name: "إبتدائية العربي التبسي - إبن ناصر" }, { name: "إبتدائية البشير الابراهيمي - إبن ناصر" }, { name: "إبتدائية هواري بومدين - إبن ناصر" }, { name: "إبتدائية المجاهد الصادق خلفاوي - إبن ناصر" }, { name: "إبتدائية المجاهد سراي مسعود ( المر) - إبن ناصر" }, { name: "إبتدائية المجاهد اليمان الطيب - إبن ناصر" }, { name: "إبتدائية المجاهد العقون خليفة - إبن ناصر" }, { name: "إبتدائية المجاهد قحمص محمد بن العيد - إبن ناصر" }, { name: "إبتدائية 13 مارس 1962 - إبن ناصر" }, { name: "إبتدائية اللأمير عبد القادر - إبن ناصر" }, { name: "إبتدائية العقبي الطيب - إبن ناصر" }],
  "الحجيرة": [{ name: "إبتدائية ابن باديس - الحجيرة" }, { name: "إبتدائية ديدوش مراد - الحجيرة" }, { name: "إبتدائية نعام سليمان - الحجيرة" }, { name: "إبتدائية محمد العيد آل خليفة - الحجيرة" }, { name: "إبتدائية العيد بن الشيخ - الحجيرة" }, { name: "إبتدائية البشير الابراهيمي - الحجيرة" }, { name: "إبتدائية مصطفى بن بولعيد - الحجيرة" }, { name: "إبتدائية الشهيد الكاس - الحجيرة" }, { name: "إبتدائية صلاح الدين الأيوبي - الحجيرة" }, { name: "إبتدائية ابن خلدون - الحجيرة" }, { name: "إبتدائية علي عمار - الحجيرة" }, { name: "إبتدائية دومة أحمد - الحجيرة" }, { name: "إبتدائية عمار ياسف - الحجيرة" }, { name: "إبتدائية المجاهد كحول احمد - الحجيرة" }, { name: "إبتدائية كريبع مسعود - الحجيرة - - الحجيرة" }, { name: "إبتدائية المجاهد بالأعور العلمي ( لقراف الجديدة 2) - الحجيرة" }, { name: "إبتدائية مجمع مدرسي حي المير - الحجيرة" }, { name: "إبتدائية خنفر محمد لحسن - الحجيرة" }, { name: "إبتدائية حي بوضياف محمد لقراف - الحجيرة" }, { name: "إبتدائية محدادي العيد - الحجيرة" }],
  "الزاوية العابدية": [{ name: "إبتدائية البحري بن المنور القديمة - الزاوية العابدية" }, { name: "إبتدائية مصطفى بن بولعيد - الزاوية العابدية" }, { name: "إبتدائية بوليفة محمد عمران - الزاوية العابدية" }, { name: "إبتدائية صولي عبد الرحمان ( 5 جويلية) - الزاوية العابدية" }, { name: "إبتدائية بشير كدة - الزاوية العابدية" }, { name: "إبتدائية عبد الرحمان بن نونة - الزاوية العابدية" }, { name: "إبتدائية عقبة بن نافع - الزاوية العابدية" }, { name: "إبتدائية المجاهد محمد الاخضر بن لمنور - الزاوية العابدية" }, { name: "إبتدائية غول محمد الصالح (حي السلام) - الزاوية العابدية" }, { name: "إبتدائية محمد مقداد - الزاوية العابدية" }, { name: "إبتدائية احمد بن لمنور - الزاوية العابدية" }],
  "الطيبات": [{ name: "إبتدائية الاستاذ عمر بن عزة - الطيبات" }, { name: "إبتدائية المجاهد عماري معمر - الطيبات" }, { name: "إبتدائية الشهيد قحمص محمد - الطيبات" }, { name: "إبتدائية العلامة حمداوي محمد بن سليمان(القواشيش) - الطيبات" }, { name: "إبتدائية ميلود تريش(بكار القديمة) - الطيبات" }, { name: "إبتدائية المجاهد زقوني بشير - الطيبات" }, { name: "إبتدائية المجاهد مراد معمر( برحمون) - الطيبات" }, { name: "إبتدائية الشهيد محمد الشين - الطيبات" }, { name: "إبتدائية قعبي علي (بئر العسل) - الطيبات" }, { name: "إبتدائية الشهيد بالطاهر الطيب - الطيبات" }, { name: "إبتدائية المجاهد منصوري مبروك - الطيبات" }, { name: "إبتدائية الشهيد بن قلية عمر - الطيبات" }, { name: "إبتدائية المجاهد رواص أحمد - الطيبات" }, { name: "إبتدائية المجاهد دحدي مسعود - الطيبات" }, { name: "إبتدائية المجاهد خليفة خليفة - الطيبات" }, { name: "إبتدائية المجاهد براهمي براهيم - الطيبات" }, { name: "إبتدائية المجاهد بلخير السعيد - الطيبات" }, { name: "إبتدائية المجاهد لـيـتيم محمد (عثمان بن عفان) - الطيبات" }, { name: "إبتدائية المجاهد بالعجال معمر - الطيبات" }, { name: "إبتدائية المجاهد عماري التجاني الدليعي - الطيبات" }],
  "العالية": [{ name: "إبتدائية الشهيد قوادري لخضر - العالية" }, { name: "إبتدائية قادري أحمد - العالية" }, { name: "إبتدائية الامام الغزالي بالعالية - العالية" }, { name: "إبتدائية الشهيد عبيدلي أحمد - العالية" }, { name: "إبتدائية سيدي عبد المالك - العالية" }, { name: "إبتدائية بن احمد احمد - العالية" }, { name: "إبتدائية طفحي مسعود ( العالية الجديدة ) - العالية" }, { name: "إبتدائية غبائشي بشير - العالية" }, { name: "إبتدائية المجاهد بساسي الطاهر - العالية" }, { name: "إبتدائية حمايمي ميلود - العالية" }, { name: "إبتدائية المجاهد حبي عمار - العالية" }, { name: "إبتدائية المجاهد ربروب محمد - العالية" }],
  "المقارين": [{ name: "إبتدائية أسامة بن زيد - المقارين" }, { name: "إبتدائية بن موسى الطيب - المقارين" }, { name: "إبتدائية العقيد سي الحواس - المقارين" }, { name: "إبتدائية ابو عبيدة بن الجراح - المقارين" }, { name: "إبتدائية بشير خذران - المقارين" }, { name: "إبتدائية محمد شافو - المقارين" }, { name: "إبتدائية بركبية حسين - المقارين" }, { name: "إبتدائية الشهيد الشريف محمد بن عبد الله - المقارين" }, { name: "إبتدائية بابا سعيد حشاني ( المجمع المدرسي الجديد ) - المقارين" }, { name: "إبتدائية المجاهد بن الزاوي السعيد - المقارين" }, { name: "إبتدائية المجاهد جاوي محمد - المقارين" }],
  "المنقر": [{ name: "إبتدائية محمد بوعسرية - المنقر" }, { name: "إبتدائية الشهيد مسماري الاخضر اللويبد - المنقر" }, { name: "إبتدائية الشهيد قبي بلقاسم - المنقر" }, { name: "إبتدائية العلامة بن الصديق علي - المنقر" }, { name: "إبتدائية الشهيد خورارة بشير - المنقر" }, { name: "إبتدائية شوية علي - المنقر" }, { name: "إبتدائية الشهيدبكاري السايح الشابي - المنقر" }, { name: "إبتدائية الشهيد محمد خيراني - المنقر" }, { name: "إبتدائية المجاهد احمد بن الصغير قويدري (البحري) - المنقر" }, { name: "إبتدائية الشلالقة( خورارة محمد) - المنقر" }, { name: "إبتدائية نواري محمد الزروق - المنقر" }, { name: "إبتدائية الشهيد دقعة محمد - المنقر" }, { name: "إبتدائية الشهيد محمد نواري( حي النخيل) - المنقر" }, { name: "إبتدائية محمد مايو - المنقر" }, { name: "إبتدائية غندير العايش - المنقر" }, { name: "إبتدائية الشهيد بله محمد الصغير - المنقر" }],
  "النزلة": [{ name: "إبتدائية بن دلالي علي - النزلة" }, { name: "إبتدائية قادري أحمد سيدي ماضي - النزلة" }, { name: "إبتدائية بن عمر النوي - النزلة" }, { name: "إبتدائية بن طرية لمنور - النزلة" }, { name: "إبتدائية بوليفة محمد عمران - النزلة" }, { name: "إبتدائية تماسيني عبد الرحمن - النزلة" }, { name: "إبتدائية كدة بشير - النزلة" }, { name: "إبتدائية حركات العايش - النزلة" }, { name: "إبتدائية المجاهد طرية مخلوف - النزلة" }, { name: "إبتدائية المجاهد قمو محمد - النزلة" }, { name: "إبتدائية تمرني موسى - النزلة" }, { name: "إبتدائية المجاهد سلامي محمد - النزلة" }, { name: "إبتدائية نقودي محمد - النزلة" }, { name: "إبتدائية المجاهد العيفاوي التجاني - النزلة" }, { name: "إبتدائية المجاهد عقال عبد الحميد - النزلة" }, { name: "إبتدائية المجاهد عشاب محمد العيد - النزلة" }, { name: "إبتدائية المجاهد فرحي بحري - النزلة" }, { name: "إبتدائية الشيخ بوعمامة - النزلة" }, { name: "إبتدائية رحماني محمد بن محمد - النزلة" }, { name: "إبتدائية المجاهد كراش الأخضر - النزلة" }, { name: "إبتدائية المجاهد بن حميدة علي - النزلة" }, { name: "إبتدائية بن هدية جاب الله ( المستقبل2) - النزلة" }, { name: "إبتدائية المجاهد مشري غزال - النزلة" }, { name: "إبتدائية بن عاشور السبتي - النزلة" }, { name: "إبتدائية علوي حمزة - النزلة" }, { name: "إبتدائية المجاهد قمو محمود - النزلة" }],
  "بلدة عمر": [{ name: "إبتدائية محمد البشير الإبراهيمي - بلدة اعمر" }, { name: "إبتدائية دحماني عبد الرحمان قوق - بلدة اعمر" }, { name: "إبتدائية بديار محمد - بلدة اعمر" }, { name: "إبتدائية المجاهد قادري موسى - بلدة اعمر" }, { name: "إبتدائية المجاهد الاخضري احمد - بلدة اعمر" }, { name: "إبتدائية المجاهد تمرني عمار(حي النهضة) - بلدة اعمر" }, { name: "إبتدائية المجاهد زروقي علي - بلدة اعمر" }, { name: "إبتدائية المجاهد حاجي عمر - بلدة اعمر" }, { name: "إبتدائية الشهيد مصطفى بن بولعيد قوق - بلدة اعمر" }, { name: "إبتدائية المجاهد شاشة محمد الصغير - بلدة اعمر" }],
  "تبسبست": [{ name: "إبتدائية محمد عشبي - تبسبست" }, { name: "إبتدائية زنو عبد الحفيظ - تبسبست" }, { name: "إبتدائية جواد عمر (تبسبست الجنوبية ) - تبسبست" }, { name: "إبتدائية بن علي الاخضر (بني يسود القديمة) - تبسبست" }, { name: "إبتدائية جيلاني كينة - تبسبست" }, { name: "إبتدائية التجاني نصيري - تبسبست" }, { name: "إبتدائية بن دومة محمد الطاهر - تبسبست" }, { name: "إبتدائية جلابية عبد القادر - تبسبست" }, { name: "إبتدائية المجاهد أحمد شاوش - تبسبست" }, { name: "إبتدائية حي الصومام - تبسبست" }, { name: "إبتدائية المجاهد بوغرارة محمد الصالح - تبسبست" }, { name: "إبتدائية الفتح الجديدة (جرو بحري) - تبسبست" }, { name: "إبتدائية المجاهد العياط سعد - تبسبست" }, { name: "إبتدائية أول نوفمبر 1954 - تبسبست" }, { name: "إبتدائية المجاهد رمون جلول حي فرجمون - تبسبست" }],
  "توقرت": [{ name: "إبتدائية بن خلدون - تقرت" }, { name: "إبتدائية الخنساء - تقرت" }, { name: "إبتدائية الشيخ الطاهر العبيدي - تقرت" }, { name: "إبتدائية عظامو محمد البحري - تقرت" }, { name: "إبتدائية الطالب بابا - تقرت" }, { name: "إبتدائية الإمام الشافعي - تقرت" }, { name: "إبتدائية الامام مالك - تقرت" }, { name: "إبتدائية عبيدلي أحمد - تقرت" }, { name: "إبتدائية عيادي علي - تقرت" }, { name: "إبتدائية ناصر بشير - تقرت" }, { name: "إبتدائية المجاهد موهوبي سليمان - تقرت" }, { name: "إبتدائية المجاهد احمد بورنان - تقرت" }, { name: "إبتدائية بن الصديق عبد الهادي (الرمال 1) - تقرت" }, { name: "إبتدائية الشهيد زابي عبد العالي - تقرت" }, { name: "إبتدائية الأمير عبد القادر الجديدة - تقرت" }, { name: "إبتدائية ميعادي محمد فخر الدين - تقرت" }, { name: "إبتدائية تاتاي محمد الصادق (الرمال 02) - تقرت" }, { name: "إبتدائية المجاهد كافي عبد الرحيم - تقرت" }, { name: "إبتدائية المجاهد عظامو محمد - تقرت" }, { name: "إبتدائية بولعراس ابراهيم - تقرت" }, { name: "إبتدائية حي النضال مجمع مدرسي حي 1190 مسكن - تقرت" }, { name: "إبتدائية عمان يوسف - تقرت" }, { name: "إبتدائية دباخ أحمد المستقبل الجنوبي 7 - تقرت" }, { name: "إبتدائية بالعيد مشري المستقبل الشمالي - تقرت" }, { name: "إبتدائية دباغ عمر المستقبل الجنوبي 09 - تقرت" }, { name: "إبتدائية تاتاي عبد القادر - تقرت" }, { name: "إبتدائية الشهيد بالطاهر علي المستقبل الشمالي - تقرت" }, { name: "إبتدائية المجاهد قادري علال حي 700 مسكن - تقرت" }],
  "سيدي سليمان": [{ name: "إبتدائية بوسعادة بن دلالي - سيدي سليمان" }, { name: "إبتدائية العربي التبسي - سيدي سليمان" }, { name: "إبتدائية الطيب بوريالة - سيدي سليمان" }, { name: "إبتدائية بركبية محمد بكار - سيدي سليمان" }, { name: "إبتدائية الشهيد بن قطان السايح - سيدي سليمان" }, { name: "إبتدائية باسو السعيد - سيدي سليمان" }],
  "تماسين": [{ name: "إبتدائية مولود فرعون - نماسين" }, { name: "إبتدائية الطالب السعدي بوخندق - نماسين" }, { name: "إبتدائية الشيخ الصغير التجاني - نماسين" }, { name: "إبتدائية الشيخ الصادق التجاني - نماسين" }, { name: "إبتدائية البشيرتاتي - نماسين" }, { name: "إبتدائية المجاهد بكوش محمد العيد - نماسين" }, { name: "إبتدائية المجاهد رزقان احمد - نماسين" }, { name: "إبتدائية المجاهد لبسيس إبراهيم - نماسين" }, { name: "إبتدائية بوبكري بشير - نماسين" }, { name: "إبتدائية بن قانة براهيم (البحور 2) - نماسين" }, { name: "إبتدائية المجاهد تجاني عبد الحق (حي الكودية ) - نماسين" }]
};

window.institutionsByDaaira = {
  "توقرت": {
    "متوسط": [{ name: "متوسطة سعد بن أبي وقاص – توقرت" }, { name: "متوسطة الإمام علي – توقرت" }, { name: "متوسطة محمد الأمين العمودي – توقرت" }, { name: "متوسطة الشيخ المقراني – تبسبست" }, { name: "متوسطة بن هدية المدني – النزلة" }, { name: "متوسطة عبد الحميد بن باديس – توقرت" }, { name: "متوسطة حمزة بن عبد المطلب – الزاوية العابدية" }, { name: "متوسطة نصرات حشاني – تبسبست" }, { name: "متوسطة عيسات ايدير – البهجة تبسبست" }, { name: "متوسطة تجيني محمد – عين الصحراء النزلة" }, { name: "متوسطة ابن رشد – حي العرقوب توقرت" }, { name: "متوسطة رضا حوحو – الزاوية العابدية" }, { name: "متوسطة ميعادي فخر الدين – النزلة" }, { name: "متوسطة عطالي محمد الصغير – سيدي مهدي النزلة" }, { name: "متوسطة محمد عمران بوليفة – حي الرمال توقرت" }, { name: "متوسطة عبد المؤمن بن علي – النزلة" }, { name: "متوسطة بن الزاوي علي – تبسبست" }, { name: "متوسطة البشير الإبراهيمي – توقرت" }, { name: "متوسطة حي 5 جويلية – الزاوية العابدية" }, { name: "متوسطة بن حيزية عبد الله – عين الصحراء النزلة" }, { name: "متوسطة بن قلية محمد – الزاوية العابدية" }, { name: "متوسطة تمرني محمد – توقرت" }, { name: "متوسطة شاوش محمد – تبسبست" }, { name: "متوسطة المجاهد التجاني الصادق – النزلة" }, { name: "متوسطة خروبي محمد لخضر – النزلة" }, { name: "متوسطة المجاهد سبقاق العيد – توقرت" }, { name: "متوسطة دقعة الطاهر – تبسبست" }, { name: "متوسطة بدودة معمر بن علي – النزلة" }, { name: "متوسطة داشر الحاج – حي المستقبل توقرت" }, { name: "متوسطة المجاهد رواص محمد – حي المستقبل توقرت" }, { name: "متوسطة المجاهد بوليفة محمد العيد – حي المستقبل توقرت" }, { name: "متوسطة المجاهد عماري السايح – حي المستقبل توقرت" }],
    "ثانوي": [{ name: "ثانوية الأمير عبد القادر – توقرت" }, { name: "ثانوية عبد الرحمان الكواكبي – تبسبست" }, { name: "ثانوية الحسن بن الهيثم – النزلة" }, { name: "ثانوية البشير الإبراهيمي – تبسبست" }, { name: "ثانوية هواري بومدين – الزاوية العابدية" }, { name: "ثانوية أبو بكر بلقايد – النزلة" }, { name: "ثانوية لزهاري تونسي – الزاوية العابدية" }, { name: "ثانوية بوخاري عبد المالك – النزلة" }, { name: "ثانوية عبودة علي – حي المستقبل توقرت" }, { name: "ثانوية مسغوني محمد الصالح – حي المستقبل" }]
  },
  "الحجيرة": {
    "متوسط": [{ name: "متوسطة ابن سينا – الحجيرة" }, { name: "متوسطة لخضاري لخضر – العالية" }, { name: "متوسطة زوابري مسعود – لقراف الحجيرة" }, { name: "متوسطة السايح بن عيسى محمد السايح – العالية" }, { name: "متوسطة بن شويحة حمزة – الحجيرة" }, { name: "متوسطة شلغوم بشير – الشقة العالية" }, { name: "متوسطة المجاهد شعيب الأخضر – الحجيرة" }],
    "ثانوي": [{ name: "ثانوية طارق بن زياد – الحجيرة" }, { name: "ثانوية بساسي محمد الصغير – العالية" }, { name: "ثانوية لحسيني محمد – الحجيرة" }, { name: "ثانوية بالضياف محمد – لقراف الحجيرة" }]
  },
  "الطيبات": {
    "متوسط": [{ name: "متوسطة أحمد زبانة – الطيبات" }, { name: "متوسطة موسى بن نصير – المنقر" }, { name: "متوسطة طارق بن زياد – بن ناصر" }, { name: "متوسطة نتاري محمد الدليلعي – الطيبات" }, { name: "متوسطة العقون محمد الكبير – الطيبات" }, { name: "متوسطة معمري محمد – بن ناصر" }, { name: "متوسطة العيد زقرير – المنقر" }, { name: "متوسطة بلعجال أحمد – الخبنة الطيبات" }, { name: "متوسطة المجاهد الخذير أحمد – المنقر" }, { name: "متوسطة المجاهد رابحي العيد – المنقر" }, { name: "متوسطة المجاهد بكاري عبد القادر – الدليليعي الطيبات" }],
    "ثانوي": [{ name: "ثانوية ابن رشيق القيرواني – الطيبات" }, { name: "ثانوية المنقر – دقعة علي المنقر" }, { name: "ثانوية عبيد أحمد – بن ناصر" }, { name: "ثانوية زقوني الصغير – الدليليعي الطيبات" }]
  },
  "المقارين": {
    "متوسط": [{ name: "متوسطة الفرابي – المقارين" }, { name: "متوسطة طفحي مسعود – سيدي سليمان" }, { name: "متوسطة بلحارث محمد السايح – سيدي سليمان" }, { name: "متوسطة سوفي الهاشمي – الطيبات" }, { name: "متوسطة الشهيد عبد الرحمان قوتال – القصور المقارين" }, { name: "متوسطة الشهيد أحميدة بوحفص – المقارين" }, { name: "متوسطة بركبية عبد الرزاق – المقارين" }, { name: "متوسطة الشهيد تماسيني عبد الرحمان – لهريهيرة المقارين" }],
    "ثانوي": [{ name: "ثانوية خالد بن الوليد – المقارين" }, { name: "ثانوية بن عمر النوي – سيدي سليمان" }, { name: "ثانوية عميش سعدون – المقارين" }]
  },
  "تماسين": {
    "متوسط": [{ name: "متوسطة عمر بن الخطاب – تماسين" }, { name: "متوسطة مولاتي محمد السايح – بلدة عمر" }, { name: "متوسطة أبو بكر الرازي – البحور تماسين" }, { name: "متوسطة قوني محمد الطيب – سيدي عامر تماسين" }, { name: "متوسطة معركة قرداش – بلدة عمر" }, { name: "متوسطة محمد الصديق بن يحي – حي الكدية تماسين" }, { name: "متوسطة بركة عبد الرزاق – قوق بلدة عمر" }, { name: "متوسطة بدودة السايح – تملاحت تماسين" }, { name: "متوسطة علي بن باديس – قوق بلدة عمر" }],
    "ثانوي": [{ name: "ثانوية مفدي زكريا – تماسين" }, { name: "ثانوية العيد بن الصحراوي – بلدة عمر" }, { name: "ثانوية قويدري محمد العيد – تماسين" }, { name: "ثانوية تجيني محمد لخضر – بلدة عمر" }, { name: "ثانوية مالك بن نبي – قوق" }]
  }
};

// --- دوال مساعدة ---
const valNum = (e) => e.value = e.value.replace(/\D/g, '');
const valAr = (e) => e.value = e.value.replace(/[^\u0600-\u06FF\s]/g, '');
const getJob = (c) => gradeMap[c] || "غير محدد";

const removeError = (input) => {
  if (input.classList.contains("input-error")) {
    input.classList.remove("input-error");
  }
};

const fmtDate = (d) => {
  if (!d) return "";
  try {
    const dateObj = (typeof d.toDate === 'function') ? d.toDate() : new Date(d);
    if(isNaN(dateObj.getTime())) return "";
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (e) { return ""; }
};

function getCurrentDateTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

let currentEmployeeData = null;

// ======================== (معدل) دالة التحقق والحقن الآمن ========================
async function verifySystemLogin() {
  const passInput = document.getElementById("systemPassInput").value.trim();
  const overlay = document.getElementById("systemLoginOverlay");
  const loginBtn = document.querySelector('.btn-login-system');
  const container = document.getElementById("interfaceCard"); // الحاوية الفارغة
  
  if (!passInput) {
    Swal.fire({icon: 'warning', title: 'تنبيه', text: 'يرجى إدخال كلمة المرور', confirmButtonColor: '#6a11cb'});
    return;
  }

  const originalText = loginBtn.innerText;
  loginBtn.innerText = 'جاري التحقق...';
  loginBtn.disabled = true;

  try {
    const docSnap = await db.collection("config").doc("pass").get();

    if (docSnap.exists) {
      const data = docSnap.data();
      const userPass = data.service_pay;
      const adminPass = data.service_pay_admin;
      
      // 1. الدخول العادي
      if (String(passInput) === String(userPass)) {
        
        container.innerHTML = SECURE_INTERFACE_HTML;
        container.classList.add("show-content"); 
        
        overlay.style.display = 'none'; 
        
        const ccpInp = document.getElementById("ccpInput");
        if(ccpInp) {
            ccpInp.addEventListener("keypress", function(event) {
                if (event.key === "Enter") {
                    event.preventDefault(); 
                    document.getElementById("loginBtn").click(); 
                }
            });
        }

        const Toast = Swal.mixin({
          toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true
        });
        Toast.fire({ icon: 'success', title: 'مرحباً بك في المنصة' });

      } 
      // 2. الدخول كمسؤول
      else if (String(passInput) === String(adminPass)) {
        sessionStorage.setItem("admin_secure_access", "granted_by_login_page");
        window.location.href = ADMIN_DASHBOARD_URL;
      } else {
        Swal.fire({icon: 'error', title: 'خطأ', text: 'كلمة المرور غير صحيحة، حاول مرة أخرى', confirmButtonColor: '#dc3545'});
        document.getElementById("systemPassInput").value = '';
      }
    } else {
      Swal.fire("خطأ", "لم يتم العثور على إعدادات الدخول (config/pass)", "error");
    }
  } catch (error) {
    console.error("Login Error:", error);
    Swal.fire("خطأ", "حدث خطأ في الاتصال بقاعدة البيانات", "error");
  } finally {
    loginBtn.innerText = originalText;
    loginBtn.disabled = false;
  }
}

document.getElementById("systemPassInput").addEventListener("keypress", function(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    verifySystemLogin();
  }
});

// فتح البوابة مباشرة دون طلب كلمة مرور ثانية عند التصريح من البوابة المركزية
document.addEventListener("DOMContentLoaded", () => {
  const isGranted = sessionStorage.getItem("permanent_access_granted") === "true" ||
                    sessionStorage.getItem("app_user_session") !== null ||
                    sessionStorage.getItem("admin_logged_in") === "true";

  if (isGranted) {
    const overlay = document.getElementById("systemLoginOverlay");
    const container = document.getElementById("interfaceCard");
    if (overlay) overlay.style.display = 'none';
    if (container && typeof SECURE_INTERFACE_HTML !== 'undefined') {
      container.innerHTML = SECURE_INTERFACE_HTML;
      container.classList.add("show-content");
      const ccpInp = document.getElementById("ccpInput");
      if (ccpInp) {
        ccpInp.maxLength = 12;
        ccpInp.placeholder = "أدخل رقم الحساب الجاري (من 10 إلى 12 رقماً)";
        ccpInp.addEventListener("keypress", function(e) {
          if (e.key === "Enter") {
            e.preventDefault();
            document.getElementById("loginBtn").click();
          }
        });
      }
    }
  }
});

function resetInterface() {
    currentEmployeeData = null;
    document.getElementById("formSection").style.display = "none";
    document.getElementById("mainHeader").style.display = "block";
    document.getElementById("loginSection").style.display = "block";
    document.getElementById("interfaceCard").classList.remove("expanded-mode");
    document.getElementById("ccpInput").value = ""; 
}

// 1️⃣ الفحص
async function checkEmployee() {
  const rawInput = document.getElementById("ccpInput").value.trim();
  const cleanInput = rawInput.replace(/\D/g, ''); 

  if (cleanInput.length < 10 || cleanInput.length > 12) {
    return Swal.fire("تنبيه رقم الحساب (CCP)", `رقم الحساب البريدي الجاري CCP يجب أن يتكون من 10 إلى 12 رقماً فقط (العدد الحالي: ${cleanInput.length} رقم).`, "warning");
  }

  Swal.fire({ title: 'جاري التحقق...', didOpen:()=>Swal.showLoading(), allowOutsideClick: false });

  try {
    const baseCCP = cleanInput.replace(/^0+/, ''); 
    const candidates = [ baseCCP, baseCCP.padStart(10, '0'), cleanInput ];
    const uniqueCandidates = [...new Set(candidates)];

    let fbData = null;
    let finalCCP = rawInput; 

    for (const candidate of uniqueCandidates) {
        const docSnap = await db.collection("employeescompay").doc(candidate).get();
        if (docSnap.exists) {
            fbData = docSnap.data();
            finalCCP = candidate; 
            break; 
        }
    }

    const res = await fetch(scriptURL, { 
        method: "POST", 
        body: new URLSearchParams({
            action: "check_existing", 
            ccp: finalCCP 
        }) 
    });
    
    const result = await res.json();
    Swal.close();

    const displayData = result.result === "exists" ? result.data : fbData;
    
    if (!displayData) {
         return Swal.fire("غير موجود", "الرقم غير مسجل في قاعدة البيانات الأولية", "error");
    }

    Swal.fire({
      title: 'تم تسجيل الدخول بنجاح',
      html: `
        مرحباً بك:
        <span style="color:#6a11cb; font-weight:700; font-size:18px;">
          ${displayData.fmn || ''} ${displayData.frn || ''}
        </span>
      `,
      icon: 'success',
      showCancelButton: true,
      confirmButtonText: 'متابعة',
      cancelButtonText: 'خروج',
      confirmButtonColor: '#2575fc',
      cancelButtonColor: '#6c757d',
      allowOutsideClick: false
    }).then((welcomeRes) => {
      
      if (welcomeRes.isConfirmed) {
        if (result.result === "exists") {
          const d = result.data;
          const isConfirmed = (d.confirmed === true || String(d.confirmed).toLowerCase() === "true");
          d.confirmed = isConfirmed; 
          currentEmployeeData = d; 

          if (isConfirmed) {
            showConfirmedModal(d);
          } else {
            showReviewModal(d, "unconfirmed_duplicate");
          }
        } else {
          fillForm(fbData, null);
          document.getElementById("ccpField").value = finalCCP;
        }
      } else {
        resetInterface();
      }
    });

  } catch (e) { 
    console.error(e);
    Swal.fire("خطأ", "فشل الاتصال", "error"); 
  }
}

// 2️⃣ المراجعة
function showReviewModal(data, context) {
  document.getElementById("interfaceCard").classList.add("expanded-mode");

  const warningBox = `
    <div style="border: 2px solid #dc3545; background-color: #fff8f8; color: #dc3545; padding: 12px; border-radius: 8px; margin-bottom: 15px; font-weight: bold; text-align: center; font-size: 14px;">
      ⚠️ معلومات التسجيل (غير مؤكدة)<br>
      يرجى مراجعة صحة المعلومات وتأكيدها لطباعة الإستمارة
    </div>
  `;

  const htmlTable = `
    <div class="swal-table-container">
      ${warningBox}
      <table class="data-table">
        <tr><th>رقم الحساب البريدي</th><td>${data.ccp}</td></tr>
        <tr><th>رقم الضمان الإجتماعي</th><td>${data.ass}</td></tr>
        <tr><th>NIN</th><td>${data.nin}</td></tr>
        <tr><th>اللقب</th><td>${data.fmn}</td></tr>
        <tr><th>الاسم</th><td>${data.frn}</td></tr>
        <tr><th>تاريخ الميلاد</th><td>${fmtDate(data.diz)}</td></tr>
        <tr><th>الرتبة</th><td>${getJob(data.gr)}</td></tr>
        <tr><th>المؤسسة</th><td>${data.schoolName}</td></tr>
        <tr><th>رقم الهاتف</th><td style="text-align: right;"><span dir="ltr">${data.phone}</span></td></tr>
      </table>
    </div>
  `;

  Swal.fire({
    title: context === 'new' ? 'تم التسجيل بنجاح' : 'مراجعة البيانات',
    html: htmlTable + '<p style="color:#FF0000; font-size:13px; margin-top:10px; font-weight: bold;">في حالة التعديل بعد تأكيد المعلومات ، يرجى مراجعة وتأكيد صحة المعلومات مرة ثانية لطباعة الإستمارة المعدلة</p>',
    icon: 'info',
    showDenyButton: true,
    showCancelButton: true,
    confirmButtonText: '✅ تأكيد المعلومات',
    denyButtonText: '✏️ تعديل المعلومات',
    cancelButtonText: 'إغلاق',
    confirmButtonColor: '#28a745',
    denyButtonColor: '#1a73e8',
    cancelButtonColor: '#6c757d',
    allowOutsideClick: false,
    width: '600px'
  }).then((res) => {
    if (res.isConfirmed) {
        showConfirmerInput(data);
    } else if (res.isDenied) {
      fillForm(null, data);
    } else if (res.dismiss === Swal.DismissReason.cancel) {
      resetInterface(); 
    }
  });
}

// 3️⃣ دالة إدخال المؤكد
function showConfirmerInput(data) {
    const sessionName = sessionStorage.getItem("saved_confirmer_name") || "";
    const sessionPhone = sessionStorage.getItem("saved_confirmer_phone") || "";

    const prevName = data.confirmed_by || sessionName;
    let prevPhone = (data.reviewer_phone || sessionPhone).replace(/\D/g, '');
    
    if(prevPhone.startsWith('213')) prevPhone = '0' + prevPhone.substring(3);

    const inputStyle = `
        width: 100%; height: 50px; padding: 0 15px;
        border: 2px solid #e1e5eb; border-radius: 12px;
        font-size: 15px; font-weight: 600; text-align: center;
        margin-bottom: 15px; font-family: 'Cairo', sans-serif; box-sizing: border-box;
    `;

    Swal.fire({
        title: 'تأكيد المعلومات',
        html: `
            <p style="font-size:14px; margin-bottom:20px; color:#555;">لإتمام المصادقة، يرجى إدخال معلومات القائم بالتأكيد:</p>
            <label style="display:block; text-align:right; margin-bottom:5px; font-weight:700; color:#555;">اسم ولقب المؤكد (بالعربية)</label>
            <input id="swal-name" value="${prevName}" placeholder="الاسم واللقب" style="${inputStyle}" oninput="this.value = this.value.replace(/[^\\u0600-\\u06FF\\s]/g, '')">
            <label style="display:block; text-align:right; margin-bottom:5px; font-weight:700; color:#555;">رقم الهاتف</label>
            <input id="swal-phone" value="${prevPhone}" placeholder="06XXXXXXXX" maxlength="10" style="${inputStyle} direction:ltr;" oninput="this.value = this.value.replace(/\\D/g, '').slice(0, 10)">
        `,
        confirmButtonText: 'حفظ وطباعة',
        showCancelButton: true,
        cancelButtonText: 'إلغاء',
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        allowOutsideClick: false,
        didOpen: () => {
            const nameInput = document.getElementById('swal-name');
            if(!nameInput.value) {
                nameInput.focus();
            }
        },
        preConfirm: () => {
            const name = document.getElementById('swal-name').value.trim();
            const phone = document.getElementById('swal-phone').value.trim();
            
            if (!name) { Swal.showValidationMessage('يرجى إدخال اسم المؤكد'); return false; }
            
            const phoneRegex = /^(05|06|07)[0-9]{8}$/;
            if (!phoneRegex.test(phone)) {
                Swal.showValidationMessage('رقم الهاتف غير صحيح (يجب أن يبدأ بـ 05، 06، 07 ويتكون من 10 أرقام)');
                return false;
            }
            
            return { name, phone };
        }
    }).then((res) => {
        if(res.isConfirmed) {
            sessionStorage.setItem("saved_confirmer_name", res.value.name);
            sessionStorage.setItem("saved_confirmer_phone", res.value.phone);

            data.confirmed_by = res.value.name;
            data.reviewer_phone = res.value.phone;
            confirmData(data);
        } else if (res.dismiss === Swal.DismissReason.cancel) {
            resetInterface(); 
        }
    });
}

// 4️⃣ المؤكد
function showConfirmedModal(data) {
  document.getElementById("interfaceCard").classList.add("expanded-mode");

  const htmlTable = `
    <div class="swal-table-container">
      <div style="background:#d4edda; color:#155724; padding:10px; border-radius:5px; margin-bottom:10px; text-align:center;">
        <strong>معلومات الموظف مؤكدة مسبقاً</strong>
      </div>
      <table class="data-table">
       <tr><th>رقم الحساب البريدي</th><td>${data.ccp}</td></tr>
        <tr><th>رقم الضمان الإجتماعي</th><td>${data.ass}</td></tr>
        <tr><th>NIN</th><td>${data.nin}</td></tr>
        <tr><th>اللقب</th><td>${data.fmn}</td></tr>
        <tr><th>الاسم</th><td>${data.frn}</td></tr>
        <tr><th>تاريخ الميلاد</th><td>${fmtDate(data.diz)}</td></tr>
        <tr><th>الرتبة</th><td>${getJob(data.gr)}</td></tr>
        <tr><th>المؤسسة</th><td>${data.schoolName}</td></tr>
        <tr><th>رقم الهاتف</th><td style="text-align: right;"><span dir="ltr">${data.phone}</span></td></tr>
      </table>
    </div>
  `;

  Swal.fire({
    title: 'الملف الشخصي للموظف',
    html: htmlTable,
    showDenyButton: true,
    showCancelButton: true,
    confirmButtonText: '🖨️ طباعة الاستمارة',
    denyButtonText: '✏️ تعديل المعلومات',
    cancelButtonText: 'خروج',
    confirmButtonColor: '#333',
    denyButtonColor: '#1a73e8',
    cancelButtonColor: '#6c757d',
    allowOutsideClick: false
  }).then((res) => {
    if (res.isConfirmed) {
      printA4(data);
    } else if (res.isDenied) {
      fillForm(null, data);
    } else if (res.dismiss === Swal.DismissReason.cancel) {
      resetInterface();
    }
  });
}

// 5️⃣ التأكيد
async function confirmData(data) {
  Swal.fire({ title: 'جاري التأكيد...', didOpen:()=>Swal.showLoading(), allowOutsideClick: false });
  
  data.confirmed = true; 

  const params = new URLSearchParams();
  
  for(let k in data) {
    if(data[k] !== null && data[k] !== undefined) {
       if (k === "date_edit" || k === "date_confirm") continue; 
       params.append(k, data[k]);
    }
  }

  params.set("action", "update");
  params.set("confirmed", "true"); 
  
  const confirmTime = getCurrentDateTime();
  params.append("date_confirm", confirmTime);

  try {
    const res = await fetch(scriptURL, { method: "POST", body: params });
    const result = await res.json();
    
    if(result.result === "success") {
      data.date_confirm = confirmTime;
      currentEmployeeData = data;
      
      Swal.fire({
        title: 'تم تأكيد المعلومات بنجاح',
        icon: 'success',
        confirmButtonText: '🖨️ طباعة الاستمارة',
        confirmButtonColor: '#333',
        showCancelButton: true,
        cancelButtonText: 'إغلاق',
        allowOutsideClick: false
      }).then((res) => {
        if (res.isConfirmed) {
            printA4(data);
        } else {
            resetInterface(); 
        }
      });
    } else {
        Swal.fire("خطأ", "فشل الحفظ: " + result.message, "error");
    }
  } catch(e) { 
    console.error(e);
    Swal.fire("خطأ", "فشل الاتصال بالسيرفر", "error"); 
  }
}

// 6️⃣ التعبئة
function fillForm(fbData, savedData) {
  document.getElementById("interfaceCard").classList.add("expanded-mode");
  document.getElementById("mainHeader").style.display = "none";
  document.getElementById("loginSection").style.display = "none";
  document.getElementById("formSection").style.display = "block";

  const d = savedData || fbData || {};
  
  document.getElementById("ccpField").value = d.ccp || d.empId || '';
  document.getElementById("assField").value = d.ass || '';
  document.getElementById("fmnField").value = d.fmn || '';
  document.getElementById("frnField").value = d.frn || '';
  document.getElementById("dizField").value = fmtDate(d.diz);
  document.getElementById("jobField").value = getJob(d.gr);
  document.getElementById("mtrField").value = d.mtr || '';
  document.getElementById("admField").value = d.adm || '';
  document.getElementById("grField").value = d.gr || '';

  if(savedData) {
    const phoneVal = (savedData.phone || '').toString().replace(/\D/g, '');
    const phoneInp = document.getElementById("phoneField");
    phoneInp.value = phoneVal;
    phoneInp.style.direction = "ltr";
    
    document.getElementById("ninField").value = savedData.nin || '';
    
    document.getElementById("levelField").value = savedData.level || "";
    document.getElementById("daairaField").value = savedData.daaira || "";
    
    updBal(); 
    
    setTimeout(() => {
        document.getElementById("baladiyaField").value = savedData.baladiya || "";
        updateWorkPlace();
        
        setTimeout(() => {
            const select = document.querySelector("#institutionArea select");
            if(select) {
                select.value = savedData.schoolCode || savedData.schoolName;
                document.getElementById("institutionCodeField").value = savedData.schoolCode || "";
            } else {
                if(savedData.level === "مديرية التربية") {
                     document.getElementById("institutionCodeField").value = "مديرية التربية";
                }
            }
        }, 100);
    }, 100);
  } else {
    document.getElementById("phoneField").value = "";
    document.getElementById("ninField").value = "";
    document.getElementById("levelField").value = "";
    document.getElementById("daairaField").value = "";
    document.getElementById("baladiyaField").innerHTML = '<option value="">-- اختر --</option>';
    document.getElementById("baladiyaField").value = "";
    document.getElementById("institutionArea").innerHTML = '<input readonly placeholder="..." class="readonly-field">';
    document.getElementById("institutionCodeField").value = "";
  }
}


// 7️⃣ إرسال التسجيل
async function submitRegistration() {
  const fields = {
    fmn: document.getElementById("fmnField"),
    frn: document.getElementById("frnField"),
    diz: document.getElementById("dizField"),
    level: document.getElementById("levelField"),
    daaira: document.getElementById("daairaField"),
    baladiya: document.getElementById("baladiyaField"),
    phone: document.getElementById("phoneField"),
    nin: document.getElementById("ninField")
  };

  const codeField = document.getElementById("institutionCodeField");
  const schoolSelect = document.querySelector("#institutionArea select");
  const institutionArea = document.getElementById("institutionArea");
  const readonlyInput = institutionArea.querySelector("input");

  Object.values(fields).forEach(el => el.classList.remove("input-error"));
  institutionArea.style.border = "none";

  let firstErrorField = null;

  for (const [key, field] of Object.entries(fields)) {
    if ((key === 'daaira' || key === 'baladiya') && fields.level.value === "مديرية التربية") {
        continue; 
    }
    
    if (!field.value.trim()) {
      field.classList.add("input-error");
      if (!firstErrorField) firstErrorField = field;
    }
  }

  const isSchoolSelected = (schoolSelect && schoolSelect.value !== "") || 
                           (codeField.value !== "") || 
                           (readonlyInput && readonlyInput.value !== "");
  
  if (!isSchoolSelected) {
    institutionArea.style.border = "2px solid #dc3545"; 
    institutionArea.style.borderRadius = "4px";
    if (!firstErrorField) firstErrorField = schoolSelect || institutionArea;
  }

  if (firstErrorField) {
    if(firstErrorField.focus && typeof firstErrorField.focus === 'function') firstErrorField.focus(); 
    return Swal.fire({ 
      icon: 'error', 
      title: 'حقول ناقصة', 
      text: 'يرجى ملء جميع الحقول الملونة بالأحمر.',
      timer: 2000,
      showConfirmButton: false
    });
  }

  const birthDate = new Date(fields.diz.value);
  if(isNaN(birthDate.getFullYear()) || birthDate.getFullYear() > new Date().getFullYear() - 18) {
      fields.diz.classList.add("input-error");
      return Swal.fire({ icon: 'warning', title: 'تاريخ الميلاد غير منطقي' });
  }

  const phoneRegex = /^(05|06|07)[0-9]{8}$/;
  if(!phoneRegex.test(fields.phone.value)) {
      fields.phone.classList.add("input-error");
      return Swal.fire({ icon: 'warning', title: 'رقم الهاتف غير صحيح', text: 'يجب أن يتكون من 10 أرقام ويبدأ بـ 05، 06، أو 07' });
  }

  if(fields.nin.value.length !== 18) {
      fields.nin.classList.add("input-error");
      return Swal.fire({ icon: 'warning', title: 'رقم التعريف الوطني غير صحيح', text: 'يجب أن يتكون من 18 رقم' });
  }

  const p = new URLSearchParams();
  p.append("ccp", document.getElementById("ccpField").value);
  p.append("ass", document.getElementById("assField").value);
  p.append("mtr", document.getElementById("mtrField").value);
  p.append("adm", document.getElementById("admField").value);
  p.append("gr", document.getElementById("grField").value);
  p.append("job", document.getElementById("jobField").value);
  p.append("fmn", fields.fmn.value);
  p.append("frn", fields.frn.value);
  p.append("diz", fields.diz.value);
  p.append("phone", fields.phone.value);
  p.append("nin", fields.nin.value);
  p.append("level", fields.level.value);
  p.append("daaira", fields.daaira.value);
  p.append("baladiya", fields.baladiya.value);
  
  let finalCode = codeField.value;
  if(!finalCode && readonlyInput && readonlyInput.value.includes("مديرية")) {
      finalCode = "مديرية التربية";
  }
  p.append("schoolCode", finalCode);
  
  if (schoolSelect) {
      p.append("schoolName", schoolSelect.options[schoolSelect.selectedIndex].text);
  } else {
      const inputVal = readonlyInput ? readonlyInput.value : "";
      p.append("schoolName", inputVal || finalCode);
  }

  const action = currentEmployeeData ? "update" : "register";
  p.set("action", action);
  p.set("confirmed", "false"); 

  if (action === "update") {
      p.append("date_edit", getCurrentDateTime());
  } else {
      p.append("date_edit", ""); 
  }
  
  p.append("date_confirm", "");

  if (currentEmployeeData) {
      if(currentEmployeeData.confirmed_by) p.append("confirmed_by", currentEmployeeData.confirmed_by);
      if(currentEmployeeData.reviewer_phone) p.append("reviewer_phone", currentEmployeeData.reviewer_phone);
  }

  Swal.fire({ title: 'جاري الحفظ...', didOpen:()=>Swal.showLoading(), allowOutsideClick: false });

  try {
    const res = await fetch(scriptURL, { method: "POST", body: p });
    const result = await res.json();
    
    if(result.result === "success") {
      let newData = {};
      for(let [k,v] of p.entries()) newData[k] = v;
      
      if (currentEmployeeData) {
          if(!newData.confirmed_by) newData.confirmed_by = currentEmployeeData.confirmed_by || "";
          if(!newData.reviewer_phone) newData.reviewer_phone = currentEmployeeData.reviewer_phone || "";
      }
      currentEmployeeData = newData; 
      
      showReviewModal(newData, "new");
    } else {
      Swal.fire("خطأ", result.message, "error");
    }
  } catch(e) { 
    console.error(e);
    Swal.fire("خطأ", "فشل الاتصال بالسيرفر", "error"); 
  }
}

// 8️⃣ الطباعة الفردية
function printA4(d) {
  const table = document.getElementById("printTable");
  document.getElementById("p_date").innerText = new Date().toLocaleDateString('ar-DZ');
  
  document.getElementById("p_confirmer").innerText = d.confirmed_by || "---";
  document.getElementById("p_confirmer_phone").innerText = d.reviewer_phone || "---";
  
  table.innerHTML = `
    <tr><th>اللقب</th><td>${d.fmn}</td></tr>
    <tr><th>الاسم</th><td>${d.frn}</td></tr>
    <tr><th>تاريخ الميلاد</th><td>${fmtDate(d.diz)}</td></tr>
    <tr><th>رقم الحساب البريدي (CCP)</th><td>${d.ccp}</td></tr>
    <tr><th>رقم الضمان الاجتماعي</th><td>${d.ass}</td></tr>
    <tr><th>الرتبة</th><td>${getJob(d.gr)}</td></tr>
    <tr><th>مكان العمل</th><td>${d.schoolName}</td></tr>
    <tr><th>الدائرة / البلدية</th><td>${d.daaira} / ${d.baladiya}</td></tr>
    <tr><th>رقم الهاتف</th><td style="text-align: right;"><span dir="ltr">${d.phone}</span></td></tr>
    <tr><th>رقم التعريف الوطني (NIN)</th><td>${d.nin}</td></tr>
  `;

  window.print();
  
  setTimeout(() => resetInterface(), 500); 
}

// --- دوال القوائم ---
function updBal() {
  const d = document.getElementById("daairaField").value;
  const b = document.getElementById("baladiyaField");
  b.innerHTML = '<option value="">-- اختر --</option>';
  if(d && baladiyaMap[d]) baladiyaMap[d].forEach(o=>{let op=document.createElement("option");op.text=o;op.value=o;b.add(op)});
}

function resetGeoFields() {
  const daaira = document.getElementById("daairaField");
  const baladiya = document.getElementById("baladiyaField");
  const area = document.getElementById("institutionArea");
  const codeField = document.getElementById("institutionCodeField");

  daaira.value = "";
  daaira.disabled = false;
  
  baladiya.innerHTML = '<option value="">-- اختر --</option>';
  baladiya.value = "";
  baladiya.disabled = false;

  area.innerHTML = '<input readonly placeholder="..." class="readonly-field">';
  codeField.value = "";

  removeError(daaira);
  removeError(baladiya);
  area.style.border = "none";
}

function updateWorkPlace() {
  const l = document.getElementById("levelField").value;
  const daaira = document.getElementById("daairaField");
  const baladiya = document.getElementById("baladiyaField");
  const area = document.getElementById("institutionArea");
  
  daaira.disabled = false;
  baladiya.disabled = false;
  area.innerHTML = ''; 

  if (l === "مديرية التربية") {
    daaira.value = "توقرت";
    updBal(); 
    baladiya.value = "توقرت";
    daaira.disabled = true;
    baladiya.disabled = true;

    area.innerHTML = '<input type="text" class="readonly-field" value="مديرية التربية لولاية توقرت" readonly style="background-color: #e9ecef;">';
    document.getElementById("institutionCodeField").value = "مديرية التربية";

    removeError(daaira);
    removeError(baladiya);
    return; 
  }

  const mkSel = (lst) => {
    let s = document.createElement("select");
    s.innerHTML = '<option value="">-- اختر --</option>';
    
    s.onchange = function() {
        document.getElementById("institutionCodeField").value = this.value;
        if(this.value !== "") {
             document.getElementById("institutionArea").style.border = "none";
        }
    };
    
    lst.forEach(i => {
      let o = document.createElement("option");
      o.text = i.name;
      o.value = i.name;
      s.add(o);
    });
    
    area.appendChild(s);
  };
  
  const d = daaira.value;
  const b = baladiya.value;

  if(l === 'ابتدائي' && b && window.primarySchoolsByBaladiya) mkSel(window.primarySchoolsByBaladiya[b]||[]);
  else if((l === 'متوسط' || l === 'ثانوي') && d && window.institutionsByDaaira) mkSel(window.institutionsByDaaira[d][l]||[]);
  else area.innerHTML = '<input readonly placeholder="..." class="readonly-field">';
}


// ============================================================
// +++ وظائف الإدارة الجديدة (Admin Functions) +++
// ============================================================

// 1. فتح نافذة الفلاتر (Modal)
// ============================================================
// +++ وظائف الإدارة الجديدة (Admin Functions) - المعدلة للحماية +++
// ============================================================

// ============================================================
// +++ وظائف الإدارة الجديدة (Admin Functions) - المحسنة +++
// ============================================================

// 1. فتح نافذة التحقق من المدير (مع توحيد تنسيق 10 أرقام)
function openAdminModal() {
  const popupHtml = `
    <div style="font-family: 'Cairo', sans-serif; direction: rtl;">
      <div style="margin-bottom: 20px; color: #555;">
        <i class="fas fa-user-shield" style="font-size: 50px; color: #2575fc; margin-bottom: 10px;"></i>
        <h3 style="margin: 0; font-size: 18px; font-weight: bold;">بوابة استخراج الوثائق</h3>
        <p style="font-size: 13px; color: #777; margin-top: 5px;">يرجى إثبات الهوية للوصول إلى بيانات المؤسسة</p>
      </div>
      
      <div style="position: relative; margin-bottom: 10px;">
        <input type="text" id="adminCcpInput" 
          maxlength="10" 
          placeholder="رقم الحساب (مثال: 0000012345)" 
          class="swal2-input" 
          style="text-align: center; font-weight: bold; font-size: 18px; letter-spacing: 2px; width: 80%; margin: 0 auto; display: block;"
          oninput="this.value = this.value.replace(/[^0-9]/g, '')">
      </div>
      <div style="font-size: 12px;font-weight: bold; color: #FF0000;">
        *  ملاحظة: الموظف الغير مؤكدة معلوماته لايظهر في قائمة الموظفين والإستمارات إلا بعد تأكيد المعلومات
      </div>
    </div>
  `;

  Swal.fire({
    html: popupHtml,
    showCancelButton: true,
    confirmButtonText: 'تحقق ودخول',
    cancelButtonText: 'إلغاء',
    confirmButtonColor: '#2575fc',
    cancelButtonColor: '#6c757d',
    showLoaderOnConfirm: true,
    width: '450px',
    didOpen: () => {
        const input = document.getElementById('adminCcpInput');
        if(input) input.focus();
        
        input.addEventListener("keypress", function(event) {
            if (event.key === "Enter") {
                Swal.clickConfirm();
            }
        });
    },
    preConfirm: () => {
      const rawCcp = document.getElementById('adminCcpInput').value;
      
      if (!rawCcp) {
        Swal.showValidationMessage('يرجى إدخال رقم الحساب البريدي');
        return false;
      }
      
      // === التعديل هنا: توحيد التنسيق إلى 10 أرقام ===
      
      // 1. تنظيف الرقم من أي رموز وحذف الأصفار من البداية
      let cleanStr = rawCcp.replace(/\D/g, '').replace(/^0+/, '');
      
      // 2. تعبئة الرقم بأصفار من اليسار ليصبح طوله 10 أرقام
      const finalCcpToCheck = cleanStr.padStart(10, '0');

      // مثال: أدخل 123 -> يرسل 0000000123
      // مثال: أدخل 00123 -> يرسل 0000000123
      
      // التحقق من السيرفر
      return fetch(scriptURL, {
        method: 'POST',
        body: new URLSearchParams({ action: 'check_existing', ccp: finalCcpToCheck })
      })
      .then(response => {
        if (!response.ok) throw new Error(response.statusText);
        return response.json();
      })
      .then(data => {
        if (data.result !== 'exists') {
          throw new Error('هذا الحساب غير مسجل كمسؤول أو البيانات غير صحيحة');
        }
        return data.data; // إرجاع بيانات المدير
      })
      .catch(error => {
        Swal.showValidationMessage(`${error}`);
      });
    },
    allowOutsideClick: () => !Swal.isLoading()
  }).then((result) => {
    if (result.isConfirmed) {
      showRestrictedAdminPanel(result.value);
    }
  });
}

// 2. عرض لوحة الاستخراج (مقفلة ومنسقة)
function showRestrictedAdminPanel(empData) {
  const schoolName = empData.schoolName || "غير محدد";
  const daaira = empData.daaira || "";
  const baladiya = empData.baladiya || "";
  const level = empData.level || "";
  const directorName = `${empData.fmn} ${empData.frn}`;

  // تنسيق CSS للحقول المقفلة
  const lockedStyle = `
    background: #f1f3f4; 
    border: 1px solid #ced4da; 
    color: #495057; 
    font-weight: 600; 
    cursor: not-allowed;
    text-align: center;
    font-size: 14px;
    height: 40px;
    margin-bottom: 12px;
  `;

  const popupHtml = `
    <div style="font-family: 'Cairo', sans-serif; direction: rtl; text-align: right;">
      
      <div style="background: linear-gradient(45deg, #2575fc, #6a11cb); color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="font-size: 12px; opacity: 0.9;">مرحباً بالسيد(ة) المدير(ة) أو المسؤول(ة):</div>
        <div style="font-size: 18px; font-weight: bold; margin-top: 5px;">${directorName}</div>
      </div>

      <div style="display: flex; gap: 10px;">
        <div style="flex: 1;">
            <label style="font-size: 12px; font-weight:bold; color:#555;">الطور:</label>
            <input type="text" value="${level}" class="swal2-input" style="${lockedStyle}; width: 100%;" disabled readonly>
        </div>
        <div style="flex: 1;">
            <label style="font-size: 12px; font-weight:bold; color:#555;">الدائرة:</label>
            <input type="text" value="${daaira}" class="swal2-input" style="${lockedStyle}; width: 100%;" disabled readonly>
        </div>
      </div>

      <label style="font-size: 12px; font-weight:bold; color:#555;">البلدية:</label>
      <input type="text" value="${baladiya}" class="swal2-input" style="${lockedStyle}; width: 100%;" disabled readonly>

      <label style="font-size: 12px; font-weight:bold; color:#2575fc;">المؤسسة (مثبتة):</label>
      <div style="position: relative;">
        <input type="text" value="${schoolName}" class="swal2-input" 
               style="${lockedStyle}; width: 100%; background: #e8f0fe; border-color: #2575fc; color: #1a73e8;" 
               disabled readonly>
        <i class="fas fa-lock" style="position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: #2575fc;"></i>
      </div>
      
      <div style="text-align: center; margin-top: 10px; font-size: 11px; color: #dc3545;">
        <i class="fas fa-info-circle"></i> لا يمكن تغيير المؤسسة لضمان سرية البيانات.
      </div>
    </div>
  `;

  Swal.fire({
    title: '', // العنوان مدمج في التصميم
    html: popupHtml,
    showCancelButton: true,
    showDenyButton: true,
    confirmButtonText: '<i class="fas fa-print"></i> طباعة الاستمارات',
    denyButtonText: '<i class="fas fa-list"></i> عرض القائمة',
    cancelButtonText: 'خروج',
    confirmButtonColor: '#333',     // لون زر الاستمارات (داكن/رسمي)
    denyButtonColor: '#28a745',     // لون زر القائمة (أخضر)
    cancelButtonColor: '#d33',
    width: '500px',
    padding: '20px',
    preConfirm: () => {
        return { action: 'forms', school: schoolName };
    },
    preDeny: () => {
        return { action: 'list', school: schoolName };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      fetchAndHandleData(result.value.school, 'forms');
    } else if (result.isDenied) {
      fetchAndHandleData(result.value.school, 'list');
    }
  });
}

// 2. تحديث القوائم المنسدلة (Logic للفلاتر)
function updateAdminBaladiya() {
    const daaira = document.getElementById("adminDaaira").value;
    const baladiyaSelect = document.getElementById("adminBaladiya");
    baladiyaSelect.innerHTML = '<option value="">-- اختر البلدية --</option>';
    
    if (daaira && baladiyaMap[daaira]) {
        baladiyaMap[daaira].forEach(b => {
            let opt = document.createElement("option");
            opt.value = b;
            opt.text = b;
            baladiyaSelect.add(opt);
        });
    }
}

function updateAdminSchools() {
    const level = document.getElementById("adminLevel").value;
    const daaira = document.getElementById("adminDaaira").value;
    const baladiya = document.getElementById("adminBaladiya").value;
    const schoolSelect = document.getElementById("adminSchool");
    
    schoolSelect.innerHTML = '<option value="">-- اختر المؤسسة --</option>';
    
    let schools = [];

    if (level === 'ابتدائي' && baladiya && window.primarySchoolsByBaladiya) {
        schools = window.primarySchoolsByBaladiya[baladiya] || [];
    } else if ((level === 'متوسط' || level === 'ثانوي') && daaira && window.institutionsByDaaira) {
        schools = window.institutionsByDaaira[daaira] ? (window.institutionsByDaaira[daaira][level] || []) : [];
    }

    schools.forEach(s => {
        let opt = document.createElement("option");
        opt.value = s.name;
        opt.text = s.name;
        schoolSelect.add(opt);
    });
}

function updateAdminFilters() {
    document.getElementById("adminDaaira").value = "";
    document.getElementById("adminBaladiya").value = "";
    document.getElementById("adminSchool").innerHTML = '<option value="">-- اختر المؤسسة --</option>';
}

// 3. جلب البيانات من السيرفر (Google Sheet)
async function fetchAndHandleData(schoolName, mode) {
    Swal.fire({ title: 'جاري جلب البيانات...', didOpen: () => Swal.showLoading() });

    try {
        const params = new URLSearchParams();
        // محاولة طلب الفلترة من السيرفر مباشرة
        params.append("action", "get_by_school"); 
        params.append("schoolName", schoolName);

        const res = await fetch(scriptURL, { method: "POST", body: params });
        const json = await res.json();
        Swal.close();

        let data = [];
        if (json.result === "success") {
            data = json.data; 
        } else {
             if(json.data) data = json.data; 
        }
        
        // فلترة إضافية في المتصفح للتأكد
        const filteredData = data.filter(emp => emp.schoolName === schoolName);

        if (filteredData.length === 0) {
            Swal.fire("تنبيه", "لا يوجد موظفين مسجلين في هذه المؤسسة", "info");
            return;
        }

        if (mode === 'forms') {
            generateBulkForms(filteredData, schoolName);
        } else {
            generateEmployeesTable(filteredData, schoolName);
        }

    } catch (e) {
        console.error(e);
        Swal.fire("خطأ", "حدث خطأ أثناء جلب البيانات", "error");
    }
}

// 4. عرض القائمة (الجدول) - بتنسيق أزرار جديد وضغط الجدول
function generateEmployeesTable(data, schoolName) {
    // 1. حساب الإحصائيات
    const total = data.length;
    const confirmedCount = data.filter(e => (e.confirmed === true || String(e.confirmed).toLowerCase() === "true")).length;
    const unconfirmedCount = total - confirmedCount;

// تحديد شكل المؤشر بناءً على الوضع
    const rowCursor = (CURRENT_SYSTEM_MODE == 2 || CURRENT_SYSTEM_MODE == 0) ? 'default' : 'pointer';

    // 2. بناء الأسطر
    let rows = '';
    data.forEach((emp, index) => {
        const isConfirmed = (emp.confirmed === true || String(emp.confirmed).toLowerCase() === "true");
        
        const statusBadge = isConfirmed 
            ? `<span style="background-color:#d4edda; color:#155724; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: bold; border: 1px solid #c3e6cb;">مؤكد</span>` 
            : `<span style="background-color:#f8d7da; color:#721c24; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: bold; border: 1px solid #f5c6cb;">غير مؤكد</span>`;

        rows += `
            <tr onclick="showEmployeeDetails('${emp.ccp}')" style="cursor:${rowCursor}; transition:all 0.1s ease; border-bottom: 1px solid #eee;">
                <td style="font-weight:bold;">${index + 1}</td>
                <td style="font-family: monospace; color:#555;">${emp.nin || '-'}</td>
                <td style="color:#2c3e50; font-weight:600;">${emp.fmn}</td>
                <td style="color:#2c3e50; font-weight:600;">${emp.frn}</td>
                <td>${fmtDate(emp.diz)}</td>
                <td style="font-size:11px;">${getJob(emp.gr)}</td>
                <td>${statusBadge}</td>
            </tr>
        `;
    });
    // 3. بناء الهيكل (CSS محسن للأزرار وضغط الجدول)
    const tableHtml = `
        <style>
            .stat-card { background: #f8f9fa; padding: 5px 10px; border-radius: 6px; border: 1px solid #e9ecef; margin: 0 3px; display: inline-block; font-size: 12px; }
            .stat-num { font-weight: bold; font-size: 13px; margin-right: 3px; }
            
            .modern-table { width: 100%; border-collapse: collapse; text-align: right; direction: rtl; font-family: 'Cairo', sans-serif; }
            .modern-table thead th { background: #2575fc; color: white; padding: 8px 5px; font-weight: normal; font-size: 12px; position: sticky; top: 0; z-index: 10; white-space: nowrap; }
            .modern-table tbody td { padding: 6px 5px; font-size: 11.5px; white-space: nowrap; }
            .modern-table tbody tr:hover { background-color: #f1f3f5 !important; }
            .modern-table tbody tr:nth-child(even) { background-color: #fbfbfb; }

            .custom-btn-group { margin: 10px 0; display: flex; justify-content: center; gap: 8px; }
            .action-btn { padding: 6px 15px; font-size: 12px; border-radius: 5px; border: none; color: white; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; font-family: 'Cairo', sans-serif; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: transform 0.1s; }
            .action-btn:hover { transform: translateY(-1px); }
            
            .btn-excel { background-color: #28a745; }
            .btn-print { background-color: #343a40; }
        </style>

        <div style="text-align:center; margin-bottom:10px;">
            <h3 style="color:#2575fc; margin-bottom: 8px; font-size: 16px; font-family: 'Cairo', sans-serif;">${schoolName}</h3>
            
            <div style="margin-bottom: 10px;">
                <div class="stat-card" style="border-right: 3px solid #2575fc;">إجمالي: <span class="stat-num" style="color: #2575fc;">${total}</span></div>
                <div class="stat-card" style="border-right: 3px solid #28a745;">المؤكد: <span class="stat-num" style="color: #28a745;">${confirmedCount}</span></div>
                <div class="stat-card" style="border-right: 3px solid #dc3545;">غير المؤكد: <span class="stat-num" style="color: #dc3545;">${unconfirmedCount}</span></div>
            </div>

            <div class="custom-btn-group">
                <button onclick="printCurrentTable('${schoolName}')" class="action-btn btn-print">
                    <i class="fas fa-print"></i> طباعة القائمة
                </button>
                <button onclick="exportTableToExcel('empTable', '${schoolName}')" class="action-btn btn-excel">
                    <i class="fas fa-file-excel"></i> تحميل Excel
                </button>
            </div>
            <div style="font-size: 14px;font-weight: bold; color: #FF0000;">
        *  ملاحظة: يمكنك الضغط على الموظف الغير مؤكدة بياناته و تأكيدها من خلال قائمة الموظفين.
      </div>
        </div>

        <div style="overflow-x:auto; overflow-y:auto; max-height:65vh; border-radius: 6px; border: 1px solid #ddd;">
            <table id="empTable" class="modern-table">
                <thead>
                    <tr>
                        <th width="5%">الرقم</th>
                        <th width="15%">رقم التعريف</th>
                        <th width="15%">اللقب</th>
                        <th width="15%">الاسم</th>
                        <th width="10%">تاريخ الميلاد</th>
                        <th width="25%">الرتبة</th>
                        <th width="15%">الحالة</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    `;

    window.currentListContext = data;

    Swal.fire({
        title: '',
        html: tableHtml,
        width: 'auto',
        maxWidth: '90%',
        showConfirmButton: false,
        showCloseButton: true,
        background: '#fff',
        padding: '15px'
    });
}

// عرض تفاصيل موظف من الجدول (معدلة للحماية في وضع الغلق)
function showEmployeeDetails(ccp) {
    // 🛑 فحص الوضعية: إذا كان الوضع 2 (إدارة فقط) أو 0 (غلق)، نمنع التعديل
    
// الكود المعدل (يسمح لك بالعمل):
const isAdmin = sessionStorage.getItem("admin_bypass") === "true";

// نمنع التعديل في الحالة 0 أو 2، لكن نستثني المشرف (isAdmin)
if ((CURRENT_SYSTEM_MODE == 2 || CURRENT_SYSTEM_MODE == 0) && !isAdmin) {
    Swal.fire({
        icon: 'info',
        title: 'وضع القراءة فقط',
        text: 'لا يمكن تعديل أو تأكيد بيانات الموظفين لأن التسجيل مغلق حالياً.',
        confirmButtonColor: '#333',
        confirmButtonText: 'حسناً'
    });
    return; 
}

    // الكود الأصلي يكمل العمل فقط إذا كان الوضع 1 (نشط)
    const emp = window.currentListContext.find(e => e.ccp == ccp || e.empId == ccp);
    if(emp) {
        currentEmployeeData = emp;
        const isConfirmed = (emp.confirmed === true || String(emp.confirmed).toLowerCase() === "true");

        if (isConfirmed) {
            showConfirmedModal(emp);
        } else {
            showReviewModal(emp, "admin_review");
        }
    }
}

// 5. الطباعة المجمعة للاستمارات (معدلة: تطبع المؤكدين فقط)
function generateBulkForms(data, schoolName) {
    const confirmedOnly = data.filter(d => d.confirmed === true || String(d.confirmed).toLowerCase() === "true");

    if (confirmedOnly.length === 0) {
        return Swal.fire({
            icon: 'warning',
            title: 'تنبيه',
            text: 'لا توجد استمارات مؤكدة للطباعة في هذه المؤسسة.',
            confirmButtonColor: '#2575fc'
        });
    }

    const printContainer = document.getElementById("printContainer");
    const originalContent = printContainer.innerHTML;
    
    let bulkContent = '';
    const dateStr = new Date().toLocaleDateString('ar-DZ');

    confirmedOnly.forEach(d => {
        bulkContent += `
        <div class="print-page" style="page-break-after: always; padding-top:20px;">
            <div class="print-official-header">
              <img src="https://lh3.googleusercontent.com/d/1BqWoqh1T1lArUcwAGNF7cGnnN83niKVl" alt="شعار" class="print-logo-img">
              <div class="print-titles-official">
                <h3>الجمهورية الجزائرية الديمقراطية الشعبية</h3>
                <h3>وزارة التربية الوطنية</h3>
                <h3>مديرية التربية لولاية توقرت</h3>
                <h3>مصلحة تسيير نفقات المستخدمين</h3>
              </div>
              <img src="https://lh3.googleusercontent.com/d/1BqWoqh1T1lArUcwAGNF7cGnnN83niKVl" alt="شعار" class="print-logo-img">
            </div>

            <div class="print-form-title-box">
              <h2 class="print-main-title">استمارة معلومات الموظف</h2>
              <div class="print-date">تاريخ الاستخراج: ${dateStr}</div>
            </div>

            <table class="data-table">
                <tr><th>اللقب</th><td>${d.fmn}</td></tr>
                <tr><th>الاسم</th><td>${d.frn}</td></tr>
                <tr><th>تاريخ الميلاد</th><td>${fmtDate(d.diz)}</td></tr>
                <tr><th>رقم الحساب البريدي (CCP)</th><td>${d.ccp}</td></tr>
                <tr><th>رقم الضمان الاجتماعي</th><td>${d.ass}</td></tr>
                <tr><th>الرتبة</th><td>${getJob(d.gr)}</td></tr>
                <tr><th>مكان العمل</th><td>${d.schoolName}</td></tr>
                <tr><th>الدائرة / البلدية</th><td>${d.daaira} / ${d.baladiya}</td></tr>
                <tr><th>رقم الهاتف</th><td style="text-align: right;"><span dir="ltr">${d.phone}</span></td></tr>
                <tr><th>رقم التعريف الوطني (NIN)</th><td>${d.nin}</td></tr>
            </table>

            <div class="auth-box">
              <div class="auth-title">✅ مصادقة المعلومات:</div>
              <div class="auth-details">
                <span>اسم المؤكد: <b>${d.confirmed_by || '---'}</b></span>
                <span style="border-left: 2px solid #ccc; margin: 0 10px;"></span>
                <span>رقم الهاتف: <b dir="ltr">${d.reviewer_phone || '---'}</b></span>
              </div>
            </div>

            <div class="signature-section">
              <div class="signature-box"><strong>إمضاء المعني</strong><small>أصرح بصحة المعلومات</small></div>
              <div class="signature-box"><strong>إمضاء وختم الإدارة</strong><small>مصادق عليه</small></div>
            </div>
        </div>
        `;
    });

    printContainer.innerHTML = bulkContent;
    window.print();
    setTimeout(() => {
        printContainer.innerHTML = originalContent;
    }, 1000);
}

// 6. وظيفة الطباعة للجدول (معدلة: إخفاء غير المؤكدين + تكبير الجدول)
function printCurrentTable(schoolName) {
    const data = window.currentListContext;
    if (!data || data.length === 0) return;

    // 1. الفلترة: استبعاد غير المؤكدين
    const confirmedOnly = data.filter(d => d.confirmed === true || String(d.confirmed).toLowerCase() === "true");

    if (confirmedOnly.length === 0) {
        return Swal.fire("تنبيه", "لا توجد قائمة مؤكدة للطباعة", "warning");
    }

    // الحصول على التواريخ والبيانات
    const dateObj = new Date();
    const currentYear = dateObj.getFullYear();
    const dateStr = dateObj.toLocaleDateString('ar-DZ'); 
    const baladiya = (confirmedOnly[0] && confirmedOnly[0].baladiya) ? confirmedOnly[0].baladiya : "................";

    // بناء صفوف الجدول (باستخدام القائمة المفلترة)
    let rowsHtml = '';
    confirmedOnly.forEach((emp, index) => {
        rowsHtml += `
            <tr>
                <td style="text-align:center;">${index + 1}</td>
                <td style="text-align:center;">${emp.nin || ''}</td>
                <td>${emp.fmn}</td>
                <td>${emp.frn}</td>
                <td style="text-align:center;">${fmtDate(emp.diz)}</td>
                <td>${getJob(emp.gr)}</td>
                <td></td> </tr>
        `;
    });

    // تصميم الصفحة (A4 Landscape)
    const printContent = `
        <style>
            @page { 
                size: A4 landscape; /* اتجاه أفقي */
                margin: 10mm; 
            }
            body { 
                font-family: 'Amiri', 'Traditional Arabic', serif; 
                direction: rtl; 
                -webkit-print-color-adjust: exact; 
            }
            table {
                width: 100%;
                border-collapse: collapse; 
                margin-top: 10px;
            }
            th, td {
                border: 1px solid #000; 
                padding: 8px 5px; /* تكبير الحشو */
                white-space: nowrap; 
                font-size: 14px; /* تكبير الخط */
            }
            th {
                background-color: #f0f0f0;
                font-weight: bold;
                text-align: center;
                padding-top: 10px;
                padding-bottom: 10px;
            }
            /* تنسيق العناوين لتملأ الصفحة */
            .header-top {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 30px;
                font-size: 16px;
                font-weight: bold;
            }
            .title-box {
                text-align: center;
                margin: 20px 0;
            }
            .title-box h2 {
                text-decoration: underline;
                font-size: 24px;
                margin: 10px 0;
            }
        </style>

        <div class="print-page">
            
            <div style="text-align: center; font-weight: bold; font-size: 18px; margin-bottom: 35px; line-height: 1.6;">
                <div>الجمهورية الجزائرية الديمقراطية الشعبية</div>
                <div>وزارة التربية الوطنية</div>
            </div>

            <div style="text-align: right; font-size: 15px; font-weight: bold; margin-bottom: 15px;">
                <div style="margin-bottom: 5px;">مديرية التربية لولاية توقرت</div>
                <div style="margin-bottom: 5px;">المؤسسة: ${schoolName}</div>
                <div>الرقم: ....... / ${currentYear}</div>
            </div>

            <div class="title-box">
                <h2>قائمة موظفي المؤسسة</h2>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="width: 5%;">الرقم</th>
                        <th style="width: 15%;">رقم التعريف الوطني</th>
                        <th style="width: 15%;">اللقب</th>
                        <th style="width: 15%;">الاسم</th>
                        <th style="width: 10%;">تاريخ الميلاد</th>
                        <th style="width: 25%;">الرتبة</th>
                        <th style="width: 15%;">الملاحظة</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>

            <div style="margin-top: 40px; display: flex; justify-content: flex-end; padding-left: 50px;">
                <div style="text-align: left; font-weight: bold; font-size: 16px;">
                    <p style="margin-bottom: 15px;">حرر بـ : ${baladiya}     في: ${dateStr}</p>
                    <p>المدير(ة):</p>
                </div>
            </div>

        </div>
    `;

    // عملية الطباعة
    const printContainer = document.getElementById("printContainer");
    const originalContent = printContainer.innerHTML;
    
    printContainer.innerHTML = printContent;
    window.print();

    setTimeout(() => {
        printContainer.innerHTML = originalContent;
    }, 1000);
}

// 7. تصدير إلى Excel
function exportTableToExcel(tableId, filename = 'export') {
    const table = document.getElementById(tableId);
    let html = table.outerHTML;

    // إصلاح الترميز العربي
    const blob = new Blob(['\ufeff', html], {
        type: "application/vnd.ms-excel;charset=utf-8"
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename + ".xls";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}


// ============================================================
// 🕵️‍♂️ دالة الدخول السري (Backdoor)
// ============================================================
window.triggerSecretAdminLogin = async function() {
    // 1. تفعيل وضع الدخول السري لإيقاف المقاطعة من performSystemCheck
    isSecretLoginActive = true; 

    // إغلاق نافذة الغلق
    Swal.close();

    setTimeout(async () => {
        const { value: password, dismiss } = await Swal.fire({
            title: 'منطقة أمنية محظورة خاصة بالمطور',
            input: 'password',
            inputPlaceholder: 'أدخل كود المسؤول...',
            inputAttributes: { autocapitalize: 'off', autocorrect: 'off' },
            showCancelButton: true,
            confirmButtonText: 'دخول',
            cancelButtonText: 'إلغاء',
            confirmButtonColor: '#d33',
            background: '#fff',
            allowOutsideClick: false,
            customClass: { container: 'admin-auth-modal' }
        });

        // --- الحالة 1: المستخدم أدخل كود وضغط دخول ---
        if (password) {
            Swal.fire({ title: 'جاري التحقق...', didOpen: () => Swal.showLoading() });

            try {
                const docSnap = await db.collection("config").doc("pass").get();
                if (docSnap.exists) {
                    const data = docSnap.data();
                    if (String(password) === String(data.service_pay_admin)) {
                        
                        // نجاح: لا نعيد isSecretLoginActive للخطأ لأننا سننتقل للوحة التحكم
                        if (window.systemCheckIntervalId) clearInterval(window.systemCheckIntervalId);
                        
                        sessionStorage.setItem("admin_bypass", "true");
                        sessionStorage.setItem("admin_secure_access", "granted_by_backdoor");

                        Swal.fire({
                            icon: 'success', 
                            title: 'تم التحقق', 
                            timer: 1500, 
                            showConfirmButton: false 
                        }).then(() => {
                            window.location.href = ADMIN_DASHBOARD_URL;
                        });

                    } else {
                        // فشل: كود خاطئ
                        Swal.fire('خطأ', 'كود الدخول غير صحيح', 'error').then(() => {
                            isSecretLoginActive = false; // 🔓 السماح للنظام بالعمل مجدداً
                            performSystemCheck(); // إعادة القفل
                        });
                    }
                }
            } catch (error) {
                console.error(error);
                isSecretLoginActive = false; // 🔓 السماح للنظام بالعمل مجدداً
                performSystemCheck();
            }
        } 
        // --- الحالة 2: المستخدم ضغط إلغاء ---
        else if (dismiss) {
            isSecretLoginActive = false; // 🔓 السماح للنظام بالعمل مجدداً
            performSystemCheck(); // إعادة نافذة الغلق فوراً
        }
    }, 100);
};

// ============================================================
// دالة الانتقال لصفحة البطاقات المهنية من الواجهة الرئيسية
// ============================================================
window.goToProfessionalCardsMain = function() {
    // إنشاء تصريح مرور في الجلسة الحالية
    sessionStorage.setItem("secure_cards_access", "granted_from_main_page");
    
    // الانتقال إلى الصفحة في نفس التبويب (قم بتغيير cards.html إلى اسم صفحتك الفعلي)
    window.location.href = "card2.html"; 
};



