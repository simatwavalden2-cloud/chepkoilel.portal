var msg = document.getElementById("msg");
var token = new URLSearchParams(location.search).get("token");
var requestForm = document.getElementById("requestForm");
var resetForm = document.getElementById("resetForm");

if (token) {
  requestForm.style.display = "none";
  resetForm.style.display = "block";
}

requestForm.addEventListener("submit", async function (e) {
  e.preventDefault();
  var btn = document.getElementById("requestBtn");
  btn.disabled = true;
  try {
    var data = await api("/api/auth/forgot", { identifier: document.getElementById("identifier").value });
    showMessage(msg, data.message, false);
  } catch (err) {
    showMessage(msg, err.message, true);
  }
  btn.disabled = false;
});

resetForm.addEventListener("submit", async function (e) {
  e.preventDefault();
  var btn = document.getElementById("resetBtn");
  btn.disabled = true;
  try {
    var data = await api("/api/auth/reset", { token: token, password: document.getElementById("newPass").value });
    showMessage(msg, data.message, false);
    setTimeout(function () { location.href = "index.html"; }, 1800);
  } catch (err) {
    showMessage(msg, err.message, true);
    btn.disabled = false;
  }
});
