require "pg"
require "dotenv/load" if File.exist?(".env")

def db_connection
    PG.connect(
        host: ENV["DB_HOST"] || "localhost",
        dbname: ENV["DB_NAME"] || "utenze",
        user: ENV["DB_USER"] || "postgres",
        password: ENV["DB_PASSWORD"] || "root"
    )
end