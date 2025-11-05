require "pg"
require "json"
require "webrick"
require_relative "db_connection"
$stderr.sync = true

PORT = 4567

log_file = File.open("webrick.log", "a+")
logger = WEBrick::Log.new(log_file)
access_log = [[log_file, WEBrick::AccessLog::COMMON_LOG_FORMAT]]

server = WEBrick::HTTPServer.new(
    Port: 4567,
    Logger: logger,
    AccessLog: access_log
)

server.mount_proc("/") do |req, res|
    res["Content-Type"] = "text/html"
    res.body = "<h1>Server Attivo</h1><p>Usa POST /login</p>"
end

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
            res.body = { success: false, message: "Inserisci tutti i campi obbligatori" }.to_json
            next
        end

        conn = db_connection

        result = conn.exec_params("SELECT * FROM utente WHERE username = $1 AND password = $2 LIMIT 1", [username, password])

        if result.ntuples > 0
            utente = result[0]
            res.status = 200
            res.body = {
                success: true,
                message: "Accesso effettuato con successo!",
                utente: {
                    nome: utente["nome"],
                    cognome: utente["cognome"],
                    username: utente["username"]
                }
            }.to_json
        else
            res.status = 401
            res.body = { success:false, message: "Credenziali non valide" }.to_json
        end

    rescue JSON::ParseError
        res.status = 400
        res.body = { success: false, message: "Formato JSON non valido" }.to_json
    rescue PG::Error => e
        res.status = 400
        res.body = { success: false, message:"Errore database: #{e.message}" }.to_json
    ensure
        conn.close if conn
    end
end

trap("INT") { server.shutdown }

puts "Server Ruby in esecuzione su http://localhost:#{PORT}"
server.start