async function api(path, body, method) {
  const res = await fetch(path, {
    method: method || (body ? "POST" : "GET"),
    headers: body ? { "Content-Type": "application/json" } : undefined,
    credentials: "same-origin",
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(function () { return {}; });
  if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}

function showMessage(el, text, isError) {
  el.textContent = text;
  el.className = "message" + (isError ? " error" : "");
}
