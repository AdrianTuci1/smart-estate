// Funcție pentru a crea elementul HTML al overlay-ului
const createOverlayElement = (property, borderColor) => {
  // Creează elementul HTML
  const overlayDiv = document.createElement('div');
  overlayDiv.className = 'property-marker-overlay';
  overlayDiv.style.cssText = `
    position: absolute;
    transform: translate(-50%, -100%);
    pointer-events: none;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 15px;
    will-change: transform;
  `;

  const imageUrl = property.mainImage || '/smartes.png';
  const propertyName = property.name || property.address || 'Proprietate';
  
  overlayDiv.innerHTML = `
    <div style="
      width: 48px;
      height: 48px;
      border-radius: 50%;
      overflow: hidden;
      border: 3px solid ${borderColor};
      background: #f3f4f6;
      margin-bottom: 6px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    ">
      <img 
        src="${imageUrl}" 
        alt="${propertyName}"
        style="width: 100%; height: 100%; object-fit: cover;"
        onerror="this.src='/smartes.png'"
        loading="lazy"
      />
    </div>
    <div style="
      background: #ffffff;
      color: #1f2937;
      padding: 4px 8px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: bold;
      box-shadow: 0 1px 4px rgba(0,0,0,0.2);
      max-width: 120px;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      border: 1px solid ${borderColor};
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    ">
      ${propertyName}
    </div>
  `;
  
  // Adaugă ID unic pentru debugging
  overlayDiv.dataset.propertyId = property.id;
  
  return overlayDiv;
};


export const createEnhancedMarker = (property, map, onMarkerClick, selectedProperty) => {
    if (!window.google || !window.google.maps) return null;
  
    // 1️⃣ Creează marker-ul de bază
    const color ='#00000000';
  
    const marker = new window.google.maps.Marker({
      position: property.position,
      icon: {
        path: "",
        fillColor: color,
        strokeColor: '#00000000',
        anchor: new window.google.maps.Point(12, 24)
      },
      title: property.name || property.address
    });
  
  // 2️⃣ Calculează culoarea bazată pe status și selecție
  const isSelected = selectedProperty && selectedProperty.id === property.id;
  const statusColor = property.status === 'finalizată' ? '#10b981' : '#f59e0b';
  const borderColor = isSelected ? '#3b82f6' : statusColor; // Albastru pentru selecție
  
  // 3️⃣ Creează overlay-ul HTML cu culoarea calculată
  const overlayDiv = createOverlayElement(property, borderColor);
  
  // 3️⃣ Adaugă click handler pe overlay-ul HTML
  if (onMarkerClick) {
    overlayDiv.style.pointerEvents = 'auto';
    overlayDiv.style.cursor = 'pointer';
    overlayDiv.addEventListener('click', (e) => {
      e.stopPropagation();
      onMarkerClick(property);
    });
  }
  
  // 3️⃣ Crează overlay custom Google Maps cu optimizări pentru stabilitate
  class StableOverlay extends google.maps.OverlayView {
    constructor(position, content) {
      super();
      this.position = position;
      this.content = content;
      this.mapReady = false;
      this.isVisible = true;
      this.lastPixel = null; // Ultimă poziție calculată
      this.animationFrame = null;
    }
  
    onAdd() {
      const panes = this.getPanes();
      panes.overlayMouseTarget.appendChild(this.content);
      this.content.style.visibility = "hidden"; // Ascuns inițial până la primul draw
    }
  
    draw() {
      const proj = this.getProjection();
      if (!proj) return;
  
      // Optimizare: calculează poziția doar dacă s-a schimbat
      const pixel = proj.fromLatLngToDivPixel(this.position);
      
      // Verifică dacă poziția s-a schimbat semnificativ (evită micro-ajustări)
      if (this.lastPixel && 
          Math.abs(pixel.x - this.lastPixel.x) < 1 && 
          Math.abs(pixel.y - this.lastPixel.y) < 1) {
        return; // Nu actualiza dacă diferența este mică
      }
      
      this.lastPixel = { x: pixel.x, y: pixel.y };
      
      // Folosește requestAnimationFrame pentru smooth updates
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
      }
      
      this.animationFrame = requestAnimationFrame(() => {
        this.content.style.left = `${pixel.x}px`;
        this.content.style.top = `${pixel.y}px`;
        
        if (!this.mapReady) {
          this.content.style.visibility = this.isVisible ? "visible" : "hidden";
          this.mapReady = true;
        }
      });
    }
  
    onRemove() {
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
      }
      this.content.parentNode?.removeChild(this.content);
    }
  
    setVisible(visible) {
      this.isVisible = visible;
      if (this.mapReady) {
        this.content.style.visibility = visible ? "visible" : "hidden";
      }
    }
    
    // Metodă pentru a actualiza doar vizibilitatea fără re-draw complet
    updateVisibility(visible) {
      if (this.isVisible !== visible) {
        this.isVisible = visible;
        if (this.mapReady) {
          this.content.style.visibility = visible ? "visible" : "hidden";
        }
      }
    }
    
    // Metodă pentru a actualiza culoarea border-ului
    updateBorderColor(newColor) {
      if (this.content) {
        const imageDiv = this.content.querySelector('div');
        const textDiv = this.content.querySelector('div:last-child');
        
        if (imageDiv) {
          imageDiv.style.borderColor = newColor;
        }
        if (textDiv) {
          textDiv.style.borderColor = newColor;
        }
      }
    }
  }
    
    // 4️⃣ Atașează overlay-ul la marker
    const overlay = new StableOverlay(property.position, overlayDiv);
    marker.propertyOverlay = overlay;
    // Vizibilitatea se controlează cu overlay.setVisible(true/false)
  
    return marker;
  };
  