require "sinatra"
require "sinatra/cross_origin"
require "pg"
require "bcrypt"
require_relative "db_connection"
require_relative "user"

set :port, 4567
enable :cross_origin

configure do
  enable :cross_origin
  set :bind, "0.0.0.0"
end

before do
  content_type :json
  response.headers["Access-Control-Allow-Origin"] = "*"
  response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
  response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
end

options "*" do
  200
end

post "/users/register" do
  begin
    data = JSON.parse(request.body.read)
    user = User.from_json(data)
    conn = db_connection

    if user.username.to_s.strip.empty? || user.password.to_s.strip.empty?
      status 400
      return { success: false, message: "Campi obbligatori mancanti" }.to_json
    end

    check = conn.exec_params("SELECT 1 FROM utente WHERE username = $1", [user.username])
    if check.ntuples > 0
      status 409
      return { success: false, message: "Username già esistente" }.to_json
    end

    password_regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\d\s:]).{8,}$/
    unless user.password.match?(password_regex)
      status 400
      return {
        sucess: false,
        message: "La password deve contenere almeno 8 caratteri, una lettera maiuscola, una minuscola, un numero e un carattere speciale."
      }.to_json
    end

    hashed_password = BCrypt::Password.create(user.password)
    conn.exec_params(
      "INSERT INTO utente (username, password, nome, cognome, data_nascita)
       VALUES ($1, $2, $3, $4, $5)",
      [user.username, hashed_password, user.nome, user.cognome, user.data_nascita]
    )

    status 201
    { success: true, message: "Utente registrato con successo" }.to_json

  rescue JSON::ParserError
    status 400
    { success: false, message: "Formato JSON non valido" }.to_json
  rescue PG::Error => e
    status 500
    { success: false, message: "Errore database: #{e.message}" }.to_json
  ensure
    conn&.close
  end
end

post "/users/login" do
  begin
    data = JSON.parse(request.body.read)
    user = User.from_json(data)
    conn = db_connection

    result = conn.exec_params("SELECT * FROM utente WHERE username = $1 LIMIT 1", [user.username])

    if result.ntuples > 0 && BCrypt::Password.new(result[0]["password"]) == user.password
      status 200
      {
        success: true,
        message: "Login effettuato",
        utente: {
          nome: result[0]["nome"],
          cognome: result[0]["cognome"],
          username: result[0]["username"]
        }
      }.to_json
    else
      status 401
      { success: false, message: "Credenziali non valide" }.to_json
    end
  rescue
    status 400
    { success: false, message: "Errore durante il login" }.to_json
  ensure
    conn&.close
  end
end

get "/users/get" do
  begin
    conn = db_connection
    result = conn.exec("SELECT id, username, nome, cognome, data_nascita FROM utente ORDER BY id ASC")

    utenti = result.map do |r|
      {
        id: r["id"],
        username: r["username"],
        nome: r["nome"],
        cognome: r["cognome"],
        data_nascita: r["data_nascita"]
      }
    end

    { success: true, utenti: utenti }.to_json
  rescue PG::Error => e
    status 500
    { success: false, message: "Errore database: #{e.message}" }.to_json
  ensure
    conn&.close
  end
end