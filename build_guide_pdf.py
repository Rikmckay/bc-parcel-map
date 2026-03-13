"""Build LotLine BC User Guide PDF."""
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)

NAVY = HexColor("#1e3a5f")
BLUE = HexColor("#3b82f6")
LIGHT_BLUE = HexColor("#dbeafe")
GRAY = HexColor("#6b7280")
LIGHT_GRAY = HexColor("#f3f4f6")
DARK = HexColor("#1f2937")
WHITE = HexColor("#ffffff")

output_path = r"C:\Users\Ross McKay\bc-parcel-map\LotLine-BC-Guide.pdf"

doc = SimpleDocTemplate(
    output_path,
    pagesize=letter,
    topMargin=0.75 * inch,
    bottomMargin=0.75 * inch,
    leftMargin=0.85 * inch,
    rightMargin=0.85 * inch,
)

base = getSampleStyleSheet()

styles = {
    "title": ParagraphStyle(
        "Title", parent=base["Title"],
        fontSize=28, leading=34, textColor=NAVY,
        spaceAfter=4, fontName="Helvetica-Bold",
    ),
    "tagline": ParagraphStyle(
        "Tagline", parent=base["Normal"],
        fontSize=12, leading=16, textColor=GRAY,
        spaceAfter=6, fontName="Helvetica-Oblique",
    ),
    "body": ParagraphStyle(
        "Body", parent=base["Normal"],
        fontSize=10.5, leading=15, textColor=DARK,
        spaceAfter=8, fontName="Helvetica",
    ),
    "h2": ParagraphStyle(
        "H2", parent=base["Heading2"],
        fontSize=16, leading=20, textColor=NAVY,
        spaceBefore=20, spaceAfter=8, fontName="Helvetica-Bold",
    ),
    "h3": ParagraphStyle(
        "H3", parent=base["Heading3"],
        fontSize=12, leading=16, textColor=BLUE,
        spaceBefore=14, spaceAfter=6, fontName="Helvetica-Bold",
    ),
    "bullet": ParagraphStyle(
        "Bullet", parent=base["Normal"],
        fontSize=10.5, leading=15, textColor=DARK,
        leftIndent=18, bulletIndent=6, spaceAfter=4,
        fontName="Helvetica",
    ),
    "numbered": ParagraphStyle(
        "Numbered", parent=base["Normal"],
        fontSize=10.5, leading=15, textColor=DARK,
        leftIndent=18, bulletIndent=6, spaceAfter=4,
        fontName="Helvetica",
    ),
    "tip": ParagraphStyle(
        "Tip", parent=base["Normal"],
        fontSize=10, leading=14, textColor=NAVY,
        leftIndent=12, spaceAfter=8, fontName="Helvetica-Oblique",
    ),
    "url": ParagraphStyle(
        "URL", parent=base["Normal"],
        fontSize=10.5, leading=15, textColor=BLUE,
        spaceAfter=10, fontName="Helvetica",
    ),
    "footer": ParagraphStyle(
        "Footer", parent=base["Normal"],
        fontSize=8, leading=10, textColor=GRAY,
        alignment=TA_CENTER, fontName="Helvetica",
    ),
    "table_header": ParagraphStyle(
        "TableHeader", parent=base["Normal"],
        fontSize=9.5, leading=13, textColor=WHITE,
        fontName="Helvetica-Bold",
    ),
    "table_cell": ParagraphStyle(
        "TableCell", parent=base["Normal"],
        fontSize=9.5, leading=13, textColor=DARK,
        fontName="Helvetica",
    ),
    "table_cell_bold": ParagraphStyle(
        "TableCellBold", parent=base["Normal"],
        fontSize=9.5, leading=13, textColor=DARK,
        fontName="Helvetica-Bold",
    ),
}

story = []

def hr():
    return HRFlowable(width="100%", thickness=0.5, color=HexColor("#e5e7eb"), spaceAfter=12, spaceBefore=6)

def make_table(header_row, data_rows, col_widths=None):
    """Build a styled table with header and data rows."""
    all_rows = [header_row] + data_rows
    t = Table(all_rows, colWidths=col_widths, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9.5),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
        ("TOPPADDING", (0, 0), (-1, 0), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("BACKGROUND", (0, 1), (-1, -1), WHITE),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_GRAY]),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -1), 9.5),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 6),
        ("TOPPADDING", (0, 1), (-1, -1), 6),
        ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#e5e7eb")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    return t

