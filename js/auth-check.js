// ============================================================
// نظام حماية الجلسات والمصادقة الموحد (Unified Auth & Session Guard)
// ============================================================

const AuthGuard = {
  // 1. جلسة المستخدم العادي المسجل (User Session)
  getUserSession() {
    try {
      const data = sessionStorage.getItem("app_user_session");
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  setUserSession(userData) {
    sessionStorage.setItem("app_user_session", JSON.stringify(userData));
    // مزامنة مع director_account إن كان المدير هو المستخدم
    if (userData.role === "director" || userData.school_name) {
      sessionStorage.setItem("director_account", JSON.stringify({
        ccp: userData.ccp,
        directorName: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.username,
        level: userData.level || "",
        daaira: userData.daaira || "",
        baladiya: userData.baladiya || "",
        schoolName: userData.school_name || "",
        phone: userData.phone || ""
      }));
    }
  },

  requireUser(redirectUrl = "login.html") {
    const session = this.getUserSession() || this.getDirectorSession() || this.getAdminSession();
    if (!session) {
      window.location.replace(redirectUrl);
      return false;
    }
    return session;
  },

  // 2. جلسة مدير المؤسسة التعليمية
  getDirectorSession() {
    try {
      const data = sessionStorage.getItem("director_account");
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  setDirectorSession(directorData) {
    sessionStorage.setItem("director_account", JSON.stringify(directorData));
  },

  requireDirector(redirectUrl = "../contract-portal/login-director.html") {
    // يمكن لحساب المدير أو المشرف العام الوصول
    const admin = this.getAdminSession();
    if (admin) return { directorName: "المشرف العام", schoolName: "كافة المؤسسات", is_admin: true };

    const session = this.getDirectorSession();
    if (!session || !session.ccp) {
      Swal.fire({
        icon: "warning",
        title: "غير مصرح",
        text: "يرجى تسجيل الدخول بحساب مدير المؤسسة أولاً للمتابعة.",
        confirmButtonText: "تسجيل الدخول",
        confirmButtonColor: "#2575fc",
        allowOutsideClick: false
      }).then(() => {
        window.location.replace(redirectUrl);
      });
      return false;
    }
    return session;
  },

  // 3. جلسة رئيس المكتب أو مصلحة الرواتب
  getOfficeSession() {
    try {
      const data = sessionStorage.getItem("office_account");
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  setOfficeSession(officeData) {
    sessionStorage.setItem("office_account", JSON.stringify(officeData));
  },

  requireOffice(redirectUrl = "../office-portal/login.html") {
    const admin = this.getAdminSession();
    if (admin) return { roleTitle: "المشرف العام", filterLevel: "all", is_admin: true };

    const session = this.getOfficeSession();
    if (!session || !session.officeType) {
      Swal.fire({
        icon: "warning",
        title: "غير مصرح",
        text: "يرجى تسجيل الدخول بحساب رئيس المكتب أو مصلحة الرواتب.",
        confirmButtonText: "تسجيل الدخول",
        confirmButtonColor: "#2575fc",
        allowOutsideClick: false
      }).then(() => {
        window.location.replace(redirectUrl);
      });
      return false;
    }
    return session;
  },

  // 4. جلسة لوحة التحكم المركزية (Admin / Super Admin)
  getAdminSession() {
    return sessionStorage.getItem("admin_logged_in") === "true";
  },

  setAdminSession(isAdmin = true, adminDetails = null) {
    if (isAdmin) {
      sessionStorage.setItem("admin_logged_in", "true");
      if (adminDetails) {
        sessionStorage.setItem("admin_details", JSON.stringify(adminDetails));
      }
    } else {
      sessionStorage.removeItem("admin_logged_in");
      sessionStorage.removeItem("admin_details");
    }
  },

  requireAdmin(redirectUrl = "admin-login.html") {
    if (!this.getAdminSession()) {
      window.location.replace(redirectUrl);
      return false;
    }
    return true;
  },

  // 5. تسجيل الخروج الشامل
  logout(redirectUrl = "index.html") {
    sessionStorage.clear();
    window.location.replace(redirectUrl);
  }
};

window.AuthGuard = AuthGuard;
