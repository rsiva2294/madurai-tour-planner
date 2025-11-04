/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { FunctionDeclaration, GoogleGenAI, Type } from '@google/genai';

// Fix: Add declarations for google maps API.
declare const google: any;

// Declare jsPDF from the global scope (loaded via script tag)
declare const jspdf: any;

// Add global declaration for the API key
declare global {
  interface Window {
    GOOGLE_MAPS_API_KEY: string;
  }
}

const { Map } = await google.maps.importLibrary('maps');
const { LatLngBounds } = await google.maps.importLibrary('core');
const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary(
  'marker',
);
const { Place } = await google.maps.importLibrary('places');

// --- LOCAL DATA SOURCE (Provided by User) ---
const MADURAI_PLACES_DATA = [
  {
    place_name: 'Sri Meenakshi Sundareswarar Temple',
    google_name: 'Meenakshi Amman Temple',
    timings: '5:00 AM to 12:30 PM and 4:00 PM to 10:00 PM',
    description:
      'Madurai’s crown jewel and one of India’s most celebrated temples, it features 14 towering gopurams, a 1000-pillared hall, musical columns, and grand festivals like Chithirai Thirukalyanam.',
    address: 'Madurai Main, Madurai, Tamil Nadu 625001',
    plus_code: 'W499+RP Madurai, Tamil Nadu',
    maps_short_link: 'https://maps.app.goo.gl/HgpMZij7Bccodnw56',
    maps_full_link:
      'https://www.google.com/maps/place/Meenakshi+Amman+Temple/@9.9193488,78.117514,18z/data=!4m6!3m5!1s0x3b00c58461e46987:0xf134621ce5286703!8m2!3d9.9195045!4d78.1193418!16s%2Fm%2F026g1j2?entry=ttu&g_ep=EgoyMDI1MTAwNi4wIKXMDSoASAFQAw%3D%3D',
    latitude: '9.919349',
    longitude: '78.117514',
    distance_km: '0.2',
    category: 'Temple',
  },
  {
    place_name: 'Thirumalai Nayakar Mahal',
    google_name: 'Thirumalai Nayakkar Mahal',
    timings: '9:00 AM to 1:00 PM and 1:30 PM to 5:00 PM',
    description:
      'A stunning 17th-century palace blending Dravidian and European styles. Known for its giant arches, courtyard, and evening light & sound show, it showcases the opulence of the Nayak dynasty.',
    address: 'Palace Rd, Mahal Area, Madurai Main, Madurai, Tamil Nadu 625001',
    plus_code: 'W47F+XHJ',
    maps_short_link: 'https://maps.app.goo.gl/VKE8uVCQMKfk5hht5',
    maps_full_link:
      'https://www.google.com/maps/place/Thirumalai+Nayakkar+Mahal/@9.9147211,78.1235013,19.5z/data=!4m6!3m5!1s0x3b00c59d0deefb2b:0xd039b81787074b09!8m2!3d9.9149532!4d78.1238927!16s%2Fg%2F11b7q90fhs?entry=tts&g_ep=EgoyMDI1MTAwNi4wIPu8ASoASAFQAw%3D%3D&skid=97cfc626-ffbd-49f0-851d-785061a24e65',
    latitude: '9.914953',
    longitude: '78.123893',
    distance_km: '0.7',
    category: 'Heritage',
  },
  {
    place_name: 'Vandiyur Mariamman Teppakkulam',
    google_name: 'Vandiyur Maariamman Kovil Theppakulam',
    timings: '6:00 AM to 9:00 PM',
    description:
      'A massive temple tank built in 1645, linked to the Vaigai River. Famous for the Float Festival (Teppam), where deities are carried across the lit-up pond — a mesmerizing sight in January/February.',
    address: 'Mariamman Nagar, Meenakshi Nagar, Madurai, Tamil Nadu 625009',
    plus_code: 'W46X+57G',
    maps_short_link: 'https://maps.app.goo.gl/vbK9byyS1jTtEDpV8',
    maps_full_link:
      'https://www.google.com/maps/place/Vandiyur+Maariamman+Kovil+Theppakulam+-Madurai/@9.9104001,78.1453979,17z/data=!4m6!3m5!1s0x3b00c506f7cc53cd:0xa65259fb05c4f5f7!8m2!3d9.9104431!4d78.1482011!16s%2Fg%2F1td0wxg6?entry=tts&g_ep=EgoyMDI1MTAwNi4wIPu8ASoASAFQAw%3D%3D&skid=99565d8f-3c49-450f-aa81-403a35603a06',
    latitude: '9.910443',
    longitude: '78.148201',
    distance_km: '3.03',
    category: 'Temple',
  },
  {
    place_name: 'Gandhi Memorial Museum',
    google_name: 'Gandhi Memorial Museum',
    timings: '10:00 AM to 1:00 PM and 2:00 PM to 5:45 PM',
    closed_days: 'Friday',
    description:
      'Housed in Rani Mangammal’s palace, this museum showcases India’s freedom struggle and Gandhi’s life. Highlights include Gandhi’s letters, personal artifacts, and the blood-stained cloth from his assassination.',
    address: 'Collector Office Rd, Alwarpuram, Madurai, Tamil Nadu 625020',
    plus_code: 'W4HQ+XC',
    maps_short_link: 'https://maps.app.goo.gl/REbhdGbxN6DySiLR9',
    maps_full_link:
      'https://www.google.com/maps/place/Gandhi+Memorial+Museum/@9.9299573,78.1385754,17z/data=!3m1!4b1!4m6!3m5!1s0x3b00c5bc1cdb0b6d:0x3c7ce8eac00e7387!8m2!3d9.9299573!4d78.1385754!16s%2Fm%2F0h3m835?entry=ttu&g_ep=EgoyMDI1MTAwNi4wIKXMDSoASAFQAw%3D%3D',
    latitude: '9.929957',
    longitude: '78.138575',
    distance_km: '2.41',
    category: 'Museum',
  },
  {
    place_name: 'Koodal Azhagar Temple',
    google_name: 'Arulmigu Koodal Azhagar Temple',
    timings: '5:30 AM to 12:00 PM and 4:00 PM to 9:00 PM',
    description:
      'A 108 Divya Desam temple in the city centre, known for its Dravidian architecture and legends from Silappadikaram. Lord Vishnu is worshipped here as Koodal Azhagar, along with Goddess Madhuravalli.',
    address:
      'Koodal Alagar Perumal Koil Street, Pallivasal Ln, Near Periyar Bus Stand, Periyar, Madurai Main, Madurai, Tamil Nadu 625001',
    plus_code: 'W477+QM8',
    maps_short_link: 'https://maps.app.goo.gl/as3T6Cc9yPQxfaPT8',
    maps_full_link:
      'https://www.google.com/maps/place/Arulmigu+Koodal+Azhagar+Temple/@9.9144189,78.1116202,17z/data=!3m1!4b1!4m6!3m5!1s0x3b00c5804b2b9651:0xeaf7f217a7990866!8m2!3d9.9144189!4d78.1142005!16s%2Fm%2F026mslf?entry=tts&g_ep=EgoyMDI1MTAwNi4wIPu8ASoASAFQAw%3D%3D&skid=7b7e1296-7f12-449b-900a-6d4404108b38',
    latitude: '9.914419',
    longitude: '78.114201',
    distance_km: '1.02',
    category: 'Temple',
  },
  {
    place_name: 'Alagarkoil Temple',
    google_name: 'Arulmigu Kallazhagar Sundararaja Perumal Temple',
    timings: '6:00 AM to 12:30 PM and 3:30 PM to 8:00 PM',
    description:
      'Located amid scenic hills, this Vishnu temple (Kallazhagar) is renowned for its intricate pillars and the grand Chithirai Festival, where the deity’s procession to the Vaigai River attracts thousands.',
    address:
      'Alagar Kovil Main Rd, Alagar Nagar, Ramavarma Nagar, K.Pudur, Tamil Nadu 625301',
    plus_code: '36F7+W6',
    maps_short_link: 'https://maps.app.goo.gl/sQty46v4jimHAAMY8',
    maps_full_link:
      'https://www.google.com/maps/place/Arulmigu+Kallazhagar+Sundararaja+Perumal+Temple/@10.0748476,78.202322,15z/data=!4m7!3m6!1s0x3b00bf39e5cfc2e5:0x8dd0f3238544b80e!8m2!3d10.0748476!4d78.2130549!15sCgthbGFnYXJrb3ZpbFoNIgthbGFnYXJrb3ZpbJIBDGhpbmR1X3RlbXBsZaoBNBABMh8QASIbIg6pAFjzyylBPdHF8wfSYr47_8av_ZsfvvpXMg8QAiILYWxhZ2Fya292aWzgAQA!16zL20vMDRwbGY1?entry=tts&g_ep=EgoyMDI1MTAwNi4wIPu8ASoASAFQAw%3D%3D&skid=9a06b6a8-8741-4a94-a33f-03a8f888717b',
    latitude: '10.074848',
    longitude: '78.213055',
    distance_km: '19.52',
    category: 'Temple',
  },
  {
    place_name: 'Tirupparankunram Murugan Temple',
    google_name: 'Arulmigu Subramaniya Swami Temple, Tirupparankundram',
    timings: '5:30 AM to 1:00 PM and 4:00 PM to 9:00 PM',
    description:
      'One of Murugan’s six abodes, carved from rock and dating to the 8th century. Unique for housing both Shiva and Vishnu sanctums, it symbolizes religious harmony and divine union.',
    address: '146a, Periya Ratha Veethi, Thiruparankundram, Tamil Nadu 625005',
    plus_code: 'V3JC+2G',
    maps_short_link: 'https://maps.app.goo.gl/vFArPHbU5fGNS8rF7',
    maps_full_link:
      'https://www.google.com/maps/place/Arulmigu+Subramaniya+Swami+Temple,+Tirupparankundram/@9.8801051,78.0687752,17z/data=!3m1!4b1!4m6!3m5!1s0x3b00cfce0abf5a1f:0x68aff2db4d1e7c1a!8m2!3d9.8801051!4d78.0713555!16s%2Fm%2F026g0v2?entry=tts&g_ep=EgoyMDI1MTAwNi4wIPu8ASoASAFQAw%3D%3D&skid=b145a015-9578-4186-897d-d4bd094a022a',
    latitude: '9.880105',
    longitude: '78.071356',
    distance_km: '7.06',
    category: 'Temple',
  },
  {
    place_name: "St. Mary's Cathedral",
    google_name: "St. Mary's Cathedral",
    timings: '7:00 AM to 7:00 PM',
    description:
      'A 150-year-old Roman-style church with twin bell towers, originally built as a chapel by Fr. Garnier. Known for its peaceful ambience, striking architecture, and historic significance.',
    address: 'E Veli St, Madurai, Tamil Nadu 625001',
    plus_code: 'W47G+872',
    maps_short_link: 'https://maps.app.goo.gl/ZLFgs2CXCrqnyftB6',
    maps_full_link:
      "https://www.google.com/maps/place/St.+Mary's+Cathedral/@9.9132624,78.1230743,17z/data=!3m1!4b1!4m6!3m5!1s0x3b00c423e48f6cbf:0x31adac7f092aa579!8m2!3d9.9132624!4d78.1256546!16s%2Fg%2F122lq3j6?entry=tts&g_ep=EgoyMDI1MTAwNi4wIPu8ASoASAFQAw%3D%3D&skid=6d0a8c78-30ee-4938-b55e-d80282086613",
    latitude: '9.913262',
    longitude: '78.125655',
    distance_km: '0.81',
    category: 'Religious - Church',
  },
  {
    place_name: 'Kazimar Big Mosque (Periya Pallivasal)',
    google_name: 'Kazimar Big Mosque',
    timings: '4:30 AM to 11:00 PM',
    description:
      'Madurai’s oldest mosque, built in 1284 by a descendant of Prophet Muhammad. It houses the Dargah of Hazrats, an Arabic school, and hosts grand annual celebrations in Rajab month.',
    address: 'Kazimar St, Periyar, Madurai Main, Madurai, Tamil Nadu 625001',
    plus_code: 'W477+4M',
    maps_short_link: 'https://maps.app.goo.gl/gdoGVgnsKvjLYqT18',
    maps_full_link:
      'https://www.google.com/maps/place/Kazimar+Big+Mosque/@9.9128155,78.0781799,14z/data=!4m7!3m6!1s0x3b00c581d7d0773b:0x9bf62d7981443494!8m2!3d9.9128155!4d78.1142288!15sChFwZXJpeWEgcGFsbGl2YXNhbFoTIhFwZXJpeWEgcGFsbGl2YXNhbJIBBm1vc3F1ZaoBURABKhUiEXBlcml5YSBwYWxsaXZhc2FsKAAyHxABIhuuPl2jRCFS-9dsL_3NXH2MWIxWg1wi2sjgycsyFRACIhFwZXJpeWEgcGFsbGl2YXNhbOABAA!16s%2Fm%2F0gjd4k1?entry=tts&g_ep=EgoyMDI1MTAwNi4wIPu8ASoASAFQAw%3D%3D&skid=c9bef31f-ca8a-4021-a849-edfef5d5760f',
    latitude: '9.912816',
    longitude: '78.114229',
    distance_km: '4.57',
    category: 'Religious - Mosque',
  },
  {
    place_name: 'Keeladi Museum',
    google_name: 'Keeladi Museum',
    timings: '10:00 AM to 06:00 PM',
    closed_days: 'Tuesday',
    description:
      'An archaeological museum near Madurai showcasing artifacts from the Keeladi excavation, revealing the advanced urban life and rich Tamil civilization of the Sangam era.',
    address: 'excavation Site, Keeladi, Tamil Nadu 630612',
    plus_code: 'V57M+CXM',
    maps_short_link: 'https://maps.app.goo.gl/SoB4xqT9eivY6r6p8',
    maps_full_link:
      'https://www.google.com/maps/place/Keeladi+Museum/@9.8634537,78.1845445,19.74z/data=!4m6!3m5!1s0x3b00db2035594243:0xff1c130600ee67cb!8m2!3d9.863592!4d78.1850176!16s%2Fg%2F11h6k8_ldg?entry=tts&g_ep=EgoyMDI1MTAwNi4wIPu8ASoASAFQAw%3D%3D&skid=12d4ca22-f915-4192-873b-273362f127c4',
    latitude: '9.863592',
    longitude: '78.185018',
    distance_km: '9.48',
    category: 'Museum',
  },
  {
    place_name: 'Pazhamudhirsolai (Solaimalai Mandapam)',
    google_name: 'Arulmigu Solaimalai Murugan Temple, Pazhamudircholai',
    timings: '5:30 AM to 1:00 PM and 4:00 PM to 9:00 PM',
    description:
      'One of Lord Muruga’s six sacred abodes, located atop a forested hill. The temple is associated with the poet Avvaiyar and celebrates vibrant festivals like Kanda Sashti and Vaikasi Visakam.',
    address: 'Alagar Koil Rd, Alagar Hills R.F, Tamil Nadu 625301',
    plus_code: '36VF+P87',
    maps_short_link: 'https://maps.app.goo.gl/ZDt3KtsgzyiDpyzP7',
    maps_full_link:
      'https://www.google.com/maps/place/Arulmigu+Solaimalai+Murugan+Temple,+Pazhamudircholai/@10.0942972,78.2207304,17z/data=!3m1!4b1!4m6!3m5!1s0x3b00bedfc1738841:0x47119124010d45d3!8m2!3d10.0942972!4d78.2233107!16s%2Fm%2F026g1r_?entry=tts&g_ep=EgoyMDI1MTAwNi4wIPu8ASoASAFQAw%3D%3D&skid=ceea74a0-09ca-421c-9725-53a33e477b53',
    latitude: '10.094297',
    longitude: '78.223311',
    distance_km: '22.38',
    category: 'Temple',
  },
  {
    place_name: 'Samanar Hill (Keelakuyilkudi)',
    google_name: 'Samanar Hill, Keelakuyilkudi',
    timings: 'Before Sunset',
    description:
      'An ancient Jain site near Madurai with rock-cut sculptures, cave temples, and centuries-old inscriptions. The serene landscape with lotus ponds makes it a perfect mix of history and tranquility.',
    address: 'Kilakuyilkudi, Tamil Nadu 625019',
    plus_code: 'W2FX+W59',
    maps_short_link: 'https://maps.app.goo.gl/1eFwbExp9Z3HSXYk8',
    maps_full_link:
      'https://www.google.com/maps/place/Samanar+Hill,+Keelakuyilkudi/@9.9221938,78.0305606,15z/data=!3m1!4b1!4m6!3m5!1s0x3b00ceede662f8fb:0xcea17cbf747a6e2!8m2!3d9.9221943!4d78.0489933!16s%2Fm%2F0_fp0sv?entry=tts&g_ep=EgoyMDI1MTAwNi4wIPu8ASoASAFQAw%3D%3D&skid=a477b50d-cfcd-4a96-b9ea-405e2ade802b',
    latitude: '9.922194',
    longitude: '78.048993',
    distance_km: '9.73',
    category: 'Heritage',
  },
  {
    place_name: 'Thirumohoor Kalamegaperumal Temple',
    google_name: 'Thirumogoor Shri Kalameghaperumal Temple - Madurai',
    timings: '7:00 AM to 12:00 PM and 4:00 PM to 8:00 PM',
    description:
      'One of the 108 Divya Desams dedicated to Lord Vishnu, this temple is famed for its intricate carvings, divine legends, and annual Brahmotsavam festival. It represents both devotion and architectural brilliance.',
    address: 'Thiruvathavur Rd, Tirumohur, Tamil Nadu 625107',
    plus_code: 'X624+8R9',
    maps_short_link: 'https://maps.app.goo.gl/ZziHJyxKPqugQ4QB6',
    maps_full_link:
      'https://www.google.com/maps/place/Thirumogoor+Shri+Kalameghaperumal+Temple+-+Madurai/@9.9507999,78.2071004,17z/data=!3m1!4b1!4m6!3m5!1s0x3b00c3f984504dfd:0x5d78f0b1b270ee48!8m2!3d9.9507999!4d78.2071004!16s%2Fm%2F05mqngg?entry=ttu&g_ep=EgoyMDI1MTAwOC4wIKXMDSoASAFQAw%3D%3D',
    latitude: '9.9508',
    longitude: '78.207100',
    distance_km: '15.5',
    category: 'Temple',
  },
  {
    place_name: 'Puthu Mandapam',
    google_name: 'Puthu Mandapam Madurai',
    timings: '9:00 AM to 9:00 PM',
    description:
      'A historic market near Meenakshi Temple where you can find handicrafts, bangles, souvenirs, and religious items.',
    category: 'Shopping & Local Experience',
    latitude: '9.9189',
    longitude: '78.1197',
  },
];

