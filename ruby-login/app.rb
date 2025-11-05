require "pg"
require "json"
require "webrick"
require "bcrypt"
require_relative "db_connection"

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
server.mount_proc "/login" do |req, res|
    res["Content-Type"] = "application/json"
    res["Access-Control-Allow-Origin"] = "*"
    res["Access-Control-Allow-Methods"] = "POST, OPTIONS"
    res["Access-Control-Allow-Headers"] = "Content-Type"

    if req.request_method == "OPTIONS"
        res.status = 200
        next
    end

    begin
        data = JSON.parse(req.body)

        username = data["username"]
        password = data["password"]

        if username.nil? || password.nil? || username.strip.empty? || password.strip.empty?
            res.status = 400
            res.body = { success: false, message: "Inserisci tutti i campi obbligatori" }
            next
        end

        conn = db_connection

        result = conn.exec_params("SELECT * FROM utente WHERE username = $1 LIMIT 1", [username])

        if result.ntuples > 0
            utente = result[0]
            hashed_password = utente["password"]

            if BCrypt::Password.new(hashed_password) == password
                res.status = 200
                res.body = {
                    success: true,
                    message: "Accesso effettuato con successo!",
                    utente: {
                        nome: utente["nome"],
                        cognome: utente["cognome"]
                        username: utente["username"]
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
    rescue PG:Error => e
        res.status = 400
        res.body = { success: false, message: "Errore database: #{e.message}" }.to_json
    ensure
        conn.close if conn
    end
end

#Endpoint di REGISTRAZIONE
server.mount_proc "/register" do |req, res|
    res["Content-Type"] = "application/json"
    res["Access-Control-Allow-Origin"] = "*"
    res["Access-Control-Allow-Methods"] = "POST, OPTIONS"
    res["Access-Control-Allow-Headers"] = "Content-Type"

    if req.request_method == "OPTIONS"
        res.status = 200
        next
    end

    begin
        data = JSON.parse(req.body)

        username = data["username"]
        password = data["password"]
        nome = data["nome"]
        cognome = data["cognome"]

        if username.nil? || password.nil? || nome.nil? || cognome.nil? || username.strip.empty? || password.strip.empty?
            res.status = 400
            res.body = { success: false, message: "Inserisci tutti i campi obbligatori" }.to_json
            next
        end

        conn = db_connection

        check = conn.exec_params("SELECT * FROM utente WHERE username = $1", [username])
        if check.ntuples > 0
            res.status = 409
            res.body = { success: false, message: "Username già esistente" }.to_json
            next
        end

        hashed_password = BCrypt::Password.create(password)

        conn.exec_params(
            "INSERT INTO utente (username, password, nome, cognome) VALUES ($1, $2, $3, $4)", [username, password, nome, cognome]
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