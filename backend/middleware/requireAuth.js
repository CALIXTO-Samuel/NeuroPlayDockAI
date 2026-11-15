
function requireAuth(req, res, next) {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({
            sucesso: false,
            erro: "Você precisa entrar na sua conta para continuar."
        });
    }

    next();
}

module.exports = requireAuth;
