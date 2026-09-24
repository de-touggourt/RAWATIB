// ============================================================
// نظام مسار وتتبع وضعية الملف الشامل (Workflow Tracking System)
// إدارة دورة حياة الملف: المؤسسة -> مكتب الطور -> مصلحة الرواتب
// وقفل/فتح صلاحيات التعديل والحذف ومسح الكود الذكي QR/Barcode
// ============================================================

const WORKFLOW_STATUSES = {
  PENDING_DIRECTOR: {
    key: "pending_director",
    label: "قيد الدراسة والتحضير بالمؤسسة",
    step: 1,
    badgeClass: "badge-draft",
    color: "#6c757d",
    icon: "fa-school"
  },
  SUBMITTED_TO_OFFICE: {
    key: "submitted_to_office",
    label: "مستلم بمكتب التعليم - قيد الدراسة",
    step: 2,
    badgeClass: "badge-pending",
    color: "#f59f00",
    icon: "fa-building-columns"
  },
  OFFICE_APPROVED: {
    key: "office_approved",
    label: "مطابق - محال لمصلحة الرواتب",
    step: 3,
    badgeClass: "badge-office",
    color: "#0284c7",
    icon: "fa-file-circle-check"
  },
  RETURNED_TO_DIRECTOR: {
    key: "returned_to_director",
    label: "غير مطابق / معاد للمؤسسة للتعديل",
    step: 1,
    badgeClass: "badge-rejected",
    color: "#dc3545",
    icon: "fa-triangle-exclamation"
  },
  SUBMITTED_TO_PAYROLL: {
    key: "submitted_to_payroll",
    label: "مستلم بمصلحة الرواتب - قيد الفحص",
    step: 3,
    badgeClass: "badge-pending",
    color: "#0891b2",
    icon: "fa-receipt"
  },
  PAYROLL_APPROVED: {
    key: "payroll_approved",
    label: "معتمد نهائياً للصرف والرواتب",
    step: 4,
    badgeClass: "badge-approved",
    color: "#28a745",
    icon: "fa-circle-check"
  },
  PAYROLL_REJECTED: {
    key: "payroll_rejected",
    label: "غير مطابق بمصلحة الرواتب",
    step: 3,
    badgeClass: "badge-rejected",
    color: "#dc3545",
    icon: "fa-circle-xmark"
  }
};

// دالة جلب كائن الحالة
function getStatusInfo(statusKey) {
  for (const key in WORKFLOW_STATUSES) {
    if (WORKFLOW_STATUSES[key].key === statusKey) {
      return WORKFLOW_STATUSES[key];
    }
  }
  return {
    key: statusKey || "pending_director",
    label: statusKey || "قيد الدراسة بالمؤسسة",
    step: 1,
    badgeClass: "badge-draft",
    color: "#6c757d",
    icon: "fa-school"
  };
}

// دالة توليد وسم الحالة (Badge HTML)
function getStatusBadge(statusKey) {
  const info = getStatusInfo(statusKey);
  return `<span class="badge ${info.badgeClass}"><i class="fas ${info.icon}"></i> ${info.label}</span>`;
}

// ============================================================
// منطق الصلاحيات والقفل / الفتح (Permission & Freezing Guards)
// ============================================================

// هل يحق للمدير التعديل؟
function canDirectorEdit(record) {
  if (!record) return false;
  // 1. إذا سمح رئيس المكتب أو مصلحة الرواتب صراحة بالتعديل
  if (record.allow_director_edit === true) return true;
  // 2. إذا كان الملف معاداً للمؤسسة بسبب عدم المطابقة
  if (record.workflow_status === "returned_to_director") return true;
  // 3. إذا كان لا يزال في مرحلة التحضير بالمؤسسة ولم يستلم في مكتب الطور بعد
  if (!record.workflow_status || record.workflow_status === "pending_director") return true;
  // في كافة الحالات الأخرى (تم استلامه بالمكتب، محال للرواتب، معتمد) -> مجمد
  return false;
}

// هل يحق للمدير الحذف؟
function canDirectorDelete(record) {
  if (!record) return false;
  if (record.allow_director_delete === true) return true;
  if (record.allow_director_edit === true && record.workflow_status === "returned_to_director") return true;
  if (!record.workflow_status || record.workflow_status === "pending_director") return true;
  return false;
}

// هل يحق لرئيس مكتب الطور اتخاذ قرار / تعديل؟
function canOfficeManage(record, officeType) {
  if (!record) return false;
  // مصلحة الرواتب لها صلاحية كاملة دائماً
  if (officeType === "payroll") return true;
  // إذا وصل الملف لمصلحة الرواتب أو اعتمد نهائياً، يتجمد التعديل لمكتب الطور إلا بإذن المصلحة
  if (record.workflow_status === "payroll_approved") return false;
  if ((record.workflow_status === "submitted_to_payroll" || record.workflow_status === "office_approved") && record.allow_office_edit !== true) {
    return false;
  }
  return true;
}