// --- CONSTANTS ---
const MADURAI_COORDS = { lat: 9.9252, lng: 78.1198 };
const LIGHT_MAP_ID = '4504f8b37365c3d0';
const DARK_MAP_ID = '16c4342273574950'; // A standard dark mode map style
const ROUTE_COLORS = [
  '#4285F4',
  '#DB4437',
  '#F4B400',
  '#0F9D58',
  '#AB47BC',
  '#FF7043',
  '#5C6BC0',
  '#26A69A',
];

// --- APPLICATION STATE ---
let map;
let points = [];
let markers = [];
let lines = [];
let bounds;
let dayPlanItinerary = [];
let selectedPois = new Set();
let dayVisibilityState = {};

// --- DOM ELEMENT REFERENCES ---
const generateButton = document.querySelector('#generate') as HTMLButtonElement;
const resetButton = document.querySelector('#reset') as HTMLButtonElement;
const exportPlanButton = document.querySelector(
  '#export-plan',
) as HTMLButtonElement;
const sharePlanButton = document.querySelector(
  '#share-plan',
) as HTMLButtonElement;
const mapContainer = document.querySelector('#map-container') as HTMLDivElement;
const mapLoader = document.querySelector('#map-loader') as HTMLDivElement;
const mapOverlay = document.querySelector('#map-overlay') as HTMLDivElement;
const spinner = document.querySelector('#spinner') as HTMLDivElement;
const errorMessage = document.querySelector('#error-message') as HTMLDivElement;
const themeToggleButton = document.querySelector(
  '#theme-toggle',
) as HTMLButtonElement;
const daysInput = document.querySelector('#days-input') as HTMLInputElement;
const poiChipsContainer = document.querySelector(
  '#poi-chips-container',
) as HTMLDivElement;
const customPoiInput = document.querySelector(
  '#custom-poi-input',
) as HTMLInputElement;
const zoomControlToggle = document.querySelector(
  '#zoom-control-toggle',
) as HTMLInputElement;
const gestureHandlingToggle = document.querySelector(
  '#gesture-handling-toggle',
) as HTMLInputElement;
const optimizeRouteToggle = document.querySelector(
  '#optimize-route-toggle',
) as HTMLInputElement;
const controlPanel = document.querySelector('#control-panel') as HTMLDivElement;
const collapsePanelButton = document.querySelector(
  '#collapse-panel',
) as HTMLButtonElement;
const showControlsButton = document.querySelector(
  '#show-controls-button',
) as HTMLButtonElement;
const locationCarousel = document.querySelector(
  '#location-carousel',
) as HTMLDivElement;
const cardsContainer = document.querySelector(
  '#cards-container',
) as HTMLDivElement;
const toggleCarouselButton = document.querySelector(
  '#toggle-carousel-button',
) as HTMLButtonElement;
const dayTogglesContainer = document.querySelector(
  '#day-toggles-container',
) as HTMLDivElement;

