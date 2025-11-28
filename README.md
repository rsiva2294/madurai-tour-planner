# Madurai AI Itinerary Planner

A smart, interactive travel planner for Madurai, India. This application uses **Google Gemini AI** to generate personalized multi-day itineraries based on your interests and visualizes them on an interactive **Google Map**.

## 🌍 For Users

Welcome to your personal Madurai tour guide! Here is how to use the application:

### How to Plan Your Trip
1.  **Set Duration:** Enter the number of days you plan to stay (1-10 days).
2.  **Choose Interests:** Click on the chips to select what you want to see (e.g., Spiritual, Heritage, Museum).
3.  **Food Preferences:** Click the "Food" chip to select specific cuisines (e.g., Chettinad, Vegetarian, Street Food).
4.  **Generate:** Click **"Generate Itinerary"**. The AI will create a logical schedule, taking into account opening times, geography, and meal breaks.

### Features
*   **Interactive Map:** View your route with color-coded paths for each day. Click on pins to see details.
*   **Itinerary Carousel:** A swipeable card view at the bottom shows details for every stop, including travel time between locations.
*   **Route Toggles:** Toggle the visibility of specific days on the map to reduce clutter.
*   **Surprise Me:** Not sure what to do? Click "Surprise Me" to let the AI randomly pick a duration and interests for you.
*   **Export & Share:** Download your plan as a PDF or share the text summary with friends.
*   **Smart Replacements:** Don't like a specific stop? Click the refresh icon on a location card, and the AI will suggest a geographically convenient alternative.

---

## 💻 For Developers

This project is a single-page application built with TypeScript, CSS, and HTML. It leverages Google's GenAI SDK and Google Maps Platform.

### Tech Stack
*   **Frontend:** Vanilla TypeScript (no framework), HTML5, CSS3 (Variables, Flexbox).
*   **AI Model:** Google Gemini 2.5 Flash via `@google/genai`.
*   **Maps:** Google Maps JavaScript API (Advanced Markers, Routes API, Places Library).
*   **PDF Generation:** `jspdf`.

### Project Structure
*   `index.html`: The main entry point. Loads the Google Maps script and layout.
*   `index.tsx`: Contains the core application logic:
    *   State management (itinerary data, map markers).
    *   Gemini API integration (`sendText`, `handleReplaceLocation`).
    *   Google Maps rendering (Pins, Polylines, Bounds).
    *   UI Event listeners.
*   `index.css`: Material Design 3 inspired styling.
*   `data.ts`: Contains static data (`MADURAI_PLACES_DATA`, `MADURAI_EATERIES_DATA`) used to ground the AI and provide accurate coordinates/metadata.

### API Integration Notes

#### 1. Google Gemini API
The app uses the `@google/genai` SDK.
*   **Initialization:** `const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });`
*   **Logic:** The app uses a "Function Calling" approach (`locationFunctionDeclaration`) to force the AI to return structured JSON data containing place names, times, and sequences, which is then parsed to render the map.
*   **Prompt Engineering:** The system instructions (in `index.tsx`) strictly enforce rules about geographical proximity and timing.

#### 2. Google Maps API
The app requires the following libraries:
*   `maps`: For the base map.
*   `core`: For `LatLngBounds`.
*   `marker`: For `AdvancedMarkerElement` and `PinElement`.
*   `places`: For the `Place` class (used for geocoding fallbacks).

### Setup & Configuration

1.  **Environment Variables:**
    *   The application expects `process.env.API_KEY` to be available for the Gemini Client.
    *   The `index.html` file currently contains a placeholder/hardcoded Google Maps API key. **Replace this with your own key** restricted to your domain.

2.  **Permissions:**
    To ensure the Routes API and Places API work, enable the following in your Google Cloud Console:
    *   Maps JavaScript API
    *   Places API (New)
    *   Routes API

3.  **Local Development:**
    If running locally, ensure your build environment supports TypeScript and ES Modules.

### Customization
To adapt this planner for a different city:
1.  Update `MADURAI_COORDS` in `index.tsx`.
2.  Replace the data in `data.ts` with POIs and Eateries for the new city.
3.  Update the `systemInstructions` in `index.tsx` to reflect the new location context.