// ============================================================
// دالة رسم الستبر المرئي التفاعلي (Interactive Visual Stepper)
// ============================================================
function renderWorkflowStepper(currentStatusKey, rejectionReason = "") {
  const isApprovedFinal = currentStatusKey === "payroll_approved";
  const isSubmittedToPayroll = currentStatusKey === "submitted_to_payroll" || isApprovedFinal;
  const isOfficeApproved = currentStatusKey === "office_approved" || isSubmittedToPayroll;
  const isSubmittedToOffice = currentStatusKey === "submitted_to_office" || isOfficeApproved;
  const isOfficeRejected = currentStatusKey === "returned_to_director";
  const isPayrollRejected = currentStatusKey === "payroll_rejected";

  let warningBox = "";
  if ((isOfficeRejected || isPayrollRejected) && rejectionReason) {
    warningBox = `
      <div style="background: #fff5f5; border: 2px solid #feb2b2; color: #c53030; padding: 12px 16px; border-radius: 10px; margin: 15px 0; text-align: right;">
        <div style="font-weight: 800; font-size: 14px; margin-bottom: 4px;">
          <i class="fas fa-triangle-exclamation"></i> سبب عدم المطابقة / طلب التعديل:
        </div>
        <div style="font-size: 13px; font-weight: 600; line-height: 1.6;">${rejectionReason}</div>
      </div>
    `;
  }

  // حساب نسبة تقدم خط المسار
  let progressWidth = "0%";
  if (isSubmittedToOffice) progressWidth = "33%";
  if (isOfficeApproved) progressWidth = "66%";
  if (isApprovedFinal) progressWidth = "100%";

  return `
    <div style="margin: 20px 0;">
      <div class="stepper-container">
        <div class="stepper-line"></div>
        <div class="stepper-progress" style="width: ${progressWidth};"></div>

        <!-- الخطوة 1: المؤسسة التربوية -->
        <div class="step-node ${isSubmittedToOffice || isOfficeApproved || isApprovedFinal ? 'completed' : (isOfficeRejected ? 'rejected' : 'current')}">
          <div class="step-icon-circle">
            <i class="fas ${isSubmittedToOffice ? 'fa-check' : (isOfficeRejected ? 'fa-triangle-exclamation' : 'fa-school')}"></i>
          </div>
          <div class="step-label">مدير المؤسسة</div>
          <div class="step-status-sub">${isSubmittedToOffice ? 'تم إعداد وإرسال الملف' : (isOfficeRejected ? 'معاد للتعديل' : 'قيد التحضير بالمؤسسة')}</div>
        </div>

        <!-- الخطوة 2: مكتب الطور بالمديرية -->
        <div class="step-node ${isOfficeApproved || isApprovedFinal ? 'completed' : (isOfficeRejected ? 'rejected' : (isSubmittedToOffice ? 'current' : ''))}">
          <div class="step-icon-circle">
            <i class="fas ${isOfficeApproved || isApprovedFinal ? 'fa-check' : (isOfficeRejected ? 'fa-xmark' : 'fa-building-columns')}"></i>
          </div>
          <div class="step-label">مكتب الطور بالمديرية</div>
          <div class="step-status-sub">${isOfficeApproved || isApprovedFinal ? 'مطابق ومحال للرواتب' : (isOfficeRejected ? 'غير مطابق (معاد)' : (isSubmittedToOffice ? 'مستلم قيد الدراسة' : 'في الانتظار'))}</div>
        </div>

        <!-- الخطوة 3: مصلحة الرواتب -->
        <div class="step-node ${isApprovedFinal ? 'completed' : (isPayrollRejected ? 'rejected' : (isOfficeApproved || isSubmittedToPayroll ? 'current' : ''))}">
          <div class="step-icon-circle">
            <i class="fas ${isApprovedFinal ? 'fa-check-double' : (isPayrollRejected ? 'fa-xmark' : 'fa-coins')}"></i>
          </div>
          <div class="step-label">مصلحة الرواتب</div>
          <div class="step-status-sub">${isApprovedFinal ? 'معتمد نهائياً للصرف' : (isPayrollRejected ? 'غير مطابق بالرواتب' : (isSubmittedToPayroll ? 'مستلم قيد التدقيق' : 'في الانتظار'))}</div>
        </div>
      </div>
      ${warningBox}
    </div>
  `;
}

// ============================================================
// دوال تحديث الحالة وإدارة الصلاحيات وسجل التدقيق
// ============================================================

// دالة تغيير حالة الملف وحفظ سجل التدقيق في Firestore
async function updateFileStatus(registrationId, newStatusKey, actorName, actorRole, note = "", extraFields = {}) {
  if (!window.db) throw new Error("قاعدة البيانات غير متصلة");

  const timestamp = new Date().toISOString();
  const event = {
    timestamp,
    actorName,
    actorRole,
    status: newStatusKey,
    note
  };

  const docRef = window.db.collection("contract_registrations").doc(registrationId);
  const updateData = {
    workflow_status: newStatusKey,
    rejection_reason: (newStatusKey.includes("reject") || newStatusKey.includes("returned")) ? note : "",
    last_updated: timestamp,
    workflow_history: firebase.firestore.FieldValue.arrayUnion(event),
    ...extraFields
  };

  await docRef.update(updateData);
  return event;
}

