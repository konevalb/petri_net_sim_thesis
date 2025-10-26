const standardCtx = standardCanvas.getContext('2d');
const riskCanvas = document.getElementById('riskCanvas');
const riskCtx = riskCanvas.getContext('2d');
const mitigatedCanvas = document.getElementById('mitigatedCanvas');
const mitigatedCtx = mitigatedCanvas.getContext('2d');

let cascades = 0;
let standardTotalCost = 0;
let integratedTotalCost = 0;
let mitigatedTotalCost = 0;
let currentFTAProb = 0;
let isSimulating = false;
let simulationInterval = null;
let animationSpeed = 1;
let currentZoom = 1.0;

// Mitigation
const activeMitigations = new Set();
const mitigationConfigs = {
    backup: { cost: 5000, ransomwareReduction: 0.4 },
    firewall: { cost: 3000, ransomwareReduction: 0.35 },
    buffer: { cost: 15000, supplierReduction: 0.8, bufferDays: 30 },
    dual: { cost: 4000, supplierReduction: 0.5 },
    maintenance: { cost: 6000, equipmentReduction: 0.7 },
    redundancy: { cost: 25000, equipmentReduction: 0.8 }
};
let bufferDaysRemaining = 0;
let mitigationSavings = 0;

// Adjustable parameters section
let parameters = {
    ransomwareProb: 0.02,
    equipmentProb: 0.05,
    supplierProb: 0.01,
    cascadeDelay: 800,
    recoveryFactor: 3,
    costMultiplier: 1.0
};

// Token animation tracking
let tokenAnimations = [];

// Traditional Supply Chain Model
const standardPN = {
    places: [
        // Manufacturer column
        { id: 'P1', x: 150, y: 200, tokens: 1, label: 'P₁', name: 'Mfg Normal', type: 'normal' },
        { id: 'P2', x: 150, y: 350, tokens: 0, label: 'P₂', name: 'Mfg Disrupted', type: 'disrupted' },
        { id: 'P3', x: 150, y: 500, tokens: 0, label: 'P₃', name: 'Mfg Recovery', type: 'recovery' },
        
        // Distributor column
        { id: 'P4', x: 300, y: 200, tokens: 1, label: 'P₄', name: 'Dist Normal', type: 'normal' },
        { id: 'P5', x: 300, y: 350, tokens: 0, label: 'P₅', name: 'Dist Disrupted', type: 'disrupted' },
        { id: 'P6', x: 300, y: 500, tokens: 0, label: 'P₆', name: 'Dist Recovery', type: 'recovery' },
        
        // Customer column
        { id: 'P7', x: 450, y: 200, tokens: 1, label: 'P₇', name: 'Cust Normal', type: 'normal' },
        { id: 'P8', x: 450, y: 350, tokens: 0, label: 'P₈', name: 'Cust Impacted', type: 'disrupted' },
        { id: 'P9', x: 450, y: 500, tokens: 0, label: 'P₉', name: 'Cust Recovery', type: 'recovery' }
    ],
    transitions: [
        { id: 'T1', x: 150, y: 275, label: 'T₁', name: 'Physical Fail', enabled: false },
        { id: 'T2', x: 300, y: 275, label: 'T₂', name: 'Physical Fail', enabled: false },
        { id: 'T3', x: 450, y: 275, label: 'T₃', name: 'Impact', enabled: false },
        
        { id: 'T4', x: 225, y: 350, label: 'T₄', name: 'Direct Impact', enabled: false },
        { id: 'T5', x: 375, y: 350, label: 'T₅', name: 'Direct Impact', enabled: false },
        
        { id: 'T6', x: 150, y: 425, label: 'T₆', name: 'Begin Recovery', enabled: false },
        { id: 'T7', x: 300, y: 425, label: 'T₇', name: 'Begin Recovery', enabled: false },
        { id: 'T8', x: 450, y: 425, label: 'T₈', name: 'Begin Recovery', enabled: false },
        
        { id: 'T9', x: 150, y: 575, label: 'T₉', name: 'Restore', enabled: false },
        { id: 'T10', x: 300, y: 575, label: 'T₁₀', name: 'Restore', enabled: false },
        { id: 'T11', x: 450, y: 575, label: 'T₁₁', name: 'Restore', enabled: false }
    ]
};

