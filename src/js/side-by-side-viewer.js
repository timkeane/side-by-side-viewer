const tilesets = {
  'nyc basemap': [
    {type: 'raster', url: 'https://maps.nyc.gov/xyz/1.0.0/carto/basemap/{z}/{x}/{y}.jpg'},
    {type: 'raster', url: 'https://maps.nyc.gov/xyz/1.0.0/carto/label/{z}/{x}/{y}.png8'}
  ],
  'old citymap': null,
  'esri mvt': null,
  'mapbox': [{type: 'vector', url: 'mapbox://styles/mapbox/streets-v11'}]
};

const state = {
  ids: {},
  sources: [[], []],
  layers: [[], []],
  maps: [
    new mapboxgl.Map({
      container: 'map0',
      center: [-73.97762459489803, 40.70598998510744],
      zoom: 9
    }),
    new mapboxgl.Map({
      container: 'map1',
      center: [-73.97762459489803, 40.70598998510744],
      zoom: 9
    })
  ]
};

const nextId = idType => {
  state.ids[idType] = state.ids[idType] ? state.ids[idType] + 1 : 1;
  return idType + state.ids[idType];
}

const addTiles = num => {
  const map = state.maps[num];
  const tileset = $('#tileset' + num).val();
  
  // map.removeLayer();
  // map.removeSource();

  // state.sources[num].empty();
  // state.layers[num].empty();

  tilesets[tileset].forEach(ts => {
    const type = ts.type;
    const url = ts.url;
    if (type === 'vector') {
      map.setStyle(url);
    } else {
      const srcId = nextId('source');
      const lyrId = nextId('layer');
      map.addSource(srcId, {
        type,
        tileSize: 256,
        tiles: [url]
      });
      map.addLayer({
        id: lyrId, 
        type: 'raster',
        source: srcId,
        minzoom: 8,
        maxzoom: 21
      });
    }
  });
}

const track = event => {
  const lead = event.target;
  const follow = lead.follow;
  follow.off('move', track);
  follow.setCenter(lead.getCenter());
  follow.setZoom(lead.getZoom());
  follow.on('move', track);
}

state.maps[0].on('move', track);
state.maps[1].on('move', track);
state.maps[0].follow = state.maps[1];
state.maps[1].follow = state.maps[0];

addTiles(0);
addTiles(1);

class MbLocator extends nyc.MapLocator {
  constructor(map) {
    super();
    this.map = map;
  }
  zoomLocation (data, callback) {
    console.warn({data});
    this.map.setCenter(proj4('EPSG:3857', 'EPSG:4326', data.coordinate));
    this.map.setZoom(15);
  }
}

const geocoder = new nyc.Geoclient({
  url: 'https://maps.nyc.gov/geoclient/v2/search.json?app_key=74DF5DB1D7320A9A2&app_id=nyc-lib-example'
});

const geolocate = {on: () =>{}};
const projection = 'EPSG:4326';

new nyc.LocationMgr({
  mapLocator: new MbLocator(state.maps[0]),
  search: new nyc.Search('#search'),
  locator: new nyc.Locator({geocoder}),
  geolocate
});

