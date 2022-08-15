var map
var polyline
let destinations = []
let departures = []

function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
  }

function defaultValues(){
    let listCities = ''
    let listTimes = ''
    // Cookie erstellen
    if(document.cookie.length == 0){
        console.log('No cookie found!')
        document.cookie = 'cities=Braunschweig Hbf\nWarsaw Centralna\nWien;deps=2022-09-19T06:00:00+0200\n2022-09-21T06:00:00+0200'
    }
    //console.log(document.cookie)
    // Daten aus Cookie extrahieren
    listCities = document.cookie.split(';')[0]
    listTimes = document.cookie.split(';')[1]

    // Falls es Probleme mit dem Cookie gab
    //if(listCities.length == 0 || listTimes.length == 0 || document.cookie = null){
    
    map = L.map('map').setView([52.269, 10.526], 3);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    }).addTo(map);
    
    //}
    
    // Füllen der Listen
    

    // Initiale Berechnung starten
    //calculate();
    //drawMap();
}

async function fetchStation(name){
    let content;
    let response = await window.interrail.stations.search(name, {results: 1}).then(data => content = data)
    return response
}

async function calculate() {
    // Checken, ob Zeiten abgegeben wurden
    const updatereq = (destinations.length==document.getElementById('cities').value.split('\n').length)
    console.log(updatereq)
    if(destinations.length != document.getElementById('cities').value.split('\n').length){
        console.log('Updating Timepickers')
        updateDestinations();
        return null
    }
    let log = document.getElementById('progress').innerHTML

    // Arrays (Orte & Zeiten) updaten
    destinations = document.getElementById('cities').value.split('\n')
    for(let i=0; i<destinations.length; i++){
        const requiredid = ('dep' + i)
        departures.push(document.getElementById(requiredid).value)
    }
    //departures = document.getElementById('departure').value.split('\n')
    let destinations_long = []
    let destinations_lat = []
    log += 'Berechnung läuft...<br>'
    document.getElementById('progress').innerHTML = log//'Berechnung läuft...'
    document.title = 'Berechnung läuft...'
    //document.cookie = (document.getElementById('cities').value + ';' + document.getElementById('departure').value)
    //document.getElementById('progress').innerHTML = '<img src="https://1.bp.blogspot.com/-rVj7BQjJDrs/YHQV88_S7UI/AAAAAAAAD9o/eZqJQ7RNlY4h366-SfnuAuQHfOCV0S1wACLcBGAsYHQ/s640/Sequence%2B02.gif" style="height: 50px;"/>'
    let ids = []
    let route = '' //[]
    for(let i=0; i<destinations.length; i++){
        let abc = await fetchStation(destinations[i]).then(data => {
            ids.push(data[0]['id']);
            if(i==0){
                destinations_long.push(data[0]['location']['longitude']);
                destinations_lat.push(data[0]['location']['latitude']);
            }
            });
        if(i != 0){
            //route1 = ('<tr><td><b>#' + i + '</b> </td>')
            let content;
            let traveltimehour = 0;
            let traveltimeminute = 0;
            let route2;
            log += ('(' + (i) + '/' + (destinations.length-1) +') Berechne Route ' + destinations[i-1] + ' nach ' + destinations[i] + '...<br>')
            document.getElementById('progress').innerHTML = log 
            let response = await window.interrail.journeys(ids[ids.length-2],ids[ids.length-1], { when: new Date(departures[i-1])}).then(data => content = data[0]['legs'])
            console.log(content[0])
            for(let j = 0; j<content.length; j++){
                const trainid = content[j]['line']['id']
                const trainname = content[j]['line']['name']
                let timedeparture = content[j]['departure'].split('T')
                let timearrival = content[j]['arrival'].split('T')
                const citydeparture = content[j]['origin']['name']
                const cityarrival = content[j]['destination']['name']
                const destination_long = parseFloat(content[j]['destination']['location']['longitude'])
                const destination_lat = parseFloat(content[j]['destination']['location']['latitude'])
                destinations_long.push(destination_long)
                destinations_lat.push(destination_lat)

                // Distanzberechnung
                let lat1 = destinations_lat[destinations_lat.length-2]
                let lat2 = destinations_lat[destinations_lat.length-1]
                let long1 = destinations_long[destinations_long.length-2]
                let long2 = destinations_long[destinations_long.length-1]
                let distanz = Math.round(111.324 * Math.acos(Math.sin(lat1)*Math.sin(lat2) + Math.cos(lat1)*Math.cos(lat2)*Math.cos(Math.abs(long2-long1))), 1)
                //console.log(distanz)
                
                // Zeitberechnung
                const daydep = parseInt(timedeparture[0].slice(8,10))
                const dayarr = parseInt(timearrival[0].slice(8,10))
                const hourdep = parseInt(timedeparture[1].slice(0,2))
                const hourarr = parseInt(timearrival[1].slice(0,2))
                const minutedep = parseInt(timedeparture[1].slice(3,5))
                const minutearr = parseInt(timearrival[1].slice(3,5))
                let deltaday = dayarr - daydep
                let deltahour = hourarr - hourdep
                let deltaminute = minutearr - minutedep
                if(deltaday > 2){
                    deltaday = 1
                }
                if(deltahour < 0){
                    deltahour = 24 + deltahour
                    deltaday -= 1
                }
                if(deltaminute < 0){
                    deltaminute = 60 + deltaminute
                    deltahour -= 1
                }
                deltahour += deltaday * 24
                
                traveltimehour += deltahour
                traveltimeminute += deltaminute
                const fahrzeit = (deltahour + ':' + deltaminute)
                const geschwindigkeit = Math.round(distanz / (deltahour +  (deltaminute/60)), 0)

                //console.log('Days:'+deltaday+'Hours:'+deltahour+'Minutes:'+deltaminute)
                route2 += ('<td><h3>' + trainname + '</h3>Von ' + citydeparture + '<br>Abfahrt am ' + timedeparture[0] + ' um ' + timedeparture[1].slice(0,5) + '<br>Nach ' + cityarrival + '<br>Ankunft am ' + timearrival[0] + ' um ' + timearrival[1].slice(0,5) + '<br>Distanz: ' + distanz + 'km in ' + fahrzeit + '(' + geschwindigkeit + '<sup>km</sup>/<sub>h</sub>)</td>')
            }
            while(traveltimeminute >= 60){
                traveltimehour += 1
                traveltimeminute -= 60
            }
            route1 = ('<tr style="background-color: #ededed; vertical-align: top;"><td><h3>#' + i + '</h3><h4>' + destinations[i-1] + ' → ' + destinations[i] + '</h4>Fahrzeit: ' + traveltimehour + ':' + traveltimeminute + '</td>')
            //route += ('<td>' + content[0] + '</td><td>' + content[1]['line']['id'] + '</td><td>' + content[2]['line']['id'])
            route += (route1 + route2 + '</tr>')
            //console.log(content[0])
            
        }
        $('.journey tbody').html(route);
    }
    //document.getElementById('textoutput').innerHTML = route
    $('.journey tbody').html(route);
    drawMap(destinations_long, destinations_lat)
    log += 'Fertig!<br>'
    document.getElementById('progress').innerHTML = log
    var objDiv = document.getElementById("progress");
    objDiv.scrollTop = objDiv.scrollHeight;
    //console.log(destinations)
    document.title = 'Deine Reise mit ' + (destinations.length-2) + ' Städten'
}