// استلام الملف الفعلي عبر مسح الباركود أو رمز QR وتجميد التعديل
async function receiveFileByScan(identifier, scannerUser, scannerRole, officeType) {
  if (!window.db) throw new Error("قاعدة البيانات غير متصلة");
  const cleanId = String(identifier || "").trim();
  if (!cleanId) throw new Error("رمز الاستمارة أو رقم الحساب غير صحيح");

  // استخراج CCP / معرف الوثيقة إذا كان من الباركود أو الـ QR
  let searchCcp = cleanId.replace(/\D/g, "");
  let searchDocId = cleanId;

  if (cleanId.includes("CCP:")) {
    const parts = cleanId.split("|");
    for (const part of parts) {
      if (part.startsWith("CCP:")) searchCcp = part.replace("CCP:", "").trim();
      if (part.startsWith("ID:")) searchDocId = part.replace("ID:", "").trim();
    }
  }

  let recordDoc = null;

  // 1. بحث بالمعرف المباشر
  if (searchDocId) {
    try {
      const docDirect = await window.db.collection("contract_registrations").doc(searchDocId).get();
      if (docDirect.exists) recordDoc = docDirect;
    } catch(e) {}
  }

  // 2. بحث برقم الحساب CCP
  if (!recordDoc && searchCcp) {
    const qSnap = await window.db.collection("contract_registrations").where("ccp", "==", searchCcp).limit(1).get();
    if (!qSnap.empty) {
      recordDoc = qSnap.docs[0];
    }
  }

  if (!recordDoc) {
    return { success: false, message: `لم يتم العثور على أي ملف مسجل برقم أو رمز (${cleanId}). تأكد من تسجيله أولاً بالمؤسسة.` };
  }

  const data = recordDoc.data();
  const docId = recordDoc.id;
  const isPayroll = officeType === "payroll";
  const targetStatus = isPayroll ? "submitted_to_payroll" : "submitted_to_office";
  const officeName = isPayroll ? "مصلحة الرواتب" : "مكتب التعليم";

  const event = {
    timestamp: new Date().toISOString(),
    actorName: scannerUser,
    actorRole: scannerRole,
    status: targetStatus,
    note: `تم استلام الملف الورقي بنجاح عبر مسح الرمز وتجميد التعديل والحذف للمؤسسة.`
  };

  const updates = {
    workflow_status: targetStatus,
    last_updated: event.timestamp,
    workflow_history: firebase.firestore.FieldValue.arrayUnion(event),
    allow_director_edit: false, // تجميد زر التعديل والحذف في صفحة المدير
    allow_director_delete: false
  };

  if (isPayroll) {
    updates.received_by_payroll = { user: scannerUser, time: event.timestamp };
  } else {
    updates.received_by_office = { user: scannerUser, time: event.timestamp };
  }

  await window.db.collection("contract_registrations").doc(docId).update(updates);

  return {
    success: true,
    docId,
    data: { ...data, ...updates },
    message: `تم استلام الملف رسمياً بمستوى ${officeName} وتجميد زر التعديل والحذف لدى المؤسسة بنجاح.`
  };
}

// دالة تفعيل/تعطيل صلاحية التعديل للمدير من قبل رئيس المكتب أو مصلحة الرواتب
async function setDirectorEditPermission(docId, allow, actorName, actorRole) {
  if (!window.db) throw new Error("قاعدة البيانات غير متصلة");
  const timestamp = new Date().toISOString();
  await window.db.collection("contract_registrations").doc(docId).update({
    allow_director_edit: Boolean(allow),
    allow_director_delete: Boolean(allow),
    last_updated: timestamp,
    workflow_history: firebase.firestore.FieldValue.arrayUnion({
      timestamp,
      actorName,
      actorRole,
      status: `director_edit_${allow ? 'unlocked' : 'locked'}`,
      note: allow ? `قام ${actorName} (${actorRole}) بفتح إمكانية التعديل والحذف لمدير المؤسسة.` 
                  : `قام ${actorName} (${actorRole}) بقفل وتجميد التعديل والحذف على مدير المؤسسة.`
    })
  });
  return true;
}

// دالة تفعيل/تعطيل صلاحية التعديل لرئيس المكتب من قبل مصلحة الرواتب
async function setOfficeEditPermission(docId, allow, actorName, actorRole) {
  if (!window.db) throw new Error("قاعدة البيانات غير متصلة");
  const timestamp = new Date().toISOString();
  await window.db.collection("contract_registrations").doc(docId).update({
    allow_office_edit: Boolean(allow),
    last_updated: timestamp,
    workflow_history: firebase.firestore.FieldValue.arrayUnion({
      timestamp,
      actorName,
      actorRole,
      status: `office_edit_${allow ? 'unlocked' : 'locked'}`,
      note: allow ? `قامت مصلحة الرواتب (${actorName}) بالسماح لرئيس مكتب الطور بإعادة دراسة وتعديل الملف.` 
                  : `قامت مصلحة الرواتب (${actorName}) بقفل التعديل عن مكتب الطور.`
    })
  });
  return true;
}