# --- Title ---
story.append(Spacer(1, 40))
story.append(Paragraph("LotLine BC", styles["title"]))
story.append(Paragraph("User Guide", ParagraphStyle(
    "Subtitle", parent=base["Normal"],
    fontSize=18, leading=22, textColor=BLUE,
    spaceAfter=12, fontName="Helvetica",
)))
story.append(Paragraph(
    "Property boundaries for all of British Columbia, in your pocket.",
    styles["tagline"],
))
story.append(Spacer(1, 8))
story.append(Paragraph(
    "LotLine BC is a mobile-friendly web app that overlays property boundary lines on a map "
    "using official ParcelMap BC data. It works province-wide and is designed for realtors, "
    "property buyers, and anyone curious about lot boundaries.",
    styles["body"],
))
story.append(Paragraph(
    '<link href="https://bc-parcel-map.netlify.app" color="#3b82f6">'
    "bc-parcel-map.netlify.app</link>",
    styles["url"],
))
story.append(hr())

# --- Getting Started ---
story.append(Paragraph("Getting Started", styles["h2"]))
story.append(Paragraph(
    "Open the app on your phone or desktop. The map loads centered on Parksville, BC. "
    "You can pan and zoom like any map app. Property boundary lines appear automatically "
    "when you zoom in close enough (zoom level 15+).",
    styles["body"],
))
story.append(Paragraph(
    "Tip: Add it to your home screen for a native app experience -- it works as a PWA.",
    styles["tip"],
))
story.append(hr())

# --- Core Features ---
story.append(Paragraph("Core Features", styles["h2"]))

story.append(Paragraph("Tap a Property", styles["h3"]))
story.append(Paragraph(
    "Tap any parcel on the map to see its details in a bottom panel:",
    styles["body"],
))
bullets = [
    "<b>PID</b> (Parcel Identifier) -- the unique BC property ID",
    "<b>Area</b> in acres, square meters, or square feet",
    "<b>Owner Type</b> (Private, Crown, Municipal, etc.)",
    "<b>Municipality</b>",
    "<b>Plan Number</b> and <b>Parcel Class</b> (when available)",
    "<b>Street Address</b> (auto-looked up from coordinates)",
]
for b in bullets:
    story.append(Paragraph(b, styles["bullet"], bulletText="\u2022"))

story.append(Paragraph("Search", styles["h3"]))
story.append(Paragraph(
    "Type an address or place name in the search bar. Results come from the BC Address "
    "Geocoder. Tap a result to fly to that location.",
    styles["body"],
))

story.append(Paragraph("GPS Location", styles["h3"]))
story.append(Paragraph(
    "Tap the crosshair button (bottom right) to center the map on your current location. "
    "A blue dot shows where you are with an accuracy circle.",
    styles["body"],
))

story.append(Paragraph("Map Layers", styles["h3"]))
story.append(Paragraph(
    "Tap the grid/map button to toggle between <b>street map</b> and <b>satellite imagery</b>.",
    styles["body"],
))
story.append(hr())

# --- Property Action Buttons ---
story.append(Paragraph("Property Action Buttons", styles["h2"]))
story.append(Paragraph(
    "When you tap a parcel, a row of action buttons appears. Swipe left to see them all:",
    styles["body"],
))

action_header = [
    Paragraph("Button", styles["table_header"]),
    Paragraph("What It Does", styles["table_header"]),
]
action_rows = [
    [Paragraph("Share", styles["table_cell_bold"]),
     Paragraph("Copies a direct link to this property. Anyone with the link sees this exact parcel.", styles["table_cell"])],
    [Paragraph("Assessment", styles["table_cell_bold"]),
     Paragraph("Opens BC Assessment's search page and copies the address to your clipboard. Paste it in the search box to look up assessed values, tax info, and sales history.", styles["table_cell"])],
    [Paragraph("Street View", styles["table_cell_bold"]),
     Paragraph("Opens Google Street View at the property location.", styles["table_cell"])],
    [Paragraph("Title", styles["table_cell_bold"]),
     Paragraph("Opens myLTSA login and copies the PID to your clipboard. Log in and paste the PID to search for the title. (Requires a myLTSA account.)", styles["table_cell"])],
    [Paragraph("Zoning", styles["table_cell_bold"]),
     Paragraph("Opens the municipality's GIS/zoning map viewer. Falls back to BC's iMapBC viewer for municipalities without a dedicated zoning map.", styles["table_cell"])],
    [Paragraph("Comps", styles["table_cell_bold"]),
     Paragraph("Opens Realtor.ca's map centered on the property to view nearby listings for comparable analysis.", styles["table_cell"])],
    [Paragraph("Print", styles["table_cell_bold"]),
     Paragraph("Opens a clean, printable property report in a new window. Print it or save as PDF.", styles["table_cell"])],
    [Paragraph("Save", styles["table_cell_bold"]),
     Paragraph("Bookmarks the property for quick access later. Saved properties are stored on your device.", styles["table_cell"])],
]
story.append(make_table(action_header, action_rows, col_widths=[1.1 * inch, 5.0 * inch]))
story.append(hr())

