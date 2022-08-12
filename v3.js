function defaultValues(){
    let listCities = ''
    let listTimes = ''
    // Cookie erstellen
    if(document.cookie.length == 0){
        console.log('No cookie found!')
        document.cookie = "username=John Doe";//'Braunschweig Hbf\nWarsaw Centralna\nWien;2022-09-19T06:00:00+0200\n2022-09-21T06:00:00+0200'
    }
    console.log(document.cookie)
    // Daten aus Cookie extrahieren
    listCities = document.cookie.split(';')[0]
    listTimes = document.cookie.split(';')[1]

    // Falls es Probleme mit dem Cookie gab
    if(listCities.length == 0 || listTimes.length == 0){
        listCities = 'Braunschweig Hbf\nWarsaw Centralna\nWien'
        listTimes = '2022-09-19T06:00:00+0200\n2022-09-21T06:00:00+0200'
    }
    
    // Füllen der Listen
    document.getElementById('cities').innerHTML = listCities//
    document.getElementById('departure').innerHTML = listTimes//

    // Initiale Berechnung starten
    calculate();
}

async function fetchStation(name){
    let content;
    let response = await window.interrail.stations.search(name, {results: 1}).then(data => content = data)
    return response
}

async function calculate() {
    const destinations = document.getElementById('cities').value.split('\n')
    const departures = document.getElementById('departure').value.split('\n')
    document.getElementById('progress').innerHTML = '<img src="https://1.bp.blogspot.com/-rVj7BQjJDrs/YHQV88_S7UI/AAAAAAAAD9o/eZqJQ7RNlY4h366-SfnuAuQHfOCV0S1wACLcBGAsYHQ/s640/Sequence%2B02.gif" style="height: 50px;"/>'
    //console.log(destinations)
    let ids = []
    let route = '' //[]
    for(let i=0; i<destinations.length; i++){
        let abc = await fetchStation(destinations[i]).then(data => ids.push(data[0]['id']));
        if(i != 0){
            //route1 = ('<tr><td><b>#' + i + '</b> </td>')
            let content;
            let traveltimehour = 0;
            let traveltimeminute = 0;
            let route2;
            
            let response = await window.interrail.journeys(ids[ids.length-2],ids[ids.length-1], { when: new Date(departures[departures.length - 2])}).then(data => content = data[0]['legs'])
            for(let j = 0; j<content.length; j++){
                const trainid = content[j]['line']['id']
                const trainname = content[j]['line']['name']
                let timedeparture = content[j]['departure'].split('T')
                let timearrival = content[j]['arrival'].split('T')
                const citydeparture = content[j]['origin']['name']
                const cityarrival = content[j]['destination']['name']
                
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

                //console.log('Days:'+deltaday+'Hours:'+deltahour+'Minutes:'+deltaminute)
                route2 += ('<td><h3>Zug: ' + trainname + '</h3>Von ' + citydeparture + '<br>Abfahrt am ' + timedeparture[0] + ' um ' + timedeparture[1].slice(0,5) + '<br>Nach ' + cityarrival + '<br>Ankunft am ' + timearrival[0] + ' um ' + timearrival[1].slice(0,5) + '<br>Fahrzeit: ' + fahrzeit + '</td>')
            }
            route1 = ('<tr style="background-color: #ededed;"><td><b>#' + i + '</b><br>Fahrzeit: <br>' + traveltimehour + ':' + traveltimeminute + '</td>')
            //route += ('<td>' + content[0] + '</td><td>' + content[1]['line']['id'] + '</td><td>' + content[2]['line']['id'])
            route += (route1 + route2 + '</tr>')
            console.log(content[0])
            
        }
    }
    //document.getElementById('textoutput').innerHTML = route
    $('.journey tbody').html(route);
    document.getElementById('progress').innerHTML = 'Fertig!'
}