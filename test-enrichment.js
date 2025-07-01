#!/usr/bin/env node

// Test enrichment logic directly
const testCard = {
  "type": "Card",
  "id": "card-2258888-1751338790302",
  "data": {
    "imageUrl": "https://cdn.tribesocial.io/videos/1738766232747.png",
    "progress": 0,
    "stats": {
      "watched": false
    }
  },
  "config": {
    "title": "5.1 Deep Work Part 1",
    "subtitle": "video",
    "actions": [
      {
        "action": "openVideoModal",
        "label": "Watch Video",
        "primary": true,
        "parameters": {
          "videoUrl": "https://cdn.tribesocial.io/videos/1738864196947/index.m3u8",
          "title": "5.1 Deep Work Part 1",
          "poster": "https://cdn.tribesocial.io/videos/1738766232747.png"
        }
      },
      {
        "action": "openWorksheet",
        "label": "Worksheet",
        "primary": false,
        "parameters": {
          "worksheetUrl": "#worksheet",
          "contentId": "2258888"
        }
      }
    ]
  },
  "version": "1.0"
};

// Simulate the enrichment logic
function enrichCard(card) {
  if (card.type === 'Card') {
    // Extract content_id from config or action parameters (fallback)
    let contentId = card.config?.content_id;

    // If content_id is missing from config, try to extract from action parameters
    if (!contentId && card.config?.actions) {
      for (const action of card.config.actions) {
        if (action.parameters?.contentId) {
          contentId = action.parameters.contentId;
          break;
        }
      }
    }

    if (contentId) {
      console.log('✅ Found contentId:', contentId);
      return {
        ...card,
        config: {
          ...card.config,
          content_id: contentId, // Ensure content_id is in config
        },
        data: {
          ...card.data,
          // Mock progress data
          progress: 0,
          value: 0,
          stats: {
            ...card.data.stats,
            watched: false,
            completed: false,
            lastWatched: null
          }
        }
      };
    } else {
      console.log('❌ No contentId found');
    }
  }
  return card;
}

console.log('🧪 Testing enrichment logic...\n');
console.log('Original card config.content_id:', testCard.config.content_id || 'MISSING');
console.log('Original card action contentId:', testCard.config.actions[1].parameters.contentId);

const enrichedCard = enrichCard(testCard);
console.log('\nEnriched card config.content_id:', enrichedCard.config.content_id || 'MISSING');
console.log('Enrichment successful:', !!enrichedCard.config.content_id ? '✅' : '❌');