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
        for(let ergebnis of this.ergebnisse){
            if(ergebnis.c_urne_nr === urne.nummer){
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
        stlgs(this.listen);

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

    getStimmenuebersicht() {
        let retval = [];
        this.listen.sort((a, b) => (a.nummer > b.nummer) ? 1 : ((b.nummer > a.nummer) ? -1 : 0));
        for (let liste of this.listen) {
            let head = new ResultListHead(liste.name, liste.c_gesamtstimmen, liste.c_listenstimmen);
            let listResult = new ListResult(head);
            liste.kandidaten.sort((a, b) => (a.c_gesamtstimmen > b.c_gesamtstimmen) ? -1 : ((b.c_gesamtstimmen > a.c_gesamtstimmen) ? 1 : ((a.nummer > b.nummer) ? 1 : ((b.nummer > a.nummer) ? -1 : 0))));
            let nr = 1;
            for (let kandidat of liste.kandidaten) {
                let resultListRow = new ResultListRow(nr++, kandidat.nummer, kandidat.name, kandidat.c_gesamtstimmen);
                listResult.addRow(resultListRow);
            }
            retval.push(listResult);
        }
        return retval;
    }

    getHaupttabelle() {
        let retval = [];
        this.listen.sort((a, b) => (a.nummer > b.nummer) ? 1 : ((b.nummer > a.nummer) ? -1 : 0));
        for (let liste of this.listen) {
            retval.push(new ListTableEntry(liste.nummer, liste.name, liste.c_gesamtstimmen, '?', liste.c_percent, '?', liste.c_seats, '?'));
        }
        return retval;
    }

    getUrnentabelle() {
        let retval = [];
        this.ergebnisse.sort((a, b) => (this.getUrneNr(a.urne) > this.getUrneNr(b.urne)) ? 1 : ((this.getUrneNr(b.urne) > this.getUrneNr(a.urne)) ? -1 : 0));
        for(let ergebnis of this.ergebnisse){
            let listenstimmen = [];
            ergebnis.listenergebnisse.sort((a, b) => (this.getListeNr(a.liste) > this.getListeNr(b.liste)) ? 1 : ((this.getListeNr(b.liste) > this.getListeNr(a.liste)) ? -1 : 0));
            for(let listenergebnis of ergebnis.listenergebnisse){
                listenstimmen.push(listenergebnis.gesamtstimmen);
            }
            let urneTableEntry = new UrneTableEntry(this.getUrneNr(ergebnis.urne), ergebnis.urne, ergebnis.stimmenGesamt, ergebnis.stimmenUngueltig, ergebnis.stimmenGueltig, ergebnis.stimmenEnthaltung, listenstimmen);
            retval.push(urneTableEntry);
        }
        return retval;
    }
}

class UrneTableEntry {
    constructor(nr, urne, gesamt, ungueltig, gueltig, enthaltungen, lists) {
        this.nr = nr;
        this.urne = urne;
        this.gesamt = gesamt;
        this.ungueltig = ungueltig;
        this.gueltig = gueltig;
        this.enthaltungen = enthaltungen;
        this.lists = lists;
    }

    toString() {
        let retval = '';
        retval += this.nr + '\t';
        retval += this.urne + '\t';
        retval += this.gesamt + '\t';
        retval += this.ungueltig + '\t';
        retval += this.gueltig + '\t';
        retval += this.enthaltungen;
        for (let list of this.lists) {
            retval += '\t' + list;
        }
        return retval + '\n';
    }
}

class ListTableEntry {
    constructor(nr, name, votes, lastvotes, percent, lastpercent, seats, lastseats) {
        this.nr = nr;
        this.name = name;
        this.votes = votes;
        this.lastvotes = lastvotes;
        this.percent = percent;
        this.lastpercent = lastpercent;
        this.seats = seats;
        this.lastseats = lastseats;
    }

    toString() {
        let retval = '';
        retval += this.nr + '\t';
        retval += this.name + '\t';
        retval += this.votes + '\t';
        retval += '(' + this.lastvotes + ')' + '\t';
        retval += this.percent.toFixed(2) + ' %\t';
        retval += '(' + this.lastpercent + ' %)' + '\t';
        retval += this.seats + '\t';
        retval += '(' + this.lastseats + ')' + '\r\n';
        return retval;
    }
}

class ListResult {
    constructor(head) {
        this.head = head;
        this.rows = [];
    }

    addRow(row) {
        this.rows.push(row);
    }

    toString() {
        let retval = '';
        retval += this.head.toString();
        retval += '\r\n';
        for (let row of this.rows) {
            retval += row.toString();
        }
        retval += '\r\n\r\n';
        return retval;
    }
}

class ResultListHead {
    constructor(name, gesamtstimmen, listenstimmen) {
        this.name = name;
        this.gesamtstimmen = gesamtstimmen;
        this.listenstimmen = listenstimmen;
    }

    toString() {
        let retval = '';
        retval += this.name + '\r\n';
        retval += 'Gesamtstimmen: ' + this.gesamtstimmen + '\r\n';
        retval += 'Listenstimmen: ' + this.listenstimmen + '\r\n';
        return retval;
    }
}

class ResultListRow {
    constructor(nr, listennr, name, stimmen) {
        this.nr = nr;
        this.listennr = listennr;
        this.name = name;
        this.stimmen = stimmen;
    }

    toString() {
        let retval = '';
        retval += this.nr + '\t';
        // retval += this.listennr + '\t';
        retval += this.name + '\t';
        retval += this.stimmen + '\r\n';
        return retval;
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

    sortListenergebnisse(wahl){
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

    sortKandidatenergebnisse(wahl){
        this.kandidatenergebnisse.sort((a, b) => (wahl.getKandidat(a.kandidat, this.liste).nummer >wahl.getKandidat(b.kandidat, this.liste).nummer) ? 1 : ((wahl.getKandidat(b.kandidat, this.liste).nummer > wahl.getKandidat(a.kandidat, this.liste).nummer) ? -1 : 0));
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