// --- INITIALIZATION ---
async function initMap() {
  bounds = new LatLngBounds();
  const currentTheme = document.body.getAttribute('data-theme');
  const mapId = currentTheme === 'dark' ? DARK_MAP_ID : LIGHT_MAP_ID;

  map = new Map(document.getElementById('map') as HTMLElement, {
    center: MADURAI_COORDS,
    zoom: 13,
    mapId: mapId,
    gestureHandling: gestureHandlingToggle.checked ? 'greedy' : 'cooperative',
    zoomControl: zoomControlToggle.checked,
    cameraControl: false,
    mapTypeControl: false,
    scaleControl: false,
    streetViewControl: false,
    rotateControl: false,
    fullscreenControl: false,
  });
}

// --- GEMINI API CONFIGURATION ---
const locationFunctionDeclaration: FunctionDeclaration = {
  name: 'location',
  parameters: {
    type: Type.OBJECT,
    description: 'Details of a location to visit.',
    properties: {
      place_name: {
        type: Type.STRING,
        description:
          'The exact "place_name" of the location from the provided list.',
      },
      time: {
        type: Type.STRING,
        description: 'Time to visit (e.g., "09:00").',
      },
      duration: {
        type: Type.STRING,
        description: 'Duration of stay (e.g., "2 hours").',
      },
      sequence: {
        type: Type.NUMBER,
        description: 'Order in the day itinerary (1 = first stop).',
      },
      day: {
        type: Type.NUMBER,
        description: 'The day number in the itinerary (e.g., 1, 2, 3).',
      },
    },
    required: ['place_name', 'day', 'sequence', 'time'],
  },
};

