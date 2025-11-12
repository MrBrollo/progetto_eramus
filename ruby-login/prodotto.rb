class Prodotto
    attr_accessor :id, :nome_oggetto, :descrizione, :data_inserimento, :tipo_prodotto_id

    def self.from_json(prodotto_json)
        prodotto = Prodotto.new
        prodotto.id = prodotto_json["id"]
        prodotto.nome_oggetto = prodotto_json["nome_oggetto"]
        prodotto.descrizione = prodotto_json["descrizione"]
        prodotto.data_inserimento = prodotto_json["data_inserimento"]
        prodotto.tipo_prodotto_id = prodotto_json["tipo_prodotto_id"]
        return prodotto
    end
end