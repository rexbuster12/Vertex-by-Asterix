// BMU Clubs & Sports Classification Constants

export const COMMUNITY_CLUBS = [
  "NSS BMU",
  "SAVERA",
  "YRC – Youth Red Cross",
]

export const REGULAR_CLUBS = [
  "ACM- Association for Computing Machinery",
  "Agraga- The HR & IR Club",
  "Automobile Club",
  "Blaze- Fashion Society",
  "BMU Robotics Club",
  "Culinary Club",
  "Enactus BMU",
  "Finonomics Club",
  "Insights Club",
  "LIQuID",
  "Mrityunjaya: The Theatre Society",
  "Nazariya",
  "PAC – Photography & Cinematography Club",
  "PFA – The Performing Arts Club",
  "SATA – Science And Technology Association",
  "Sci-Mat",
  "Sierra",
  "SMC – Social Media Club",
  "Strokes",
  "TSEC – The Startup And Entrepreneurship Club",
  "Wellness Tribe",
]

// 1. Major Club: All 21 Regular Clubs + 3 Community Clubs + "Sports" (24 BMU Clubs + Sports)
export const MAJOR_CLUBS = [
  ...REGULAR_CLUBS,
  ...COMMUNITY_CLUBS,
  "Sports",
]

// 2. Minor Club: 21 Regular Clubs + "Sports" (Without Community Clubs)
export const MINOR_CLUBS = [
  ...REGULAR_CLUBS,
  "Sports",
]

export const ALL_CLUBS = MAJOR_CLUBS