async function drawMap(long, lat){
    let avglong = 0
    let avglat = 0
    let coordinates = []
    for(let i=0; i<long.length; i++){
        avglong += long[i]
        avglat += lat[i]
        coordinates.push([lat[i], long[i]])
    }
    avglong = avglong / long.length
    avglat = avglat / lat.length
    
    //document.getElementById('map').innerHTML = ''
    map.setView([52.269, 10.526], 3); // = L.map('map')
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    }).addTo(map);
    polyline = L.polyline(coordinates, {color: 'red'}).addTo(map);
    map.fitBounds(polyline.getBounds());
}

function setDemoRoute(selection){
    // Lange Option
    listCities = 'Braunschweig\nWarsaw\nWien\nZagreb\nSplit\nRoma\nNice\nBarcelona\nMadrid\nPorto\nLisbon\nMadrid\nToulouse\nParis\nBrussels\nAmsterdam\nBraunschweig'
    listTimes = '2022-09-19T06:00:00+0200\n2022-09-21T06:00:00+0200\n2022-09-23T06:00:00+0200\n2022-09-25T06:00:00+0200\n2022-09-27T06:00:00+0200\n2022-09-29T06:00:00+0200\n2022-10-01T06:00:00+0200\n2022-10-03T06:00:00+0200\n2022-10-03T06:00:00+0200\n2022-10-05T06:00:00+0200\n2022-10-07T06:00:00+0200\n2022-10-09T06:00:00+0200\n2022-10-11T06:00:00+0200\n2022-10-13T06:00:00+0200\n2022-10-15T06:00:00+0200\n2022-10-19T06:00:00+0200\n2022-10-19T06:00:00+0200'

    // Kurze Optionen
    slistCities = 'Braunschweig\nWarsaw\nWien\nBraunschweig'
    slistTimes = '2022-09-19T06:00:00+0200\n2022-09-21T06:00:00+0200\n2022-09-23T06:00:00+0200\n2022-09-25T06:00:00+0200'

    // Füllen der Kästen
    var log = document.getElementById('progress').innerHTML

    if(selection == 'long'){
        document.getElementById('cities').innerHTML = listCities
        //document.getElementById('departure').innerHTML = listTimes
        log += 'Lange Route geladen.<br>'
    }
    else{
        document.getElementById('cities').innerHTML = slistCities
        //document.getElementById('departure').innerHTML = slistTimes
        log += 'Kurze Route geladen.<br>'
    }
    updateDestinations()
    document.getElementById('progress').innerHTML = log
    var objDiv = document.getElementById("progress");
    objDiv.scrollTop = objDiv.scrollHeight;
}

function updateDestinations(){
    destinations = document.getElementById('cities').value.split('\n')
    let datepickers = '<h3>Abfahrtszeiten</h3>'
    let month = '09'
    let day = 19
    for(let i=0; i<destinations.length; i++){
        let tempday
        if(day > 30){
            month = '10'
            day = 1
        }
        if(day < 10){
            tempday = ('0' + day)
        }
        else{
            tempday = day
        }
        datepickers += '<input type="datetime-local" class="datepicker" id="dep' + i + '" value="2022-' + month + '-' + tempday + 'T06:00" min="2022-09-19T00:00" max="2022-10-19T23:59"><br>'
        day += 1
    }
    document.getElementById('timesdiv').innerHTML = datepickers
}