/**
 * crop-metadata.ts
 * 
 * Centralized disease metadata for eCropGuard.
 * Contains detailed descriptions, symptoms, causes, and treatment protocols.
 */

export interface CropDiseaseMeta {
  description: string;
  symptoms: string[];
  causes: string[];
  recommendations: string[];
  treatmentSteps: string[];
  preventionTips: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact?: string; // New: Economical/Yield impact
  organic_controls?: string[]; // New: Organic alternatives
}

export const DISEASE_METADATA: Record<string, CropDiseaseMeta> = {
  // --- General / Healthy ---
  'Healthy': {
    description: 'The crop appears to be in excellent physiological condition. No pathogen activity or nutrient deficiencies were detected from the visual profile.',
    symptoms: [
      'Lush green leaf coloration',
      'Strong turgor pressure (stiff stems)',
      'Consistent leaf surface texture',
      'No visible spotting or fungal growth'
    ],
    causes: ['Optimal soil moisture', 'Balanced nutrient availability', 'Proper climate conditions'],
    recommendations: [
      'Maintain current irrigation schedule',
      'Apply nitrogen-rich fertilizer if growth slows',
      'Keep field clear of weeds that attract pests'
    ],
    treatmentSteps: ['No treatment required.'],
    preventionTips: [
      'Regular scouting (once every 3 days)',
      'Ensure proper drainage after heavy rain',
      'Monitor for early signs of yellowing'
    ],
    severity: 'low',
    impact: 'Maximizes yield potential and seed quality.',
  },

  // --- Blackgram / Pulse Diseases ---
  'Cercospora': {
    description: 'Characterized by small, circular cherry-red to brown spots with gray centers on leaves. A common pulse disease particularly during warm, humid periods.',
    symptoms: [
      'Small, circular spots with grayish centers and reddish-brown borders',
      'Numerous spots may coalesce, causing large necrotic areas',
      'Premature defoliation in severe cases',
      'Spots appearing on stems and pods as well'
    ],
    causes: ['Fungus Cercospora canesens', 'High humidity (>70%) with moderate temperatures', 'Overhead irrigation spreading spores'],
    recommendations: [
      'Space plants to improve airflow',
      'Switch to drip or ground-level irrigation',
      'Use certified disease-free seeds'
    ],
    treatmentSteps: [
      'Spray Carbendazim (0.1%) or Mancozeb (0.25%)',
      'Remove and destroy infected plant debris',
      'Apply systemic fungicide if more than 3 spots per leaf'
    ],
    preventionTips: [
      'Treat seeds with Captan or Thiram',
      'Wider spacing to reduce leaf-to-leaf contact',
      'Rotate with non-leguminous crops'
    ],
    severity: 'medium',
    impact: 'Reduces leaf area for photosynthesis, impacting 10-25% of yield.',
    organic_controls: ['Spray Garlic extract (5%)', 'Spray fermented buttermilk (diluted)']
  },

  // --- Blackgram Specific ---
  'Anthracnose': {
    description: 'A serious fungal disease (Colletotrichum truncatum) that affects all aerial parts of the blackgram plant, often spreading during rainy spells.',
    symptoms: [
      'Sunken, circular dark spots on leaves and pods',
      'Salmon-pink spore masses in the center of spots during humid weather',
      'Premature pod drop and shriveled seeds',
      'Brown necrotic lesions on stems'
    ],
    causes: ['Seed-borne infection', 'High humidity (>85%)', 'Rain-splash dispersal of spores'],
    recommendations: [
      'Stop irrigation during peak humidity',
      'Apply systemic fungicide (Carbendazim)',
      'Avoid working in wet fields to prevent spread'
    ],
    treatmentSteps: [
      'Spray Carbendazim (0.1%) or Mancozeb (0.25%)',
      'Repeat spray after 10-12 days if rains continue',
      'Remove and burn heavily infected crop residues'
    ],
    preventionTips: [
      'Use certified disease-free seeds',
      'Treat seeds with Thiram or Captan (2g/kg) before sowing',
      'Practice 2-year crop rotation'
    ],
    severity: 'high',
    impact: 'Can cause 30-60% yield loss in susceptible varieties.',
    organic_controls: ['Spray Neem oil (3%)', 'Apply Pseudomonas fluorescens (biocontrol)'],
  },
  'Leaf Crinkle': {
    description: 'Viral disease characterized by extreme rugosity and thickening of the leaves, often leading to total yield failure if infection occurs early.',
    symptoms: [
      'Enlargement and crinkling of third/fourth leaves',
      'Leathery texture and dark green coloration',
      'Stunting of the main stem',
      'Flower shedding and reduced pod formation'
    ],
    causes: ['Transmission by whiteflies and aphids', 'Mechanical transmission through sap', 'Infected seed'],
    recommendations: [
      'Uproot infected plants immediately',
      'Monitor for sucking pests (vector control)',
      'Avoid excessive nitrogen application'
    ],
    treatmentSteps: [
      'Remove infected plants and bury them far from the field',
      'Control vectors with Dimethoate or Imidacloprid (0.3ml/L)',
      'Spray yellow sticky traps to capture whiteflies'
    ],
    preventionTips: [
      'Plant resistant varieties like VBN 4 or Co 6',
      'Rogue out infected plants early (15-20 days after sowing)',
      'Maintain field hygiene by removing alternative hosts'
    ],
    severity: 'critical',
    impact: 'Heavy infection at early stage can result in 100% loss.',
  },
  'Powdery Mildew': {
    description: 'A fungal infection (Erysiphe polygoni) that appears as white flour-like patches, particularly during cool dry weather with high night humidity.',
    symptoms: [
      'White powdery patches starting on lower leaves',
      'Patches eventually cover all green parts including pods',
      'Leaves turn yellow, then brown and dry up',
      'Reduction in photosynthesis leading to shriveled grain'
    ],
    causes: ['Low temperatures at night', 'Dew formation on leaves', 'Dry afternoon weather'],
    recommendations: [
      'Increase plant spacing for better airflow',
      'Apply sulfur-based fungicides early morning',
      'Monitor fields from initiation of flowering'
    ],
    treatmentSteps: [
      'Spray Wettable Sulphur (2.5g/L) or Dinocap (1ml/L)',
      'Repeat spray after 10 days if patches persist',
      'Adjust irrigation to reduce evening humidity'
    ],
    preventionTips: [
      'Early sowing (before peak dry season)',
      'Avoid high density planting',
      'Maintain balanced soil nutrients'
    ],
    severity: 'medium',
    impact: 'Reduces grain weight and market value.',
    organic_controls: ['Spray milk-water solution (1:9 ratio)', 'Use fermented curd extract'],
  },
  'Yellow Mosaic Virus': {
    description: 'The most destructive viral disease of blackgram in South Asia, spread by whiteflies. It prevents the plant from producing chlorophyll effectively.',
    symptoms: [
      'Bright yellow patches alternating with green areas',
      'Complete yellowing of leaves in severe cases',
      'Stunted growth and reduced leaf size',
      'Pods become small, yellow and produce few seeds'
    ],
    causes: ['Yellow Mosaic Virus (YMV)', 'Vector: Whitefly (Bemisia tabaci)', 'Weed hosts near the field'],
    recommendations: [
      'Control whiteflies immediately',
      'Uproot and burn infected plants',
      'Avoid planting near other legume crops if they show symptoms'
    ],
    treatmentSteps: [
      'Spray Imidacloprid (0.3ml/L) or Thiamethoxam (0.2g/L)',
      'Install 25 yellow sticky traps per hectare',
      'Apply systemic insecticides at 15 and 30 days after sowing'
    ],
    preventionTips: [
      'Use only YMV resistant varieties',
      'Seed treatment with Imidacloprid (5g/kg seed)',
      'Keep the field and borders weed-free'
    ],
    severity: 'critical',
    impact: 'Potential for 80-100% yield loss if infection occurs before 30 days.',
  },

  // --- Chickpea Specific (ResNet50) ---
  'Blight': {
    description: 'A fungal disease causing rapid rot of leaves and stems. Often referred to as Alternaria or Ascochyta blight in chickpea.',
    symptoms: [
      'Circular, dark brown spots with concentric rings on leaflets',
      'Shrinking and darkening of pods',
      'Girdling of stems leading to breakage',
      'Premature defoliation'
    ],
    causes: ['Extended leaf wetness', 'Moderate temperatures with high humidity', 'Infected seed or soil debris'],
    recommendations: [
      'Avoid overhead irrigation',
      'Use resistant varieties',
      'Apply protective fungicides'
    ],
    treatmentSteps: [
      'Spray Mancozeb (2.5g/L) or Chlorothalonil',
      'Repeat after 7 days if weather remains wet',
      'Remove and destroy infected crop residue'
    ],
    preventionTips: [
      'Deep plowing during summer',
      'Use disease-free seed',
      'Wider spacing for better aeration'
    ],
    severity: 'high',
    impact: 'Up to 50% yield reduction under favorable pandemic conditions.',
  },
  'Early Blight': {
    description: 'Commonly known as Alternaria blight, it causes small, circular, dark brown spots on the leaflets, often with concentric rings.',
    symptoms: [
      'Small, water-soaked spots on lower leaflets',
      'Spots turn dark brown with concentric circles',
      'Premature leaf drop (defoliation)',
      'Girdling of the stem if infection is severe'
    ],
    causes: ['Fungal pathogen Alternaria solani', 'Extended leaf wetness', 'Moderate temperatures (20-25°C)'],
    recommendations: [
      'Improve drainage to reduce humidity',
      'Remove lower infected leaves',
      'Apply protective fungicides before rain'
    ],
    treatmentSteps: [
      'Spray Mancozeb (2.5g/L) or Chlorothalonil',
      'Repeat at 7-day intervals',
      'Ensure thorough coverage of all leaf surfaces'
    ],
    preventionTips: [
      'Rotate with non-host crops like wheat or mustard',
      'Use deeper sowing techniques',
      'Space plants to allow rapid drying of foliage'
    ],
    severity: 'medium',
    impact: 'Can cause 20-50% yield reduction in humid years.',
    organic_controls: ['Spray garlic-pepper extract', 'Apply Trichoderma viride to soil'],
  },
  'Late Blight': {
    description: 'A rapid and destructive disease that can wipe out a crop in days during cool, wet, and misty weather.',
    symptoms: [
      'Water-soaked greenish-black lesions',
      'White mildew growth on leaf undersides during morning',
      'Stem rot and branch breakage',
      'Total collapse of plant within 48-72 hours'
    ],
    causes: ['Oomycete Phytophthora infestans', 'High humidity (>90%)', 'Foggy or misty weather'],
    recommendations: [
      'Daily scouting during mist/fog',
      'Immediate chemical intervention',
      'Avoid excessive irrigation'
    ],
    treatmentSteps: [
      'Contact spray (Mancozeb) mixed with systemic (Metalaxyl)',
      'Spray Ridomil Gold (2g/L)',
      'Repeat after 5 days if weather remains wet'
    ],
    preventionTips: [
      'Plant in well-drained fields',
      'Use disease-free seed from reliable sources',
      'Avoid planting in low-lying areas'
    ],
    severity: 'critical',
    impact: 'Complete crop failure is common if left untreated.',
  },
  'Leaf Spot': {
    description: 'Fungal infection causing localized lesions on leaves. It appears as dark circular spots that can reduce the effective leaf area for photosynthesis.',
    symptoms: [
      'Small brown to black circular lesions on leaves',
      'Yellow halo around the spots',
      'Premature leaf aging and drop',
      'Spots may merge to form larger necrotic blotches'
    ],
    causes: ['High humidity', 'Poor plant spacing', 'Overhead watering'],
    recommendations: [
      'Improve field ventilation',
      'Reduce plant density',
      'Apply copper-based fungicides'
    ],
    treatmentSteps: [
      'Spray copper oxychloride (0.3%)',
      'Remove bottom-most infected leaves',
      'Ensure good field drainage'
    ],
    preventionTips: [
      'Crop rotation',
      'Proper nutrition (Potassium especially)',
      'Resistant varieties'
    ],
    severity: 'medium',
    impact: 'Reduces yield by 5-15% through reduced photosynthesis.',
  },
  'Rust': {
    description: 'Characterized by small, round, powdery, brown pustules on leaves, stems, and pods, reducing the green area for grain filling.',
    symptoms: [
      'Orange-brown rusty pustules on leaf surface',
      'Leaves turn yellow and dry prematurely',
      'Pustules may merge to cover large areas',
      'Stems may become brittle and break'
    ],
    causes: ['Uromyces ciceris-arietini spores', 'Air-borne dispersal', 'Cool temperatures with high humidity'],
    recommendations: [
      'Apply Triazole fungicides',
      'Monitor from late vegetation stage',
      'Reduce nitrogen if growth is overly dense'
    ],
    treatmentSteps: [
      'Spray Tebuconazole or Propiconazole (1ml/L)',
      'Apply at the first sign of pustules',
      'Check surrounding fields for infection sources'
    ],
    preventionTips: [
      'Late sowing can sometimes reduce rust pressure',
      'Use resistant genotypes',
      'Clean field of alternative hosts like weeds'
    ],
    severity: 'high',
    impact: 'Yield loss of 10-25% through reduced seed weight.',
    organic_controls: ['Spray diluted cow urine (1:10)', 'Apply cinnamon oil'],
  },
  'Wilt': {
    description: 'A vascular disease (Fusarium oxysporum) that blocks water transport, leading to sudden drooping and death of the plant.',
    symptoms: [
      'Sudden drooping of leaves starting from the top',
      'Internal browning of the stem (vascular staining)',
      'Gradual yellowing and death of the entire plant',
      'Roots appear stunted and dark'
    ],
    causes: ['Soil-borne fungus', 'High soil temperatures (>28°C)', 'Improper drainage'],
    recommendations: [
      'Avoid water stress',
      'Remove wilted plants with roots',
      'Increase organic matter in soil'
    ],
    treatmentSteps: [
      'Drench soil with Carbendazim (1g/L)',
      'No effective foliar treatment once wilt starts',
      'Solarization of soil in extreme cases'
    ],
    preventionTips: [
      'Deep summer plowing to kill soil pathogens',
      'Seed treatment with Trichoderma (10g/kg)',
      'Intercropping with mustard or linseed'
    ],
    severity: 'critical',
    impact: 'Causes patchy crop stand and high yield loss.',
  }
};

export function getMetadata(label: string): CropDiseaseMeta {
  return DISEASE_METADATA[label] || {
    description: `Diagnosis: ${label}. This condition requires professional agricultural assessment.`,
    symptoms: ['Visibly abnormal foliage patterns'],
    causes: ['Pathogen infection or abiotic stress'],
    recommendations: ['Consult local agricultural officer', 'Take samples to nearby research center'],
    treatmentSteps: ['Isolate affected plants', 'Await expert diagnostic confirmation'],
    preventionTips: ['Maintain good field sanitation', 'Monitor crop health daily'],
    severity: 'medium',
    impact: 'Unknown impact without detailed identification.'
  };
}
