import { Component, ElementRef, NgZone, ViewChild } from '@angular/core';
import { Geolocation, Position } from '@capacitor/geolocation';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  //Pega a div do html e coloca ela na variável mapRef
  @ViewChild('map') mapRef!: ElementRef;

  //Cria uma variavel para o Maps
  map!: google.maps.Map;

  minhaPosicao!: google.maps.LatLng;

  listaEnderecos: google.maps.places.AutocompletePrediction[]=[]

  private autoComplete = new google.maps.places.AutocompleteService();
  private directions = new google.maps.DirectionsService();
  private directionsRender = new google.maps.DirectionsRenderer();

  constructor(private ngZone: NgZone) {}

    async exibirMapa(){
       // The location of Uluru
  const position = { lat: -5.473844, lng: -45.568046 };

  // Request needed libraries.
  //@ts-ignore
  const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;


  // The map, centered at Uluru
  this.map = new Map(
    this.mapRef.nativeElement,
    {
      zoom: 4,
      center: position,
      mapId: 'DEMO_MAP_ID',
    }
  );

  /* The marker, positioned at Uluru

  */


    this.buscarLocalizacao();}


    ionViewWillEnter(){
      this.exibirMapa();
    }

    async buscarLocalizacao(){

      const coordinates = await Geolocation.getCurrentPosition({enableHighAccuracy: true});

      console.log('Current position:', coordinates);

      this.minhaPosicao = new google.maps.LatLng({
        lat: coordinates.coords.latitude,
        lng: coordinates.coords.longitude
        });

        this.map.setCenter(this.minhaPosicao);

        this.map.setZoom(18);

        this.adicionaMarcador(this.minhaPosicao);

    }

   async adicionaMarcador(position: google.maps.LatLng){
      const { AdvancedMarkerElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;
      const marker = new AdvancedMarkerElement({
        map: this.map,
        position: position,
        title: 'Marcador'
      });
    }

  //Buscar endereços no Maps
  buscarEndereco(valorBusca: any){
    //Pega o valor digitado no HTML e converte em string
    const busca = valorBusca.target.value as string;


    //Lembrando que 0 representa FALSE
    if(!busca.trim().length){// Verifica se veio texto na busca.
      this.listaEnderecos = []; // Se não tem busca, limpa a lista
      return false; // encerra a função.
    }

    //Busca o endereço no Maps.
    this.autoComplete.getPlacePredictions(
      {input: busca}, //Envia o valor da busca para o maps
      (arrayLocais, status) =>{
        if(status == 'OK') { // Se tiver retorno da busca
          this.ngZone.run(()=>{ // Avisa ao HTML que tem mudança
            // Atribui o retorno a lista se ela possuir valores
            this.listaEnderecos = arrayLocais ? arrayLocais : [];
            console.log(this.listaEnderecos);
          });
        } else {
          //Se deu erro na busca, limpa a lista.
          this.listaEnderecos = [];
        }
      }
    );
      return true;
  }

  tracarRotar(local: google.maps.places.AutocompletePrediction){
    this.listaEnderecos = []; //Limpa a lista de busca

    //COnverte o texto do endereço para uma posição do GPS
    new google.maps.Geocoder().geocode({address: local.description}, resultado => {
      this.adicionaMarcador(resultado![0].geometry.location); // Adiciona o marcador no local
      
      // Cria a configuração da rota 
      const rota: google.maps.DirectionsRequest = {
        origin: this.minhaPosicao,
        destination: resultado![0].geometry.location,
        unitSystem: google.maps.UnitSystem.METRIC,
        travelMode: google.maps.TravelMode.DRIVING
      }

      //Traça a rota entre os endereços.
      this.directions.route(rota, (resultado, status)=>{
        if(status == 'OK'){
          //Desenha a rota no mapa.
          this.directionsRender.setMap(this.map);
          this.directionsRender.setOptions({suppressMarkers: true});
          this.directionsRender.setDirections(resultado);
        }
      })
    });


  }

}
