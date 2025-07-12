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

  const formatList = (items: {nom: string, minute?: number}[]) =>
    items.map(item => `<li>– ${item.nom} ${item.minute ? `(${item.minute}’)` : ''}</li>`).join('');

  const cleanSheet = gardien?.cleanSheet ? `<li>– ${gardien.nom}</li>` : '<li><i>n/a</i></li>';

  return `
    <h1>🏆 ${clubName} vs ${adversaire}</h1>
    <p>📅 ${jourSemaine} ${date} | 📍 ${lieu} | 🕊 Saison ${saison}</p>
    <h2>🔚 Score final : ${clubName} ${scoreEquipe} – ${scoreAdverse} ${adversaire}</h2>
    <h3>📌 Résumé du match :</h3>
    <p>${clubName} s’est imposé ce ${jourSemaine} face à ${adversaire} au terme d’un match disputé et rythmé. L’équipe a su faire la différence avec un jeu collectif solide.</p>

    <h4>Les buts ont été marqués par :</h4>
    <ul>${buteurs.length > 0 ? formatList(buteurs) : "<li>Aucun but marqué.</li>"}</ul>

    <h4>🎯 Passeurs décisifs :</h4>
    <ul>${passeurs.length > 0 ? formatList(passeurs) : "<li>Aucun</li>"}</ul>

    <h4>🧤 Clean sheet :</h4>
    <ul>${cleanSheet}</ul>

    <h4>🟨 Cartons jaunes :</h4>
    <ul>${cartonsJaunes.length > 0 ? formatList(cartonsJaunes) : "<li>Aucun</li>"}</ul>

    <h4>🟥 Cartons rouges :</h4>
    <ul>${cartonsRouges.length > 0 ? formatList(cartonsRouges) : "<li>Aucun</li>"}</ul>

    <h3>✅ Bilan du match :</h3>
    <p>Belle performance de l’équipe qui continue sur sa lancée. Bravo à tous ! 💪</p>

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
