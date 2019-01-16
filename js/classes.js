class Wahl {
    constructor() {
        this.ergebnisse = [];
        this.listen = [];
        this.urnen = [];
    }

    static fromXml(xml) {
        let wahl = new Wahl();
        for (let ergebnis of xml.getElementsByTagName('ergebnis')) {
            wahl.addErgebnis(Ergebnis.fromXml(ergebnis))
        }

        for (let liste of xml.getElementsByTagName('liste')) {
            wahl.addListe(Liste.fromXml(liste))
        }

        for (let urne of xml.getElementsByTagName('urne')) {
            wahl.addUrne(Urne.fromXml(urne))
        }
        wahl.calculateGesamtstimmen();
        return wahl;
    }

    addErgebnis(ergebnis) {
        this.ergebnisse.push(ergebnis);
    }

    addListe(liste) {
        this.listen.push(liste);
    }

    addUrne(urne) {
        this.urnen.push(urne);
    }

    getKandidat(kname, kliste) {
        for (let liste of this.listen) {
            if (liste.kuerzel === kliste) {
                for (let kandidat of liste.kandidaten) {
                    if (kandidat.name === kname) {
                        return kandidat;
                    }
                }
            }
        }
        throw new Error("Unknown name '" + kname + "' for list '" + kliste + "'");
    }

    getListe(kliste) {
        for (let liste of this.listen) {
            if (liste.kuerzel === kliste) {
                return liste;
            }
        }
        throw new Error("Unknown list '" + kliste + "'");
    }

    getErgebnisForUrne(urne) {
        for (let ergebnis of this.ergebnisse) {
            if (ergebnis.c_urne_nr === urne.nummer) {
                return ergebnis;
            }
        }
        return null;
    }

    calculateGesamtstimmen() {
        for (let ergebnis of this.ergebnisse) {
            ergebnis.calculateGesamtstimmen(this);
            ergebnis.c_urne_nr = this.getUrneNr(ergebnis.urne);
        }
        let gesamtlistenstimmen = 0;
        for (let liste of this.listen) {
            gesamtlistenstimmen += liste.c_gesamtstimmen;
        }
        for (let liste of this.listen) {
            liste.c_percent = liste.c_gesamtstimmen * 100 / gesamtlistenstimmen;
        }
        //stlgs(this.listen);

    }

    getUrneNr(name) {
        for (let urne of this.urnen) {
            if (urne.name === name) {
                return urne.nummer;
            }
        }
        throw new Error('Urne not found: ' + name);
    }

    getListeNr(name) {
        for (let liste of this.listen) {
            if (liste.kuerzel === name) {
                return liste.nummer;
            }
        }
        throw new Error('Liste not found: ' + name);
    }

    hasErgebnis(urne) {
        for (let ergebnis of this.ergebnisse) {
            if (ergebnis.urne === urne) {
                return true;
            }
        }
        return false;
    }

    merge(other) {
        for (let ergebnis of other.ergebnisse) {
            if (this.hasErgebnis(ergebnis.urne)) {
                alert('Cannot merge Urne: ' + ergebnis.urne + ' already exists. Skipping this one.');
            } else {
                this.ergebnisse.push(ergebnis);
            }
        }
    }
}

class Liste {
    constructor(kuerzel, name, nummer) {
        this.kuerzel = kuerzel;
        this.name = name;
        this.nummer = parseInt(nummer);
        this.kandidaten = [];
        this.c_gesamtstimmen = 0;
        this.c_listenstimmen = 0;
        this.c_seats = 0;
        this.c_percent = 0;
    }

    static fromXml(xml) {
        let kuerzel = xml.getAttribute('kuerzel');
        let name = xml.getAttribute('name');
        let nummer = xml.getAttribute('nummer');
        let liste = new Liste(kuerzel, name, nummer);
        for (let kandidat of xml.getElementsByTagName('kandidat')) {
            liste.addKandidat(Kandidat.fromXml(kandidat))
        }
        return liste;
    }

