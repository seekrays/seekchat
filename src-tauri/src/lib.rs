mod database;
mod mcp;

use database::*;
use mcp::*;
use tauri::AppHandle;
use tauri::Manager;

// 已彻底移除 TauriSqliteDb/TauriSql 相关 trait 和实现

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 定义数据库迁移
    let migrations = vec![tauri_plugin_sql::Migration {
        version: 1,
        description: "create_initial_tables",
        sql: r#"
            CREATE TABLE IF NOT EXISTS chat_session (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                metadata TEXT,
                updatedAt INTEGER NOT NULL,
                createdAt INTEGER NOT NULL
            );
            
            CREATE TABLE IF NOT EXISTS chat_message (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sessionId INTEGER NOT NULL,
                role TEXT NOT NULL,
                providerId INTEGER NOT NULL,
                modelId INTEGER NOT NULL,
                content TEXT NOT NULL,
                status TEXT,
                updatedAt INTEGER NOT NULL,
                createdAt INTEGER NOT NULL,
                FOREIGN KEY (sessionId) REFERENCES chat_session(id) ON DELETE CASCADE
            );
            
            CREATE TABLE IF NOT EXISTS mcp_servers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                url TEXT NOT NULL,
                type TEXT NOT NULL,
                tools TEXT,
                description TEXT,
                active BOOLEAN NOT NULL DEFAULT 0,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            );
            
            CREATE TABLE IF NOT EXISTS models (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                provider TEXT NOT NULL,
                model_type TEXT NOT NULL,
                config TEXT NOT NULL,
                enabled BOOLEAN NOT NULL DEFAULT 0,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            );
            "#,
        kind: tauri_plugin_sql::MigrationKind::Up,
    }];

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:seekchat.db", migrations)
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            // 数据库操作
            get_sessions,
            create_session,
            delete_session,
            get_messages,
            create_message,
            // MCP服务
            start_mcp_server,
            stop_mcp_server,
            get_active_mcp_servers,
            send_message_to_mcp
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