// Integrated Cyber-Physical Model
const integratedPN = {
    places: [
        // Physical places
        { id: 'P1', x: 150, y: 200, tokens: 1, label: 'P₁', name: 'Mfg Normal', type: 'normal' },
        { id: 'P2', x: 150, y: 350, tokens: 0, label: 'P₂', name: 'Mfg Disrupted', type: 'disrupted' },
        { id: 'P3', x: 150, y: 500, tokens: 0, label: 'P₃', name: 'Mfg Recovery', type: 'recovery' },
        
        { id: 'P4', x: 300, y: 200, tokens: 1, label: 'P₄', name: 'Dist Normal', type: 'normal' },
        { id: 'P5', x: 300, y: 350, tokens: 0, label: 'P₅', name: 'Dist Disrupted', type: 'disrupted' },
        { id: 'P6', x: 300, y: 500, tokens: 0, label: 'P₆', name: 'Dist Recovery', type: 'recovery' },
        
        { id: 'P7', x: 450, y: 200, tokens: 1, label: 'P₇', name: 'Cust Normal', type: 'normal' },
        { id: 'P8', x: 450, y: 350, tokens: 0, label: 'P₈', name: 'Cust Impacted', type: 'disrupted' },
        { id: 'P9', x: 450, y: 500, tokens: 0, label: 'P₉', name: 'Cust Recovery', type: 'recovery' },
        
        // Cyber-physical system states
        { id: 'P10', x: 150, y: 80, tokens: 1, label: 'P₁₀', name: 'IT Systems', type: 'cyber' },
        { id: 'P11', x: 300, y: 80, tokens: 1, label: 'P₁₁', name: 'Production Sys', type: 'cyber' },
        { id: 'P12', x: 450, y: 80, tokens: 1, label: 'P₁₂', name: 'Logistics Sys', type: 'cyber' }
    ],
    transitions: [
        { id: 'T1', x: 150, y: 275, label: 'T₁', name: 'FTA: Ransomware', fta: true, enabled: false },
        { id: 'T2', x: 300, y: 275, label: 'T₂', name: 'FTA: Equipment', fta: true, enabled: false },
        { id: 'T3', x: 450, y: 275, label: 'T₃', name: 'FTA: Supplier', fta: true, enabled: false },
        
        { id: 'T4', x: 225, y: 350, label: 'T₄', name: 'Cyber Cascade', enabled: false },
        { id: 'T5', x: 375, y: 350, label: 'T₅', name: 'Cascade Spread', enabled: false },
        
        { id: 'T6', x: 150, y: 425, label: 'T₆', name: 'Begin Recovery', enabled: false },
        { id: 'T7', x: 300, y: 425, label: 'T₇', name: 'Begin Recovery', enabled: false },
        { id: 'T8', x: 450, y: 425, label: 'T₈', name: 'Begin Recovery', enabled: false },
        
        { id: 'T9', x: 150, y: 575, label: 'T₉', name: 'Restore', enabled: false },
        { id: 'T10', x: 300, y: 575, label: 'T₁₀', name: 'Restore', enabled: false },
        { id: 'T11', x: 450, y: 575, label: 'T₁₁', name: 'Restore', enabled: false },
        
        { id: 'T12', x: 225, y: 140, label: 'T₁₂', name: 'Cyber Attack', cyber: true, enabled: false },
        { id: 'T13', x: 375, y: 140, label: 'T₁₃', name: 'Lateral Move', cyber: true, enabled: false }
    ]
};

// Mitigation-Enhanced Model
const mitigatedPN = JSON.parse(JSON.stringify(integratedPN));

// Add mitigation places
mitigatedPN.places.push(
    { id: 'M1', x: 75, y: 80, tokens: 0, label: 'M₁', name: 'Backup', type: 'mitigation' },
    { id: 'M2', x: 525, y: 80, tokens: 0, label: 'M₂', name: 'Firewall', type: 'mitigation' },
    { id: 'M3', x: 75, y: 350, tokens: 0, label: 'M₃', name: 'Buffer', type: 'mitigation' },
    { id: 'M4', x: 525, y: 350, tokens: 0, label: 'M₄', name: 'Dual Src', type: 'mitigation' },
    { id: 'M5', x: 225, y: 600, tokens: 0, label: 'M₅', name: 'Maint.', type: 'mitigation' },
    { id: 'M6', x: 375, y: 600, tokens: 0, label: 'M₆', name: 'Redund.', type: 'mitigation' }
);

