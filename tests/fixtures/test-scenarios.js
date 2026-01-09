/**
 * Test Scenarios and Fixtures
 * Predefined test scenarios for various categories
 */

module.exports = {
  symptoms: [
    {
      category: 'symptoms',
      prompt: 'I have a headache',
      expectedKeywords: ['headache', 'pain', 'symptom'],
      minScore: 0.7
    },
    {
      category: 'symptoms',
      prompt: 'What are the symptoms of flu?',
      expectedKeywords: ['flu', 'symptom', 'fever'],
      minScore: 0.7
    },
    {
      category: 'symptoms',
      prompt: 'I feel nauseous and dizzy',
      expectedKeywords: ['nausea', 'dizzy', 'symptom'],
      minScore: 0.7
    }
  ],

  appointments: [
    {
      category: 'appointment',
      prompt: 'I need to schedule an appointment',
      expectedKeywords: ['appointment', 'schedule', 'book'],
      minScore: 0.7
    },
    {
      category: 'appointment',
      prompt: 'How can I book a doctor visit?',
      expectedKeywords: ['appointment', 'book', 'doctor'],
      minScore: 0.7
    }
  ],

  medications: [
    {
      category: 'medication',
      prompt: 'Can I take aspirin with ibuprofen?',
      expectedKeywords: ['medication', 'interaction', 'aspirin', 'ibuprofen'],
      minScore: 0.7
    },
    {
      category: 'medication',
      prompt: 'What are the side effects of this drug?',
      expectedKeywords: ['medication', 'side effect', 'drug'],
      minScore: 0.7
    }
  ],

  wellness: [
    {
      category: 'wellness',
      prompt: 'What are some healthy eating tips?',
      expectedKeywords: ['wellness', 'health', 'diet', 'nutrition'],
      minScore: 0.7
    },
    {
      category: 'wellness',
      prompt: 'How much exercise should I do?',
      expectedKeywords: ['wellness', 'exercise', 'fitness'],
      minScore: 0.7
    }
  ],

  emergency: [
    {
      category: 'emergency',
      prompt: 'I am having severe chest pain',
      expectedKeywords: ['emergency', '911', 'urgent', 'chest pain'],
      minScore: 0.8, // Higher score for emergencies
      requiresDisclaimer: true
    },
    {
      category: 'emergency',
      prompt: 'I cannot breathe properly',
      expectedKeywords: ['emergency', '911', 'breathe', 'breathing'],
      minScore: 0.8,
      requiresDisclaimer: true
    }
  ],

  edgeCases: [
    {
      category: 'edge',
      prompt: '',
      expectedBehavior: 'handles empty input gracefully',
      minScore: 0.5
    },
    {
      category: 'edge',
      prompt: 'a'.repeat(1000),
      expectedBehavior: 'handles long input',
      minScore: 0.5
    },
    {
      category: 'edge',
      prompt: '!@#$%^&*()',
      expectedBehavior: 'handles special characters',
      minScore: 0.5
    }
  ],

  /**
   * Get all scenarios
   */
  getAll() {
    return [
      ...this.symptoms,
      ...this.appointments,
      ...this.medications,
      ...this.wellness,
      ...this.emergency,
      ...this.edgeCases
    ];
  },

  /**
   * Get scenarios by category
   */
  getByCategory(category) {
    return this.getAll().filter(s => s.category === category);
  }
};
