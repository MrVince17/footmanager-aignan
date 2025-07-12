import React, { useState } from 'react';
import { MatchDetails } from '../types';

function generateMatchSummary(match: MatchDetails): string {
  const {
    date, jourSemaine, domicile, adversaire, scoreEquipe, scoreAdverse,
    saison, buteurs, passeurs, gardien, cartonsJaunes, cartonsRouges, prochainMatch
  } = match;

  const clubName = "US Aignan"; // à adapter dynamiquement si nécessaire
  const lieu = domicile ? "Domicile" : "Extérieur";

  const formatButeurs = buteurs.map(b => `– ${b.nom} (${b.minute}’)`).join('\n');
  const formatPasseurs = passeurs.map(p => `– ${p.nom}`).join('\n');
  const formatJaunes = cartonsJaunes.map(c => `– ${c.nom} (${c.minute}’)`).join('\n');
  const formatRouges = cartonsRouges.map(c => `– ${c.nom} (${c.minute}’)`).join('\n');
  const cleanSheet = gardien?.cleanSheet ? `– ${gardien.nom}` : '*n/a*';

  return `🏆 ${clubName} vs ${adversaire}
📅 ${jourSemaine} ${date} | 📍 ${lieu} | 🕊 Saison ${saison}

🔚 Score final : ${clubName} ${scoreEquipe} – ${scoreAdverse} ${adversaire}

📌 Résumé du match :
${clubName} s’est imposé ce ${jourSemaine} face à ${adversaire} au terme d’un match disputé et rythmé. L’équipe a su faire la différence avec un jeu collectif solide.

${buteurs.length > 0 ? `Les buts ont été marqués par :\n${formatButeurs}` : "Aucun but marqué."}

${passeurs.length > 0 ? `\n🎯 Passeurs décisifs :\n${formatPasseurs}` : ""}

🧤 Clean sheet :
${cleanSheet}

🟨 Cartons jaunes :
${formatJaunes || "*Aucun*"}

🟥 Cartons rouges :
${formatRouges || "*Aucun*"}

✅ Bilan du match :
Belle performance de l’équipe qui continue sur sa lancée. Bravo à tous ! 💪

📆 Prochain rendez-vous : ${prochainMatch || "à venir"}

#MatchDay #${scoreEquipe > scoreAdverse ? "Victoire" : scoreEquipe === scoreAdverse ? "MatchNul" : "Défaite"} #${clubName.replace(/\s/g, "")} #Saison${saison.replace(/-/g, "_")}`;
}

export default function MatchSummaryGenerator({ match }: { match: MatchDetails }) {
  const [summary, setSummary] = useState('');

  const handleGenerate = () => {
    const result = generateMatchSummary(match);
    setSummary(result);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
  };

  return (
    <div className="p-4 border rounded-lg shadow-md bg-white space-y-4">
      <button onClick={handleGenerate} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        Générer le résumé
      </button>

      {summary && (
        <>
          <textarea
            className="w-full h-80 p-2 border rounded"
            value={summary}
            onChange={e => setSummary(e.target.value)}
          />
          <div className="flex justify-end space-x-2">
            <button onClick={handleCopy} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
              Copier le texte
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Imprimer / Exporter PDF
            </button>
          </div>
        </>
      )}
    </div>
  );
}
