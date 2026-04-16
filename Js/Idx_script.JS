/*-----------------------------Fonction de section de la page------------------------------------------*/
function showSection(id) {
    const sections = document.querySelectorAll(".section")
    sections.forEach(section => {
        section.style.display = "none"
    })
    document.getElementById(id).style.display = "block"
}


/*------------------------------------ Fontion de logique du moteur du jeu de Go -----------------------------------------*/ 

function init_Matrice(tlle){
  let matrice = []

  for (let i = 0; i < tlle; i++){
    let ligne = []
    for (let j = 0; j < tlle; j++){
      ligne.push(0)
    }
    matrice.push(ligne)
  }
  return matrice
}

function startClock(etat){
  let clk_vue = document.getElementById("chronoDisplay")

  let idInterval = setInterval(function(){
    if (etat.phase === "termine"){ 
      clearInterval(idInterval)
      return
    }

    etat.nv_temps = etat.nv_temps - 1

    let min = Math.floor(etat.nv_temps / 60)
    let sec = etat.nv_temps % 60
    let sec_reset = sec
    if (sec < 10){
      sec_reset = "0" + sec 
    }
    clk_vue.innerHTML = min + ":" + sec_reset

    if(etat.nv_temps <= 0){
      clearInterval(idInterval)
      etat.phase = "termine"

      let hist = document.getElementById("moveHistory")
      hist.innerHTML += "<li class='list-group-item list-group-item-danger fw-bold text-center mt-2'> TEMPS ÉCOULÉ </li>";
    
      afficherEcranFin(etat)
    
    }
    }, 1000)
    clk_vue.dataset.moteurTemps = idInterval;
}

function placerhandicap(mat,tlle,nbr_handi){
  let bd_ht_left = 0
  let mid = 0
  let bd_bs_right = 0

  if (nbr_handi == 0){
    return mat
  }

  //définition des "Hochi", je préfère "Repère" 
  if (tlle == 19){
    bd_ht_left = 3 //bordHautGauche
    mid = 9 //milieu
    bd_bs_right = 15} //bordBasDroite
  else if (tlle == 13){
    bd_ht_left = 3
    mid = 6
    bd_bs_right = 9}
  else if (tlle == 9){
    bd_ht_left = 2
    mid = 4
    bd_bs_right = 6
  }

  //logique d'injection des pierres (cartographie des 9 piliers)
  if (nbr_handi >= 2){
    mat[bd_bs_right][bd_bs_right] = 1
    mat[bd_bs_right][bd_ht_left] = 1}
  if (nbr_handi >= 3){
    mat[bd_ht_left][bd_bs_right] = 1}
  if (nbr_handi >= 4){
    mat[bd_ht_left][bd_ht_left] = 1}
  if (nbr_handi >= 6){
    mat[mid][bd_ht_left] = 1
    mat[mid][bd_bs_right] = 1}
  if (nbr_handi >= 8){
    mat[bd_ht_left][mid] = 1
    mat[bd_bs_right][mid] = 1
  }
  if (nbr_handi == 5 || nbr_handi == 7 || nbr_handi == 9){
    mat[mid][mid] = 1
  }

  return mat

}

function analyserMat(mat,lgn,col){
  const clre = mat[lgn][col]
  const tlle = mat.length
  let grp = []
  let lbrt = []
  let nb_vst = []

  //pas de groupe à analyser si case vide
  if (clre === 0){return null}

  //Explore la matrice
  function explorer(l,c){
    let crdns = l + ","+ c

    //limite du plateau
    if(l < 0 || l >= tlle || c < 0 || c >= tlle ){return}

    //coordonées deja inclus dans nb_vst
    if (nb_vst.includes(crdns)){return}

    //c'est ok
    nb_vst.push(crdns)

    //Analyse
    if (mat[l][c] === 0){
      //on constate une liberté, on s'assure de ne pas le compter 2 fois
      let dejaComptee = lbrt.some(lib => lib[0] === l && lib[1] === c)
      if (!dejaComptee){
        lbrt.push([l,c])
      }
      return
    }

    //si c'est un ennemi, on s'arrête
    if (mat[l][c] !== clre){return}
    //si c'est un allié, on l'ajoute au groupe
    grp.push([l,c])

    //on regarde dans les 4 autres directions
    explorer(l-1,c) //Haut
    explorer(l+1,c) //Bas
    explorer(l,c-1) //Gauche
    explorer(l,c+1) //Droite
  }

  explorer(lgn,col)

  return {  pions : grp, 
    nombre_Libertes: lbrt.length}
}

