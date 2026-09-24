// ============================================================
// سكربت مزامنة التسجيلات مع Google Sheets (Google Apps Script API)
// ============================================================

const GoogleSheetsSync = {
  // جلب رابط السكربت من إعدادات النظام أو الرابط الافتراضي
  async getWebhookUrl() {
    try {
      if (window.db) {
        const snap = await window.db.collection("system_settings").doc("general").get();
        if (snap.exists && snap.data().google_sheets_url) {
          return snap.data().google_sheets_url;
        }
      }
    } catch (e) {
      console.warn("تعذر جلب رابط Google Sheets من الإعدادات:", e);
    }
    return "https://script.google.com/macros/s/AKfycbyXEdCPd-rrImLFLZObPXbeELUqj71mknOOFB7sjMCh6JQE-L7yMIsgFlFXrA5-VTUjRg/exec";
  },

  // إرسال سجل جديد أو محدث إلى شيت جوجل
  async syncRegistration(record) {
    const url = await this.getWebhookUrl();
    if (!url) {
      console.log("المزامنة مع Google Sheets معطلة (لا يوجد رابط محدد)");
      return { success: false, reason: "no_url" };
    }

    try {
      const payload = {
        action: "save_contract_employee",
        timestamp: new Date().toISOString(),
        ccp: record.ccp || "",
        nss: record.nss || "",
        nin: record.nin || "",
        fmn_ar: record.fmn_ar || "",
        frn_ar: record.frn_ar || "",
        fmn_en: record.fmn_en || "",
        frn_en: record.frn_en || "",
        birth_date: record.birth_date || "",
        birth_place: record.birth_place || "",
        marital_status: record.marital_status || "",
        children_count: record.children_count || 0,
        spouse_name: record.spouse_name || "",
        spouse_job: record.spouse_job || "",
        academic_year: record.academic_year || "",
        level: record.level || "",
        status_type: record.status_type || "",
        diploma: record.diploma || "",
        rank: record.rank || "",
        rank_code: record.rank_code || "",
        admin_code: record.admin_code || "",
        daaira: record.daaira || "",
        baladiya: record.baladiya || "",
        school_name: record.school_name || "",
        start_date: record.start_date || "",
        end_date: record.end_date || "",
        duration: record.duration_text || "",
        phone: record.phone || "",
        workflow_status: record.workflow_status || "pending_director"
      };

      const response = await fetch(url, {
        method: "POST",
        mode: "no-cors", // لمنع أخطاء CORS مع Google Apps Script
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(payload)
      });

      console.log("✅ تم إرسال بيانات الموظف إلى Google Sheets بنجاح");
      return { success: true };
    } catch (err) {
      console.error("❌ فشلت المزامنة مع Google Sheets:", err);
      return { success: false, error: err };
    }
  },

  // كود Google Apps Script الجاهز للنسخ في محرر جوجل
  getAppsScriptTemplate() {
    return `
/**
 * سكربت Google Apps Script لمزامنة منصة المستخلفين والمتعاقدين
 * الصق هذا الكود في Google Apps Script المرتبط بشيت المستخلفين
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var p = e.parameter;
    
    // عناوين الأعمدة في حال كان الشيت فارغاً
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "تاريخ التسجيل", "رقم الحساب CCP", "رقم الضمان الاجتماعي NSS", "رقم التعريف NIN",
        "اللقب بالعربية", "الاسم بالعربية", "اللقب بالإنجليزية", "الاسم بالإنجليزية",
        "تاريخ الميلاد", "مكان الميلاد", "الحالة العائلية", "عدد الأولاد", "اسم الزوج", "وظيفة الزوج",
        "السنة الدراسية", "الطور", "الصفة", "شهادة التوظيف", "الرتبة", "رمز الرتبة", "رمز الإدارة",
        "الدائرة", "البلدية", "المؤسسة", "تاريخ البداية", "تاريخ النهاية", "المدة", "رقم الهاتف", "حالة الملف"
      ]);
    }
    
    // إضافة السطر الجديد
    sheet.appendRow([
      p.timestamp, p.ccp, p.nss, p.nin,
      p.fmn_ar, p.frn_ar, p.fmn_en, p.frn_en,
      p.birth_date, p.birth_place, p.marital_status, p.children_count, p.spouse_name, p.spouse_job,
      p.academic_year, p.level, p.status_type, p.diploma, p.rank, p.rank_code, p.admin_code,
      p.daaira, p.baladiya, p.school_name, p.start_date, p.end_date, p.duration, p.phone, p.workflow_status
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ "result": "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ "result": "error", "error": error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
    `.trim();
  }
};
