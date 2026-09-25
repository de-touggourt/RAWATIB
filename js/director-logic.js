// ============================================================
// منطق التحقق وفحص الحسابات البريدية الجارية (CCP Logic)
// لبوابة مدير المؤسسة وفحص الموظفين المستخلفين
// ============================================================

const DirectorLogic = {
  // تنظيف رقم الـ CCP واستخراج المرشحين للبحث (سواء مع أصفار أو بدونها)
  normalizeCCP(rawInput) {
    if (!rawInput) return { clean: "", candidates: [] };
    const clean = String(rawInput).trim().replace(/\D/g, "");
    const base = clean.replace(/^0+/, "");
    const candidates = [...new Set([base, base.padStart(10, "0"), clean])].filter(Boolean);
    return { clean, base, candidates };
  },

  // 1. البحث في كولكشن الموظفين الدائمين employeescompay
  async findInPermanentEmployees(rawCCP) {
    if (!window.db) throw new Error("قاعدة البيانات غير متصلة");
    const { candidates } = this.normalizeCCP(rawCCP);

    for (const ccp of candidates) {
      try {
        const snap = await window.db.collection("employeescompay").doc(ccp).get();
        if (snap.exists) {
          return { exists: true, ccp, data: snap.data() };
        }
      } catch (err) {
        console.warn(`فحص CCP ${ccp} في employeescompay:`, err);
      }
    }
    return { exists: false, ccp: null, data: null };
  },

  // 2. البحث في كولكشن المستخلفين السابقين employeescompaycontra
  async findInContractEmployees(rawCCP) {
    if (!window.db) throw new Error("قاعدة البيانات غير متصلة");
    const { candidates } = this.normalizeCCP(rawCCP);

    for (const ccp of candidates) {
      try {
        const snap = await window.db.collection("employeescompaycontra").doc(ccp).get();
        if (snap.exists) {
          return { exists: true, ccp, data: snap.data() };
        }
      } catch (err) {
        console.warn(`فحص CCP ${ccp} في employeescompaycontra:`, err);
      }
    }
    return { exists: false, ccp: null, data: null };
  },

  // 3. البحث في كولكشن حسابات المدراء المسجلين directors_accounts
  async findDirectorAccount(rawCCP) {
    if (!window.db) throw new Error("قاعدة البيانات غير متصلة");
    const { candidates } = this.normalizeCCP(rawCCP);

    for (const ccp of candidates) {
      try {
        const snap = await window.db.collection("directors_accounts").doc(ccp).get();
        if (snap.exists) {
          return { exists: true, ccp, data: snap.data() };
        }
      } catch (err) {
        console.warn(`فحص حساب المدير ${ccp}:`, err);
      }
    }
    return { exists: false, ccp: null, data: null };
  },

  // 4. تسجيل حساب مدير جديد
  async registerDirectorAccount(directorData) {
    if (!window.db) throw new Error("قاعدة البيانات غير متصلة");
    const ccp = String(directorData.ccp).trim();
    await window.db.collection("directors_accounts").doc(ccp).set({
      ...directorData,
      created_at: new Date().toISOString(),
      status: "active"
    });
    return true;
  },

  // 5. فحص شامل لمرشح مستخلف/متعاقد جديد (وفقاً للشروط المحددة: من 10 إلى 12 رقماً)
  async verifyCandidateForRegistration(rawCCP) {
    const clean = String(rawCCP || "").trim().replace(/\D/g, "");
    if (clean.length < 10 || clean.length > 12) {
      Swal.fire({
        icon: "warning",
        title: "تنبيه رقم الحساب (CCP)",
        text: `رقم الحساب البريدي الجاري CCP يجب أن يتكون من 10 إلى 12 رقماً بدون المفتاح (العدد الحالي: ${clean.length} رقم).`,
        confirmButtonColor: "#2575fc"
      });
      return null;
    }

    Swal.fire({
      title: "جاري التحقق من رقم الحساب...",
      text: "يتم الفحص في قاعدة بيانات الموظفين الدائمين والمستخلفين",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      // الخطوة 1: الفحص في employeescompay (الموظفون الدائمون)
      const permCheck = await this.findInPermanentEmployees(clean);
      if (permCheck.exists) {
        Swal.close();
        Swal.fire({
          icon: "error",
          title: "❌ تسجيل مرفوض وممنوع",
          html: `
            <div style="text-align: center; direction: rtl; line-height: 1.8;">
              <p style="color: #dc3545; font-size: 15px; font-weight: bold; margin-bottom: 10px;">
                لا يمكن اعتماد أو تسجيل هذا الموظف كونه مسجلاً بالفعل ضمن الموظفين الدائمين.
              </p>
              <div style="background: #f8f9fa; border: 1px solid #e2e8f0; padding: 10px; border-radius: 8px; font-size: 13px;">
                <strong>الاسم واللقب:</strong> ${permCheck.data.fmn || ''} ${permCheck.data.frn || ''}<br>
                <strong>رقم الحساب:</strong> ${permCheck.ccp}
              </div>
            </div>
          `,
          confirmButtonText: "موافق",
          confirmButtonColor: "#dc3545"
        });
        return { allowed: false, reason: "permanent" };
      }

      // الخطوة 1.5: الفحص في contract_registrations لمنع تسجيل نفس الموظف في أكثر من مؤسسة أو صفة في نفس السنة
      const sysSettings = typeof getSystemSettings === "function" ? await getSystemSettings() : null;
      const currentYear = (sysSettings && sysSettings.active_academic_year) ? sysSettings.active_academic_year : "2026-2027";
      
      const { candidates: ccpCandidates } = this.normalizeCCP(clean);
      let duplicateDoc = null;
      for (const cand of ccpCandidates) {
        const snap = await window.db.collection("contract_registrations")
          .where("ccp", "==", cand)
          .where("academic_year", "==", currentYear)
          .get();
        if (!snap.empty) {
          duplicateDoc = snap.docs[0].data();
          break;
        }
      }

      if (duplicateDoc) {
        Swal.close();
        Swal.fire({
          icon: "error",
          title: "❌ تكرار التسجيل ممنوع",
          html: `
            <div style="text-align: right; direction: rtl; line-height: 1.8; font-size: 13.5px;">
              <p style="color: #dc2626; font-weight: bold; margin-bottom: 8px;">
                الموظف مسجل بالفعل للسنة الدراسية الحالية (${duplicateDoc.academic_year || currentYear}):
              </p>
              <div style="background: #fef2f2; border: 1.5px solid #fecaca; padding: 12px 14px; border-radius: 10px;">
                <b>الاسم واللقب:</b> ${duplicateDoc.fmn_ar || ''} ${duplicateDoc.frn_ar || ''}<br>
                <b>المؤسسة المسجل بها:</b> <span style="color:#b91c1c; font-weight:bold;">${duplicateDoc.school_name || '---'}</span><br>
                <b>الصفة والرتبة:</b> ${duplicateDoc.status_type || '---'} - ${duplicateDoc.rank || '---'}<br>
                <b>الفترة:</b> من ${duplicateDoc.start_date || '---'} إلى ${duplicateDoc.end_date || '---'}
              </div>
              <p style="color: #64748b; font-size: 12px; margin-top: 8px;">
                * تمنع لوائح المنظومة ازدواجية تسجيل نفس الموظف في أكثر من مؤسسة أو أكثر من صفة لنفس السنة الدراسية.
              </p>
            </div>
          `,
          confirmButtonText: "موافق",
          confirmButtonColor: "#dc2626"
        });
        return { allowed: false, reason: "duplicate_academic_year" };
      }

      // الخطوة 2: الفحص في employeescompaycontra (المستخلفون والمتعاقدون السابقون)
      const contraCheck = await this.findInContractEmployees(clean);
      Swal.close();

      if (contraCheck.exists) {
        // الحالة الأولى: موجود مسبقاً
        const emp = contraCheck.data;
        const empName = `${emp.fmn || emp.fmn_ar || ''} ${emp.frn || emp.frn_ar || ''}`.trim();

        const result = await Swal.fire({
          icon: "success",
          title: "تم العثور على بيانات الموظف المستخلف بنجاح",
          html: `
            <div style="text-align: right; direction: rtl; font-size: 13px; line-height: 1.8;">
              <p style="margin-bottom: 8px; color: #28a745; font-weight: bold;">
                الموظف مسجل سابقاً في قاعدة بيانات المستخلفين:
              </p>
              <table style="width: 100%; border-collapse: collapse; margin-top: 5px;">
                <tr><th style="padding: 4px; border-bottom: 1px solid #ddd; width: 40%;">الاسم واللقب:</th><td style="padding: 4px; border-bottom: 1px solid #ddd; font-weight: bold;">${empName || 'غير مسجل'}</td></tr>
                <tr><th style="padding: 4px; border-bottom: 1px solid #ddd;">رقم CCP:</th><td style="padding: 4px; border-bottom: 1px solid #ddd;">${contraCheck.ccp}</td></tr>
                <tr><th style="padding: 4px; border-bottom: 1px solid #ddd;">رقم الضمان:</th><td style="padding: 4px; border-bottom: 1px solid #ddd;">${emp.ass || emp.nss || '---'}</td></tr>
              </table>
            </div>
          `,
          showCancelButton: true,
          confirmButtonText: "متابعة",
          cancelButtonText: "إلغاء",
          confirmButtonColor: "#2575fc",
          cancelButtonColor: "#6c757d"
        });

        if (result.isConfirmed) {
          // تخزين البيانات للانتقال للاستمارة
          sessionStorage.setItem("candidate_prefill", JSON.stringify({
            mode: "existing",
            ccp: contraCheck.ccp,
            data: emp
          }));
          window.location.href = `contract-form.html?ccp=${contraCheck.ccp}&mode=existing`;
        }
        return { allowed: true, mode: "existing", data: emp };
      } else {
        // الحالة الثانية: غير موجود
        const result = await Swal.fire({
          icon: "info",
          title: "لم يتم العثور على بيانات سابقة للموظف",
          text: `رقم الحساب ${clean} غير مسجل مسبقاً. يمكنك فتح استمارة تسجيل جديدة الآن.`,
          showCancelButton: true,
          confirmButtonText: "تسجيل الآن",
          cancelButtonText: "إلغاء",
          confirmButtonColor: "#28a745",
          cancelButtonColor: "#6c757d"
        });

        if (result.isConfirmed) {
          sessionStorage.setItem("candidate_prefill", JSON.stringify({
            mode: "new",
            ccp: clean,
            data: null
          }));
          window.location.href = `contract-form.html?ccp=${clean}&mode=new`;
        }
        return { allowed: true, mode: "new", ccp: clean };
      }

    } catch (err) {
      Swal.close();
      console.error("خطأ أثناء فحص المرشح:", err);
      Swal.fire({
        icon: "error",
        title: "خطأ في الاتصال",
        text: "تعذر التحقق من رقم الحساب بسبب مشكلة في الاتصال بقاعدة البيانات.",
        confirmButtonColor: "#2575fc"
      });
      return null;
    }
  }
};

window.DirectorLogic = DirectorLogic;