# --- Tools ---
story.append(Paragraph("Tools", styles["h2"]))

story.append(Paragraph("ALR Overlay", styles["h3"]))
story.append(Paragraph(
    "Tap the leaf/droplet button to toggle the <b>Agricultural Land Reserve</b> overlay. "
    "Green-shaded areas are within the ALR. A legend appears in the bottom left. Works at zoom level 12+.",
    styles["body"],
))

story.append(Paragraph("Measure Tool", styles["h3"]))
story.append(Paragraph(
    "Tap the ruler button to enter measure mode. Tap points on the map to measure distances "
    "between them. The total distance shows in a red bar at the top. Tap \"Clear\" to reset. "
    "Tap the ruler button again to exit.",
    styles["body"],
))

story.append(Paragraph("Bookmarks", styles["h3"]))
story.append(Paragraph(
    "Tap the bookmark button (right side) to open your saved properties list. Tap any saved "
    "property to fly to it and load its details. Tap the X to remove a bookmark.",
    styles["body"],
))
story.append(hr())

# --- Sharing a Property ---
story.append(Paragraph("Sharing a Property", styles["h2"]))
steps = [
    "Tap a parcel to select it",
    "Tap <b>Share</b>",
    "A link is copied to your clipboard",
    "Send the link to anyone -- they'll see that exact property when they open it",
]
for i, step in enumerate(steps, 1):
    story.append(Paragraph(step, styles["numbered"], bulletText=f"{i}."))
story.append(hr())

# --- Tips ---
story.append(Paragraph("Tips", styles["h2"]))
tips = [
    "<b>Zoom in</b> to see property boundaries. They load automatically at zoom level 15+.",
    "<b>Large areas:</b> If you see a \"Zoom in for complete coverage\" message, the view contains too many parcels. Zoom in for full data.",
    "<b>Works offline-ish:</b> Bookmarks and recent map tiles are cached on your device, but parcel data requires an internet connection.",
    "<b>Data source:</b> All property data comes from ParcelMap BC via the BC Open Government Licence. Boundary lines are official cadastral data.",
]
for t in tips:
    story.append(Paragraph(t, styles["bullet"], bulletText="\u2022"))
story.append(hr())

# --- Data Sources ---
story.append(Paragraph("Data Sources", styles["h2"]))

ds_header = [
    Paragraph("Data", styles["table_header"]),
    Paragraph("Source", styles["table_header"]),
]
ds_rows = [
    [Paragraph("Property boundaries", styles["table_cell"]),
     Paragraph("ParcelMap BC WFS", styles["table_cell"])],
    [Paragraph("ALR boundaries", styles["table_cell"]),
     Paragraph("BC ALR Polygons", styles["table_cell"])],
    [Paragraph("Address search", styles["table_cell"]),
     Paragraph("BC Address Geocoder", styles["table_cell"])],
    [Paragraph("Assessed values", styles["table_cell"]),
     Paragraph("BC Assessment", styles["table_cell"])],
    [Paragraph("Street maps", styles["table_cell"]),
     Paragraph("OpenStreetMap", styles["table_cell"])],
    [Paragraph("Satellite imagery", styles["table_cell"]),
     Paragraph("Esri World Imagery", styles["table_cell"])],
]
story.append(make_table(ds_header, ds_rows, col_widths=[2.0 * inch, 4.1 * inch]))

# --- Footer spacer ---
story.append(Spacer(1, 30))
story.append(Paragraph(
    "LotLine BC -- bc-parcel-map.netlify.app -- Data: ParcelMap BC / BC Open Government Licence",
    styles["footer"],
))

# --- Build ---
doc.build(story)
print(f"PDF created: {output_path}")