// Create a string of available places for the prompt, including timings
const availablePlacesForPrompt = MADURAI_PLACES_DATA.map((p) => {
  let details = `(Category: ${p.category}, Timings: ${p.timings || 'N/A'}`;
  if (p.closed_days) {
    details += `, Closed: ${p.closed_days}`;
  }
  details += ')';
  return `- "${p.place_name}" ${details}`;
}).join('\n');

const systemInstructions = `You are an expert travel agent specializing in creating detailed, multi-day itineraries for the city of Madurai, Tamil Nadu, India.
Your task is to select places from a PREDEFINED LIST to build a logical and enjoyable itinerary based on user preferences.

**Available Places (DO NOT use any place not on this list):**
${availablePlacesForPrompt}

**Core Responsibilities:**
1.  **Use Only Provided Places:** You MUST exclusively select places from the list above. Match the 'place_name' exactly.
2.  **Respect Operating Hours:** Pay close attention to the 'timings' and 'closed_days' provided for each place. DO NOT schedule visits outside of these hours or on closed days. For example, do not suggest a museum visit at 8:00 AM if it opens at 10:00 AM.
3.  **Adhere to User Preferences:** Build the itinerary using places that match the user's selected categories and any custom-named places if they match a name in the list.
4.  **Logical Sequencing:** Group attractions geographically to minimize travel time. The order of visits within a day should make logistical sense.
5.  **Complete the Plan:** If the user's choices aren't enough for a full day, intelligently add other relevant places from the list to create a complete itinerary.
6.  **Output Format:** Your entire response MUST be a series of 'location' function calls. Do not respond with plain text. For each stop, provide the exact 'place_name', 'day', 'sequence', 'time', and a suggested 'duration'.`;

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- UI & THEME LOGIC ---
function setupUI() {
  // Dynamically populate POI chips from local data categories
  const categories = [
    ...new Set(MADURAI_PLACES_DATA.map((p) => p.category)),
  ]
    .filter(Boolean)
    .sort();
  poiChipsContainer.innerHTML = categories
    .map((poi) => `<div class="poi-chip" data-poi="${poi}">${poi}</div>`)
    .join('');

  // Set theme from localStorage or system preference
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.body.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  // Set map options from localStorage
  const enableZoom = localStorage.getItem('zoomControl') === 'true';
  const enableGreedyGestures =
    localStorage.getItem('gestureHandling') !== 'false'; // Default to true if not set
  zoomControlToggle.checked = enableZoom;
  gestureHandlingToggle.checked = enableGreedyGestures;

  // Disable share button if Web Share API is not supported
  if (!navigator.share) {
    sharePlanButton.disabled = true;
    sharePlanButton.title = 'Web Share API not supported in this browser.';
  }

  // Set initial panel state
  mapContainer.classList.add('map-container-controls-open');
}

function updateThemeIcon(theme) {
  const icon = themeToggleButton.querySelector('i');
  if (icon) {
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  }
}

function showMapLoader() {
  mapLoader.classList.remove('hidden');
}

function hideMapLoader() {
  mapLoader.classList.add('hidden');
}

function adjustMapBoundsWithDelay() {
  if (bounds && map && points.length > 0) {
    showMapLoader();
    setTimeout(() => {
      google.maps.event.addListenerOnce(map, 'idle', () => {
        hideMapLoader();
      });
      map.fitBounds(bounds);
    }, 350);
  }
}

function updateMapOptions() {
  const enableZoom = zoomControlToggle.checked;
  const enableGreedyGestures = gestureHandlingToggle.checked;

  // Save to localStorage for persistence
  localStorage.setItem('zoomControl', String(enableZoom));
  localStorage.setItem('gestureHandling', String(enableGreedyGestures));

  if (map) {
    map.setOptions({
      zoomControl: enableZoom,
      gestureHandling: enableGreedyGestures ? 'greedy' : 'cooperative',
    });
  }
}

async function rebuildMap() {
  if (!map) return;
  showMapLoader();

  // Store current map state
  const oldCenter = map.getCenter();
  const oldZoom = map.getZoom();

  // Clear map div and re-initialize map with new theme
  document.getElementById('map').innerHTML = '';
  await initMap();

  // Restore previous map state
  map.setCenter(oldCenter);
  map.setZoom(oldZoom);

  // Re-attach all markers and polylines to the new map instance
  markers.forEach((marker) => marker.setMap(map));
  lines.forEach((line) => {
    const isVisible = dayVisibilityState[line.day] ?? true;
    line.poly.setMap(isVisible ? map : null);
  });

  // Re-highlight the active elements
  const activeCarouselCard = document.querySelector('.location-card.active');
  if (activeCarouselCard) {
    const activeIndex = parseInt(
      (activeCarouselCard as HTMLElement).dataset.index,
      10,
    );
    if (!isNaN(activeIndex)) {
      highlightCarouselCard(activeIndex);
      highlightMapPin(activeIndex);
    }
  }

  hideMapLoader();
}