function drawPetriNet(ctx, model, isIntegrated) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Grid background
    ctx.strokeStyle = '#f5f5f5';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < ctx.canvas.width; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, ctx.canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < ctx.canvas.height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(ctx.canvas.width, y);
        ctx.stroke();
    }
    
    // Draw section background
    ctx.fillStyle = 'rgba(44, 62, 80, 0.01)';
    ctx.fillRect(100, 140, 100, 480);  // Manufacturer column
    ctx.fillRect(250, 140, 100, 480);  // Distributor column
    ctx.fillRect(400, 140, 100, 480);  // Customer column
    
    if (isIntegrated) {
        // Cyber layer background
        ctx.fillStyle = 'rgba(155, 89, 182, 0.02)';
        ctx.fillRect(100, 40, 400, 80);
    }
    
    // Headers
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetY = 1;
    
    ctx.font = '700 16px Roboto, sans-serif';
    ctx.fillStyle = '#1a1a1a';
    ctx.textAlign = 'center';
    
    ctx.fillText('MANUFACTURER', 150, 160);
    ctx.fillText('DISTRIBUTOR', 300, 160);
    ctx.fillText('CUSTOMER', 450, 160);
    
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    
    if (isIntegrated) {
        // Cyber layer header
        ctx.font = '700 15px Roboto, sans-serif';
        const gradient = ctx.createLinearGradient(200, 50, 400, 50);
        gradient.addColorStop(0, '#8e44ad');
        gradient.addColorStop(1, '#9b59b6');
        ctx.fillStyle = gradient;
        ctx.fillText('CYBER-PHYSICAL LAYER (FTA-TRIGGERED)', 300, 50);
    }
    
    // Supply chain backbone
    const backboneGradient = ctx.createLinearGradient(150, 200, 450, 200);
    backboneGradient.addColorStop(0, '#cbd5e0');
    backboneGradient.addColorStop(0.5, '#94a3b8');
    backboneGradient.addColorStop(1, '#cbd5e0');
    
    ctx.strokeStyle = backboneGradient;
    ctx.lineWidth = 3;
    ctx.setLineDash([12, 6]);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(150, 200);
    ctx.lineTo(300, 200);
    ctx.lineTo(450, 200);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineCap = 'butt';
    
    // Draw arcs
    drawArcs(ctx, model, isIntegrated);
    
    // Draw places
    model.places.forEach(place => {
        if (place.tokens > 0) {
            const glowGradient = ctx.createRadialGradient(place.x, place.y, 0, place.x, place.y, 30);
            if (place.type === 'cyber') {
                glowGradient.addColorStop(0, 'rgba(155, 89, 182, 0.15)');
                glowGradient.addColorStop(1, 'rgba(155, 89, 182, 0)');
            } else if (place.type === 'normal') {
                glowGradient.addColorStop(0, 'rgba(74, 144, 226, 0.15)');
                glowGradient.addColorStop(1, 'rgba(74, 144, 226, 0)');
            } else if (place.type === 'disrupted') {
                glowGradient.addColorStop(0, 'rgba(231, 76, 60, 0.15)');
                glowGradient.addColorStop(1, 'rgba(231, 76, 60, 0)');
            } else if (place.type === 'recovery') {
                glowGradient.addColorStop(0, 'rgba(243, 156, 18, 0.15)');
                glowGradient.addColorStop(1, 'rgba(243, 156, 18, 0)');
            } else if (place.type === 'mitigation') {
                glowGradient.addColorStop(0, 'rgba(22, 163, 74, 0.15)');
                glowGradient.addColorStop(1, 'rgba(22, 163, 74, 0)');
            }
            ctx.fillStyle = glowGradient;
            ctx.fillRect(place.x - 30, place.y - 30, 60, 60);
        }
        
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        ctx.beginPath();
        ctx.arc(place.x, place.y, 22, 0, 2 * Math.PI);
        
        const placeGradient = ctx.createRadialGradient(place.x - 5, place.y - 5, 0, place.x, place.y, 22);
        placeGradient.addColorStop(0, '#ffffff');
        placeGradient.addColorStop(0.9, '#f8f9fa');
        placeGradient.addColorStop(1, '#e9ecef');
        ctx.fillStyle = placeGradient;
        ctx.fill();
        
        // Border
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        if (place.type === 'cyber') {
            ctx.strokeStyle = '#9b59b6';
        } else if (place.type === 'normal') {
            ctx.strokeStyle = '#4a90e2';
        } else if (place.type === 'disrupted') {
            ctx.strokeStyle = '#e74c3c';
        } else if (place.type === 'recovery') {
            ctx.strokeStyle = '#f39c12';
        } else if (place.type === 'mitigation') {
            ctx.strokeStyle = '#16a34a';
        }
        
        ctx.lineWidth = 2.5;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(place.x, place.y, 18, 0, 2 * Math.PI);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
        
        // Token
        if (place.tokens > 0) {
            ctx.beginPath();
            ctx.arc(place.x, place.y, 7, 0, 2 * Math.PI);
            ctx.fillStyle = '#000000';
            ctx.fill();
        }
        
        // Label with background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(place.x + 23, place.y - 7, 32, 16);
        
        ctx.fillStyle = '#1a1a1a';
        ctx.font = '700 13px Roboto, monospace';
        ctx.textAlign = 'left';
        ctx.fillText(place.label, place.x + 27, place.y + 5);
        
        // Name
        ctx.font = '600 12px Roboto, sans-serif';
        ctx.fillStyle = '#475569';
        ctx.textAlign = 'center';
        
        const nameWidth = ctx.measureText(place.name).width;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillRect(place.x - nameWidth/2 - 3, place.y + 31, nameWidth + 6, 16);
        
        ctx.fillStyle = '#475569';
        ctx.fillText(place.name, place.x, place.y + 43);
    });
    
    // Draw transitions
    model.transitions.forEach(trans => {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        
        // Transition bar
        const transGradient = ctx.createLinearGradient(trans.x - 30, trans.y - 12, trans.x - 30, trans.y + 12);
        if (trans.enabled) {
            transGradient.addColorStop(0, '#e0f2fe');
            transGradient.addColorStop(1, '#bae6fd');
        } else {
            transGradient.addColorStop(0, '#ffffff');
            transGradient.addColorStop(1, '#f1f5f9');
        }
        
        ctx.fillStyle = transGradient;
        ctx.fillRect(trans.x - 30, trans.y - 12, 60, 24);
        
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Border styling based on type
        if (trans.fta) {
            ctx.strokeStyle = '#dc2626';
            ctx.lineWidth = trans.enabled ? 3 : 2;
        } else if (trans.cyber) {
            ctx.strokeStyle = '#9333ea';
            ctx.lineWidth = trans.enabled ? 3 : 2;
        } else {
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = trans.enabled ? 2 : 1.5;
        }
        
        ctx.strokeRect(trans.x - 30, trans.y - 12, 60, 24);
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(trans.x - 28, trans.y - 10, 56, 20);
        
        ctx.fillStyle = '#0f172a';
        ctx.font = '700 12px Roboto, monospace';
        ctx.textAlign = 'left';
        ctx.fillText(trans.label, trans.x + 35, trans.y + 4);
        
        // Transition bar text
        if (trans.enabled) {
            ctx.fillStyle = '#0369a1';
            ctx.font = '500 10px Roboto, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('ACTIVE', trans.x, trans.y + 4);
        }
        
        // Name below
        ctx.font = '600 11px Roboto, sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'center';
        ctx.fillText(trans.name, trans.x, trans.y + 30);
    });
    
    // FTA box for integrated model
    if (isIntegrated) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        const ftaGradient = ctx.createLinearGradient(700, 60, 820, 105);
        ftaGradient.addColorStop(0, '#fef2f2');
        ftaGradient.addColorStop(1, '#fee2e2');
        
        ctx.fillStyle = ftaGradient;
        ctx.fillRect(700, 60, 120, 50);
        
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Border
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 2;
        ctx.strokeRect(700, 60, 120, 50);
        
        // Inner border
        ctx.strokeStyle = 'rgba(220, 38, 38, 0.3)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(702, 62, 116, 46);
        
        // Text
        ctx.fillStyle = '#991b1b';
        ctx.font = '700 14px Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('FTA ANALYSIS', 760, 80);
        
        ctx.font = '500 12px Roboto, sans-serif';
        ctx.fillStyle = '#7f1d1d';
        ctx.fillText('System Failure', 760, 95);
        
        ctx.font = '700 14px Roboto, monospace';
        ctx.fillStyle = '#dc2626';
        ctx.fillText(`P = ${(currentFTAProb * 100).toFixed(1)}%`, 760, 108);
    }
    
    // Draw animated tokens
    drawAnimatedTokens(ctx);
}

