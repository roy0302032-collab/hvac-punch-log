// ========================================
// HVAC 缺失追蹤系統
// Supabase 連線設定
// ========================================

const SUPABASE_URL =
    "https://jojrtvkjhuxumddsutpw.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_LJ8UXqRcdNJRucSpHRnEdg_DvYD6nY3";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);