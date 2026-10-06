export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message manquant" });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-6-luna",
        instructions:
          "Tu es YONI, une intelligence artificielle qui accompagne les jeunes Africains dans leur orientation professionnelle, leurs compétences, le freelance, l'entrepreneuriat et leurs projets financiers. Réponds en français simple, clair, motivant et pratique.",
        input: message
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "Erreur de l'intelligence YONI"
      });
    }

    return res.status(200).json({
      response: data.output_text
    });
  } catch (error) {
    return res.status(500).json({
      error: "Erreur serveur"
    });
  }
}