function drawArcs(ctx, model, isIntegrated) {
    let arcs = [];
    
    // Check if this is the mitigated model
    const isMitigated = model === mitigatedPN;
    
    if (isIntegrated) {
        arcs = [
            // Normal physical flow
            { from: 'P1', to: 'T1' },
            { from: 'T1', to: 'P2' },
            { from: 'P2', to: 'T6' },
            { from: 'T6', to: 'P3' },
            { from: 'P3', to: 'T9' },
            { from: 'T9', to: 'P1' },
            
            { from: 'P4', to: 'T2' },
            { from: 'T2', to: 'P5' },
            { from: 'P5', to: 'T7' },
            { from: 'T7', to: 'P6' },
            { from: 'P6', to: 'T10' },
            { from: 'T10', to: 'P4' },
            
            { from: 'P7', to: 'T3' },
            { from: 'T3', to: 'P8' },
            { from: 'P8', to: 'T8' },
            { from: 'T8', to: 'P9' },
            { from: 'P9', to: 'T11' },
            { from: 'T11', to: 'P7' },
            
            // Cyber-physical cascade arcs
            { from: 'P10', to: 'T12', cyber: true },
            { from: 'P1', to: 'T12', cyber: true },
            { from: 'T12', to: 'P2', cascade: true },
            
            { from: 'P2', to: 'T4', cascade: true },
            { from: 'T4', to: 'P5', cascade: true },
            
            { from: 'P5', to: 'T5', cascade: true },
            { from: 'T5', to: 'P8', cascade: true },
            
            // Cyber spread
            { from: 'P10', to: 'T13', cyber: true },
            { from: 'T13', to: 'P11', cyber: true },
            { from: 'P11', to: 'P12', cyber: true }
        ];
        
        // Add mitigation arcs if this is the mitigated model
        if (isMitigated) {
            // M1 (Backup) protects against ransomware cascades
            if (activeMitigations.has('backup')) {
                arcs.push({ from: 'M1', to: 'T1', mitigation: true, inhibitor: true });
                arcs.push({ from: 'M1', to: 'T12', mitigation: true, inhibitor: true });
            }
            
            // M2 (Firewall) prevents cyber attacks
            if (activeMitigations.has('firewall')) {
                arcs.push({ from: 'M2', to: 'T12', mitigation: true, inhibitor: true });
                arcs.push({ from: 'M2', to: 'T13', mitigation: true, inhibitor: true });
            }
            
            // M3 (Buffer) provides alternative to supplier disruption
            if (activeMitigations.has('buffer')) {
                arcs.push({ from: 'M3', to: 'P3', mitigation: true });
                arcs.push({ from: 'M3', to: 'T3', mitigation: true, inhibitor: true });
            }
            
            // M4 (Dual Sourcing) provides alternative supply
            if (activeMitigations.has('dual')) {
                arcs.push({ from: 'M4', to: 'P1', mitigation: true });
                arcs.push({ from: 'M4', to: 'T1', mitigation: true, inhibitor: true });
            }
            
            // M5 (Maintenance) prevents equipment failures
            if (activeMitigations.has('maintenance')) {
                arcs.push({ from: 'M5', to: 'T2', mitigation: true, inhibitor: true });
                arcs.push({ from: 'M5', to: 'P4', mitigation: true });
            }
            
            // M6 (Redundancy) provides backup equipment
            if (activeMitigations.has('redundancy')) {
                arcs.push({ from: 'M6', to: 'P4', mitigation: true });
                arcs.push({ from: 'M6', to: 'T2', mitigation: true, inhibitor: true });
            }
        }
    } else {
        arcs = [
            // Normal flow
            { from: 'P1', to: 'T1' },
            { from: 'T1', to: 'P2' },
            { from: 'P2', to: 'T6' },
            { from: 'T6', to: 'P3' },
            { from: 'P3', to: 'T9' },
            { from: 'T9', to: 'P1' },
            
            { from: 'P4', to: 'T2' },
            { from: 'T2', to: 'P5' },
            { from: 'P5', to: 'T7' },
            { from: 'T7', to: 'P6' },
            { from: 'P6', to: 'T10' },
            { from: 'T10', to: 'P4' },
            
            { from: 'P7', to: 'T3' },
            { from: 'T3', to: 'P8' },
            { from: 'P8', to: 'T8' },
            { from: 'T8', to: 'P9' },
            { from: 'P9', to: 'T11' },
            { from: 'T11', to: 'P7' },
            
            // Direct impacts
            { from: 'P2', to: 'T4', direct: true },
            { from: 'P5', to: 'T5', direct: true }
        ];
    }
    
    // Draw each arc
    arcs.forEach(arc => {
        const from = [...model.places, ...model.transitions].find(n => n.id === arc.from);
        const to = [...model.places, ...model.transitions].find(n => n.id === arc.to);
        
        if (!from || !to) return;
        
        // Calculate the actual start and end points considering circle/rectangle boundaries
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const angle = Math.atan2(dy, dx);
        
        // Adjust start point based on whether it's a place (circle) or transition (rectangle)
        let startX, startY;
        if (from.id.startsWith('P')) {
            // From a place (circle)
            startX = from.x + 22 * Math.cos(angle);
            startY = from.y + 22 * Math.sin(angle);
        } else {
            // From a transition (rectangle)
            if (Math.abs(dx) > Math.abs(dy)) {
                startX = from.x + (dx > 0 ? 30 : -30);
                startY = from.y;
            } else {
                startX = from.x;
                startY = from.y + (dy > 0 ? 12 : -12);
            }
        }
        
        // Adjust end point
        let endX, endY;
        if (to.id.startsWith('P')) {
            // To a place (circle)
            endX = to.x - 22 * Math.cos(angle);
            endY = to.y - 22 * Math.sin(angle);
        } else {
            // To a transition (rectangle)
            if (Math.abs(dx) > Math.abs(dy)) {
                endX = to.x - (dx > 0 ? 30 : -30);
                endY = to.y;
            } else {
                endX = to.x;
                endY = to.y - (dy > 0 ? 12 : -12);
            }
        }
        
        // Set line style based on arc type
        ctx.save();
        
        if (arc.mitigation) {
            // Mitigation arcs - green
            ctx.strokeStyle = '#16a34a';
            ctx.setLineDash([8, 4]);
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
        } else if (arc.cascade) {
            // Cascade arcs - red dashed
            ctx.strokeStyle = '#dc2626';
            ctx.setLineDash([6, 3]);
            ctx.lineWidth = 2.5;
            ctx.lineCap = 'round';
        } else if (arc.cyber) {
            // Cyber arcs - purple dashed
            ctx.strokeStyle = '#7c3aed';
            ctx.setLineDash([4, 4]);
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
        } else if (arc.direct) {
            // Direct impact - gray
            ctx.strokeStyle = '#94a3b8';
            ctx.setLineDash([]);
            ctx.lineWidth = 1.5;
        } else {
            // Normal flow - dark gray solid
            ctx.strokeStyle = '#475569';
            ctx.setLineDash([]);
            ctx.lineWidth = 1.5;
        }
        
        // Draw the line
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        
        // Calculate arrow position
        const arrowLength = 10;
        const arrowAngle = Math.PI / 6;
        
        // Draw arrowhead or inhibitor arc circle
        if (arc.inhibitor) {
            // Draw inhibitor arc circle
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = arc.mitigation ? '#16a34a' : ctx.strokeStyle;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(endX, endY, 6, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
        } else {
            // Draw triangle arrowhead
            ctx.fillStyle = ctx.strokeStyle;
            ctx.beginPath();
            ctx.moveTo(endX, endY);
            ctx.lineTo(
                endX - arrowLength * Math.cos(angle - arrowAngle),
                endY - arrowLength * Math.sin(angle - arrowAngle)
            );
            ctx.lineTo(
                endX - arrowLength * Math.cos(angle + arrowAngle),
                endY - arrowLength * Math.sin(angle + arrowAngle)
            );
            ctx.closePath();
            ctx.fill();
        }
        
        // Add outline to arrow for cascade arcs
        if (arc.cascade || arc.cyber) {
            ctx.strokeStyle = ctx.fillStyle;
            ctx.lineWidth = 1;
            ctx.setLineDash([]);
            ctx.stroke();
        }
        
        ctx.restore();
    });
}

function animateTokenTransfer(fromPlace, toPlace, model, ctx) {
    const from = model.places.find(p => p.id === fromPlace);
    const to = model.places.find(p => p.id === toPlace);
    
    if (!from || !to) return;
    
    const animation = {
        startX: from.x,
        startY: from.y,
        endX: to.x,
        endY: to.y,
        progress: 0,
        ctx: ctx,
        model: model
    };
    
    tokenAnimations.push(animation);
    
    const animationFrame = () => {
        animation.progress += 0.05 * animationSpeed;
        
        if (animation.progress >= 1) {
            tokenAnimations = tokenAnimations.filter(a => a !== animation);
            to.tokens = 1;
            from.tokens = 0;
            drawPetriNet(ctx, model, model === integratedPN);
        } else {
            requestAnimationFrame(animationFrame);
        }
    };
    
    requestAnimationFrame(animationFrame);
}

function drawAnimatedTokens(ctx) {
    tokenAnimations.forEach(anim => {
        if (anim.ctx === ctx) {
            const x = anim.startX + (anim.endX - anim.startX) * anim.progress;
            const y = anim.startY + (anim.endY - anim.startY) * anim.progress;
            
            // Draw moving token
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, 2 * Math.PI);
            ctx.fillStyle = '#2c3e50';
            ctx.fill();
            
            // Trail effect
            ctx.beginPath();
            ctx.arc(x, y, 8, 0, 2 * Math.PI);
            ctx.fillStyle = `rgba(44, 62, 80, ${0.3 * (1 - anim.progress)})`;
            ctx.fill();
        }
    });
    
    if (tokenAnimations.length > 0) {
        requestAnimationFrame(() => {
            drawPetriNet(standardCtx, standardPN, false);
            drawPetriNet(riskCtx, integratedPN, true);
        });
    }
}

