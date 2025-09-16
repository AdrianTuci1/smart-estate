// Stiluri personalizate pentru harta - ascunde POI-urile
export const mapStyles = [
  {
    featureType: 'all',
    elementType: 'geometry.fill',
    stylers: [
      {
        color: '#f5f5f5'
      }
    ]
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [
      {
        color: '#c9c9c9'
      }
    ]
  },
  {
    featureType: 'poi',
    elementType: 'all',
    stylers: [
      {
        visibility: 'off'
      }
    ]
  },
  {
    featureType: 'poi.business',
    elementType: 'all',
    stylers: [
      {
        visibility: 'off'
      }
    ]
  },
  {
    featureType: 'poi.attraction',
    elementType: 'all',
    stylers: [
      {
        visibility: 'off'
      }
    ]
  },
  {
    featureType: 'poi.government',
    elementType: 'all',
    stylers: [
      {
        visibility: 'off'
      }
    ]
  },
  {
    featureType: 'poi.medical',
    elementType: 'all',
    stylers: [
      {
        visibility: 'off'
      }
    ]
  },
  {
    featureType: 'poi.park',
    elementType: 'all',
    stylers: [
      {
        visibility: 'off'
      }
    ]
  },
  {
    featureType: 'poi.place_of_worship',
    elementType: 'all',
    stylers: [
      {
        visibility: 'off'
      }
    ]
  },
  {
    featureType: 'poi.school',
    elementType: 'all',
    stylers: [
      {
        visibility: 'off'
      }
    ]
  },
  {
    featureType: 'poi.sports_complex',
    elementType: 'all',
    stylers: [
      {
        visibility: 'off'
      }
    ]
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [
      {
        color: '#ffffff'
      }
    ]
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [
      {
        color: '#616161'
      }
    ]
  }
];

// Stiluri pentru harta cu POI-uri vizibile
export const mapStylesWithPOIs = [
  {
    featureType: 'all',
    elementType: 'geometry.fill',
    stylers: [
      {
        color: '#f5f5f5'
      }
    ]
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [
      {
        color: '#c9c9c9'
      }
    ]
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [
      {
        color: '#757575'
      }
    ]
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [
      {
        color: '#ffffff'
      }
    ]
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [
      {
        color: '#616161'
      }
    ]
  }
];

// Date mock pentru proprietăți
export const mockProperties = [
  {
    id: 1,
    name: 'Complex Rezidențial Aurora',
    address: 'Strada Mihai Viteazu 15, Cluj-Napoca',
    position: { lat: 46.7704, lng: 23.5918 },
    status: 'finalizată',
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400',
    leads: [
      { id: 1, name: 'Maria Popescu', phone: '0721 234 567', interest: '2 camere' },
      { id: 2, name: 'Ion Ionescu', phone: '0722 345 678', interest: '3 camere' }
    ]
  },
  {
    id: 2,
    name: 'Tower Residence',
    address: 'Bulevardul Eroilor 25, Cluj-Napoca',
    position: { lat: 46.7710, lng: 23.5925 },
    status: 'în construcție',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400',
    leads: [
      { id: 3, name: 'Ana Dumitrescu', phone: '0723 456 789', interest: '1 cameră' }
    ]
  },
  {
    id: 3,
    name: 'Garden View Apartments',
    address: 'Strada Memorandumului 8, Cluj-Napoca',
    position: { lat: 46.7695, lng: 23.5905 },
    status: 'finalizată',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400',
    leads: [
      { id: 4, name: 'Petru Marinescu', phone: '0724 567 890', interest: '4 camere' },
      { id: 5, name: 'Elena Radu', phone: '0725 678 901', interest: '2 camere' }
    ]
  }
];
