// Complete police station hierarchy data structure
export const POLICE_STATION_HIERARCHY = [
  {
    label: "North District",
    value: "north_district",
    subdivisions: [
      {
        label: "Panaji",
        value: "panaji_sd",
        stations: ["Panaji PS", "Old Goa PS", "Agacaim PS"]
      },
      {
        label: "Mapusa",
        value: "mapusa_sd",
        stations: ["Mapusa PS", "Anjuna PS", "Colvale PS"]
      },
      {
        label: "Bicholim",
        value: "bicholim_sd",
        stations: ["Bicholim PS", "Valpoi PS"]
      },
      {
        label: "Pernem",
        value: "pernem_sd",
        stations: ["Pernem PS", "Mandrem PS", "Mopa PS"]
      },
      {
        label: "Porvorim",
        value: "porvorim_sd",
        stations: ["Porvorim PS", "Calangute PS", "Saligao PS"]
      }
    ]
  },
  {
    label: "South District",
    value: "south_district",
    subdivisions: [
      {
        label: "Margao",
        value: "margao_sd",
        stations: ["Margao Town PS", "Maina Curtorim PS", "Fatorda PS", "Colva PS", "Cuncolim PS"]
      },
      {
        label: "Quepem",
        value: "quepem_sd",
        stations: ["Quepem PS", "Sanguem PS", "Curchorem PS"]
      },
      {
        label: "Vasco",
        value: "vasco_sd",
        stations: ["Vasco PS", "Verna PS", "Dabolim Airport PS", "Mormugao PS", "Vasco Railway PS"]
      },
      {
        label: "Ponda",
        value: "ponda_sd",
        stations: ["Ponda PS", "Mardol PS", "Collem PS"]
      },
      {
        label: "Canacona",
        value: "canacona_sd",
        stations: ["Canacona PS"]
      }
    ]
  },
  {
    label: "Anc",
    value: "anc",
    stations: ["ANCPS"]
  },
  {
    label: "Crime Branch",
    value: "crime_branch",
    stations: ["CBPS"]
  },
  {
    label: "Economic Offence Cell",
    value: "economic_offence_cell",
    stations: ["EOC PS"]
  },
  {
    label: "SIT (Land Grabbing)",
    value: "sit_land_grabbing",
    stations: ["SIT (LAND GRABBING)"],
    isAssignedOnly: true
  },
  {
    label: "Konkan Railway",
    value: "konkan_railway",
    stations: ["Konkan Railway PS"]
  },
  {
    label: "Cyber Crime",
    value: "cyber_crime",
    stations: ["CCPS"]
  },
  {
    label: "Coastal Security",
    value: "coastal_security",
    stations: ["Betul Coastal PS", "Chapora Coastal PS", "Panji Coastal PS", "Tiracol Coastal PS", "Siolim Coastal PS", "Talpona Coastal PS", "Harbour Coastal PS"]
  },
  {
    label: "Women Safety",
    value: "women_safety",
    stations: ["WSPS"]
  }
];
