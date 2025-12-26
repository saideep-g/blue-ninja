/**
 * Math Atoms - Fundamental concepts that students must master
 * Used to categorize questions and track mastery
 */

export const MATH_ATOMS = {
  // Arithmetic - Grades 6-7
  FRACTIONS_BASICS: {
    id: 'A1',
    name: 'Fractions (Basics)',
    description: 'Understanding fractions as parts of a whole',
    difficulty: 'EASY',
    category: 'Arithmetic',
    prerequisite: null,
  },
  FRACTIONS_OPERATIONS: {
    id: 'A2',
    name: 'Adding & Subtracting Fractions',
    description: 'Operations with fractions',
    difficulty: 'MEDIUM',
    category: 'Arithmetic',
    prerequisite: 'A1',
  },
  DECIMALS_BASICS: {
    id: 'A3',
    name: 'Decimals (Basics)',
    description: 'Understanding decimal place value',
    difficulty: 'EASY',
    category: 'Arithmetic',
    prerequisite: 'A1',
  },
  PERCENTAGES: {
    id: 'A4',
    name: 'Percentages',
    description: 'Converting between fractions, decimals, and percentages',
    difficulty: 'MEDIUM',
    category: 'Arithmetic',
    prerequisite: 'A1',
  },

  // Algebra - Grades 7-8
  INTEGERS_OPERATIONS: {
    id: 'ALG1',
    name: 'Integer Operations',
    description: 'Adding, subtracting, multiplying integers',
    difficulty: 'MEDIUM',
    category: 'Algebra',
    prerequisite: null,
  },
  VARIABLES_EXPRESSIONS: {
    id: 'ALG2',
    name: 'Variables & Expressions',
    description: 'Writing and simplifying algebraic expressions',
    difficulty: 'MEDIUM',
    category: 'Algebra',
    prerequisite: 'ALG1',
  },
  LINEAR_EQUATIONS: {
    id: 'ALG3',
    name: 'Linear Equations',
    description: 'Solving ax + b = c',
    difficulty: 'MEDIUM',
    category: 'Algebra',
    prerequisite: 'ALG2',
  },
  LINEAR_FUNCTIONS: {
    id: 'ALG4',
    name: 'Linear Functions',
    description: 'Understanding slope and y-intercept',
    difficulty: 'HARD',
    category: 'Algebra',
    prerequisite: 'ALG3',
  },
  SYSTEMS_OF_EQUATIONS: {
    id: 'ALG5',
    name: 'Systems of Equations',
    description: 'Solving two equations with two variables',
    difficulty: 'HARD',
    category: 'Algebra',
    prerequisite: 'ALG3',
  },

  // Geometry - Grades 7-8
  ANGLES: {
    id: 'GEO1',
    name: 'Angles',
    description: 'Angle types and relationships',
    difficulty: 'MEDIUM',
    category: 'Geometry',
    prerequisite: null,
  },
  TRIANGLES: {
    id: 'GEO2',
    name: 'Triangles',
    description: 'Triangle properties and classification',
    difficulty: 'MEDIUM',
    category: 'Geometry',
    prerequisite: 'GEO1',
  },
  PYTHAGOREAN_THEOREM: {
    id: 'GEO3',
    name: 'Pythagorean Theorem',
    description: 'a² + b² = c²',
    difficulty: 'HARD',
    category: 'Geometry',
    prerequisite: 'GEO2',
  },
  AREA_PERIMETER: {
    id: 'GEO4',
    name: 'Area & Perimeter',
    description: 'Calculating area and perimeter of shapes',
    difficulty: 'MEDIUM',
    category: 'Geometry',
    prerequisite: null,
  },
  VOLUME: {
    id: 'GEO5',
    name: 'Volume & Surface Area',
    description: '3D shapes and calculations',
    difficulty: 'HARD',
    category: 'Geometry',
    prerequisite: 'GEO4',
  },

  // Data & Probability
  DATA_ANALYSIS: {
    id: 'DATA1',
    name: 'Data Analysis',
    description: 'Mean, median, mode',
    difficulty: 'MEDIUM',
    category: 'Data',
    prerequisite: null,
  },
  PROBABILITY: {
    id: 'DATA2',
    name: 'Probability',
    description: 'Basic probability concepts',
    difficulty: 'MEDIUM',
    category: 'Data',
    prerequisite: null,
  },
};

/**
 * Get atom by ID
 */
export function getAtom(atomId) {
  return Object.values(MATH_ATOMS).find(a => a.id === atomId);
}

/**
 * Get atoms by category
 */
export function getAtomsByCategory(category) {
  return Object.values(MATH_ATOMS).filter(a => a.category === category);
}

/**
 * Get prerequisite chain
 */
export function getPrerequisites(atomId) {
  const atom = getAtom(atomId);
  if (!atom || !atom.prerequisite) return [];

  const chain = [atom.prerequisite];
  const prereq = getAtom(atom.prerequisite);
  if (prereq?.prerequisite) {
    chain.push(...getPrerequisites(prereq.id));
  }
  return chain;
}

/**
 * Get dependent atoms (what requires this atom)
 */
export function getDependents(atomId) {
  return Object.values(MATH_ATOMS)
    .filter(a => a.prerequisite === atomId)
    .map(a => a.id);
}