function updateParameter(type, value) {
    switch(type) {
        case 'ransomware':
            parameters.ransomwareProb = value / 100;
            document.getElementById('ransomwareValue').textContent = value + '%';
            break;
        case 'equipment':
            parameters.equipmentProb = value / 100;
            document.getElementById('equipmentValue').textContent = value + '%';
            break;
        case 'supplier':
            parameters.supplierProb = value / 100;
            document.getElementById('supplierValue').textContent = value + '%';
            break;
        case 'delay':
            parameters.cascadeDelay = parseInt(value);
            document.getElementById('delayValue').textContent = (value / 1000).toFixed(1) + ' sec';
            break;
        case 'recovery':
            parameters.recoveryFactor = parseInt(value);
            document.getElementById('recoveryValue').textContent = value + 'x';
            break;
        case 'cost':
            parameters.costMultiplier = value / 100;
            document.getElementById('costValue').textContent = (value / 100).toFixed(1) + 'x';
            break;
    }
}

function setSpeed(speed) {
    animationSpeed = speed;
    document.querySelectorAll('.speed-btn').forEach(btn => {
        if (btn.textContent.includes('x') && !btn.textContent.includes('%')) {
            btn.classList.remove('active');
        }
    });
    event.target.classList.add('active');
}

function setZoom(zoom) {
    currentZoom = zoom;
    document.querySelectorAll('.speed-btn').forEach(btn => {
        if (btn.textContent.includes('%')) {
            btn.classList.remove('active');
        }
    });
    event.target.classList.add('active');
    
    // Apply zoom to all three canvases/PNs
    const scale = `scale(${zoom})`;
    standardCanvas.style.transform = scale;
    standardCanvas.style.transformOrigin = 'top left';
    riskCanvas.style.transform = scale;
    riskCanvas.style.transformOrigin = 'top left';
    mitigatedCanvas.style.transform = scale;
    mitigatedCanvas.style.transformOrigin = 'top left';
    
    // Adjust container height to account for zoom
    const standardContainer = standardCanvas.parentElement;
    const riskContainer = riskCanvas.parentElement;
    const mitigatedContainer = mitigatedCanvas.parentElement;
    standardContainer.style.height = `${650 * zoom + 50}px`;
    riskContainer.style.height = `${650 * zoom + 50}px`;
    mitigatedContainer.style.height = `${650 * zoom + 50}px`;
}

