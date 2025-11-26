require "sinatra"
require "sinatra/cross_origin"
require "pg"
require "bcrypt"
require "jwt"
require "mail"
require "dotenv/load"
require_relative "db_connection"
require_relative "user"
require_relative "prodotto"
require_relative "inventario"

# --- CONFIGURAZIONE SERVER SINATRA ---
set :port, 4567
enable :cross_origin

configure do
  enable :cross_origin
  set :bind, "0.0.0.0"
end

# --- MIDDLEWARE: CONFIGURAZIONE HEADERS CORS ---
before do
  content_type :json
  response.headers["Access-Control-Allow-Origin"] = "*"
  response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
  response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
end

# --- GESTIONE PREFLIGHT REQUEST ---
options "*" do
  200
end

# --- CONFIGURAZIONE JWT ---
# --- In produzione usare sempre variabili d'ambiente ---
SECRET_KEY = ENV["JWT_SECRET"] || "key_casuale"

# --- CONFIGURAZIONE EMAIL SMTP ---
Mail.defaults do
  delivery_method :smtp, {
    address: "smtp.gmail.com",
    port: 587,
    user_name: ENV["SMTP_USERNAME"],
    password: ENV["SMTP_PASSWORD"],
    authentication: "plain",
    enable_starttls_auto: true
  }
end

# --- FUNZIONE DI VERIFICA TOKEN JWT ---
def verify_token(request)
  auth_header = request.env["HTTP_AUTHORIZATION"]
  return nil unless auth_header && auth_header.start_with?("Bearer ")

  token = auth_header.split(" ").last
  begin
    decoded = JWT.decode(token, SECRET_KEY, true, { algorithm: "HS256" })
    return decoded[0]
  rescue JWT::ExpiredSignature, JWT::DecodeError
    nil
  end
end

