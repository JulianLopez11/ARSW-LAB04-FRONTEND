const API = import.meta.env.VITE_API_BASE;

export async function getBlueprintsByAuthor(author) {
  const res = await fetch(`${API}/api/blueprints?author=${author}`);
  return res.json();
}

export async function getBlueprint(author, name) {
  const res = await fetch(`${API}/api/v1/blueprints/${author}/${name}`);
  return res.json();
}

export async function createBlueprint(data) {
  const res = await fetch(`${API}/api/v1/blueprints`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function updateBlueprint(author, name, data) {
  const res = await fetch(`${API}/api/v1/blueprints/${author}/${name}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function deleteBlueprint(author, name) {
  await fetch(`${API}/api/v1/blueprints/${author}/${name}`, {
    method: "DELETE"
  });
}