// --- EVENT LISTENERS ---
function addEventListeners() {
  generateButton.addEventListener('click', (e) => {
    (e.currentTarget as HTMLButtonElement).classList.add('loading');
    sendText();
  });

  resetButton.addEventListener('click', () => {
    clearResults();
    resetInputs();
  });
  exportPlanButton?.addEventListener('click', exportDayPlan);
  sharePlanButton?.addEventListener('click', shareDayPlan);

  themeToggleButton.addEventListener('click', async () => {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);

    if (map) {
      await rebuildMap();
    }
  });

  poiChipsContainer.addEventListener('click', (e) => {
    const target = e.target as HTMLDivElement;
    if (target.classList.contains('poi-chip')) {
      const poi = target.dataset.poi;
      target.classList.toggle('active');
      if (selectedPois.has(poi)) {
        selectedPois.delete(poi);
      } else {
        selectedPois.add(poi);
      }
    }
  });

  zoomControlToggle.addEventListener('change', updateMapOptions);
  gestureHandlingToggle.addEventListener('change', updateMapOptions);

  collapsePanelButton.addEventListener('click', () => {
    controlPanel.classList.add('collapsed');
    showControlsButton.classList.remove('hidden');
    mapContainer.classList.remove('map-container-controls-open');
    adjustMapBoundsWithDelay();
  });

  showControlsButton.addEventListener('click', () => {
    controlPanel.classList.remove('collapsed');
    showControlsButton.classList.add('hidden');
    mapContainer.classList.add('map-container-controls-open');
    adjustMapBoundsWithDelay();
  });

  toggleCarouselButton.addEventListener('click', (e) => {
    locationCarousel.classList.toggle('hidden');
    mapContainer.classList.toggle('map-container-carousel-open');
    const icon = (e.currentTarget as HTMLElement).querySelector('i');
    if (icon) {
      icon.className = locationCarousel.classList.contains('hidden')
        ? 'fas fa-chevron-up'
        : 'fas fa-chevron-down';
    }
    // Adjust button position and map bounds after transition
    (e.currentTarget as HTMLElement).style.transform =
      locationCarousel.classList.contains('hidden')
        ? 'translateY(-240px)'
        : 'translateY(0)';
    adjustMapBoundsWithDelay();
  });

  dayTogglesContainer.addEventListener('change', (e) => {
    const target = e.target as HTMLInputElement;
    if (target.classList.contains('day-visibility-toggle')) {
      const day = parseInt(target.dataset.day, 10);
      const isVisible = target.checked;
      dayVisibilityState[day] = isVisible;

      lines.forEach((line) => {
        if (line.day === day) {
          line.poly.setMap(isVisible ? map : null);
        }
      });
    }
  });
}

// --- CORE APPLICATION LOGIC ---
function clearResults() {
  points = [];
  bounds = new google.maps.LatLngBounds();
  dayPlanItinerary = [];
  markers.forEach((marker) => marker.setMap(null));
  markers = [];
  lines.forEach((line) => line.poly.setMap(null));
  lines = [];
  dayVisibilityState = {};

  errorMessage.innerHTML = '';
  exportPlanButton.classList.add('hidden');
  sharePlanButton.classList.add('hidden');
  toggleCarouselButton.classList.add('hidden');
  dayTogglesContainer.classList.add('hidden');
  dayTogglesContainer.innerHTML = '';

  cardsContainer.innerHTML = '';
  locationCarousel.classList.add('hidden');
  mapContainer.classList.remove('map-container-carousel-open');
}

function resetInputs() {
  selectedPois.clear();
  document
    .querySelectorAll('.poi-chip.active')
    .forEach((chip) => chip.classList.remove('active'));
  customPoiInput.value = '';
  daysInput.value = '2';
}

function handleError(error: unknown, userMessage: string) {
  // Log the detailed error to the console for debugging.
  console.error('[Itinerary Planner Error]', error);

  // Display a user-friendly message in the UI.
  if (errorMessage) {
    errorMessage.innerHTML = userMessage;
  }
}

/**
 * Uses Google Places API to find coordinates for a given place name.
 * This serves as a fallback for locations not in the local data.
 * @param {string} name The name of the place to search for.
 * @returns {Promise<object>} A promise that resolves to the location details.
 */
async function geocodeLocation(name: string): Promise<any> {
  const request = {
    textQuery: `${name}, Madurai`,
    fields: ['displayName', 'location', 'formattedAddress'],
    locationBias: MADURAI_COORDS,
  };

  const { places } = await Place.searchByText(request);

  if (places && places.length > 0) {
    const place = places[0];
    return {
      name: place.displayName,
      lat: place.location.lat(),
      lng: place.location.lng(),
      address: place.formattedAddress,
    };
  } else {
    throw new Error(`Geocoding failed for "${name}". No results found.`);
  }
}

async function sendText() {
  spinner.classList.remove('hidden');
  errorMessage.innerHTML = '';
  clearResults();

  try {
    const numDays = daysInput.value || '2';
    const customPois = customPoiInput.value.trim();
    const selectedCategories = Array.from(selectedPois);

    if (selectedCategories.length === 0 && !customPois) {
      throw new Error(
        'Please select at least one category or add a custom place.',
      );
    }

    let prompt = `Create a ${numDays}-day itinerary for Madurai.`;
    if (selectedCategories.length > 0) {
      prompt += ` Include places from these categories: ${selectedCategories.join(
        ', ',
      )}.`;
    }
    if (customPois) {
      prompt += ` Also, make sure to include this specific place: ${customPois}.`;
    }

    const response = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstructions,
        temperature: 0.7,
        tools: [{ functionDeclarations: [locationFunctionDeclaration] }],
      },
    });

    let aiItinerarySteps = [];
    for await (const chunk of response) {
      const fns = chunk.functionCalls ?? [];
      for (const fn of fns) {
        if (fn.name === 'location') {
          aiItinerarySteps.push(fn.args);
        }
      }
    }

    if (aiItinerarySteps.length === 0) {
      throw new Error('Could not generate results.');
    }

    // Sort steps logically by day and sequence
    aiItinerarySteps.sort((a, b) => a.day - b.day || a.sequence - b.sequence);

    // STEP 1: Process and geocode all locations from the AI response
    let processedLocations = [];
    for (const step of aiItinerarySteps) {
      let locationData;
      const placeData = MADURAI_PLACES_DATA.find(
        (p) =>
          p.place_name.toLowerCase() === step.place_name.toLowerCase() ||
          p.google_name.toLowerCase() === step.place_name.toLowerCase(),
      );

      if (placeData) {
        locationData = {
          ...step,
          name: placeData.place_name,
          description: placeData.description,
          lat: parseFloat(placeData.latitude),
          lng: parseFloat(placeData.longitude),
          timings: placeData.timings,
          closed_days: placeData.closed_days,
        };
      } else {
        console.warn(
          `AI suggested place "${step.place_name}" not found in local data. Using Places API.`,
        );
        try {
          const geocodedPlace = await geocodeLocation(step.place_name);
          locationData = {
            ...step,
            name: geocodedPlace.name,
            description: `Address: ${
              geocodedPlace.address || 'Not available'
            }`,
            lat: geocodedPlace.lat,
            lng: geocodedPlace.lng,
          };
        } catch (geoError) {
          handleError(
            geoError,
            `Could not find a map location for "${step.place_name}". It will be skipped.`,
          );
          continue; // Skip this step if geocoding fails
        }
      }
      processedLocations.push(locationData);
    }

    // STEP 2: Optimize routes if the user has enabled the feature
    let finalItineraryPlan = processedLocations;
    if (optimizeRouteToggle.checked && processedLocations.length > 0) {
      const spinnerSpan = generateButton.querySelector('.button-text');
      if (spinnerSpan) spinnerSpan.textContent = 'Optimizing Routes...';
      finalItineraryPlan = await optimizeItineraryByDay(processedLocations);
      if (spinnerSpan) spinnerSpan.textContent = 'Generate Itinerary';
    }

    // STEP 3: Set map pins for the final (potentially optimized) itinerary
    for (const location of finalItineraryPlan) {
      setPin(location);
    }

    // STEP 4: Calculate final travel distances and draw routes
    dayPlanItinerary = await calculateDistancesAndTimes(dayPlanItinerary);
    drawAllRoutes();

    // STEP 5: Render the UI
    if (dayPlanItinerary.length > 0) {
      renderCarousel();
      renderDayToggles();
      exportPlanButton.classList.remove('hidden');
      sharePlanButton.classList.remove('hidden');
      toggleCarouselButton.classList.remove('hidden');

      if (window.innerWidth > 768) {
        collapsePanelButton.click();
      }
      adjustMapBoundsWithDelay();
      setActiveLocation(0, true);
    }
  } catch (e) {
    if (e instanceof Error) {
      if (e.message.includes('Please select')) {
        handleError(e, e.message);
      } else if (e.message.includes('Could not generate results')) {
        handleError(
          e,
          "We couldn't create an itinerary from your request. Please try adjusting your selections.",
        );
      } else {
        handleError(
          e,
          'Sorry, an error occurred while generating the itinerary. Please try again later.',
        );
      }
    } else {
      handleError(
        e,
        'An unknown error occurred. Please check the console for details.',
      );
    }
  } finally {
    generateButton.classList.remove('loading');
    spinner.classList.add('hidden');
  }
}

