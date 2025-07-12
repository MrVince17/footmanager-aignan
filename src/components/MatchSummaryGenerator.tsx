import { MatchDetails } from '../types';
import * as fs from 'file-saver';
import htmlToDocx from 'html-to-docx';

export function generateMatchSummaryHTML(match: MatchDetails): string {
  const {
    date, jourSemaine, domicile, adversaire, scoreEquipe, scoreAdverse,
    saison, buteurs, passeurs, gardien, cartonsJaunes, cartonsRouges, prochainMatch
  } = match;

  const clubName = "US Aignan";
  const lieu = domicile ? "Domicile" : "Extérieur";

  const formatButeursList = buteurs.map(b => `<li>${b.nom} (${b.minute}’)</li>`).join('');
  const formatPasseursList = passeurs.map(p => p.nom).join(', ');
  const formatJaunesList = cartonsJaunes.map(c => `<li>${c.nom} (${c.minute}’)</li>`).join('');
  const formatRougesList = cartonsRouges.map(c => `<li>${c.nom} (${c.minute}’)</li>`).join('');
  const cleanSheetDisplay = gardien?.cleanSheet ? `<li>${gardien.nom}</li>` : '<i>Non</i>';

  // Basic narrative generation
  let narrative = `${clubName} s’est imposé ce ${jourSemaine} face à ${adversaire} au terme d’un match disputé et rythmé.`;
  if (buteurs.length > 0) {
    narrative += ` Le score a été ouvert à la ${buteurs[0].minute}’ par ${buteurs[0].nom}`;
    if (passeurs.length > 0) {
      narrative += `, bien servi par ${passeurs[0].nom}`;
    }
    narrative += '.';
  }
  if (gardien && gardien.nom !== 'N/A') {
      narrative += ` En défense, ${gardien.nom} a réalisé plusieurs arrêts décisifs.`
  }


  return `
    <h1>🏆 ${clubName} vs ${adversaire}</h1>
    <p>📅 ${date} | 📍 ${lieu} | 🕊 Saison ${saison}</p>
    <h2>🔚 Score final : ${clubName} ${scoreEquipe} – ${scoreAdverse} ${adversaire}</h2>

    <h3>📌 Résumé du match :</h3>
    <p>${narrative}</p>

    <h3>🎯 Statistiques clés</h3>
    <h4>⚽ Buteurs :</h4>
    <ul>${buteurs.length > 0 ? formatButeursList : "<li>Aucun</li>"}</ul>

    <h4>🎯 Passeurs décisifs :</h4>
    <p>${passeurs.length > 0 ? formatPasseursList : "Aucun"}</p>

    <h4>🧤 Clean sheet :</h4>
    <ul>${cleanSheetDisplay}</ul>

    <h4>🟨 Cartons jaunes :</h4>
    <ul>${cartonsJaunes.length > 0 ? formatJaunesList : "<li>Aucun</li>"}</ul>

    <h4>🟥 Cartons rouges :</h4>
    <ul>${cartonsRouges.length > 0 ? formatRougesList : "<li>Aucun</li>"}</ul>

    <h3>✅ Bilan du match :</h3>
    <p>Une belle prestation collective qui confirme la bonne dynamique du groupe. Bravo à tous les joueurs pour leur implication sur le terrain ! 🔥</p>

    <p>📆 Prochain rendez-vous : ${prochainMatch || "à venir"}</p>

    <p><i>#MatchDay #${scoreEquipe > scoreAdverse ? "Victoire" : scoreEquipe === scoreAdverse ? "MatchNul" : "Défaite"} #${clubName.replace(/\s/g, "")} #Saison${saison.replace(/-/g, "_")}</i></p>
  `;
}

export async function exportMatchSummaryToWord(match: MatchDetails) {
  const htmlString = generateMatchSummaryHTML(match);
  const fileBuffer = await htmlToDocx(htmlString, undefined, {
    table: { row: { cantSplit: true } },
    footer: true,
    pageNumber: true,
  });

  fs.saveAs(fileBuffer, `resume_match_${match.adversaire}_${match.date}.docx`);
}
