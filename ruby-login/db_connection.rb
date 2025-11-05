require "pg"

def db_connection
    PG.connect(
        host: "localhost",
        dbname: "eramus",
        user: "postgres",
        password: "root"
    )
end