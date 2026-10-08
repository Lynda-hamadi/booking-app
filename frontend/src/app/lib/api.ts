const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Options = {
  method?: string;
  body?: unknown;
  token?: string | null;
};

export async function apiFetch<T>(path: string, options: Options = {}): Promise<T> {
  const { method = "GET", body, token } = options;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error ?? "Erreur réseau");
  return data as T;
}