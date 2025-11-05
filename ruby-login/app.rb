require "webrick"
require_relative "db_connection"
require "json"

PORT = 4567

server = WEbrick::HTTPServer.new(Port: PORT)

trap("INT") { server.shutdown }

server.mount_proc "/login" do |req, res|
    res["Content-Type"] = "application/json"

    if req.request_method == "POST"
        begin

        data = JSON.parse(req.body)
        username = data["username"]
        password = data["password"]

        conn = db_connection
        result = conn.exec_params("SELECT * FROM utente WHERE username = $1 AND password = $2", [username, password])

        if result.ntuples > 0
            utente = result[0]
            res.status = 200
            res.body = {
                message: "Accesso effettuato con successo",
                nome: utente["nome"],
                cognome: utente["cognome"]
        }.to_json
        else
        res.status = 401
        res.body = {
            error: "Credenziali non valide"
        }.to_json
        end

        conn.close
    rescue => e
        res.status = 500
        res.body = {
        error: "Errore del server: #{e.message}"
    }.to_json
    end
    else
    res.status = 405
    res.body = {
        error: "Metodo non consentito"
    }.to_json
    end
end

puts "Server Ruby attivo su http://localhost:#{PORT}"
server.start