function setPin(args) {
  try {
    if (isNaN(Number(args.lat)) || isNaN(Number(args.lng))) {
      throw new Error(`Invalid coordinates for location: ${args.name}`);
    }
    const point = { lat: Number(args.lat), lng: Number(args.lng) };
    points.push(point);
    bounds.extend(point);

    const pinElement = new PinElement({
      background: '#DB4437', // Default Red
      borderColor: '#A50E0E',
      glyphColor: '#FFFFFF',
    });

    const marker = new AdvancedMarkerElement({
      map,
      position: point,
      title: args.name,
      content: pinElement.element,
    });
    markers.push(marker);

    const locationInfo = {
      ...args,
      position: new google.maps.LatLng(point),
      marker,
      distanceFromPrev: '',
      durationFromPrev: '',
      fromText: '',
    };
    dayPlanItinerary.push(locationInfo);
  } catch (e) {
    console.error('Failed to process and render a location pin. Skipping.', {
      locationArgs: args,
      error: e,
    });
  }
}

/**
 * Fetches route details between two points using the Routes API.
 * @param {object} originLatLng - The origin coordinates {lat, lng}.
 * @param {object} destinationLatLng - The destination coordinates {lat, lng}.
 * @returns {Promise<object|null>} A promise that resolves to the route details or null.
 */
async function fetchRouteDetails(originLatLng, destinationLatLng) {
  const requestBody = {
    origin: {
      location: {
        latLng: {
          latitude: originLatLng.lat,
          longitude: originLatLng.lng,
        },
      },
    },
    destination: {
      location: {
        latLng: {
          latitude: destinationLatLng.lat,
          longitude: destinationLatLng.lng,
        },
      },
    },
    travelMode: 'DRIVE',
    languageCode: 'en-US',
    units: 'METRIC',
  };

  try {
    const response = await fetch(
      'https://routes.googleapis.com/directions/v2:computeRoutes',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': window.GOOGLE_MAPS_API_KEY,
          'X-Goog-FieldMask':
            'routes.duration,routes.distanceMeters,routes.localizedValues',
        },
        body: JSON.stringify(requestBody),
      },
    );

    if (!response.ok) {
      const errorBody = await response.json();
      console.error('Routes API Error:', errorBody);
      throw new Error(`Routes API request failed with status ${response.status}`);
    }

    const data = await response.json();
    if (data.routes && data.routes.length > 0) {
      return data.routes[0];
    }
    return null;
  } catch (e) {
    console.error('Routes API request failed', e);
    return null;
  }
}

async function calculateDistancesAndTimes(itinerary) {
  const meenakshiTemple = MADURAI_PLACES_DATA.find((p) =>
    p.place_name.includes('Meenakshi'),
  );
  const meenakshiTempleCoords = {
    lat: parseFloat(meenakshiTemple.latitude),
    lng: parseFloat(meenakshiTemple.longitude),
  };

  for (let i = 0; i < itinerary.length; i++) {
    const currentItem = itinerary[i];
    let originLatLng;
    let fromText;

    const isFirstOfTheDay = i === 0 || itinerary[i - 1].day !== currentItem.day;

    if (isFirstOfTheDay) {
      originLatLng = meenakshiTempleCoords;
      fromText = 'from Meenakshi Temple';
    } else {
      originLatLng = {
        lat: itinerary[i - 1].position.lat(),
        lng: itinerary[i - 1].position.lng(),
      };
      fromText = `from ${itinerary[i - 1].name}`;
    }

    const destinationLatLng = {
      lat: currentItem.position.lat(),
      lng: currentItem.position.lng(),
    };

    const route = await fetchRouteDetails(originLatLng, destinationLatLng);

    if (route) {
      currentItem.distanceFromPrev =
        route.localizedValues?.distance?.text ??
        `${(route.distanceMeters / 1000).toFixed(1)} km`;
      currentItem.durationFromPrev =
        route.localizedValues?.duration?.text ??
        `${Math.round(parseInt(route.duration.slice(0, -1), 10) / 60)} mins`;
    } else {
      currentItem.distanceFromPrev = 'N/A';
      currentItem.durationFromPrev = 'N/A';
    }
    currentItem.fromText = fromText;
  }
  return itinerary;
}

/**
 * Creates a duration matrix for a given list of locations for route optimization.
 * @param {Array<object>} locations - The locations for a single day.
 * @returns {Promise<Array<Array<number>>>} A 2D array of travel durations in seconds.
 */
async function createDurationMatrix(locations) {
  const size = locations.length;
  const matrix = Array(size)
    .fill(null)
    .map(() => Array(size).fill(Infinity));
  const promises = [];

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (i === j) {
        matrix[i][j] = 0;
      } else {
        const origin = { lat: locations[i].lat, lng: locations[i].lng };
        const destination = { lat: locations[j].lat, lng: locations[j].lng };
        promises.push(
          fetchRouteDetails(origin, destination).then((route) => {
            if (route && route.duration) {
              matrix[i][j] = parseInt(route.duration.slice(0, -1), 10);
            }
          }),
        );
      }
    }
  }

  await Promise.all(promises);
  return matrix;
}

