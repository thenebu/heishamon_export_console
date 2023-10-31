// ==UserScript==
// @name         Heishamon Export
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Console-Daten von heishamon.local als CSV speichern
// @author       thenebu
// @match        http://heishamon.local/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Dies ist die Variable, in der die zu exportierenden Daten gespeichert werden
    var csvData = "Daten\n";  // Beginn mit einem Header

    // Diese Funktion fügt die Daten zum CSV-String hinzu, sofern sie den Filtertext (falls angegeben) enthalten
    function handleData(data, filter1, filter2) {
        if (filter1 && !data.includes(filter1) && (!filter2 || !data.includes(filter2))) {
            return;  // Überspringt die Daten, wenn keiner der Filter in den Daten gefunden wird
        }
        csvData += data + "\n";
    }
    

    // Diese Funktion erstellt eine CSV-Datei aus den Daten und löst einen Download aus
    function downloadCSV(filtered=false) {
        setTimeout(() => {
            var date = new Date();
            var timestamp = date.getFullYear() + "_" +
                ("0" + (date.getMonth() + 1)).slice(-2) + "_" +
                ("0" + date.getDate()).slice(-2) + "_" +
                ("0" + date.getHours()).slice(-2) + "_" +
                ("0" + date.getMinutes()).slice(-2) + "_" +
                ("0" + date.getSeconds()).slice(-2);
            
            var filename = 'Heishamon_Console_Export_' + (filtered ? "TOP_" : "") + timestamp + '.csv';
    
            // Erstellt eine temporäre Download-URL und einen Link, um die CSV herunterzuladen
            var blob = new Blob([csvData], { type: 'text/csv' });
            var url = window.URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.setAttribute('hidden', '');
            a.setAttribute('href', url);
            a.setAttribute('download', filename);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }, 0);
    }

    // Erstellt einen Button, um alle Daten als CSV herunterzuladen
    var btn = document.createElement('button');
    btn.innerText = "Export als CSV";
    btn.onclick = downloadCSV;
    btn.style.marginLeft = '20px';      // Linken Rand auf 20px setzen
    btn.style.marginRight = '10px';     // Rechten Rand auf 10px setzen
    document.body.appendChild(btn);

    // Erstellt einen weiteren Button, um nur die Daten herunterzuladen, die den String ": received TOP" enthalten
    var btnFilter = document.createElement('button');
    btnFilter.innerText = "Export TOP";
    btnFilter.onclick = function() {
        csvData = "Daten\n"; // Reset der CSV-Daten
        var messages = document.getElementById("cli").value.split("\n");
        messages.forEach(function(message) {
            handleData(message, ": received TOP", ": set ");
        });
        downloadCSV(true);  // Hier setzen wir den Parameter auf true
    };
    
    btnFilter.style.marginLeft = '10px';  // Linken Rand auf 10px setzen
    document.body.appendChild(btnFilter);

    // Eine Variable, um den Verbindungsstatus des WebSockets zu überprüfen
    var bConnected = false;

    // Diese Funktion startet den WebSocket und verarbeitet die darauf empfangenen Daten
    function startWebsockets() {
        var oWebsocket;

        // Überprüft die Browserkompatibilität für WebSockets
        if (typeof MozWebSocket != "undefined") {
            oWebsocket = new MozWebSocket("ws://" + location.host + ":80");
        } else if (typeof WebSocket != "undefined") {
            oWebsocket = new WebSocket("ws://" + location.host + ":80/ws");
        }

        if (oWebsocket) {
            oWebsocket.onopen = function(evt) {
                bConnected = true;
            };

            oWebsocket.onclose = function(evt) {
                console.log('WebSocket geschlossen. Grund:', evt.reason);
                console.log('Versuche erneut zu verbinden...');
                setTimeout(startWebsockets, 4000);  // Versucht nach 4 Sekunden erneut eine Verbindung herzustellen
            };

            oWebsocket.onerror = function(evt) {
                console.log('WebSocket Fehler:', evt);
            };

            // Bei Erhalt einer Nachricht vom WebSocket
            oWebsocket.onmessage = function(evt) {
                handleData(evt.data);

                let obj = document.getElementById("cli");
                let chk = document.getElementById("autoscroll");

                obj.value += evt.data + "\n";

                if (chk.checked) {
                    obj.scrollTop = obj.scrollHeight;
                }
            }
        }
    }

    // Startet die Websockets-Funktion, sobald das Skript geladen wird
    startWebsockets(); 

})();
