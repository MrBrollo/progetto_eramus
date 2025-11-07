require "pg"
require "json"
require "webrick"
require "bcrypt"
require_relative "db_connection"
require_relative "user.rb"

PORT = 4567

log_file = File.open("webrick.log", "a+")
logger = WEBrick::Log.new(log_file)
access_log = [[log_file, WEBrick::AccessLog::COMMON_LOG_FORMAT]]

server = WEBrick::HTTPServer.new(
    Port: 4567,
    Logger: logger,
    AccessLog: access_log
)

# Endpoint di LOGIN
server.mount_proc "/users/login" do |req, res|
    res["Content-Type"] = "application/json"
    res["Access-Control-Allow-Origin"] = "*"
    res["Access-Control-Allow-Methods"] = "POST, OPTIONS"
    res["Access-Control-Allow-Headers"] = "Content-Type"

    if req.request_method == "OPTIONS"
        res.status = 200
        next
    end

    begin
        
        user = User.from_json(JSON.parse(req.body))

        if user.username.nil? || user.password.nil? || user.username.strip.empty? || user.password.strip.empty?
            res.status = 400
            res.body = { success: false, message: "Inserisci tutti i campi obbligatori" }
            next
        end

        conn = db_connection

        result = conn.exec_params("SELECT * FROM utente WHERE username = $1 LIMIT 1", [user.username])

        if result.ntuples > 0
            utente = User.from_json(result[0])
            hashed_password = utente.password

            if BCrypt::Password.new(hashed_password) == user.password
                res.status = 200
                res.body = {
                    success: true,
                    message: "Accesso effettuato con successo!",
                    utente: {
                        nome: utente.nome,
                        cognome: utente.cognome,
                        username: utente.username
                    }
                }.to_json
            else
                res.status = 401
                res.body = { success: false, message: "Credenziali non valide" }.to_json
            end
        else
            res.status = 401
            res.body = { success: false, message: "Utente non trovato" }.to_json
        end

    rescue JSON::ParseError
        res.status = 400
        res.body = { success: false, message: "Formato JSON non valido" }.to_json
    rescue PG::Error => e
        res.status = 400
        res.body = { success: false, message: "Errore database: #{e.message}" }.to_json
    ensure
        conn.close if conn
    end
end

#ENDPOINT GET degli utenti

server.mount_proc "/users/get" do |req, res|
    res["Content-Type"] = "application/json"
    res["Access-Control-Allow-Origin"] = "*"
    res["Access-Control-Allow-Methods"] = "GET, OPTIONS"
    res["Access-Control-Allow-Headers"] = "Content-Type"

    if req.request_method == "OPTIONS"
        res.status = 200
        next
    end

    begin
        conn = db_connection
        result = conn.exec_params("SELECT * FROM utente ORDER BY id ASC")

        utenti = result.map do |r| 
            {
                id: r["id"],
                username: r["username"],
                password: r["password"],
                nome: r["nome"],
                cognome: r["cognome"],
                data_nascita: r["data_nascita"]
            }
    end

    res.status = 200
    res.body = { success: true, utenti: utenti }.to_json

    rescue PG::Error => e
        res.status = 400
        res.body = { success: false, message: "Errore database: #{e.message}" }.to_json
    ensure
        conn.close if conn
    end
end

#Endpoint di REGISTRAZIONE
server.mount_proc "/users/register" do |req, res|
    res["Content-Type"] = "application/json"
    res["Access-Control-Allow-Origin"] = "*"
    res["Access-Control-Allow-Methods"] = "POST, OPTIONS"
    res["Access-Control-Allow-Headers"] = "Content-Type"

    if req.request_method == "OPTIONS"
        res.status = 200
        next
    end

    begin
        user = User.from_json(JSON.parse(req.body))

        if user.username.nil? || user.password.nil? || user.nome.nil? || user.cognome.nil? || user.username.strip.empty? || user.password.strip.empty?
            res.status = 400
            res.body = { success: false, message: "Inserisci tutti i campi obbligatori" }.to_json
            next
        end

        conn = db_connection

        check = conn.exec_params("SELECT * FROM utente WHERE username = $1", [user.username])
        if check.ntuples > 0
            res.status = 409
            res.body = { success: false, message: "Username già esistente" }.to_json
            next
        end

        hashed_password = BCrypt::Password.create(user.password)

        conn.exec_params(
            "INSERT INTO utente (username, password, nome, cognome, data_nascita) VALUES ($1, $2, $3, $4, $5)", [user.username, user.password, user.nome, user.cognome, user.data_nascita]
        )

        res.status = 201
        res.body = {success: true, message: "Utente registrato con successo" }.to_json

    rescue JSON::ParseError
        res.status = 400
        res.body = { success: false, message: "Formato JSON non valido" }.to_json

    rescue PG::ParseError
        res.status = 400
        res.body = { success: false, message: "Errore database #{e.message}" }.to_json
    ensure
        conn.close if conn
    end
end

trap("INT") { server.shutdown }

puts "Server Ruby in esecuzione su http://localhost:#{PORT}"
server.start