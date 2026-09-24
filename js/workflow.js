// ============================================================
// نظام مسار وتتبع وضعية الملف (Workflow Tracking System)
// إدارة دورة حياة الملف وسجل التدقيق والستبر المرئي
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
    label: "محال لمكتب الطور بالمديرية",
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
    label: "غير مطابق / وثائق ناقصة (معاد للمؤسسة)",
    step: 1,
    badgeClass: "badge-rejected",
    color: "#dc3545",
    icon: "fa-triangle-exclamation"
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

// دالة رسم الستبر المرئي التفاعلي (Interactive Visual Stepper)
function renderWorkflowStepper(currentStatusKey, rejectionReason = "") {
  const isApprovedFinal = currentStatusKey === "payroll_approved";
  const isOfficeApproved = currentStatusKey === "office_approved" || isApprovedFinal;
  const isSubmittedToOffice = currentStatusKey === "submitted_to_office" || isOfficeApproved;
  const isOfficeRejected = currentStatusKey === "returned_to_director";
  const isPayrollRejected = currentStatusKey === "payroll_rejected";

  let warningBox = "";
  if ((isOfficeRejected || isPayrollRejected) && rejectionReason) {
    warningBox = `
      <div style="background: #fff5f5; border: 2px solid #feb2b2; color: #c53030; padding: 12px 16px; border-radius: 10px; margin: 15px 0; text-align: right;">
        <div style="font-weight: 800; font-size: 14px; margin-bottom: 4px;">
          <i class="fas fa-exclamation-triangle"></i> سبب عدم المطابقة / طلب التعديل:
        </div>
        <div style="font-size: 13px; font-weight: 600;">${rejectionReason}</div>
      </div>
    `;
  }

  // حساب نسبة تقدم خط المسار
  let progressWidth = "0%";
  if (isSubmittedToOffice) progressWidth = "50%";
  if (isOfficeApproved) progressWidth = "75%";
  if (isApprovedFinal) progressWidth = "100%";

  return `
    <div style="margin: 20px 0;">
      <div class="stepper-container">
        <div class="stepper-line"></div>
        <div class="stepper-progress" style="width: ${progressWidth};"></div>

        <!-- الخطوة 1: المؤسسة التربوية -->
        <div class="step-node ${isSubmittedToOffice || isOfficeApproved || isApprovedFinal ? 'completed' : (isOfficeRejected ? 'rejected' : 'current')}">
          <div class="step-icon-circle">
            <i class="fas ${isSubmittedToOffice ? 'fa-check' : (isOfficeRejected ? 'fa-exclamation' : 'fa-school')}"></i>
          </div>
          <div class="step-label">مدير المؤسسة</div>
          <div class="step-status-sub">${isSubmittedToOffice ? 'تم إرسال الملف' : (isOfficeRejected ? 'معاد للتعديل' : 'قيد التحضير')}</div>
        </div>

        <!-- الخطوة 2: مكتب الطور بالمديرية -->
        <div class="step-node ${isOfficeApproved || isApprovedFinal ? 'completed' : (isOfficeRejected ? 'rejected' : (isSubmittedToOffice ? 'current' : ''))}">
          <div class="step-icon-circle">
            <i class="fas ${isOfficeApproved || isApprovedFinal ? 'fa-check' : (isOfficeRejected ? 'fa-times' : 'fa-building-columns')}"></i>
          </div>
          <div class="step-label">مكتب الطور بالمديرية</div>
          <div class="step-status-sub">${isOfficeApproved || isApprovedFinal ? 'مطابق ومعتمد' : (isOfficeRejected ? 'غير مطابق' : (isSubmittedToOffice ? 'قيد الدراسة' : 'في الانتظار'))}</div>
        </div>

        <!-- الخطوة 3: مصلحة الرواتب -->
        <div class="step-node ${isApprovedFinal ? 'completed' : (isPayrollRejected ? 'rejected' : (isOfficeApproved ? 'current' : ''))}">
          <div class="step-icon-circle">
            <i class="fas ${isApprovedFinal ? 'fa-check-double' : (isPayrollRejected ? 'fa-times' : 'fa-coins')}"></i>
          </div>
          <div class="step-label">مصلحة الرواتب</div>
          <div class="step-status-sub">${isApprovedFinal ? 'معتمد نهائياً للصرف' : (isPayrollRejected ? 'غير مطابق' : (isOfficeApproved ? 'قيد الفحص النهائي' : 'في الانتظار'))}</div>
        </div>
      </div>
      ${warningBox}
    </div>
  `;
}

// دالة تغيير حالة الملف وحفظ سجل التدقيق في Firestore
async function updateFileStatus(registrationId, newStatusKey, actorName, actorRole, note = "") {
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
  await docRef.update({
    workflow_status: newStatusKey,
    rejection_reason: (newStatusKey.includes("reject") || newStatusKey.includes("returned")) ? note : "",
    last_updated: timestamp,
    workflow_history: firebase.firestore.FieldValue.arrayUnion(event)
  });

  return event;
}