function triggerRansomware() {
    let effectiveProb = parameters.ransomwareProb;
    let baseCost = 50000;
    let mitigatedCost = baseCost;
    
    // Apply mitigations
    if (activeMitigations.has('backup')) {
        effectiveProb *= (1 - mitigationConfigs.backup.ransomwareReduction);
        mitigatedCost *= (1 - mitigationConfigs.backup.ransomwareReduction);
    }
    if (activeMitigations.has('firewall')) {
        effectiveProb *= (1 - mitigationConfigs.firewall.ransomwareReduction);
        mitigatedCost *= (1 - mitigationConfigs.firewall.ransomwareReduction);
    }
    
    currentFTAProb = effectiveProb;
    
    // Enable relevant transitions
    integratedPN.transitions[0].enabled = true;
    standardPN.transitions[0].enabled = true;
    
    // Animate token transfer for integrated model
    animateTokenTransfer('P10', 'P2', integratedPN, riskCtx);
    animateTokenTransfer('P1', 'P2', integratedPN, riskCtx);
    
    // Animate token transfer for mitigated model  
    animateTokenTransfer('P10', 'P2', mitigatedPN, mitigatedCtx);
    animateTokenTransfer('P1', 'P2', mitigatedPN, mitigatedCtx);
    
    // Standard model
    animateTokenTransfer('P1', 'P2', standardPN, standardCtx);
    
    // Cascade effect in integrated model
    setTimeout(() => {
        integratedPN.transitions[3].enabled = true;
        animateTokenTransfer('P4', 'P5', integratedPN, riskCtx);
        
        mitigatedPN.transitions[3].enabled = true;
        animateTokenTransfer('P4', 'P5', mitigatedPN, mitigatedCtx);
        cascades++;
        
        setTimeout(() => {
            integratedPN.transitions[4].enabled = true;
            animateTokenTransfer('P7', 'P8', integratedPN, riskCtx);
            
            mitigatedPN.transitions[4].enabled = true;
            animateTokenTransfer('P7', 'P8', mitigatedPN, mitigatedCtx);
            cascades++;
            updateDisplay();
        }, parameters.cascadeDelay / animationSpeed);
    }, parameters.cascadeDelay / animationSpeed);
    
    // Cost calculation
    standardTotalCost += baseCost * parameters.costMultiplier;
    
    // Apply mitigation to integrated cost
    if (activeMitigations.size > 0) {
        integratedTotalCost += mitigatedCost * parameters.costMultiplier;
        mitigatedTotalCost += mitigatedCost * parameters.costMultiplier;
        mitigationSavings += (baseCost - mitigatedCost) * parameters.costMultiplier;
    } else {
        integratedTotalCost += (50000 + 30000 + 20000) * parameters.costMultiplier;
        mitigatedTotalCost += (50000 + 30000 + 20000) * parameters.costMultiplier;
    }
    
    updateDisplay();
    highlightCard('stateCard');
}

function triggerEquipment() {
    let effectiveProb = parameters.equipmentProb;
    let baseCost = 30000;
    let mitigatedCost = baseCost;
    
    // Apply mitigations
    if (activeMitigations.has('maintenance')) {
        effectiveProb *= (1 - mitigationConfigs.maintenance.equipmentReduction);
        mitigatedCost *= (1 - mitigationConfigs.maintenance.equipmentReduction);
    }
    if (activeMitigations.has('redundancy')) {
        effectiveProb *= (1 - mitigationConfigs.redundancy.equipmentReduction);
        mitigatedCost *= (1 - mitigationConfigs.redundancy.equipmentReduction);
    }
    
    currentFTAProb = effectiveProb;
    
    integratedPN.transitions[1].enabled = true;
    standardPN.transitions[1].enabled = true;
    
    animateTokenTransfer('P4', 'P5', standardPN, standardCtx);
    animateTokenTransfer('P11', 'P5', integratedPN, riskCtx);
    animateTokenTransfer('P4', 'P5', integratedPN, riskCtx);
    
    animateTokenTransfer('P11', 'P5', mitigatedPN, mitigatedCtx);
    animateTokenTransfer('P4', 'P5', mitigatedPN, mitigatedCtx);
    
    standardTotalCost += baseCost * parameters.costMultiplier;
    
    if (activeMitigations.size > 0) {
        integratedTotalCost += mitigatedCost * 1.5 * parameters.costMultiplier;
        mitigatedTotalCost += mitigatedCost * 1.5 * parameters.costMultiplier;
        mitigationSavings += (45000 - mitigatedCost * 1.5) * parameters.costMultiplier;
    } else {
        integratedTotalCost += 45000 * parameters.costMultiplier;
        mitigatedTotalCost += 45000 * parameters.costMultiplier;
    }
    
    updateDisplay();
    highlightCard('stateCard');
}

