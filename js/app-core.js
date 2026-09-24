// ============================================================
// النواة المركزية الموحدة للمنظومة (Unified App Core)
// تشمل: التحقق من CCP (من 10 إلى 12 رقماً)، الهاتف، البريد، قوة كلمة المرور،
// إدارة الحسابات، التحقق من config/pass، وخدمات المؤسسات والرتب
// ============================================================

const AppCore = {
  // ------------------------------------------------------------
  // 1. التحقق من رقم الحساب البريدي الجاري (CCP: من 10 إلى 12 رقماً)
  // ------------------------------------------------------------
  CCP: {
    clean(input) {
      if (!input) return "";
      return String(input).trim().replace(/\D/g, "");
    },

    isValid(input) {
      const cleaned = this.clean(input);
      return cleaned.length >= 10 && cleaned.length <= 12;
    },

    validateOrError(input) {
      const cleaned = this.clean(input);
      if (!cleaned) {
        return { valid: false, message: "يرجى إدخال رقم الحساب الجاري (CCP)." };
      }
      if (cleaned.length < 10 || cleaned.length > 12) {
        return {
          valid: false,
          message: `رقم الحساب الجاري CCP يجب أن يتكون من 10 إلى 12 رقماً فقط (المدخل الحالي: ${cleaned.length} رقم).`
        };
      }
      return { valid: true, ccp: cleaned };
    },

    // استخراج المرشحين للبحث في فايربيز (للتعامل مع الأرقام القديمة والـ 12 رقماً)
    generateCandidates(input) {
      const clean = this.clean(input);
      if (!clean) return [];
      const base = clean.replace(/^0+/, "");
      return [...new Set([
        clean,
        clean.padStart(12, "0"),
        base.padStart(10, "0"),
        base.padStart(12, "0"),
        base
      ])].filter(Boolean);
    }
  },

  // ------------------------------------------------------------
  // 2. التحقق من البريد الإلكتروني (Gmail فقط)
  // ------------------------------------------------------------
  Email: {
    isValidGmail(email) {
      if (!email) return false;
      const trimmed = String(email).trim().toLowerCase();
      const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
      return gmailRegex.test(trimmed);
    },

    validateOrError(email) {
      if (!email) {
        return { valid: false, message: "يرجى إدخال البريد الإلكتروني." };
      }
      const trimmed = String(email).trim().toLowerCase();
      if (!this.isValidGmail(trimmed)) {
        return {
          valid: false,
          message: "البريد الإلكتروني يجب أن يكون من نطاق Gmail حصراً (ينتهي بـ @gmail.com)."
        };
      }
      return { valid: true, email: trimmed };
    }
  },

  // ------------------------------------------------------------
  // 3. التحقق من رقم الهاتف الجزائري (05 / 06 / 07 وبطول 10 أرقام)
  // ------------------------------------------------------------
  Phone: {
    clean(phone) {
      if (!phone) return "";
      return String(phone).trim().replace(/\D/g, "");
    },

    isValid(phone) {
      const cleaned = this.clean(phone);
      return /^(05|06|07)[0-9]{8}$/.test(cleaned);
    },

    formatDisplay(phone) {
      const cleaned = this.clean(phone);
      if (cleaned.length !== 10) return phone;
      // 00 00 00 00 00
      return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8, 10)}`;
    },

    validateOrError(phone) {
      const cleaned = this.clean(phone);
      if (!cleaned) {
        return { valid: false, message: "يرجى إدخال رقم الهاتف." };
      }
      if (!this.isValid(cleaned)) {
        return {
          valid: false,
          message: "رقم الهاتف يجب أن يكون بصيغة جزائرية صحيحة مكونة من 10 أرقام وتبدأ بـ (05 أو 06 أو 07)."
        };
      }
      return { valid: true, phone: cleaned, formatted: this.formatDisplay(cleaned) };
    }
  },

  // ------------------------------------------------------------
  // 4. مؤشر قوة كلمة المرور (Password Strength Meter)
  // ------------------------------------------------------------
  Password: {
    evaluate(password) {
      const pass = String(password || "");
      if (!pass) {
        return { score: 0, label: "فارغة", color: "#cbd5e1", percent: 0 };
      }

      let score = 0;
      if (pass.length >= 6) score += 1;
      if (pass.length >= 8) score += 1;
      if (/[A-Z]/.test(pass)) score += 1;
      if (/[0-9]/.test(pass)) score += 1;
      if (/[^A-Za-z0-9]/.test(pass)) score += 1;

      if (score <= 2) {
        return { score: 1, label: "ضعيفة", color: "#ef4444", percent: 33, class: "weak" };
      } else if (score === 3 || score === 4) {
        return { score: 2, label: "متوسطة", color: "#f59e0b", percent: 66, class: "medium" };
      } else {
        return { score: 3, label: "قوية جداً", color: "#10b981", percent: 100, class: "strong" };
      }
    }
  },

  // ------------------------------------------------------------
  // 5. قاموس الرتب الرسمية والرتب المسموح لها بالإنشاء والإدارة
  // ------------------------------------------------------------
  Grades: {
    dictionary: {
      "1006": "أستاذ إبتدائي (متعاقد)",
      "1007": "أستاذ تعليم إبتدائي قسم أول",
      "1008": "أستاذ تعليم إبتدائي قسم ثان",
      "1009": "أستاذ مميز في التعليم الإبتدائي",
      "1010": "أستاذ التعليم الإبتدائي",
      "2021": "ناظر في التعليم الإبتدائي",
      "2031": "مربي متخصص رئيسي في الدعم",
      "2100": "مدير مدرسة إبتدائية",
      "3001": "أستاذ التعليم المتوسط قسم أول",
      "3005": "أستاذ التعليم المتوسط قسم ثاني",
      "3010": "أستاذ مميز في التعليم المتوسط",
      "3012": "أستاذ التعليم المتوسط / متعاقد",
      "3020": "أستاذ ت م متعاقد ق 01 (13)",
      "4000": "مدير متوسطة",
      "4006": "ناظر في التعليم المتوسط",
      "4025": "مقتصد",
      "4030": "مستشار التربية",
      "4031": "مستشار توجيه وارشاد مدرسي",
      "4032": "مستشار محلل لتوجيه والارشاد",
      "4033": "مستشار رئيسي للتوجيه",
      "4034": "مستشار رئيس للتوجيه",
      "4040": "نائب مقتصد مسير",
      "4060": "نائب مقتصد",
      "4065": "مساعد رئيسي للمصالح الاقتصادية",
      "4072": "ملحق بالمخبر",
      "4076": "ملحق رئيسي للمخبر",
      "4077": "ملحق رئيس بالمخابر",
      "4078": "ملحق مشرف بالمخابر",
      "4085": "مساعد رئيسي للتربية",
      "4087": "مشرف تربية",
      "4088": "مشرف رئيسي للتربية",
      "4089": "مشرف رئيس للتربية",
      "4090": "مشرف عام للتربية",
      "5019": "أستاذ تعليم ثانوي",
      "5020": "أستاذ تعليم ثانوي (متعاقد)",
      "5021": "أستاذ تعليم ثانوي مستخلف",
      "5022": "أستاذ مميز في التعليم الثانوي",
      "5023": "أستاذ التعليم الثانوي قسم ثان",
      "5024": "أستاذ التعليم الثانوي قسم أول",
      "6001": "مدير ثانوية",
      "6003": "مستشار رئيس توجيه وارشاد",
      "6004": "ناظر في التعليم الثانوي",
      "6006": "مشرف رئيس للتربية",
      "6007": "مشرف عام للتربية",
      "6008": "مستشار محلل توجيه وارشاد",
      "6009": "مستشار رئيسي توجيه وارشاد",
      "6010": "مقتصد رئيسي",
      "6015": "مقتصد",
      "6025": "مستشار للتوجيه المدرسي",
      "6035": "مستشار للتربية",
      "6046": "ملحق رئيسي للمخبر",
      "6047": "ملحق مشرف بالمخابر",
      "6048": "ملحق رئيس بالمخابر",
      "6085": "نائب مقتصد",
      "6117": "مشرف رئيسي للتربية",
      "6118": "مشرف للتربية",
      "7005": "مدير التربية",
      "7011": "الأمين العام",
      "7013": "رئيس مصلحة بمديرية التربية",
      "7025": "مفتش التعليم الثانوي للتوجيه والإرشاد",
      "7071": "رئيس مصلحة بمديرية التربية",
      "7160": "مستشار محلل للتوجيه والإرشاد المدرسي",
      "7220": "نائب مقتصد",
      "7260": "م مصالح اقتصادية رئيسي",
      "7682": "مدير التربية"
    },

    // الرتب الافتراضية المسموح لها بإنشاء الحسابات وإدارة شؤون المؤسسة
    defaultAllowedGrades: [
      "2100", // مدير مدرسة إبتدائية
      "4000", // مدير متوسطة
      "6001", // مدير ثانوية
      "2021", // ناظر ابتدائي
      "4006", // ناظر متوسط
      "6004", // ناظر ثانوي
      "4025", "6010", "6015", // مقتصد
      "4040", "4060", "6085", "7220", // نائب مقتصد
      "4030", "6035", // مستشار التربية
      "7005", "7011", "7013", "7071" // الإدارة والمديرية
    ],

    getTitle(gradeCode) {
      if (!gradeCode) return "غير محدد";
      const code = String(gradeCode).trim();
      return this.dictionary[code] || `رتبة كود ${code}`;
    },

    // جلب الرتب المسموح لها من Firestore (system_settings/grades_allowed)
    async getAllowedGrades() {
      try {
        if (window.db) {
          const docSnap = await window.db.collection("system_settings").doc("grades_allowed").get();
          if (docSnap.exists) {
            const data = docSnap.data();
            if (Array.isArray(data.allowed_grades) && data.allowed_grades.length > 0) {
              return data.allowed_grades.map(String);
            }
          }
        }
      } catch (err) {
        console.warn("استخدام الرتب الافتراضية لتعذر الاتصال:", err);
      }
      return this.defaultAllowedGrades;
    },

    // حفظ الرتب المسموح لها من لوحة التحكم
    async saveAllowedGrades(gradesList) {
      if (!window.db) throw new Error("قاعدة البيانات غير متصلة");
      const list = [...new Set(gradesList.map(String))];
      await window.db.collection("system_settings").doc("grades_allowed").set({
        allowed_grades: list,
        updated_at: new Date().toISOString()
      }, { merge: true });
      return true;
    },

    // فحص هل رتبة معينة مسموح لها بإنشاء الحساب
    async isGradeAllowed(gradeCode) {
      const allowed = await this.getAllowedGrades();
      const code = String(gradeCode || "").trim();
      return allowed.includes(code);
    }
  },

  // ------------------------------------------------------------
  // 6. التحقق من حسابات الإدارة والمكاتب من config/pass
  // ------------------------------------------------------------
  ConfigAuth: {
    // اسم المستخدم = اسم الـ Field، كلمة المرور = القيمة المقابلة
    async verifyAdminLogin(username, password) {
      if (!window.db) throw new Error("قاعدة البيانات غير متصلة");
      const cleanUser = String(username || "").trim();
      const cleanPass = String(password || "").trim();

      if (!cleanUser || !cleanPass) {
        return { success: false, message: "يرجى إدخال اسم المستخدم وكلمة المرور." };
      }

      try {
        const snap = await window.db.collection("config").doc("pass").get();
        if (!snap.exists) {
          return { success: false, message: "وثيقة الإعدادات config/pass غير موجودة في قاعدة البيانات." };
        }

        const passData = snap.data();
        // فحص المفاتيح بحساسية مرنة
        for (const [key, val] of Object.entries(passData)) {
          const keyLower = String(key).trim().toLowerCase();
          if (keyLower === cleanUser.toLowerCase()) {
            if (String(val).trim() === cleanPass) {
              // تحديد نوع الحساب والصلاحية
              let role = "admin";
              let title = "مسؤول إداري";
              let officeType = "";
              let filterLevel = "all";

              if (keyLower === "acc_pr" || keyLower.includes("primary") || keyLower.includes("ibtidai") || keyLower.includes("ابتدائي") || keyLower.includes("primaire")) {
                role = "office_primary";
                officeType = "primary";
                filterLevel = "ابتدائي";
                title = "رئيس مكتب التعليم الابتدائي";
              } else if (keyLower === "acc_cm" || keyLower.includes("middle") || keyLower.includes("motawasit") || keyLower.includes("متوسط") || keyLower.includes("cem") || keyLower.includes("moyen")) {
                role = "office_middle";
                officeType = "middle";
                filterLevel = "متوسط";
                title = "رئيس مكتب التعليم المتوسط";
              } else if (keyLower === "acc_ly" || keyLower.includes("secondary") || keyLower.includes("thanawi") || keyLower.includes("ثانوي") || keyLower.includes("lycee")) {
                role = "office_secondary";
                officeType = "secondary";
                filterLevel = "ثانوي";
                title = "رئيس مكتب التعليم الثانوي";
              } else if (keyLower === "dir" || keyLower.includes("dir") || keyLower.includes("مدير")) {
                role = "director";
                title = "مدير المؤسسة التعليمية";
              } else if (keyLower.includes("pay") || keyLower.includes("rawatib") || keyLower.includes("رواتب")) {
                role = "office_payroll";
                officeType = "payroll";
                filterLevel = "all";
                title = "رئيس مصلحة نفقات المستخدمين (الرواتب)";
              } else if (keyLower === "admin" || keyLower.includes("admin")) {
                role = "admin";
                title = "المشرف العام";
              }

              return {
                success: true,
                type: "config_admin",
                username: cleanUser,
                role: role,
                officeType: officeType,
                filterLevel: filterLevel,
                title: title,
                isSuperAdmin: role === "admin"
              };
            }
          }
        }

        return { success: false, message: "اسم المستخدم أو كلمة المرور غير صحيحة." };
      } catch (err) {
        console.error("خطأ في فحص config/pass:", err);
        throw err;
      }
    },

    // جلب جميع مفاتيح الإدارة لتعديل كلمات المرور في لوحة التحكم
    async getAdminAccountsList() {
      if (!window.db) throw new Error("قاعدة البيانات غير متصلة");
      const snap = await window.db.collection("config").doc("pass").get();
      if (!snap.exists) return {};
      return snap.data();
    },

    // تحديث كلمة مرور في config/pass من لوحة التحكم
    async updateAdminPassword(keyName, newPassword) {
      if (!window.db) throw new Error("قاعدة البيانات غير متصلة");
      await window.db.collection("config").doc("pass").set({
        [keyName]: String(newPassword).trim()
      }, { merge: true });
      return true;
    }
  },

  // ------------------------------------------------------------
  // 7. إدارة المستخدمين والحسابات المنشأة (users_accounts)
  // ------------------------------------------------------------
  Users: {
    // التحقق من اسم مستخدم مسجل مسبقاً
    async isUsernameTaken(username) {
      if (!window.db) throw new Error("قاعدة البيانات غير متصلة");
      const u = String(username).trim().toLowerCase();
      const snap = await window.db.collection("users_accounts").where("username_lower", "==", u).limit(1).get();
      return !snap.empty;
    },

    // التحقق من وجود حساب سابق للموظف بواسطة CCP (من 10 إلى 12 رقماً)
    async isCcpRegistered(rawCcp) {
      if (!window.db) throw new Error("قاعدة البيانات غير متصلة");
      const candidates = AppCore.CCP.generateCandidates(rawCcp);
      for (const candidate of candidates) {
        const snap = await window.db.collection("users_accounts").where("ccp", "==", candidate).limit(1).get();
        if (!snap.empty) {
          return { exists: true, user: snap.docs[0].data(), id: snap.docs[0].id };
        }
        const docSnap = await window.db.collection("users_accounts").doc(candidate).get();
        if (docSnap.exists) {
          return { exists: true, user: docSnap.data(), id: docSnap.id };
        }
      }
      return { exists: false };
    },

    // إنشاء حساب جديد
    async createAccount(accountData) {
      if (!window.db) throw new Error("قاعدة البيانات غير متصلة");
      const ccp = String(accountData.ccp).trim();
      const username = String(accountData.username).trim();

      const newDoc = {
        ...accountData,
        ccp: ccp,
        username: username,
        username_lower: username.toLowerCase(),
        status: "active", // active | suspended
        created_at: new Date().toISOString()
      };

      const docRef = window.db.collection("users_accounts").doc(ccp);
      await docRef.set(newDoc);

      // مزامنة تلقائية مع حسابات المدراء إذا كان الحساب لمدير
      if (accountData.role === "director" || (accountData.school_name && accountData.level)) {
        try {
          await window.db.collection("directors_accounts").doc(ccp).set({
            ccp: ccp,
            directorName: `${accountData.first_name || ''} ${accountData.last_name || ''}`.trim(),
            level: accountData.level,
            daaira: accountData.daaira,
            baladiya: accountData.baladiya,
            schoolName: accountData.school_name,
            phone: accountData.phone,
            created_at: new Date().toISOString(),
            status: "active"
          }, { merge: true });
        } catch (e) {
          console.warn("مزامنة directors_accounts:", e);
        }
      }

      return { success: true, ccp: ccp, data: newDoc };
    },

    // مصادقة تسجيل دخول مستخدم عادي
    async verifyUserLogin(username, password) {
      if (!window.db) throw new Error("قاعدة البيانات غير متصلة");
      const u = String(username).trim();
      const p = String(password).trim();

      // البحث باسم المستخدم أو CCP
      let q = window.db.collection("users_accounts").where("username_lower", "==", u.toLowerCase()).limit(1);
      let snap = await q.get();

      if (snap.empty && AppCore.CCP.isValid(u)) {
        q = window.db.collection("users_accounts").where("ccp", "==", u).limit(1);
        snap = await q.get();
      }

      if (snap.empty) {
        return { success: false, message: "اسم المستخدم أو رقم الحساب غير مسجل." };
      }

      const docSnap = snap.docs[0];
      const user = docSnap.data();

      if (user.status === "suspended") {
        return {
          success: false,
          message: "هذا الحساب معطل حالياً من طرف الإدارة. يرجى مراجعة مصلحة نفقات المستخدمين."
        };
      }

      if (String(user.password).trim() !== p) {
        return { success: false, message: "كلمة المرور غير صحيحة." };
      }

      return { success: true, user: user, id: docSnap.id };
    }
  },

  // ------------------------------------------------------------
  // 8. فحص الموظف الدائم في employeescompay
  // ------------------------------------------------------------
  PermanentEmployee: {
    async findByCcp(rawCcp) {
      if (!window.db) throw new Error("قاعدة البيانات غير متصلة");
      const candidates = AppCore.CCP.generateCandidates(rawCcp);

      for (const candidate of candidates) {
        try {
          const docSnap = await window.db.collection("employeescompay").doc(candidate).get();
          if (docSnap.exists) {
            return { exists: true, ccp: candidate, data: docSnap.data() };
          }
        } catch (e) {
          console.warn("فحص employeescompay كـ doc:", e);
        }
      }

      // بحث كحقل ccp إذا لم يوجد كمفتاح مستند
      for (const candidate of candidates) {
        try {
          const q = await window.db.collection("employeescompay").where("ccp", "==", candidate).limit(1).get();
          if (!q.empty) {
            return { exists: true, ccp: candidate, data: q.docs[0].data() };
          }
        } catch (e) {
          console.warn("فحص employeescompay كحقل:", e);
        }
      }

      return { exists: false, ccp: null, data: null };
    }
  },

  // ------------------------------------------------------------
  // 9. تسيير المؤسسات التعليمية (Firestore + Fallback)
  // ------------------------------------------------------------
  Institutions: {
    // جلب المؤسسات لطور ودائرة وبلدية معينة
    getSchools(level, daaira, baladiya) {
      if (level === "ابتدائي") {
        if (typeof primarySchoolsByBaladiya !== "undefined" && primarySchoolsByBaladiya[baladiya]) {
          return primarySchoolsByBaladiya[baladiya].map(s => ({
            name: s.name,
            code: s.code || ""
          }));
        }
      } else if (level === "متوسط" || level === "ثانوي") {
        if (typeof window.institutionsByDaaira !== "undefined" && window.institutionsByDaaira[daaira] && window.institutionsByDaaira[daaira][level]) {
          return window.institutionsByDaaira[daaira][level];
        }
        if (typeof institutionsByDaaira !== "undefined" && institutionsByDaaira[daaira] && institutionsByDaaira[daaira][level]) {
          return institutionsByDaaira[daaira][level];
        }
      }
      return [];
    },

    // جلب رمز المؤسسة إن وجد
    findSchoolCode(schoolName, level, daaira) {
      const schools = this.getSchools(level, daaira, "");
      const found = schools.find(s => s.name.trim() === String(schoolName).trim());
      return found && found.code ? found.code : "";
    }
  },

  // ------------------------------------------------------------
  // 10. إعدادات البوابات وحالة النظام
  // ------------------------------------------------------------
  Gateways: {
    async getSettings() {
      if (!window.db) throw new Error("قاعدة البيانات غير متصلة");
      try {
        const snap = await window.db.collection("system_settings").doc("general").get();
        if (snap.exists) return snap.data();
      } catch (e) {}

      return {
        permanent_portal_enabled: false, // مجمدة افتراضياً كما طُلب
        contract_portal_enabled: true,
        registration_enabled: true,
        closure_message: "التسجيل مغلق مؤقتاً لانتهاء الآجال المحددة.",
        active_academic_year: "2026-2027"
      };
    },

    async updateSettings(updates) {
      if (!window.db) throw new Error("قاعدة البيانات غير متصلة");
      await window.db.collection("system_settings").doc("general").set(updates, { merge: true });
      return true;
    }
  }
};

window.AppCore = AppCore;
