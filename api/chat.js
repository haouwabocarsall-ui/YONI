
export default async function handler(req, res) {
  // YONI accepte uniquement les requêtes POST envoyées par index.html.
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Méthode non autorisée"
    });
  }

  try {
    // Vérifier que la clé API est configurée dans Vercel.
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "La clé OPENAI_API_KEY n'est pas configurée dans Vercel."
      });
    }

    // Lire les données envoyées par index.html.
    let body = req.body;

    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch (parseError) {
        return res.status(400).json({
          error: "Les données reçues ne sont pas au format JSON valide."
        });
      }
    }

    const message = typeof body?.message === "string"
      ? body.message.trim()
      : "";

    if (!message) {
      return res.status(400).json({
        error: "Message manquant ou vide."
      });
    }

    // Envoyer les réponses du jeune à l'API OpenAI.
    const apiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-6-luna",
        instructions: `Tu es YONI, une intelligence artificielle qui accompagne les jeunes Africains dans leur orientation et leurs projets.

Tu aides les jeunes à choisir une voie, développer des compétences, trouver des opportunités, préparer une recherche d'emploi, travailler en freelance ou lancer une activité.

Analyse réellement les réponses données par la personne. Tiens compte de son objectif, de son domaine d'intérêt et de son niveau. Les conseils, le profil et le plan doivent changer selon ces réponses. Ne donne pas automatiquement le même profil ou le même plan à tout le monde.

Propose des actions réalistes, accessibles et adaptées au contexte africain, notamment au Sénégal lorsque cela est pertinent. Ne promets jamais un emploi ou un revenu garanti. Réponds en français simple, clair, encourageant et pratique.

Respecte exactement ces trois rubriques, dans cet ordre :
PROFIL : un nom court et personnalisé.
DESCRIPTION : une analyse personnalisée de quelques phrases.
PLAN : un parcours concret de 30 jours, organisé en quatre semaines, avec des actions précises et adaptées au profil et au niveau de la personne.`,
        input: message
      })
    });

    // Lire la réponse JSON de l'API.
    let data;

    try {
      data = await apiResponse.json();
    } catch (parseError) {
      return res.status(502).json({
        error: "La réponse du service d'intelligence artificielle est illisible."
      });
    }

    // Renvoyer clairement les erreurs provenant de l'API.
    if (!apiResponse.ok) {
      return res.status(apiResponse.status).json({
        error: data?.error?.message || "Erreur du service d'intelligence artificielle."
      });
    }

    // Récupérer le texte généré par l'API Responses.
    let texte = typeof data.output_text === "string"
      ? data.output_text
      : "";

    // Repli : parcourir les blocs de sortie si output_text est absent.
    if (!texte && Array.isArray(data.output)) {
      texte = data.output
        .flatMap((item) => Array.isArray(item.content) ? item.content : [])
        .filter((part) => part.type === "output_text" && typeof part.text === "string")
        .map((part) => part.text)
        .join("\n");
    }

    if (!texte.trim()) {
      return res.status(502).json({
        error: "YONI n'a reçu aucun texte exploitable. Réessaie dans quelques instants."
      });
    }

    // Le nom response correspond à celui lu par index.html.
    return res.status(200).json({
      response: texte
    });
  } catch (error) {
    console.error("Erreur dans api/chat.js :", error);

    return res.status(500).json({
      error: "Une erreur interne est survenue dans YONI. Vérifie les paramètres du serveur puis réessaie."
    });
  }
}
