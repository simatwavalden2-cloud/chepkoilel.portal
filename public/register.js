var form = document.getElementById("regForm");
var msg = document.getElementById("msg");
var btn = document.getElementById("submitBtn");

form.addEventListener("submit", async function (e) {
  e.preventDefault();
  btn.disabled = true;
  showMessage(msg, "", false);
  try {
    await api("/api/auth/register", {
      fullName: document.getElementById("fullName").value,
      email: document.getElementById("email").value,
      studentId: document.getElementById("studentId").value,
      password: document.getElementById("pass").value,
    });
    location.href = "dashboard.html";
  } catch (err) {
    showMessage(msg, err.message, true);
    btn.disabled = false;
  }
});