/**
 * Reorders the itinerary for each day to find the most efficient route.
 * @param {Array<object>} itinerary - The full, processed itinerary.
 * @returns {Promise<Array<object>>} The optimized itinerary.
 */
async function optimizeItineraryByDay(itinerary) {
  const locationsByDay = itinerary.reduce((acc, loc) => {
    const day = loc.day;
    if (!acc[day]) acc[day] = [];
    acc[day].push(loc);
    return acc;
  }, {});

  const optimizedPlan = [];

  for (const day in locationsByDay) {
    let dayLocations = locationsByDay[day];

    if (dayLocations.length > 2) {
      const durationMatrix = await createDurationMatrix(dayLocations);

      // Simple greedy (nearest neighbor) algorithm
      const tour = [];
      const startNode = dayLocations[0]; // Keep the first stop fixed
      tour.push(startNode);
      let remaining = dayLocations.slice(1);

      while (remaining.length > 0) {
        const lastInTour = tour[tour.length - 1];
        const lastInTourIndex = dayLocations.indexOf(lastInTour);
        let nearestIndex = -1;
        let minDuration = Infinity;

        remaining.forEach((location) => {
          const locationIndex = dayLocations.indexOf(location);
          const duration = durationMatrix[lastInTourIndex][locationIndex];
          if (duration < minDuration) {
            minDuration = duration;
            nearestIndex = dayLocations.indexOf(location);
          }
        });

        if (nearestIndex !== -1) {
          const nearestNode = dayLocations[nearestIndex];
          tour.push(nearestNode);
          remaining = remaining.filter((loc) => loc !== nearestNode);
        } else {
          // Fallback if no route is found, just add the rest
          tour.push(...remaining);
          break;
        }
      }
      dayLocations = tour;
    }
    optimizedPlan.push(...dayLocations);
  }

  // Re-assign sequence numbers after optimization
  return optimizedPlan.map((loc, index) => ({
    ...loc,
    sequence: index + 1, // This is a temporary sequence for ordering, might need adjustment if we want per-day sequence
  }));
}

async function drawAllRoutes() {
  const locationsByDay = dayPlanItinerary.reduce((acc, loc) => {
    const day = loc.day;
    if (!acc[day]) acc[day] = [];
    acc[day].push(loc);
    return acc;
  }, {});

  for (const day in locationsByDay) {
    const dayLocations = locationsByDay[day];
    if (dayLocations.length > 1) {
      const path = dayLocations.map((loc) => loc.position);
      const dayColor =
        ROUTE_COLORS[(parseInt(day) - 1) % ROUTE_COLORS.length];
      const routePolyline = new google.maps.Polyline({
        path: path,
        strokeColor: dayColor,
        strokeOpacity: 0.8,
        strokeWeight: 4,
        zIndex: 0,
        map: map,
      });
      // Store reference for visibility toggling
      lines.push({ poly: routePolyline, day: parseInt(day) });
    }
  }
  map.fitBounds(bounds);
}

// --- UI RENDERING & MAP INTERACTION ---
function highlightRouteForDay(dayToHighlight: number) {
  lines.forEach((line) => {
    const isTargetDay = line.day === dayToHighlight;
    line.poly.setOptions({
      strokeWeight: isTargetDay ? 8 : 4,
      strokeOpacity: isTargetDay ? 1.0 : 0.5,
      zIndex: isTargetDay ? 1 : 0,
    });
  });
}

function resetAllRoutesToNormal() {
  lines.forEach((line) => {
    line.poly.setOptions({
      strokeWeight: 4,
      strokeOpacity: 0.8,
      zIndex: 0,
    });
  });
}

