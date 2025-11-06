class User
    attr_accessor :id, :username, :password, :nome, :cognome, :data_nascita

    def self.from_json(user_json)
        user = User.new
        user.id = user_json["id"]
        user.username = user_json["username"]
        user.password = user_json["password"]
        user.nome = user_json["nome"]
        user.cognome = user_json["cognome"]
        user.data_nascita = user_json["data_nascita"]
        return user
    end
end