    addKandidat(kandidat) {
        this.kandidaten.push(kandidat);
    }

    addGesamtstimmen(amount) {
        this.c_gesamtstimmen += amount;
    }

    addListenstimmen(amount) {
        this.c_listenstimmen += amount;
    }
}

class Kandidat {
    constructor(name, nummer) {
        this.name = name;
        this.nummer = parseInt(nummer);
        this.c_gesamtstimmen = 0;
    }

    static fromXml(xml) {
        let name = xml.getAttribute('name');
        let nummer = xml.getAttribute('nummer');
        return new Kandidat(name, nummer);
    }

    addGesamtstimmen(amount) {
        this.c_gesamtstimmen += amount;
    }
}

class Urne {
    constructor(name, nummer) {
        this.name = name;
        this.nummer = parseInt(nummer);
    }

    static fromXml(xml) {
        let name = xml.getAttribute('name');
        let nummer = xml.getAttribute('nummer');
        return new Urne(name, nummer);
    }
}

class Ergebnis {
    constructor(stimmenEnthaltung, stimmenGesamt, stimmenGueltig, stimmenUngueltig, urne) {
        this.stimmenEnthaltung = parseInt(stimmenEnthaltung);
        this.stimmenGesamt = parseInt(stimmenGesamt);
        this.stimmenGueltig = parseInt(stimmenGueltig);
        this.stimmenUngueltig = parseInt(stimmenUngueltig);
        this.urne = urne;
        this.listenergebnisse = [];
        this.c_urne_nr = 0;
    }

    static fromXml(xml) {
        let stimmenEnthaltung = xml.getAttribute('stimmenEnthaltung');
        let stimmenGesamt = xml.getAttribute('stimmenGesamt');
        let stimmenGueltig = xml.getAttribute('stimmenGueltig');
        let stimmenUngueltig = xml.getAttribute('stimmenUngueltig');
        let urne = xml.getAttribute('urne');
        let ergebnis = new Ergebnis(stimmenEnthaltung, stimmenGesamt, stimmenGueltig, stimmenUngueltig, urne);
        for (let listenergebnis of xml.getElementsByTagName('listenergebnis')) {
            ergebnis.addListenergebnis(Listenergebnis.fromXml(listenergebnis))
        }
        return ergebnis;
    }

    sortListenergebnisse(wahl) {
        this.listenergebnisse.sort((a, b) => (wahl.getListe(a.liste).nummer > wahl.getListe(b.liste).nummer) ? 1 : ((wahl.getListe(b.liste).nummer > wahl.getListe(a.liste).nummer) ? -1 : 0));
    }

    addListenergebnis(listenergebnis) {
        this.listenergebnisse.push(listenergebnis);
    }

    calculateGesamtstimmen(wahl) {
        for (let listenergebnis of this.listenergebnisse) {
            listenergebnis.calculateGesamtstimmen(wahl);
        }
    }
}

class Listenergebnis {
    constructor(gesamtstimmen, liste, listenstimmen) {
        this.gesamtstimmen = parseInt(gesamtstimmen);
        this.liste = liste;
        this.listenstimmen = parseInt(listenstimmen);
        this.kandidatenergebnisse = [];
    }

    static fromXml(xml) {
        let gesamtstimmen = xml.getAttribute('gesamtstimmen');
        let liste = xml.getAttribute('liste');
        let listenstimmen = xml.getAttribute('listenstimmen');
        let listenergebnis = new Listenergebnis(gesamtstimmen, liste, listenstimmen);
        for (let kandidatenergebnis of xml.getElementsByTagName('kandidatenergebnis')) {
            listenergebnis.addKandidatenergebnis(Kandidatenergebnis.fromXml(kandidatenergebnis))
        }
        return listenergebnis;
    }

