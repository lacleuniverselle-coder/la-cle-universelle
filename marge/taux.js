/* taux.js — SOURCE UNIQUE des taux de cotisations et des abattements.
   Utilisé par calculette.html et bilan.html (à charger avant leur script principal).
   Taux 2026 = cotisations + CFP. La CFP (0,3 %) n'est pas réduite par l'ACRE
   (simulateur URSSAF : 5 € sur 1 658 €).
   Pour changer la CFP du matériel (ex. 0,1 %), modifier uniquement CFP.mat.
   Le régime (ACRE / plein) est enregistré devis par devis (d.regime) : le passage
   au taux plein se choisit dans la calculette, rien à changer ici.
   Si les taux URSSAF changent un jour : ajouter un jeu RATES_V3, mettre ratesVer: 3
   sur les nouveaux devis et étendre ratesOf — les anciens devis gardent leurs taux. */
const CFP = { mat: 0.003, serv: 0.003 };
const RATES = {
  acre:  { mat: 0.062 + CFP.mat,  serv: 0.106 + CFP.serv },
  plein: { mat: 0.123 + CFP.mat,  serv: 0.212 + CFP.serv }
};
// Anciens taux (devis enregistrés avant la mise à jour, sans ratesVer) : conservés pour ne pas modifier le passé.
const RATES_V1 = {
  acre:  { mat: 0.062,  serv: 0.1075 },
  plein: { mat: 0.123 + 0.001, serv: 0.212 + 0.003 }
};
function ratesOf(d, reg){
  const src = (d && d.ratesVer === 2) ? RATES : RATES_V1;
  return src[reg || (d && d.regime)] || src.acre;
}
// Abattements forfaitaires micro-BIC (vente de marchandises / prestations de services), à titre indicatif
const ABATT_VENTE = 0.71, ABATT_SERV = 0.50;
