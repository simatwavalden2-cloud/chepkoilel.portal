var box = document.getElementById("profile");

function row(label, value) {
  var p = document.createElement("p");
  var s = document.createElement("strong");
  s.textContent = label + ": ";
  p.appendChild(s);
  p.appendChild(document.createTextNode(value));
  return p;
}

api("/api/auth/me")
  .then(function (data) {
    box.textContent = "";
    box.appendChild(row("Name", data.user.fullName));
    box.appendChild(row("Student ID", data.user.studentId));
    box.appendChild(row("Email", data.user.email));
  })
  .catch(function () { location.replace("index.html"); });

document.getElementById("logout").addEventListener("click", async function () {
  await api("/api/auth/logout", {}).catch(function () {});
  location.href = "index.html";
});
