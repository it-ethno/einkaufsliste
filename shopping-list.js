const liste = document.querySelector('ul');
const eingabe = document.querySelector('input');
const knopf = document.querySelector('button');

/* Eine Variable für die Datenbank */
let db;

/* Von der Window-Umgebung eine Eröffnungs-Anfrage für eine konkrete DB holen */
const openRequest = window.indexedDB.open('shopping_db', 1);

/* EventListener für den Ausgang der DB-Abfrage */
openRequest.addEventListener('error', () => console.error('Shopping Datenbank konnte nicht geöffnet werden!'));
openRequest.addEventListener('success', () => {
    console.log('Shopping Datenbank wurde erfolgreich geöffnet!');
    db = openRequest.result;
    showItems();
});

/* Über diesen EventListener wird das Datenbank-Schema definiert! */
openRequest.addEventListener('upgradeneeded', e => {
    db = e.target.result;
    const objectStore = db.createObjectStore('shopping_os', { keyPath: 'id', autoIncrement: true});
    objectStore.createIndex('title', 'title', { unique: false });
    console.log('Shopping Datenbank Setup fertig!');
});

/* Sorgt dafür, dass man zur Eingabe auch Return drücken kann */
eingabe.addEventListener('keydown', (e) => {
    if (e.which === 13) {
        addItem(e);
    }
});

knopf.addEventListener('click', addItem);
eingabe.focus();

function showItems() {
    while (liste.firstChild) {
        liste.removeChild(liste.firstChild);
    }
    
    const objectStore = db.transaction('shopping_os').objectStore('shopping_os');
    objectStore.openCursor().addEventListener('success', e => {
        const cursor = e.target.result;

        if (cursor) {
            const neuesItem = document.createElement('li');
            neuesItem.setAttribute('data-item-id', cursor.value.id);

            const newSpan = document.createElement('span');
            newSpan.textContent = cursor.value.title;
            neuesItem.appendChild(newSpan);

            const loeschKnopf = document.createElement('button');
            loeschKnopf.textContent = 'Löschen';
            loeschKnopf.addEventListener('click', deleteItem);
            neuesItem.appendChild(loeschKnopf);

            liste.appendChild(neuesItem);

            cursor.continue();
        } else {
            if (!liste.firstChild) {
                const messageItem = document.createElement('li');
                messageItem.textContent = 'Keine Eintraege gespeichert.';
                liste.appendChild(messageItem);
            }

            console.log('Alle Einträge angezeigt (aber wann?)!');
        }
    });
}

function addItem(e) {
    e.preventDefault();

    let wert = eingabe.value;

    if (wert !== '') {
        wert = wert.toLowerCase();
        wert = wert.replace('ä', 'ae');
        wert = wert.replace('ü', 'ue');
        wert = wert.replace('ö', 'oe');

        console.log(wert);
        const neuesItem = { title: wert };
        const transaction = db.transaction(['shopping_os'], 'readwrite');
        const objectStore = transaction.objectStore('shopping_os');
        const addRequest = objectStore.add(neuesItem);

        addRequest.addEventListener('success', () => {
            eingabe.value = '';
            console.log('Neues Item erfolgreich hinzugefügt!');
        });

        transaction.addEventListener('complete', () => {
            console.log('Transaktion beendet: Datenbank Modifikation ist fertig!');
            showItems();
        })
        transaction.addEventListener('error', () => console.log('Transaktion konnte nicht eröffnet werden!'));
    }

    eingabe.focus();
}

function deleteItem(e) {
    const itemId = Number(e.target.parentNode.getAttribute('data-item-id'));

    const transaction = db.transaction(['shopping_os'], 'readwrite');
    const objectStore = transaction.objectStore('shopping_os');
    const deleteRequest = objectStore.delete(itemId);

    transaction.addEventListener('complete', () => {
        e.target.parentNode.parentNode.removeChild(e.target.parentNode);
        console.log('Ding ' + itemId + ' gelöscht!');
        if (!liste.firstChild) {
            const spaceItem = document.createElement('li');
            spaceItem.textContent = 'Keine Sachen gemerkt!';
            liste.appendChild(spaceItem);
        }
    });
}