function triggerSupplier() {
    let effectiveProb = parameters.supplierProb;
    let baseCost = 20000;
    let mitigatedCost = baseCost;
    
    // Apply mitigations
    if (activeMitigations.has('dual')) {
        effectiveProb *= (1 - mitigationConfigs.dual.supplierReduction);
        mitigatedCost *= (1 - mitigationConfigs.dual.supplierReduction);
    }
    if (activeMitigations.has('buffer') && bufferDaysRemaining > 0) {
        effectiveProb *= (1 - mitigationConfigs.buffer.supplierReduction);
        mitigatedCost *= (1 - mitigationConfigs.buffer.supplierReduction);
        bufferDaysRemaining--;
    }
    
    currentFTAProb = effectiveProb;
    
    integratedPN.transitions[0].enabled = true;
    standardPN.transitions[0].enabled = true;
    
    animateTokenTransfer('P1', 'P2', standardPN, standardCtx);
    animateTokenTransfer('P1', 'P2', integratedPN, riskCtx);
    animateTokenTransfer('P1', 'P2', mitigatedPN, mitigatedCtx);
    
    standardTotalCost += baseCost * parameters.costMultiplier;
    
    if (activeMitigations.size > 0) {
        integratedTotalCost += mitigatedCost * 1.75 * parameters.costMultiplier;
        mitigatedTotalCost += mitigatedCost * 1.75 * parameters.costMultiplier;
        mitigationSavings += (35000 - mitigatedCost * 1.75) * parameters.costMultiplier;
    } else {
        integratedTotalCost += 35000 * parameters.costMultiplier;
        mitigatedTotalCost += 35000 * parameters.costMultiplier;
    }
    
    updateDisplay();
    highlightCard('stateCard');
}

function stepSimulation() {
    const rand = Math.random();
    if (rand < parameters.ransomwareProb) {
        triggerRansomware();
    } else if (rand < parameters.ransomwareProb + parameters.equipmentProb) {
        triggerEquipment();
    } else if (rand < parameters.ransomwareProb + parameters.equipmentProb + parameters.supplierProb) {
        triggerSupplier();
    }
}

function compareModels() {
    const diff = integratedTotalCost - standardTotalCost;
    const pct = standardTotalCost > 0 ? (diff / standardTotalCost * 100).toFixed(1) : 0;
    document.getElementById('costDiff').textContent = `+${pct}%`;
    document.getElementById('systemState').textContent = 'Analyzed';
    
    // Highlight all the cost cards
    document.querySelectorAll('.result-card').forEach(card => {
        if (card.textContent.includes('Cost') || card.textContent.includes('Difference')) {
            highlightCard(card.id || card);
        }
    });
}

function highlightCard(cardId) {
    const card = typeof cardId === 'string' ? document.getElementById(cardId) : cardId;
    if (card) {
        card.classList.add('highlight');
        setTimeout(() => card.classList.remove('highlight'), 2000);
    }
}

function updateDisplay() {
    const state = cascades > 0 ? 'CASCADING' : 'NORMAL';
    const ftaPercent = (currentFTAProb * 100).toFixed(1) + '%';
    const standardCostStr = '$' + Math.round(standardTotalCost).toLocaleString();
    const integratedCostStr = '$' + Math.round(integratedTotalCost).toLocaleString();
    const mitigatedCostStr = '$' + Math.round(mitigatedTotalCost).toLocaleString();
    const activeCount = activeMitigations.size + '/6';
    const savingsStr = '$' + Math.round(mitigationSavings).toLocaleString();
    
    // Results bar
    document.getElementById('systemStateBar').textContent = state;
    document.getElementById('ftaProbBar').textContent = ftaPercent;
    document.getElementById('cascadeCountBar').textContent = cascades;
    document.getElementById('standardCostBar').textContent = standardCostStr;
    document.getElementById('integratedCostBar').textContent = integratedCostStr;
    document.getElementById('mitigatedCostBar').textContent = mitigatedCostStr;
    document.getElementById('activeMitigationsBar').textContent = activeCount;
    document.getElementById('savingsBar').textContent = savingsStr;
    
    // Change state color based on status
    const stateBar = document.getElementById('systemStateBar');
    if (state === 'CASCADING') {
        stateBar.style.color = '#e74c3c';
        stateBar.style.fontWeight = '700';
    } else {
        stateBar.style.color = '#27ae60';
        stateBar.style.fontWeight = '700';
    }
    
    // Highlight changes in the bar
    if (cascades > 0) {
        document.getElementById('systemStateBar').classList.add('changing');
        document.getElementById('cascadeCountBar').classList.add('changing');
        setTimeout(() => {
            document.getElementById('systemStateBar').classList.remove('changing');
            document.getElementById('cascadeCountBar').classList.remove('changing');
        }, 600);
    }
    
    // Animate cost changes
    if (standardTotalCost > 0) {
        document.getElementById('standardCostBar').classList.add('changing');
        setTimeout(() => {
            document.getElementById('standardCostBar').classList.remove('changing');
        }, 600);
    }
    if (integratedTotalCost > 0) {
        document.getElementById('integratedCostBar').classList.add('changing');
        setTimeout(() => {
            document.getElementById('integratedCostBar').classList.remove('changing');
        }, 600);
    }
    if (mitigatedTotalCost > 0) {
        document.getElementById('mitigatedCostBar').classList.add('changing');
        setTimeout(() => {
            document.getElementById('mitigatedCostBar').classList.remove('changing');
        }, 600);
    }
    if (mitigationSavings > 0) {
        document.getElementById('savingsBar').classList.add('changing');
        setTimeout(() => {
            document.getElementById('savingsBar').classList.remove('changing');
        }, 600);
    }
    
    // Update detailed results panel
    document.getElementById('systemState').textContent = state;
    document.getElementById('ftaProb').textContent = ftaPercent;
    document.getElementById('cascadeCount').textContent = cascades;
    document.getElementById('standardCost').textContent = standardCostStr;
    document.getElementById('integratedCost').textContent = integratedCostStr;
    
    // Calculate and display mitigated cost
    document.getElementById('mitigatedCost').textContent = mitigatedCostStr;
    
    // Update mitigation displays
    document.getElementById('activeMitigations').textContent = activeMitigations.size;
    const mitCost = calculateMitigationCost();
    document.getElementById('mitigationCost').textContent = mitCost.toLocaleString();
    document.getElementById('mitigationSavings').textContent = savingsStr;
    const roi = mitCost > 0 ? ((mitigationSavings / mitCost) * 100).toFixed(0) : 0;
    document.getElementById('mitigationROI').textContent = roi + '%';
}