    addKandidatenergebnis(kandidatenergebnis) {
        this.kandidatenergebnisse.push(kandidatenergebnis);
    }

    calculateGesamtstimmen(wahl) {
        wahl.getListe(this.liste).addListenstimmen(this.listenstimmen);
        wahl.getListe(this.liste).addGesamtstimmen(this.listenstimmen + this.getKandidatenstimmen());
        for (let kandidatenergebnis of this.kandidatenergebnisse) {
            kandidatenergebnis.calculateGesamtstimmen(wahl, this.liste);
        }
    }

    getKandidatenstimmen() {
        let sum = 0;
        for (let kandidatenergebnis of this.kandidatenergebnisse) {
            sum += kandidatenergebnis.stimmen;
        }
        return sum;
    }

    sortKandidatenergebnisse(wahl) {
        this.kandidatenergebnisse.sort((a, b) => (wahl.getKandidat(a.kandidat, this.liste).nummer > wahl.getKandidat(b.kandidat, this.liste).nummer) ? 1 : ((wahl.getKandidat(b.kandidat, this.liste).nummer > wahl.getKandidat(a.kandidat, this.liste).nummer) ? -1 : 0));
    }

}

class Kandidatenergebnis {
    constructor(kandidat, stimmen) {
        this.kandidat = kandidat;
        this.stimmen = parseInt(stimmen);
    }

    static fromXml(xml) {
        let kandidat = xml.getAttribute('kandidat');
        let stimmen = xml.getAttribute('stimmen');
        return new Kandidatenergebnis(kandidat, stimmen);
    }

    calculateGesamtstimmen(wahl, liste) {
        wahl.getKandidat(this.kandidat, liste).addGesamtstimmen(this.stimmen);
    }
}

function stlgs(lists) {
    let numberOfSeats = 43;

    let sumOfVotes = 0
    for (let list of lists) {
        sumOfVotes += list.c_gesamtstimmen;
    }

    let divisor = 1.0;
    let sumOfAllSeats = numberOfSeats + 1;
    let maxSeats = 0;
    while (sumOfAllSeats > numberOfSeats) {
        sumOfAllSeats = 0;
        maxSeats = 0;
        divisor += 10;
        for (let list of lists) {
            list.c_seats = Math.round(list.c_gesamtstimmen / divisor);
            sumOfAllSeats += list.c_seats;
            if (list.c_seats > maxSeats) {
                maxSeats = list.c_seats;
            }
        }
    }

    while (sumOfAllSeats < numberOfSeats) {
        sumOfAllSeats = 0;
        maxSeats = 0;
        divisor -= 1;
        for (let list of lists) {
            list.c_seats = Math.round(list.c_gesamtstimmen / divisor);
            sumOfAllSeats += list.c_seats;
            if (list.c_seats > maxSeats) {
                maxSeats = list.c_seats;
            }
        }

    }

    while (sumOfAllSeats > numberOfSeats) {
        sumOfAllSeats = 0;
        maxSeats = 0;
        divisor += 0.1;
        for (let list of lists) {
            list.c_seats = Math.round(list.c_gesamtstimmen / divisor);
            sumOfAllSeats += list.c_seats;
            if (list.c_seats > maxSeats) {
                maxSeats = list.c_seats;
            }
        }
    }

    while (sumOfAllSeats < numberOfSeats && divisor > 0.002) {
        sumOfAllSeats = 0;
        maxSeats = 0;
        divisor -= 0.001;
        for (let list of lists) {
            list.c_seats = Math.round(list.c_gesamtstimmen / divisor);
            sumOfAllSeats += list.c_seats;
            if (list.c_seats > maxSeats) {
                maxSeats = list.c_seats;
            }
        }
    }

    if (sumOfAllSeats !== numberOfSeats) {
        alert("Teilergleichheit bei zwei oder mehr Gruppen! " + sumOfAllSeats + " Sitze zugewiesen!");
    }

}
