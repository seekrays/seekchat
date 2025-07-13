use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct ChatSession {
    pub id: Option<i64>,
    pub name: String,
    pub metadata: Option<String>,
    pub updated_at: i64,
    pub created_at: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChatMessage {
    pub id: Option<i64>,
    pub session_id: i64,
    pub role: String,
    pub provider_id: i64,
    pub model_id: i64,
    pub content: String,
    pub status: Option<String>,
    pub updated_at: i64,
    pub created_at: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct McpServer {
    pub id: Option<i64>,
    pub name: String,
    pub url: String,
    pub server_type: String,
    pub active: i64,
    pub tools: Option<String>,
    pub description: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Model {
    pub id: Option<i64>,
    pub name: String,
    pub provider: String,
    pub model_type: String,
    pub config: String,
    pub enabled: i64,
    pub created_at: i64,
    pub updated_at: i64,
}

// 数据库操作全部交由前端 JS/TS 通过 @tauri-apps/plugin-sql 实现
// 这里只保留类型定义和空的 tauri command

#[tauri::command]
pub async fn get_sessions() -> Result<Vec<ChatSession>, String> {
    // todo: 由前端实现
    Ok(vec![])
}

#[tauri::command]
pub async fn create_session(_name: String) -> Result<ChatSession, String> {
    // todo: 由前端实现
    Err("Not implemented in Rust, use frontend plugin-sql".to_string())
}

#[tauri::command]
pub async fn delete_session(_id: i64) -> Result<(), String> {
    // todo: 由前端实现
    Err("Not implemented in Rust, use frontend plugin-sql".to_string())
}

#[tauri::command]
pub async fn get_messages(_session_id: i64) -> Result<Vec<ChatMessage>, String> {
    // todo: 由前端实现
    Ok(vec![])
}

#[tauri::command]
pub async fn create_message(_message: ChatMessage) -> Result<ChatMessage, String> {
    // todo: 由前端实现
    Err("Not implemented in Rust, use frontend plugin-sql".to_string())
}