function JouerBot (etat){

  if (etat.phase !== "jeu" || etat.joueurAct !== 2 || etat.mode !== "PvE"){
    return
  }

  
  let cse_vide = []
  let tlle = etat.plateau.length
  // Goban
  for (let i = 0; i < tlle; i++){
    for (let j = 0; j <tlle; j++){
      if (etat.plateau[i][j] === 0){
        cse_vide.push([i , j])
      }
    }
  }
  
  //Décision bot Aléatoire
  for (let i = cse_vide.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    let temp = cse_vide[i]
    cse_vide[i] = cse_vide[j]
    cse_vide[j] = temp
  }

  let cp_bot = false
  for (let k = 0; k < cse_vide.length; k++) {
    let Lgn = cse_vide[k][0]
    let Col = cse_vide[k][1]
    let rapport_cp = jouerCoup(etat.plateau, Lgn, Col, 2, etat.plateau_avant, true)
    //Coup valide
    if (rapport_cp.valide === true){
      etat.plateau_avant = rapport_cp.nv_pre
      etat.passageTour = 0
      etat.captureBlanc = etat.captureBlanc + rapport_cp.prises
      etat.joueurAct = 1

      //actualisation, pour return
      actualiseAffichage(etat)

      return
    }
  }

  if (cp_bot === true){
    actualiseAffichage(etat)}
  else{
    //Pas de coup valide trouvé
    passerTour(etat)
  }
  
}
function jouerCoup(mat,lgn,col,joueur,plateau_avant, bot = false){
  //Ennemi ou Joueur
  let ennemi = 3 - joueur
  let tlle = mat.length
  //Compteur de capture
  let Tt_Cptre = 0

  
  //Limites du plateau
  if (lgn < 0 || lgn >= tlle || col < 0 || col >= tlle){
    return {
      valide : false,
      prises : 0
    }
  }

  //mat avant commencement du jeu
  let bck_mat = JSON.parse(JSON.stringify(mat))
  
  //Si la Case n'est pas occupé, on pose le pion 
  if (mat[lgn][col] !== 0){
    return {
      valide : false,
      prises : 0
    }
  }
  mat[lgn][col] = joueur

  //Verifie les intersections voisines
  let prm_frp = [[lgn-1,col],[lgn+1,col],[lgn,col-1],[lgn,col+1]]
  for (let i = 0; i < prm_frp.length; i++){
    let cible = prm_frp[i]
    let vl = cible[0]
    let vc = cible[1]

    //On ignore si, sortie du plateau ou aucun ennemi
    if (vl < 0 || vl >= tlle || vc < 0 || vc >= tlle ){
      continue
    }
    if (mat[vl][vc]!== ennemi){
      continue
    }

    
    //Si ennemi touché, capture s'il n'a pas de liberté
    let bilan_foe = analyserMat(mat,vl,vc)
    if (bilan_foe && bilan_foe.nombre_Libertes === 0){
      for (let j = 0; j < bilan_foe.pions.length; j++){
        let Pdeath = bilan_foe.pions[j]
        mat[Pdeath[0]][Pdeath[1]] = 0
      }
      //Addition des pions supprimés
      Tt_Cptre = Tt_Cptre + bilan_foe.pions.length
    }
  }
  
  //Si joueur commet un suicide
  let bilan_Joueur = analyserMat(mat,lgn,col)
  if (bilan_Joueur && bilan_Joueur.nombre_Libertes === 0){

    //Si c'est un humain
    if (bot === false){
      alert("Ce coup n'est pas permis")
    }
      
    for (let i = 0; i < tlle; i++){
      for (let j = 0; j < tlle; j++){
        mat[i][j] = bck_mat[i][j]
      }
    }
    return {
      valide : false,
      prises : 0
    }
  }

  //Règle de Ko
  if (JSON.stringify(mat) === JSON.stringify(plateau_avant)){
    if (bot === false){
      alert("Règle de Ko : Interdiction de recréer la position précédente execte.")
    }
    for (let i = 0; i < tlle; i++){
      for (let j = 0; j < tlle; j++){
        mat[i][j] = bck_mat[i][j]
      }
    }
    return {
      valide : false,
      prises : 0
    }
  }

  return {
    valide : true,
    prises : Tt_Cptre,
    nv_pre : bck_mat
  }

}