# --- ENDPOINT: REGISTRAZIONE NUOVO UTENTE ---
post "/users/register" do
  begin
    data = JSON.parse(request.body.read)
    user = User.from_json(data)
    conn = db_connection

    # Validazione campi obbligatori
    if user.username.to_s.strip.empty? || user.password.to_s.strip.empty? || user.email.to_s.empty?
      status 400
      return { success: false, message: "Campi obbligatori mancanti" }.to_json
    end

    # Validazione formato email
    email_regex = /\A[^@\s]+@[^@\s]+\.[^@\s]+\z/
    unless user.email.match?(email_regex)
      status 400
      return { success: false, message: "Email non valida" }.to_json
    end

    # Controllo username univoco
    check = conn.exec_params("SELECT 1 FROM utente WHERE username = $1", [user.username])
    if check.ntuples > 0
      status 409
      return { success: false, message: "Username già esistente" }.to_json
    end

    # Validazione password sicura
    password_regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\d\s:]).{8,}$/
    unless user.password.match?(password_regex)
      status 400
      return {
        success: false,
        message: "La password deve contenere almeno 8 caratteri, una lettera maiuscola, una minuscola, un numero e un carattere speciale."
      }.to_json
    end

    # Hashing della password con BCrypt
    hashed_password = BCrypt::Password.create(user.password)

    # Inserimento nel database
    conn.exec_params(
      "INSERT INTO utente (username, password, nome, cognome, data_nascita, email)
       VALUES ($1, $2, $3, $4, $5, $6)",
      [user.username, hashed_password, user.nome, user.cognome, user.data_nascita, user.email]
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

# --- ENDPOINT: LOGIN UTENTE ---
post "/users/login" do

  begin
    data = JSON.parse(request.body.read)
    user = User.from_json(data)
    conn = db_connection

    # Ricerca utente nel database
    result = conn.exec_params("SELECT * FROM utente WHERE username = $1 LIMIT 1", [user.username])

    # Verifica credenziali
    if result.ntuples > 0 && BCrypt::Password.new(result[0]["password"]) == user.password

      # Creazione JWT Token
      payload = { username: user.username, exp: Time.now.to_i + 3600 }
      token = JWT.encode(payload, SECRET_KEY, "HS256")

      status 200
      {
        success: true,
        message: "Login effettuato con successo",
        token: token,
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

# --- ENDPOINT LISTA UTENTI CON PAGINAZIONE ---
get "/users/get" do

  # Verifica autenticazione
  payload = verify_token(request)
  unless payload
    status 401
    return { success: false, message: "Token mancante o non valido "}.to_json
  end

  begin
    conn = db_connection
    
    # Parametri paginazione
    page = (params["page"] || 1).to_i
    per_page = 10
    offset = (page - 1) * per_page

    # Conteggio totale utenti
    total_result = conn.exec("SELECT COUNT(*) FROM utente")
    total_count = total_result[0]["count"].to_i
    total_pages = (total_count / per_page.to_f).ceil

    # Query paginata
    result = conn.exec_params(
      "SELECT id, username, email, nome, cognome, data_nascita
       FROM utente
       ORDER BY id ASC
       LIMIT $1 OFFSET $2",
      [per_page, offset]
    )

    # Mapping dei risultati
    utenti = result.map do |r|
      {
        id: r["id"],
        username: r["username"],
        email: r["email"],
        nome: r["nome"],
        cognome: r["cognome"],
        data_nascita: r["data_nascita"]
      }
    end

    # Risposta con Metadata paginazione
     {
      success: true,
      page: page,
      per_page: per_page,
      total_pages: total_pages,
      total_items: total_count,
      utenti: utenti
    }.to_json
    
  rescue PG::Error => e
    status 500
    { success: false, message: "Errore database: #{e.message}" }.to_json
  ensure
    conn&.close
  end
end

# --- ENDPOINT: RICHIESTA RESET PASSWORD
post "/users/forgot-password" do
  begin
    data = JSON.parse(request.body.read)
    email = data["email"]

    # Validazione email
    if email.to_s.strip.empty?
      status 400
      return { success: false, message: "Email obbligatoria" }.to_json
    end

    conn = db_connection

    # Ricerca utente per email
    result = conn.exec_params("SELECT id, username FROM utente WHERE email = $1 LIMIT 1", [email])

    if result.ntuples == 0
      status 404
      return{ success: false, message: "Nessun utente registrato con questa email" }.to_json
    end

    user = result[0]

    # Creazione Token per reset
    reset_token = JWT.encode(
      { user_id: user["id"], exp: Time.now.to_i + 3600 },
      SECRET_KEY,
      "HS256"
    )

    # Creazione link reset
    reset_link = "http://localhost:3000/reset-password?token=#{reset_token}"


    # Invio della email
    Mail.deliver do
      from ENV["SMTP_USERNAME"]
      to email
      subject "Reimposta la tua password"
      html_part do
        content_type "text/html; charset=UTF-8"
        body <<~HTML
          <h2>Richiesta reset password</h2>
          <p>Ciao <b>#{user["username"]}</b>,</p>
          <p>Hai richiesto di reimpostare la password. Clicca sul link qui sotto:</p>
          <a href="#{reset_link}">Reimposta password</a>
          <p>Il link è valido per 1 ora.</p>
        HTML
      end
    end

    status 200
    { success: true, message: "Email inviata con successo" }.to_json

  rescue JSON::ParserError
    status 400
    { success: false, message: "Formato JSON non valido" }.to_json
  rescue => e
    status 500
    { success: false, message: "Errore: #{e.message}" }.to_json
  ensure
    conn&.close
  end
end

# --- ENDPOINT: RESET PASSWORD
post "/users/reset-password" do
  begin
    data = JSON.parse(request.body.read)
    token = data["token"]
    new_password = data["new_password"]

    # Validazione campi
    if token.to_s.strip.empty? || new_password.to_s.strip.empty?
      status 400
      return { success: false, message: "Token e nuova password sono obbligatori."}.to_json
    end

    # Validazione password
    password_regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\d\s:]).{8,}$/
    unless new_password.match?(password_regex)
      status 400
      return {
        success: false,
        message: "La password non rispetta i requisiti minimi."
      }.to_json
    end

    # Decodifica e verifica token
    begin
      decoded = JWT.decode(token, SECRET_KEY, true, { algorithm: "HS256" })
      payload = decoded[0]
    rescue JWT::ExpiredSignature
      status 400
      return { success: false, message: "Token scaduto." }.to_json
    rescue JWT::DecodeError
      status 400
      return { success: false, message: "Token non valido" }.to_json
    end

    user_id = payload["user_id"]

    conn = db_connection

    # Verifica che l'utente esista
    result = conn.exec_params("SELECT id FROM utente WHERE id = $1 LIMIT 1", [user_id])

    if result.ntuples == 0
      status 404
      return { success: false, message: "Utente non trovato." }.to_json
    end

    # Hashing della nuova password
    hashed_password = BCrypt::Password.create(new_password)

    # Aggiornamento password nel database
    conn.exec_params(
      "UPDATE utente SET password = $1 WHERE id = $2",
      [hashed_password, user_id]
    )

    status 200
    { success: true, message: "Password reimpostata con successo." }.to_json

  rescue JSON::ParserError
    status 400
    { success: false, message: "Formato JSON non valido." }.to_json
  rescue PG::Error => e
    status 500
    { success: false, message: "Errore database: #{e.message}" }.to_json
  ensure
    conn&.close
  end
end