function renderCarousel() {
  if (!cardsContainer || dayPlanItinerary.length === 0) return;
  cardsContainer.innerHTML = '';
  let currentDay = 0;

  dayPlanItinerary.forEach((item, index) => {
    // Add a day header when the day changes
    if (item.day !== currentDay) {
      currentDay = item.day;
      const dayHeader = document.createElement('div');
      dayHeader.className = 'day-header';
      dayHeader.dataset.day = String(currentDay);
      const dayColor =
        ROUTE_COLORS[(currentDay - 1) % ROUTE_COLORS.length];
      dayHeader.style.setProperty('--day-color', dayColor);
      dayHeader.textContent = `Day ${currentDay}`;

      dayHeader.addEventListener('click', (e) => {
        const clickedHeader = e.currentTarget as HTMLElement;
        const dayToToggle = parseInt(clickedHeader.dataset.day, 10);
        const isCurrentlyExpanded =
          !clickedHeader.classList.contains('collapsed');

        if (isCurrentlyExpanded) {
          // This day is expanded, so we are collapsing it.
          clickedHeader.classList.add('collapsed');
          const cardsToCollapse = cardsContainer.querySelectorAll(
            `.location-card[data-day="${dayToToggle}"]`,
          );
          cardsToCollapse.forEach((card) =>
            card.classList.add('card-collapsed'),
          );

          // Reset all routes since no day is actively expanded now.
          resetAllRoutesToNormal();
        } else {
          // This day is collapsed, so we are expanding it.

          // 1. Collapse all other headers and their cards.
          const allHeaders = cardsContainer.querySelectorAll('.day-header');
          allHeaders.forEach((header) => {
            const day = parseInt((header as HTMLElement).dataset.day, 10);
            if (day !== dayToToggle) {
              header.classList.add('collapsed');
              const cardsToCollapse = cardsContainer.querySelectorAll(
                `.location-card[data-day="${day}"]`,
              );
              cardsToCollapse.forEach((card) =>
                card.classList.add('card-collapsed'),
              );
            }
          });

          // 2. Expand the clicked header and its cards.
          clickedHeader.classList.remove('collapsed');
          const cardsToExpand = cardsContainer.querySelectorAll(
            `.location-card[data-day="${dayToToggle}"]`,
          );
          cardsToExpand.forEach((card) =>
            card.classList.remove('card-collapsed'),
          );

          // 3. Highlight the route for this day on the map.
          highlightRouteForDay(dayToToggle);
        }
      });
      cardsContainer.appendChild(dayHeader);
    }

    const dayColor = ROUTE_COLORS[(item.day - 1) % ROUTE_COLORS.length];
    const card = document.createElement('div');
    card.className = 'location-card';
    card.dataset.index = String(index);
    card.dataset.day = String(item.day);
    card.style.setProperty('--day-color', dayColor);

    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      item.name,
    )}&query_ll=${item.lat},${item.lng}`;

    const travelInfoHtml = item.durationFromPrev
      ? `
      <div class="card-travel-info">
        <i class="fas fa-car"></i>
        <span>${item.durationFromPrev}</span>
        <span class="travel-separator"></span>
        <span>${item.distanceFromPrev}</span>
        <span class="travel-origin">(${item.fromText})</span>
      </div>`
      : '';

    card.innerHTML = `
      <div class="card-header">
        <div class="card-title">${item.name}</div>
        <div class="card-time">${item.time}</div>
      </div>
      <div class="card-description">${item.description}</div>
      ${travelInfoHtml}
      <a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer" class="card-gmaps-link">
        <i class="fas fa-map-marker-alt"></i> View on Google Maps
      </a>
    `;
    card.addEventListener('click', () => setActiveLocation(index));
    cardsContainer.appendChild(card);
  });

  locationCarousel.classList.remove('hidden');
  mapContainer.classList.add('map-container-carousel-open');
}

function renderDayToggles() {
  const uniqueDays = [
    ...new Set(dayPlanItinerary.map((item) => item.day)),
  ].sort((a, b) => a - b);
  if (uniqueDays.length <= 1) return;

  dayTogglesContainer.innerHTML = ''; // Clear previous toggles
  dayVisibilityState = {};

  const togglesTitle = document.createElement('label');
  togglesTitle.textContent = 'Route Visibility';
  dayTogglesContainer.appendChild(togglesTitle);

  uniqueDays.forEach((day) => {
    dayVisibilityState[day] = true; // Default to visible
    const dayColor = ROUTE_COLORS[(day - 1) % ROUTE_COLORS.length];

    const row = document.createElement('div');
    row.className = 'day-toggle-row';
    row.innerHTML = `
      <span>
        <span class="day-color-dot" style="background-color: ${dayColor};"></span>
        Day ${day} Route
      </span>
      <label class="switch">
        <input type="checkbox" class="day-visibility-toggle" data-day="${day}" checked>
        <span class="slider round"></span>
      </label>
    `;
    dayTogglesContainer.appendChild(row);
  });

  dayTogglesContainer.classList.remove('hidden');
}

function setActiveLocation(index: number, centerOnly = false) {
  if (index < 0 || index >= dayPlanItinerary.length) return;

  const location = dayPlanItinerary[index];

  map.panTo(location.position);
  if (!centerOnly) {
    map.setZoom(15);
  }

  highlightCarouselCard(index);
  highlightMapPin(index);
}

function highlightCarouselCard(index: number) {
  if (!cardsContainer) return;
  const cards = cardsContainer.querySelectorAll('.location-card');
  cards.forEach((card) => card.classList.remove('active'));

  const cardToHighlight = cards[index] as HTMLElement;
  if (cardToHighlight) {
    cardToHighlight.classList.add('active');
    cardToHighlight.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  }
}

function highlightMapPin(selectedIndex: number) {
  if (!dayPlanItinerary || dayPlanItinerary.length === 0) return;

  dayPlanItinerary.forEach((location, index) => {
    const isSelected = index === selectedIndex;

    const pinOptions = {
      background: isSelected ? '#4A90E2' : '#DB4437', // Blue for selected, red for default
      borderColor: isSelected ? '#185ABC' : '#A50E0E',
      glyphColor: '#FFFFFF',
      scale: isSelected ? 1.2 : 1.0, // Make selected pin slightly larger
    };

    const pinElement = new PinElement(pinOptions);
    location.marker.content = pinElement.element;
  });
}

function exportDayPlan() {
  if (dayPlanItinerary.length === 0) return;

  const { jsPDF } = jspdf;
  const doc = new jsPDF();
  let y = 15;
  const margin = 15;
  const pageWidth = doc.internal.pageSize.getWidth();
  const usableWidth = pageWidth - 2 * margin;

  const checkPageEnd = (spaceNeeded) => {
    if (y + spaceNeeded > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
  };

  doc.setFontSize(20).setFont(undefined, 'bold');
  doc.text('Your Madurai Itinerary', pageWidth / 2, y, { align: 'center' });
  y += 15;

  let currentDay = 0;
  dayPlanItinerary.forEach((item, index) => {
    if (item.day !== currentDay) {
      currentDay = item.day;
      checkPageEnd(20);
      y += 10;
      doc.setFontSize(16).setFont(undefined, 'bold');
      doc.text(`Day ${currentDay}`, margin, y);
      y += 8;
    }

    checkPageEnd(25);
    doc.setFontSize(12).setFont(undefined, 'bold');

    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      item.name,
    )}&query_ll=${item.lat},${item.lng}`;
    
    // Use a consistent counter for the sequence in the PDF
    const sequenceInDay =
      dayPlanItinerary
        .slice(0, index + 1)
        .filter((loc) => loc.day === item.day).length;
    const titlePrefix = `${sequenceInDay}. `;

    const titleSuffix = ` (${item.time})`;

    doc.text(titlePrefix, margin, y);
    const prefixWidth = doc.getTextWidth(titlePrefix);

    doc.setTextColor(66, 133, 244); // Link color
    doc.textWithLink(item.name, margin + prefixWidth, y, {
      url: googleMapsUrl,
    });

    const nameWidth = doc.getTextWidth(item.name);
    doc.setTextColor(0); // Reset color
    doc.text(titleSuffix, margin + prefixWidth + nameWidth, y);
    y += 6;

    if (item.durationFromPrev) {
      checkPageEnd(10);
      doc.setFontSize(9).setFont(undefined, 'normal').setTextColor(100);
      doc.text(
        `🚗 ${item.durationFromPrev} (${item.distanceFromPrev}) ${item.fromText}`,
        margin,
        y,
      );
      doc.setTextColor(0);
      y += 6;
    }

    doc.setFontSize(10).setFont(undefined, 'normal');
    const descLines = doc.splitTextToSize(item.description, usableWidth);
    doc.text(descLines, margin, y);
    y += descLines.length * 4 + 4;

    if (item.timings) {
      checkPageEnd(10);
      doc.setFont(undefined, 'italic').setTextColor(100);
      let timingsText = `Timings: ${item.timings}`;
      if (item.closed_days) {
        timingsText += ` (Closed: ${item.closed_days})`;
      }
      doc.text(timingsText, margin, y);
      doc.setTextColor(0);
      y += 6;
    }

    if (item.duration) {
      checkPageEnd(10);
      doc.setFont(undefined, 'italic').setTextColor(100);
      doc.text(`Suggested duration: ${item.duration}`, margin, y);
      doc.setTextColor(0);
      y += 6;
    }
  });

  doc.save('Madurai-Itinerary.pdf');
}

async function shareDayPlan() {
  if (dayPlanItinerary.length === 0 || !navigator.share) return;

  let shareText = 'My Madurai Itinerary\n\n';
  let currentDay = 0;

  dayPlanItinerary.forEach((item) => {
    if (item.day !== currentDay) {
      currentDay = item.day;
      shareText += `--- Day ${currentDay} ---\n`;
    }
    shareText += `- ${item.time}: ${item.name}`;
    if (item.durationFromPrev) {
      shareText += ` (${item.durationFromPrev} drive)`;
    }
    shareText += '\n';
  });

  shareText += '\nPlan created with the Madurai Itinerary Planner.';

  try {
    await navigator.share({
      title: 'My Madurai Itinerary',
      text: shareText,
    });
  } catch (error) {
    console.log('Error sharing', error);
  }
}

// --- RUN APPLICATION ---
setupUI();
initMap();
addEventListeners();
