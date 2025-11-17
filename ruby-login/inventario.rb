require "sinatra"
require "pg"
require "json"
require_relative "db_connection"
require_relative "prodotto"

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

#Endpoint GET
get "/inventario" do
    payload = verify_token(request)
    unless payload
        status 401
        return { success: false, message: "Token mancante o non valido" }.to_json
    end

    begin
        conn = db_connection

        # Parametri paginazione
        page = (params["page"] || 1).to_i
        per_page = 10
        offset = (page - 1) * per_page

        # Conteggio totale
        total_count_result = conn.exec("SELECT COUNT(*) FROM inventario")
        total_count = total_count_result[0]["count"].to_i
        total_pages = (total_count.to_f / per_page).ceil

        # Query paginata
        result = conn.exec_params("
        SELECT i.id, i.nome_oggetto, i.descrizione, i.data_inserimento, t.tipo
        FROM inventario i
        JOIN tipo_prodotto t ON i.tipo_prodotto_id = t.id
        ORDER BY i.id ASC
        LIMIT $1 OFFSET $2
        ", [per_page, offset])

        inventario = result.map do |r|
            {
                id: r["id"],
                nome_oggetto: r["nome_oggetto"],
                descrizione: r["descrizione"],
                data_inserimento: r["data_inserimento"],
                tipo_prodotto: r["tipo"]
            }
        end

        {
            success: true,
            inventario: inventario,
            page: page,
            per_page: per_page,
            total_pages: total_pages
        }.to_json

    rescue PG::Error => e
        status 500
        { success: false, message: "Errore database: #{e.message}" }.to_json
    ensure
        conn&.close
    end
end

#Endpoint POST
post "/inventario" do
    payload = verify_token(request)
    unless payload
        status 401
        return { success: false, message: "Token mancante o non valido" }.to_json
    end

    begin
        data = JSON.parse(request.body.read)
        prodotto = Prodotto.from_json(data)
        conn = db_connection

        if prodotto.nome_oggetto.to_s.strip.empty? || prodotto.tipo_prodotto_id.nil?
            status 400
            return { success: false, message: "Nome e tipo prodotto sono obbligatori" }.to_json
        end

        conn.exec_params("
            INSERT INTO inventario (nome_oggetto, descrizione, data_inserimento, tipo_prodotto_id)
            VALUES ($1, $2, $3, $4)",
            [prodotto.nome_oggetto,
             prodotto.descrizione,
             prodotto.data_inserimento || Time.now.strftime("%Y-%m-%d"),
             prodotto.tipo_prodotto_id]
        )

        status 201
        { success: true, message: "Prodotto inserito con successo" }.to_json
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

#Endpoint PUT
put "/inventario/:id" do
    payload = verify_token(request)
    unless payload
        status 401
        return { success: false, message: "Token mancante o non valido" }.to_json
    end

    begin
        data = JSON.parse(request.body.read)
        prodotto = Prodotto.from_json(data)
        conn = db_connection
        id = params[:id]

        result = conn.exec_params("SELECT * FROM inventario WHERE id = $1", [id])

        if result.ntuples == 0
            status 404
            return { success: false, message: "Prodotto non trovato" }.to_json
        end

        conn.exec_params(
            "UPDATE inventario SET nome_oggetto = $1, descrizione = $2, tipo_prodotto_id = $3 WHERE id = $4",
            [prodotto.nome_oggetto, prodotto.descrizione, prodotto.tipo_prodotto_id, id]
        )

        status 200
        {success: true, message: "Prodotto aggiornato con successo" }.to_json
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

#Endpoint DELETE
delete "/inventario/:id" do
    payload = verify_token(request)
    unless payload
        status 401
        return { success: false, message: "Token mancante o non valido" }.to_json
    end

    begin
        conn = db_connection
        id = params[:id].to_i

        if id <=0
            status 400
            return {success: false, message: "ID non valido" }.to_json
        end

        result = conn.exec_params("SELECT 1 FROM inventario WHERE id = $1", [id])
        if result.ntuples == 0
            status 404
            return { success: false, message: "Prodotto non trovato" }.to_json
        end

        conn.exec_params("DELETE FROM inventario WHERE id = $1", [id])

        status 200
        { success: true, message: "Prodotto eliminato con successo" }.to_json

    rescue PG::Error => e
        status 500
        { success: false, message: "Errore database: #{e.message}" }.to_json
    ensure
        conn&.close
    end
end