// Mitigation functions
function toggleMitigation(id) {
    const item = document.getElementById(`mit-${id}`);
    const checkbox = item.querySelector('.mitigation-checkbox');
    
    if (activeMitigations.has(id)) {
        activeMitigations.delete(id);
        item.classList.remove('active');
        if (id === 'buffer') bufferDaysRemaining = 0;
    } else {
        activeMitigations.add(id);
        item.classList.add('active');
        if (id === 'buffer') bufferDaysRemaining = 30;
    }
    
    // Update mitigation places in the mitigated PN model
    updateMitigationPlaces();
    updateDisplay();
    drawPetriNet(mitigatedCtx, mitigatedPN, true);
}

function updateMitigationPlaces() {
    // Update tokens in mitigation places based on active mitigations selected by user
    mitigatedPN.places.forEach(place => {
        if (place.type === 'mitigation') {
            switch(place.name) {
                case 'Backup':
                    place.tokens = activeMitigations.has('backup') ? 1 : 0;
                    break;
                case 'Firewall':
                    place.tokens = activeMitigations.has('firewall') ? 1 : 0;
                    break;
                case 'Buffer':
                    place.tokens = activeMitigations.has('buffer') ? 1 : 0;
                    break;
                case 'Dual Src':
                    place.tokens = activeMitigations.has('dual') ? 1 : 0;
                    break;
                case 'Maint.':
                    place.tokens = activeMitigations.has('maintenance') ? 1 : 0;
                    break;
                case 'Redund.':
                    place.tokens = activeMitigations.has('redundancy') ? 1 : 0;
                    break;
            }
        }
    });
}

function calculateMitigationCost() {
    let total = 0;
    activeMitigations.forEach(id => {
        total += mitigationConfigs[id].cost || 0;
    });
    return total;
}

function resetAll() {
    // Reset all transitions
    standardPN.transitions.forEach(t => t.enabled = false);
    integratedPN.transitions.forEach(t => t.enabled = false);
    mitigatedPN.transitions.forEach(t => t.enabled = false);
    
    // Reset standard places
    standardPN.places.forEach((p, i) => {
        p.tokens = (i % 3 === 0) ? 1 : 0;
    });
    
    // Reset integrated places
    integratedPN.places.forEach((p, i) => {
        if (i < 9) {
            p.tokens = (i % 3 === 0) ? 1 : 0;
        } else {
            p.tokens = 1;
        }
    });
    
    // Reset mitigated places
    mitigatedPN.places.forEach((p, i) => {
        if (p.type === 'mitigation') {
            p.tokens = 0; // Keep mitigation indicators based on active state
        } else if (i < 9) {
            p.tokens = (i % 3 === 0) ? 1 : 0;
        } else if (i < 12) {
            p.tokens = 1;
        }
    });
    updateMitigationPlaces(); // Restore active mitigation indicators
    
    cascades = 0;
    standardTotalCost = 0;
    integratedTotalCost = 0;
    mitigatedTotalCost = 0;
    currentFTAProb = 0;
    isSimulating = false;
    tokenAnimations = [];
    mitigationSavings = 0;
    if (activeMitigations.has('buffer')) bufferDaysRemaining = 30;
    
    if (simulationInterval) {
        clearInterval(simulationInterval);
        simulationInterval = null;
    }
    
    document.getElementById('simBtn').textContent = 'Run 30-Day Simulation';
    document.getElementById('simBtn').disabled = false;
    
    updateDisplay();
    document.getElementById('costDiff').textContent = '0%';
    drawPetriNet(standardCtx, standardPN, false);
    drawPetriNet(riskCtx, integratedPN, true);
    drawPetriNet(mitigatedCtx, mitigatedPN, true);
}

function runSimulation() {
    if (isSimulating) {
        stopSimulation();
        return;
    }
    
    isSimulating = true;
    document.getElementById('simBtn').textContent = 'Stop Simulation';
    let steps = 0;
    
    simulationInterval = setInterval(() => {
        steps++;
        stepSimulation();
        
        if (steps >= 30) {
            stopSimulation();
            compareModels();
        }
    }, 1000 / animationSpeed);
}

function stopSimulation() {
    isSimulating = false;
    if (simulationInterval) {
        clearInterval(simulationInterval);
        simulationInterval = null;
    }
    document.getElementById('simBtn').textContent = 'Run 30-Day Simulation';
}

function exportData() {
    const data = {
        parameters: parameters,
        results: {
            cascades: cascades,
            standardCost: standardTotalCost,
            integratedCost: integratedTotalCost,
            ftaProbability: currentFTAProb
        },
        timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `petri-net-simulation-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// Initialize
drawPetriNet(standardCtx, standardPN, false);
drawPetriNet(riskCtx, integratedPN, true);
drawPetriNet(mitigatedCtx, mitigatedPN, true);
updateDisplay();

// Keyboard shortcuts. R: Reset, S: Start/Stop Simulation, C: Compare Models, Space: Step Simulation. Keep?
document.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R') resetAll();
    if (e.key === 's' || e.key === 'S') runSimulation();
    if (e.key === 'c' || e.key === 'C') compareModels();
    if (e.key === ' ') {
        e.preventDefault();
        stepSimulation();
    }
});