// Already signed in? Go straight to the dashboard.
api("/api/auth/me").then(function () { location.replace("dashboard.html"); }).catch(function () {});

var form = document.getElementById("loginForm");
var msg = document.getElementById("msg");
var btn = document.getElementById("submitBtn");

form.addEventListener("submit", async function (e) {
  e.preventDefault();
  btn.disabled = true;
  showMessage(msg, "", false);
  try {
    await api("/api/auth/login", {
      identifier: document.getElementById("user").value,
      password: document.getElementById("pass").value,
      remember: document.getElementById("remember").checked,
    });
    location.href = "dashboard.html";
  } catch (err) {
    showMessage(msg, err.message, true);
    btn.disabled = false;
  }
});