function calculeTerritoires(mat){
  const tlle = mat.length
  let trtre_N = 0
  let trtre_B = 0
  let cse_vst = new Set()

  for (let i = 0; i < tlle - 1; i++){
    for (let j = 0; j < tlle - 1; j++){
      const poskey = i+","+j

      //Ignore les pierres et le vide déjà scanné
      if (mat[i][j] !== 0 || cse_vst.has(poskey)){
        continue
      }

      let tlle_zone = 0
      const front_col = new Set()
      
      //moteur recursif
      function exploreVide(lgn,col){
        //limite de la matrice
        if (lgn < 0 || lgn >= tlle || col < 0 || col >= tlle){
          return
        }

        const val_cse = mat[lgn][col]

        //Collision avec un pierre
        if (val_cse !== 0){
          front_col.add(val_cse)
          return
        }

        const cleCase = lgn +","+ col

        //Test d'appartenance de cleCase dans cse_vst
        if(cse_vst.has(cleCase)){
          return
        }

        //inclusion de cleCase dans cse_vst
        cse_vst.add(cleCase)
        tlle_zone ++

        exploreVide(lgn - 1, col)
        exploreVide(lgn + 1, col)
        exploreVide(lgn, col - 1)
        exploreVide(lgn, col + 1)
      }
      //lancement de la recursivité
      exploreVide(i,j)

      //Si tableau contient une seule couleur
      if (front_col.size === 1){
        if (front_col.has(1)){
          trtre_N += tlle_zone}
        else if (front_col.has(2)){
          trtre_B += tlle_zone
        }
      }
    }
  }

  return{
    pointsNoir : trtre_N,
    pointsBlanc : trtre_B
  }
}



/*------------------------------------- Fontion d'interface du jeu --------------------------------*/
function nouvellePartie(){

  let clk_vue = document.getElementById("chronoDisplay")
  if (clk_vue && clk_vue.dataset.moteurTemps){
    clearInterval(parseInt(clk_vue.dataset.moteurTemps))
  }
  // Identifiant extrait  
  let brd_sz_str = document.getElementById("boardSize").value
  let handi_str = document.getElementById("handicap").value
  let komi_str = document.getElementById("komi").value
  let md_jeu = document.getElementById("modeJeu").value
  let tps_str = document.getElementById("tempsMax").value
  //coversion des valeurs (identifiants)
  let brd_sz = parseInt(brd_sz_str)
  let handi = parseInt(handi_str)
  let kmi = parseFloat(komi_str)
  let tps_sec = parseInt(tps_str) * 60


  if (handi < 2){
    handi = 0 }
  else if (handi > 9 ){
    handi = 9
  } 

  if (kmi < 0){
    kmi = 7.5
  }
  //matrice sans handicap
  let mat_vide = init_Matrice(brd_sz)
  //matrice avec handicap
  let mat_finale = placerhandicap(mat_vide,brd_sz,handi)

  // par défaut noir commence (Noir : 1 ; blanc : 2)
  let pre_joueur = 1 
  if (handi > 0){
    pre_joueur = 2
  }

  let plt_pre = JSON.parse(JSON.stringify(mat_finale))

  const etatJeu = {
    plateau : mat_finale,
    plateau_avant : plt_pre,
    mode : md_jeu,
    joueurAct : pre_joueur,
    captureNoir : 0,
    captureBlanc : 0,
    komi : kmi,
    nv_temps : tps_sec,
    passageTour : 0,
    phase : "jeu"
  } 

  // Nettoyage visuel 
  document.getElementById("moveHistory").innerHTML = ""

  actualiseAffichage(etatJeu)

  startClock(etatJeu)

  let passeT = document.getElementById("btnPass")
  passeT.onclick = function () {
    passerTour(etatJeu)
  }

  let fin = document.getElementById("btnEnd")
  fin.onclick = function () {
    if (etatJeu.phase === "nettoyage"){
      etatJeu.phase = "termine"
      afficherEcranFin(etatJeu)}
    else if (etatJeu.phase === "jeu"){
      alert("Vous devez d'abord passer votre tour consécutivement pour entrer en phase de nettoyage.")
    }
    

  }
}



function passerTour(etat){

  if (etat.phase !== "jeu"){return}

  //mémoire de passage de tour
  etat.passageTour =  etat.passageTour + 1

  let hist = document.getElementById("moveHistory")
  let joueurNom = etat.joueurAct
  if (joueurNom === 1){
    hist.innerHTML += "<li class='list-group-item'> joueur 1 a passé son tour.</li>"}
  else if (joueurNom === 2){
    hist.innerHTML += "<li class='list-group-item'>joueur 2 a passé son tour.</li>"
  }

  if ( etat.passageTour >= 2){
    etat.phase = "nettoyage"
    hist.innerHTML += "<li class='list-group-item list-group-item-warning fw-bold text-center'>PHASE DE NETTOYAGE<br><small>Cliquez sur les pierres mortes pour les retirer. Puis cliquez sur 'Fin de partie'.</small></li>"
    actualiseAffichage(etat)}
  else{
    etat.joueurAct = 3 - etat.joueurAct
    actualiseAffichage(etat)
  }
  
}


