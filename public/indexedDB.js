const indexedDB =
    window.indexedDB ||
    window.mozIndexedDB ||
    window.webkitIndexedDB ||
    window.msIndexedDB ||
    window.shimIndexedDB;
// Create DB
let db;
// Request to open budget DB w/ vers1
const request = indexedDB.open("budget", 1);
// When upgrade needed grab db and create a collection/table
request.onupgradeneeded = (event) => {
    const db = event.target.result;
    db.createObjectStore("pending", {
        autoIncrement: true,
    });
};
// when db successfuly opened/created get result and if online check and send
request.onsuccess = (event) => {
    db = event.target.result;
    if (navigator.onLine) {
        checkDatabase();
    }
};
// if error log whoops
request.onerror = (event) => {
    console.log("Whoops! " + event.target.errorCode);
};
// save record (called by index.js) create transaction with pending table >> target pending >> add to table
function saveRecord(record) {
    const transaction = db.transaction(["pending"], "readwrite");
    const store = transaction.objectStore("pending");
    store.add(record);
}
// connect to pending table >> >>  >> >>  post to create 
function checkDatabase() {
    const transaction = db.transaction(["pending"], "readwrite");
    // get everything added to table while offline 
    const store = transaction.objectStore("pending");
    const getAll = store.getAll();
    // check table and is there anything if yes (>0) send transactions in array to server to bulk upload
    getAll.onsuccess = () => {
        if (getAll.result.length > 0) {
            fetch("/api/transaction/bulk", {
                method: "POST",
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: "application/json, text/plain, */*",
                    "Content-Type": "application/json",
                },
            })
            // when successful connect to BD again and clear out since already added
                .then(() => {
                    const transaction = db.transaction(["pending"], "readwrite");
                    const store = transaction.objectStore("pending");
                    store.clear();
                });
        }
    };
}
// when back online run checkDB
window.addEventListener("online", checkDatabase);
