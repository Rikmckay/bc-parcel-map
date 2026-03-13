# LotLine BC - User Guide

**Property boundaries for all of British Columbia, in your pocket.**

LotLine BC is a mobile-friendly web app that overlays property boundary lines on a map using official ParcelMap BC data. It works province-wide and is designed for realtors, property buyers, and anyone curious about lot boundaries.

**Live app**: [bc-parcel-map.netlify.app](https://bc-parcel-map.netlify.app)

---

## Getting Started

Open the app on your phone or desktop. The map loads centered on Parksville, BC. You can pan and zoom like any map app. Property boundary lines appear automatically when you zoom in close enough (zoom level 15+).

**Tip**: Add it to your home screen for a native app experience - it works as a PWA.

---

## Core Features

### Tap a Property
Tap any parcel on the map to see its details in a bottom panel:
- **PID** (Parcel Identifier) - the unique BC property ID
- **Area** in acres, square meters, or square feet
- **Owner Type** (Private, Crown, Municipal, etc.)
- **Municipality**
- **Plan Number** and **Parcel Class** (when available)
- **Street Address** (auto-looked up from coordinates)

### Search
Type an address or place name in the search bar. Results come from the BC Address Geocoder. Tap a result to fly to that location.

### GPS Location
Tap the crosshair button (bottom right) to center the map on your current location. A blue dot shows where you are with an accuracy circle.

### Map Layers
Tap the grid/map button to toggle between **street map** and **satellite imagery**.

---

## Property Action Buttons

When you tap a parcel, a row of action buttons appears. Swipe left to see them all:

| Button | What It Does |
|--------|-------------|
| **Share** | Copies a direct link to this property. Anyone with the link sees this exact parcel. |
| **Assessment** | Opens BC Assessment's map centered on the property for assessed values, tax info, and sales history. |
| **Street View** | Opens Google Street View at the property location. |
| **Title** | Opens LTSA title search and copies the PID to your clipboard. Paste it in LTSA Explorer to look up the title. (Requires an LTSA account.) |
| **Zoning** | Opens the municipality's GIS/zoning map viewer. Available for Parksville, Qualicum Beach, Nanaimo, Victoria, Vancouver, and other mapped municipalities. |
| **Comps** | Opens BC Assessment's map zoomed out to show surrounding properties for comparable analysis. |
| **Print** | Opens a clean, printable property report in a new window. Print it or save as PDF. |
| **Save** | Bookmarks the property for quick access later. Saved properties are stored on your device. |

---

## Tools

### ALR Overlay
Tap the leaf/droplet button to toggle the **Agricultural Land Reserve** overlay. Green-shaded areas are within the ALR. A legend appears in the bottom left. Works at zoom level 12+.

### Measure Tool
Tap the ruler button to enter measure mode. Tap points on the map to measure distances between them. The total distance shows in a red bar at the top. Tap "Clear" to reset. Tap the ruler button again to exit.

### Bookmarks
Tap the bookmark button (right side) to open your saved properties list. Tap any saved property to fly to it and load its details. Tap the X to remove a bookmark.

---

## Sharing a Property

1. Tap a parcel to select it
2. Tap **Share**
3. A link is copied to your clipboard (e.g., `bc-parcel-map.netlify.app?pid=029773202`)
4. Send the link to anyone - they'll see that exact property when they open it

---

## Tips

- **Zoom in** to see property boundaries. They load automatically at zoom level 15+.
- **Large areas**: If you see a "Zoom in for complete coverage" message, the view contains too many parcels. Zoom in for full data.
- **Works offline-ish**: Bookmarks and recent map tiles are cached on your device, but parcel data requires an internet connection.
- **Data source**: All property data comes from ParcelMap BC via the BC Open Government Licence. Boundary lines are official cadastral data.

---

## Data Sources

| Data | Source |
|------|--------|
| Property boundaries | [ParcelMap BC WFS](https://catalogue.data.gov.bc.ca/dataset/parcelmap-bc-parcel-fabric) |
| ALR boundaries | [BC ALR Polygons](https://catalogue.data.gov.bc.ca/dataset/alr-polygons) |
| Address search | [BC Address Geocoder](https://www2.gov.bc.ca/gov/content/data/geographic-data-services/location-services/geocoder) |
| Assessed values | [BC Assessment](https://www.bcassessment.ca/) |
| Street maps | [OpenStreetMap](https://www.openstreetmap.org/) |
| Satellite imagery | [Esri World Imagery](https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9) |