function actualiseAffichage(etat){
  let id_brd = document.getElementById("board")
  let pn = document.getElementById("blackPrisoners")
  let pb = document.getElementById("whitePrisoners")
  id_brd.innerHTML = ""
  pn.innerHTML = etat.captureNoir
  pb.innerHTML = etat.captureBlanc
  let Et_plt = etat.plateau
  

  id_brd.style.gridTemplateColumns = "repeat("+Et_plt.length+",1fr)"

  for (let i = 0; i < Et_plt.length; i++){
    for (let j = 0; j < Et_plt.length; j++){
      let N_div = document.createElement("div")
      N_div.className = "cell"

      if (Et_plt[i][j] === 1){
        let blk_P = document.createElement("div")
        blk_P.className = "black"
        N_div.appendChild(blk_P)}
      else if (Et_plt[i][j] === 2){
        let wht_P = document.createElement("div")
        wht_P.className = "white"
        N_div.appendChild(wht_P)
      }

      N_div.onclick = function(){
        if (etat.phase === "termine"){return}
        
        if (etat.phase === "jeu" && etat.mode === "PvE" && etat.joueurAct === 2){
          return
        }
        console.log("Tentative de clic sur :", i, j)
        if (etat.phase === "jeu"){
          let rapport_cp =  jouerCoup(Et_plt,i,j,etat.joueurAct,etat.plateau_avant)
      
          if (rapport_cp.valide === true){
            etat.plateau_avant = rapport_cp.nv_pre
            etat.passageTour = 0
            if (etat.joueurAct === 1){
              etat.captureNoir = etat.captureNoir + rapport_cp.prises }
            else if (etat.joueurAct === 2){
              etat.captureBlanc = etat.captureBlanc + rapport_cp.prises
            }
            etat.joueurAct = 3 - etat.joueurAct
            actualiseAffichage(etat)
          }
        }

        //Phase nettoyage
        else if (etat.phase === "nettoyage"){
          let cible = Et_plt[i][j]

          if (cible === 0){return}

          let grp_mort = analyserMat(Et_plt,i,j)

          if (grp_mort && grp_mort.pions.length > 0){
            let tlle_grp = grp_mort.pions.length

            // Suppression physique de la matrice
            for (let k = 0; k < tlle_grp; k++){
              let p = grp_mort.pions[k]
              Et_plt[p[0]][p[1]] = 0
            }

            if (cible === 1){
              etat.captureBlanc = etat.captureBlanc + tlle_grp}
            else if (cible === 2){
              etat.captureNoir = etat.captureNoir + tlle_grp
            }
          
            //actualisation de la page
            actualiseAffichage(etat)
          
          }
        }
      } 

      id_brd.appendChild(N_div)
    }
    
  }

  //Configuration Tour bot
  if (etat.phase === "jeu" && etat.mode === "PvE" && etat.joueurAct === 2){
    setTimeout(function(){
      JouerBot(etat)
    },500)
  }
  
}

function afficherEcranFin(etat){
  let bilan_trtre = calculeTerritoires(etat.plateau)
  let score_noir = etat.captureNoir + bilan_trtre.pointsNoir
  let score_blanc = etat.captureBlanc + etat.komi + bilan_trtre.pointsBlanc
  let hist = document.getElementById("moveHistory")

  // 1. L'En-tête (L'Annonce)
  hist.innerHTML += "<li class='list-group-item list-group-item-danger fw-bold text-center'>PARTIE TERMINEE</li>";


  let rapportDetails = "<li class='list-group-item'>Score final Noir : " + score_noir +"<br><small>( Captures : " +etat.captureNoir+ " | Territoires : " +bilan_trtre.pointsNoir+ " )</small><br>Score final Blanc (+ Komi ) : " + score_blanc + "<br><small>( Captures : " +etat.captureBlanc+ " | Territoires : " +bilan_trtre.pointsBlanc + " )</small></li>"
  hist.innerHTML += rapportDetails
  
  //Conclusion du match
  let messVerdict = "" 
  if (score_noir > score_blanc){
    messVerdict = "Victoire pour joueur 1 (pions Noirs)"}
  else if (score_blanc > score_noir){
    messVerdict = "Victoire de joueur 2 (pions Blancs)"}
  else {
    messVerdict = "Egalité entre Joueur 1 et 2"
  }
  //Affiche historique 
  hist.innerHTML += "<li class='list-group-item fw-bold text-success text-center'>"+ messVerdict+"</li>"

}



