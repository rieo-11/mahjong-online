// Supabaseのダッシュボードから取得した値に置き換えてください。
// ここに秘密鍵(service_role)は絶対に入れないでください。
window.SUPABASE_URL = "https://YOUR_PROJECT.supabase.co";
window.SUPABASE_PUBLISHABLE_KEY = "YOUR_PUBLISHABLE_KEY";

window.sb = window.supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_PUBLISHABLE_KEY
);
