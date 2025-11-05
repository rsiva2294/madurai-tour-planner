/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { FunctionDeclaration, GoogleGenAI, Type } from '@google/genai';
import { MADURAI_PLACES_DATA, MADURAI_EATERIES_DATA } from './data';

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

// --- CONSTANTS ---
const MADURAI_COORDS = { lat: 9.9252, lng: 78.1198 };
const LIGHT_MAP_ID = '4504f8b37365c3d0';
const ROUTE_COLORS = [
  '#4285F4', // Blue
  '#DB4437', // Red
  '#F4B400', // Yellow
  '#0F9D58', // Green
  '#AB47BC', // Purple
  '#FF7043', // Orange
  '#5C6BC0', // Indigo
  '#26A69A', // Teal
];
// Darker shades for pin borders for better contrast
const PIN_BORDER_COLORS = [
    '#1A73E8',
    '#C5221F',
    '#F29900',
    '#0B8043',
    '#8E24AA',
    '#F0652E',
    '#3949AB',
    '#00796B'
];


// --- APPLICATION STATE ---
let map;
let points = [];
let markers = [];
let lines = [];
let bounds;
let dayPlanItinerary = [];
let selectedPois = new Set<string>();
let selectedFoodCategories = new Set<string>();
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
const spinner = document.querySelector('#spinner') as HTMLDivElement;
const errorMessage = document.querySelector('#error-message') as HTMLDivElement;
const daysInput = document.querySelector('#days-input') as HTMLInputElement;
const poiChipsContainer = document.querySelector(
  '#poi-chips-container',
) as HTMLDivElement;
const zoomControlToggle = document.querySelector(
  '#zoom-control-toggle',
) as HTMLInputElement;
const gestureHandlingToggle = document.querySelector(
  '#gesture-handling-toggle',
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
const foodModalOverlay = document.querySelector('#food-modal-overlay') as HTMLDivElement;
const foodCategoriesContainer = document.querySelector('#food-categories-container') as HTMLDivElement;
const confirmFoodSelectionButton = document.querySelector('#confirm-food-selection') as HTMLButtonElement;
const cancelFoodSelectionButton = document.querySelector('#cancel-food-selection') as HTMLButtonElement;
const closeModalButton = document.querySelector('#close-modal-btn') as HTMLButtonElement;
const routeVisibilityControl = document.querySelector('#route-visibility-control') as HTMLDivElement;
const routeVisibilityToggleBtn = document.querySelector('#route-visibility-toggle-btn') as HTMLButtonElement;
const routeVisibilityPopover = document.querySelector('#route-visibility-popover') as HTMLDivElement;


// --- INITIALIZATION ---
async function initMap() {
  bounds = new LatLngBounds();

  map = new Map(document.getElementById('map') as HTMLElement, {
    center: MADURAI_COORDS,
    zoom: 13,
    mapId: LIGHT_MAP_ID,
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

// Create a string of available places for the prompt
const availablePlacesForPrompt = MADURAI_PLACES_DATA.map((p) => {
  let details = `(Category: ${p.category}, Timings: ${p.timings || 'N/A'}`;
  if (p.closed_days) {
    details += `, Closed: ${p.closed_days}`;
  }
  details += ')';
  return `- "${p.place_name}" ${details}`;
}).join('\n');

// Create a string of available eateries for the prompt
const availableEateriesForPrompt = MADURAI_EATERIES_DATA.map((e) => {
  return `- "${e.place_name}" (Category: ${e.category}, Specialty: ${e.specialty})`;
}).join('\n');

const systemInstructions = `You are an expert travel agent specializing in creating detailed, multi-day itineraries for the city of Madurai, Tamil Nadu, India.
Your task is to select places and restaurants from PREDEFINED LISTS to build a logical and enjoyable itinerary based on user preferences.

**CRITICAL RULE: ACTIVITY PACING**
- You MUST schedule at least one tourist attraction (from the 'Available Tourist Places' list) between any two food-related stops (from the 'Available Eateries' list).
- IT IS FORBIDDEN to place two eateries consecutively in the itinerary, regardless of whether they are for a meal, snack, or drink.

**Available Tourist Places (DO NOT use any place not on this list):**
${availablePlacesForPrompt}

**Available Eateries (DO NOT use any eatery not on this list):**
${availableEateriesForPrompt}

**Core Responsibilities:**
1.  **Use Only Provided Lists:** You MUST exclusively select places and restaurants from the lists above. Match the 'place_name' exactly.
2.  **Respect Operating Hours:** Pay close attention to the 'timings' and 'closed_days' for tourist places. DO NOT schedule visits outside these hours.
3.  **Include Meal Breaks:** At appropriate times (e.g., ~1:00 PM for lunch, ~8:00 PM for dinner), you MUST insert a meal stop. You may also include short snack/drink stops (like Jigarthanda) at logical times. Select a suitable restaurant from the **Available Eateries** list that aligns with the user's selected food categories.
4.  **Adhere to User Preferences:** Build the itinerary using places and eateries that match the user's selected categories.
5.  **Logical Sequencing & Geographical Proximity:** This is the most important rule. You MUST group attractions and restaurants that are geographically close to each other to minimize travel time. The order of visits within a day must make logistical sense, creating a sensible path through the city. When selecting an eatery for a meal break, prioritize options that are very close to the previous or next tourist attraction. Avoid long-distance travel between consecutive stops within the same day.
6.  **Complete the Plan:** If the user's choices aren't enough for a full day, intelligently add other relevant places or meal stops from the lists to create a complete itinerary.
7.  **Eatery Frequency:** Do not include more than three eateries in a single day's plan. Ideally, include two main meals (lunch and dinner). If you include a third, ensure it's for a different purpose (like a morning coffee/tiffin or an evening snack) and that all three are well-spaced across the day (e.g., one between 8 AM-12 PM, one between 12 PM-4 PM, one between 4 PM-8 PM).
8.  **Output Format:** Your entire response MUST be a series of 'location' function calls for both tourist spots and restaurants. Do not respond with plain text. For each stop, provide the exact 'place_name', 'day', 'sequence', 'time', and a suggested 'duration'.`;

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- UI & THEME LOGIC ---
function setupUI() {
  // Dynamically populate POI chips from local data categories
  const placeCategories = [...new Set(MADURAI_PLACES_DATA.map((p) => p.category))]
    .filter(Boolean)
    .sort();
    
  let chipsHtml = placeCategories
    .map((poi) => `<div class="poi-chip" data-poi="${poi}">${poi}</div>`)
    .join('');
  
  // Add the special "Food" chip
  chipsHtml += `<div class="poi-chip" data-poi="Food" id="food-chip">Food</div>`;
  
  poiChipsContainer.innerHTML = chipsHtml;

  // Populate the food modal
  const eateryCategories = [...new Set(MADURAI_EATERIES_DATA.map((e) => e.category))]
    .filter(Boolean)
    .sort();

  foodCategoriesContainer.innerHTML = eateryCategories
    .map(
      (cat) => `
      <label class="food-category-item">
        <input type="checkbox" name="food-category" value="${cat}">
        <span>${cat}</span>
      </label>
    `,
    )
    .join('');


  // Set map options from localStorage, with sensible defaults
  const enableZoom = localStorage.getItem('zoomControl') === 'true';
  const enableGreedyGestures = localStorage.getItem('gestureHandling') !== 'false'; // Default to true

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

function openFoodModal() {
  // Sync checkboxes with current selections
  const checkboxes = foodCategoriesContainer.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach((cb: HTMLInputElement) => {
    cb.checked = selectedFoodCategories.has(cb.value);
  });
  foodModalOverlay.classList.remove('hidden');
}

function closeFoodModal() {
  foodModalOverlay.classList.add('hidden');
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

  poiChipsContainer.addEventListener('click', (e) => {
    const target = e.target as HTMLDivElement;
    if (target.classList.contains('poi-chip')) {
      const poi = target.dataset.poi;

      if (poi === 'Food') {
        openFoodModal();
        return; // Prevent default chip selection logic
      }

      target.classList.toggle('active');
      if (selectedPois.has(poi)) {
        selectedPois.delete(poi);
      } else {
        selectedPois.add(poi);
      }
    }
  });

  // Add modal event listeners
  confirmFoodSelectionButton.addEventListener('click', () => {
    selectedFoodCategories.clear();
    const checked = foodCategoriesContainer.querySelectorAll<HTMLInputElement>(
      'input[type="checkbox"]:checked',
    );
    checked.forEach((cb) => selectedFoodCategories.add(cb.value));

    const foodChip = document.querySelector('#food-chip');
    if (foodChip) {
      foodChip.classList.toggle('active', selectedFoodCategories.size > 0);
    }
    
    closeFoodModal();
  });

  cancelFoodSelectionButton.addEventListener('click', closeFoodModal);
  closeModalButton.addEventListener('click', closeFoodModal);
  foodModalOverlay.addEventListener('click', (e) => {
      if (e.target === foodModalOverlay) {
          closeFoodModal();
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
       markers.forEach((marker) => {
        if (marker.day === day) {
          marker.setMap(isVisible ? map : null);
        }
      });
    }
  });

    routeVisibilityToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent document click listener from firing immediately
    routeVisibilityPopover.classList.toggle('hidden');
  });

  // Add a delegated event listener for card buttons
  cardsContainer.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;

    // "Show more" button
    if (target.classList.contains('show-more-btn')) {
      e.stopPropagation(); // Prevent card click from firing and panning the map
      const description = target.previousElementSibling;
      if (
        description &&
        description.classList.contains('card-description')
      ) {
        const isExpanded = description.classList.toggle('expanded');
        target.textContent = isExpanded ? 'Show less' : 'Show more';
      }
    }

    // "Replace Location" button
    const replaceBtn = target.closest('.replace-location-btn');
    if (replaceBtn) {
      e.stopPropagation();
      const index = parseInt(replaceBtn.getAttribute('data-index'), 10);
      if (!isNaN(index)) {
        handleReplaceLocation(index);
      }
    }
  });


    // Close popover if clicked outside
  document.addEventListener('click', (e) => {
    if (
      !routeVisibilityPopover.classList.contains('hidden') &&
      !routeVisibilityControl.contains(e.target as Node)
    ) {
      routeVisibilityPopover.classList.add('hidden');
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
  routeVisibilityControl.classList.add('hidden');
  routeVisibilityPopover.classList.add('hidden');
  dayTogglesContainer.innerHTML = '';

  cardsContainer.innerHTML = '';
  locationCarousel.classList.add('hidden');
  mapContainer.classList.remove('map-container-carousel-open');
}

function resetInputs() {
  selectedPois.clear();
  selectedFoodCategories.clear();
  document
    .querySelectorAll('.poi-chip.active')
    .forEach((chip) => chip.classList.remove('active'));
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
 * Parses latitude and longitude from a Google Maps URL.
 * @param {string} url The Google Maps URL.
 * @returns {{lat: number, lng: number} | null} The coordinates or null if not found.
 */
function getLatLngFromGoogleMapsUrl(url: string): { lat: number; lng: number } | null {
  if (!url) return null;

  // Prefer the more specific !3d/!4d parameters if available
  const dataMatch = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (dataMatch && dataMatch[1] && dataMatch[2]) {
    return {
      lat: parseFloat(dataMatch[1]),
      lng: parseFloat(dataMatch[2]),
    };
  }
  
  // Fallback to the @lat,lng format
  const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch && atMatch[1] && atMatch[2]) {
    return {
      lat: parseFloat(atMatch[1]),
      lng: parseFloat(atMatch[2]),
    };
  }

  return null;
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

/**
 * Finds location details from local data or falls back to geocoding.
 * @param {string} placeName - The name of the place to find.
 * @returns {Promise<object|null>} A promise that resolves to the location data or null if not found.
 */
async function findLocationDetails(placeName: string) {
  const stepNameLower = placeName.toLowerCase();
  
  // Check tourist places data first
  const placeData = MADURAI_PLACES_DATA.find(
    (p) =>
      p.place_name.toLowerCase() === stepNameLower ||
      (p.google_name && p.google_name.toLowerCase() === stepNameLower),
  );

  if (placeData) {
    return {
      type: 'poi',
      category: placeData.category,
      name: placeData.place_name,
      description: placeData.description,
      lat: parseFloat(placeData.latitude),
      lng: parseFloat(placeData.longitude),
      timings: placeData.timings,
      closed_days: placeData.closed_days,
      google_maps_url: placeData.maps_full_link,
    };
  }

  // If not a tourist place, check eateries data
  const eateryData = MADURAI_EATERIES_DATA.find(
    (e) => e.place_name.toLowerCase() === stepNameLower,
  );

  if (eateryData) {
    const coords = getLatLngFromGoogleMapsUrl(eateryData.google_maps_url);
    if (coords) {
      return {
        type: 'eatery',
        category: eateryData.category,
        name: eateryData.place_name,
        description: `Must-Try: ${eateryData.specialty}. ${eateryData.notes}`,
        lat: coords.lat,
        lng: coords.lng,
        google_maps_url: eateryData.google_maps_url,
      };
    } else {
      throw new Error(`URL parsing failed for ${eateryData.place_name}`);
    }
  }
  
  // Fallback for places not in any local data
  console.warn(
    `Place "${placeName}" not found in local data. Using Places API as a fallback.`
  );
  try {
    const geocodedPlace = await geocodeLocation(placeName);
    return {
      type: 'poi',
      name: geocodedPlace.name,
      description: `Address: ${geocodedPlace.address || 'Not available'}`,
      lat: geocodedPlace.lat,
      lng: geocodedPlace.lng,
    };
  } catch (geoError) {
    throw geoError;
  }
}


async function sendText() {
  spinner.classList.remove('hidden');
  errorMessage.innerHTML = '';
  clearResults();

  try {
    const numDays = daysInput.value || '2';
    const selectedPlaceCategories = Array.from(selectedPois);
    const selectedFoodPrefs = Array.from(selectedFoodCategories);
    const allSelectedCategories = [...selectedPlaceCategories, ...selectedFoodPrefs];

    if (allSelectedCategories.length === 0) {
      throw new Error(
        'Please select at least one category of interest or food preference.',
      );
    }

    let prompt = `Create a ${numDays}-day itinerary for Madurai.`;
    if (allSelectedCategories.length > 0) {
      prompt += ` Include places and food from these categories: ${allSelectedCategories.join(
        ', ',
      )}.`;
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
        try {
            const locationDetails = await findLocationDetails(step.place_name);
            processedLocations.push({ ...step, ...locationDetails });
        } catch (findError) {
             handleError(
                findError,
                `Could not find a map location for "${step.place_name}". It will be skipped.`,
            );
            continue;
        }
    }
    dayPlanItinerary = processedLocations;


    // STEP 2: Set map pins for the final itinerary
    dayPlanItinerary.forEach(location => {
        setPin(location);
    });

    // STEP 3: Calculate final travel distances
    await calculateDistancesAndTimes(dayPlanItinerary);

    // STEP 4: Draw routes on the map
    drawAllRoutes();

    // STEP 5: Render the UI components
    if (dayPlanItinerary.length > 0) {
      renderCarousel();
      renderDayToggles();
      exportPlanButton.classList.remove('hidden');
      sharePlanButton.classList.remove('hidden');
      toggleCarouselButton.classList.remove('hidden');

      
      collapsePanelButton.click();
      
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

function setPin(location) {
  try {
    if (isNaN(Number(location.lat)) || isNaN(Number(location.lng))) {
      throw new Error(`Invalid coordinates for location: ${location.name}`);
    }
    const point = { lat: Number(location.lat), lng: Number(location.lng) };
    points.push(point);
    bounds.extend(point);
    
    const dayIndex = (location.day - 1) % ROUTE_COLORS.length;
    const dayColor = ROUTE_COLORS[dayIndex];
    const borderColor = PIN_BORDER_COLORS[dayIndex];

    const pinElement = new PinElement({
      background: dayColor,
      borderColor: borderColor,
      glyphColor: '#FFFFFF',
    });

    const marker = new AdvancedMarkerElement({
      map,
      position: point,
      title: location.name,
      content: pinElement.element,
    });
    // Add day property to marker for visibility toggling
    marker.day = location.day;
    markers.push(marker);

    // Add remaining properties to the itinerary item
    location.position = new google.maps.LatLng(point);
    location.marker = marker;
    location.distanceFromPrev = '';
    location.durationFromPrev = '';
    location.fromText = '';
    location.dayColor = dayColor;
    location.borderColor = borderColor;


    // Get the index of the item. It should already be in the dayPlanItinerary.
    const itineraryIndex = dayPlanItinerary.findIndex(item => item === location);
    // Add a click listener to the marker to activate its corresponding carousel card.
    marker.addListener('click', () => {
      setActiveLocation(itineraryIndex);
    });
  } catch (e) {
    console.error('Failed to process and render a location pin. Skipping.', {
      locationArgs: location,
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


async function recalculateRoutesForDay(day: number) {
    const dayLocations = dayPlanItinerary.filter(loc => loc.day === day);
    if (dayLocations.length === 0) return;

    // We need to pass the full itinerary to calculateDistancesAndTimes, but we
    // only want to recalculate for this day. This is a bit inefficient, but
    // calculateDistancesAndTimes is designed for a full pass.
    // A better approach would be to refactor it to work on a subset.
    // For now, let's create a temporary itinerary for calculation.
    
    const itineraryWithDay = [...dayPlanItinerary];
    await calculateDistancesAndTimes(itineraryWithDay);

    // Update the main itinerary with the new values for the specific day
    dayPlanItinerary.forEach(item => {
        if (item.day === day) {
            const updatedItem = itineraryWithDay.find(newItem => newItem.name === item.name && newItem.day === item.day);
            if (updatedItem) {
                item.distanceFromPrev = updatedItem.distanceFromPrev;
                item.durationFromPrev = updatedItem.durationFromPrev;
                item.fromText = updatedItem.fromText;
            }
        }
    });
}


// --- TIME & DURATION HELPERS ---

/**
 * Formats a 24-hour time string ("HH:MM") into a 12-hour AM/PM format.
 * @param {string} timeStr - The 24-hour time string.
 * @returns {string} The formatted 12-hour time string.
 */
function formatTimeTo12Hour(timeStr: string): string {
    if (!timeStr || !timeStr.includes(':')) return timeStr; 
    
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return timeStr;

    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
    
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
}

async function drawAllRoutes() {
  // Clear existing routes
  lines.forEach(line => line.poly.setMap(null));
  lines = [];

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
    const originalDayColor =
      ROUTE_COLORS[(line.day - 1) % ROUTE_COLORS.length];

    line.poly.setOptions({
      strokeWeight: isTargetDay ? 8 : 4,
      strokeOpacity: isTargetDay ? 1.0 : 0.5,
      zIndex: isTargetDay ? 1 : 0,
      strokeColor: isTargetDay ? originalDayColor : '#757575', // Highlight color or grey
    });
  });
}

function resetAllRoutesToNormal() {
  lines.forEach((line) => {
    const originalDayColor =
      ROUTE_COLORS[(line.day - 1) % ROUTE_COLORS.length];
    line.poly.setOptions({
      strokeWeight: 4,
      strokeOpacity: 0.8,
      zIndex: 0,
      strokeColor: originalDayColor,
    });
  });
}

function expandAndHighlightDay(dayToExpand: number) {
  const allHeaders = cardsContainer.querySelectorAll('.day-header');
  allHeaders.forEach((header) => {
    const day = parseInt((header as HTMLElement).dataset.day, 10);
    const shouldCollapse = day !== dayToExpand;
    header.classList.toggle('collapsed', shouldCollapse);

    const cards = cardsContainer.querySelectorAll(
      `.location-card[data-day="${day}"]`,
    );
    cards.forEach((card) =>
      card.classList.toggle('card-collapsed', shouldCollapse),
    );
  });

  highlightRouteForDay(dayToExpand);
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
          // Collapse the clicked day
          clickedHeader.classList.add('collapsed');
          const cardsToCollapse = cardsContainer.querySelectorAll(
            `.location-card[data-day="${dayToToggle}"]`,
          );
          cardsToCollapse.forEach((card) =>
            card.classList.add('card-collapsed'),
          );
          resetAllRoutesToNormal();
        } else {
          // Expand the clicked day (and collapse others)
          expandAndHighlightDay(dayToToggle);
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

    const googleMapsUrl = item.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
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
      
    const typeTagHtml = item.type === 'eatery' 
      ? `<div class="card-type-tag">Food & Drink</div>` 
      : '';
      
    const displayTime = formatTimeTo12Hour(item.time);
    const cardActionsHtml = `
      <div class="card-header-actions">
        <div class="card-time">${displayTime}</div>
        <button class="replace-location-btn" data-index="${index}" aria-label="Replace this location" title="Find a replacement for ${item.name}">
          <i class="fas fa-sync-alt"></i>
        </button>
      </div>
    `;

    card.innerHTML = `
      <div class="card-header">
        <div class="card-title-wrapper">
            <div class="card-title">${item.name}</div>
            ${typeTagHtml}
        </div>
        ${cardActionsHtml}
      </div>
      <div class="card-description-wrapper">
        <div class="card-description">${item.description}</div>
      </div>
      ${travelInfoHtml}
      <a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer" class="card-gmaps-link">
        <i class="fas fa-map-marker-alt"></i> View on Google Maps
      </a>
    `;
    card.addEventListener('click', () => setActiveLocation(index));
    cardsContainer.appendChild(card);

    // After appending, check if the description is overflowing and add a button
    const descriptionEl = card.querySelector(
      '.card-description',
    ) as HTMLElement;
    if (descriptionEl && descriptionEl.scrollHeight > descriptionEl.clientHeight) {
      const wrapper = card.querySelector('.card-description-wrapper');
      const showMoreBtn = document.createElement('button');
      showMoreBtn.className = 'show-more-btn';
      showMoreBtn.textContent = 'Show more';
      wrapper?.appendChild(showMoreBtn);
    }
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

  routeVisibilityControl.classList.remove('hidden');
}

function setActiveLocation(index: number, centerOnly = false) {
  if (index < 0 || index >= dayPlanItinerary.length) return;

  const location = dayPlanItinerary[index];
  
  // Expand the correct day in the carousel before highlighting
  expandAndHighlightDay(location.day);

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
    const { marker, dayColor, borderColor } = location;

    const pinOptions = {
      background: dayColor,
      borderColor: isSelected ? '#2d3748' : borderColor, // Dark border for selected
      glyphColor: '#FFFFFF',
      scale: isSelected ? 1.5 : 1.0, // Make selected pin larger
    };

    const pinElement = new PinElement(pinOptions);
    marker.content = pinElement.element;
    marker.zIndex = isSelected ? 10 : 0; // Ensure selected pin is on top
  });
}

async function handleReplaceLocation(index: number) {
  const card = cardsContainer.querySelector(`.location-card[data-index="${index}"]`);
  if (!card) return;

  card.classList.add('is-replacing');
  errorMessage.innerHTML = '';

  try {
    const locationToReplace = dayPlanItinerary[index];
    const day = locationToReplace.day;
    const allPlaceNames = dayPlanItinerary.map(loc => loc.name);

    const dayLocations = dayPlanItinerary.filter(loc => loc.day === day);
    const locationIndexInDay = dayLocations.findIndex(loc => loc === locationToReplace);

    const prevLocation = locationIndexInDay > 0 ? dayLocations[locationIndexInDay - 1] : null;
    const nextLocation = locationIndexInDay < dayLocations.length - 1 ? dayLocations[locationIndexInDay + 1] : null;

    let replacementPrompt = `The user wants to replace "${locationToReplace.name}" in their itinerary for Madurai on Day ${day}.
It is currently scheduled between "${prevLocation ? prevLocation.name : 'the start of the day'}" and "${nextLocation ? nextLocation.name : 'the end of the day'}".

Suggest ONE alternative from the provided lists.
The replacement MUST be of a similar category to "${locationToReplace.category}".
The new location MUST be geographically convenient to minimize travel disruption.
CRITICAL: DO NOT suggest any of the following places, as they are already in the full itinerary:
${allPlaceNames.join(', ')}

Respond with exactly ONE 'location' function call for the best replacement. The 'day' should be ${day}, and the 'sequence' should be ${locationToReplace.sequence}. Re-estimate a suitable 'time' based on its new position in the day.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: replacementPrompt,
        config: {
            systemInstruction: systemInstructions,
            temperature: 0.8, // Higher temp for more creative replacements
            tools: [{functionDeclarations: [locationFunctionDeclaration]}]
        },
    });

    const fn = response.functionCalls?.[0];
    if (!fn || fn.name !== 'location') {
      throw new Error("Could not find a suitable replacement. Please try again.");
    }

    const replacementStep = fn.args;
    const newLocationDetails = await findLocationDetails(replacementStep.place_name);

    // --- Start state update ---
    // 1. Remove old map objects
    locationToReplace.marker.setMap(null);
    markers = markers.filter(m => m !== locationToReplace.marker);
    
    // 2. Create the new location object
    const newLocation = { ...locationToReplace, ...replacementStep, ...newLocationDetails };
    
    // 3. Update the itinerary array
    dayPlanItinerary[index] = newLocation;

    // 4. Create and set the new pin
    setPin(newLocation);

    // 5. Recalculate routes and redraw
    await recalculateRoutesForDay(day);
    await drawAllRoutes();

    // 6. Update UI
    renderCarousel();
    adjustMapBoundsWithDelay();
    setActiveLocation(index);


  } catch(e) {
    if (e instanceof Error) {
        handleError(e, `Could not find a replacement. Please try again or reset your plan. Error: ${e.message}`);
    } else {
        handleError(e, "An unknown error occurred while finding a replacement.");
    }
  } finally {
    card.classList.remove('is-replacing');
  }
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

    const googleMapsUrl = item.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      item.name,
    )}&query_ll=${item.lat},${item.lng}`;
    
    // Use a consistent counter for the sequence in the PDF
    const sequenceInDay =
      dayPlanItinerary
        .slice(0, index + 1)
        .filter((loc) => loc.day === item.day).length;
    const titlePrefix = `${sequenceInDay}. `;

    const displayTime = formatTimeTo12Hour(item.time);
    const titleSuffix = ` (${displayTime})`;

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
    const displayTime = formatTimeTo12Hour(item.time);
    shareText += `- ${displayTime}: ${item.name}`;
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