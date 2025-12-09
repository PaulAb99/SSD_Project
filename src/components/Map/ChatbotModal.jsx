import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bot, User, Loader } from 'lucide-react';
import Swal from 'sweetalert2';
import { useTheme } from '../../contexts/ThemeContext';
import useMapStore from '../../stores/mapStore';
import { t } from '../../utils/uiTranslations';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

function ChatbotModal({ isOpen, onClose, onCreateRoute, userLocation }) {
  const { isDark } = useTheme();
  const currentLanguage = useMapStore((state) => state.currentLanguage);
  const culturalNodes = useMapStore((state) => state.culturalNodes);
  const discoveredNodes = useMapStore((state) => state.discoveredNodes);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      // Add or update welcome message when modal opens or language changes
      const locationsList = culturalNodes.map(node => node.title).join(', ');
      
      const welcomeTemplate = t('chatbot.welcomeMessage', currentLanguage);
      const welcomeMessage = welcomeTemplate
        .replace('{count}', culturalNodes.length)
        .replace('{locations}', locationsList);
      
      setMessages([
        {
          role: 'assistant',
          content: welcomeMessage
        }
      ]);
    }
  }, [isOpen, currentLanguage, culturalNodes]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      
      // Prepare cultural nodes data for context
      const locationsData = culturalNodes.map(node => ({
        title: node.title,
        description: node.description,
        category: node.category,
        historicalPeriod: node.historicalPeriod,
        coordinates: `${node.latitude}, ${node.longitude}`,
        discovered: discoveredNodes.has(node.id)
      }));

      const locationsContext = JSON.stringify(locationsData, null, 2);
      
      const prompt = `You are a knowledgeable and friendly tour guide assistant for Timișoara, Romania.
You have access to the following cultural heritage locations in our database:

${locationsContext}

Your role:
1. Help users learn about these specific locations in detail
2. Provide historical context and interesting facts about the monuments
3. Recommend nearby restaurants, cafes, and attractions around these locations
4. Create custom trip itineraries based on user preferences (interests, time available, etc.)
5. Answer questions about the architecture, history, and cultural significance
6. Provide practical information like opening hours, accessibility, etc.

IMPORTANT: When a user asks you to create a trip, plan a route, or make an itinerary based on their interests (like "make me a trip based on architecture" or "plan a 2-hour route for history lovers"), you MUST:
1. Select the most relevant locations from the database that match their preferences
2. Include a special JSON block at the END of your response with this exact format:

---ROUTE_DATA---
{"locations": ["Location Title 1", "Location Title 2", "Location Title 3"]}
---END_ROUTE_DATA---

3. Before the JSON block, provide a friendly explanation of the route in natural language

For example, if someone asks "make me a trip based on architecture":
- First, write a friendly response explaining the route
- Then add the JSON block with exact location titles from the database

Categories available: ${[...new Set(culturalNodes.map(n => n.category))].join(', ')}

Be conversational, informative, and enthusiastic about Timișoara's rich history.
Keep responses concise but informative (2-4 paragraphs max).
Respond in ${currentLanguage === 'ro' ? 'Romanian' : currentLanguage === 'hu' ? 'Hungarian' : currentLanguage === 'de' ? 'German' : currentLanguage === 'fr' ? 'French' : currentLanguage === 'es' ? 'Spanish' : 'English'}.

User question: ${userMessage}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log('AI Response:', text);

      // Check if response contains route data
      const routeMatch = text.match(/---ROUTE_DATA---(.*?)---END_ROUTE_DATA---/s);
      
      console.log('Route match found:', !!routeMatch);
      
      if (routeMatch) {
        try {
          const routeData = JSON.parse(routeMatch[1].trim());
          const locationTitles = routeData.locations || [];
          
          console.log('Parsed location titles:', locationTitles);
          
          // Find matching nodes from database
          const selectedNodes = culturalNodes.filter(node => 
            locationTitles.some(title => 
              node.title.toLowerCase().includes(title.toLowerCase()) ||
              title.toLowerCase().includes(node.title.toLowerCase())
            )
          );

          console.log('Selected nodes:', selectedNodes.length, selectedNodes.map(n => n.title));

          if (selectedNodes.length > 0 && userLocation && onCreateRoute) {
            // Remove the JSON block and clean up any remaining artifacts
            let cleanText = text.replace(/---ROUTE_DATA---.*?---END_ROUTE_DATA---/s, '').trim();
            
            // Remove code blocks with json
            cleanText = cleanText.replace(/```json[\s\S]*?```/gi, '').trim();
            cleanText = cleanText.replace(/```[\s\S]*?```/g, '').trim();
            
            // Remove any JSON objects
            cleanText = cleanText.replace(/\{[\s\S]*?"locations"[\s\S]*?\}/g, '').trim();
            cleanText = cleanText.replace(/\{[\s"]*locations[\s"]*:[\s\S]*?\}/g, '').trim();
            
            // Remove triple backticks, quotes, and other artifacts
            cleanText = cleanText.replace(/```/g, '').trim();
            cleanText = cleanText.replace(/^\s*["'`]+|["'`]+\s*$/g, '').trim();
            
            // Remove lines that look like JSON remnants
            cleanText = cleanText.split('\n')
              .filter(line => !line.trim().match(/^[`'"{}[\]]+$/) && line.trim() !== 'json')
              .join('\n')
              .trim();
            
            // Add assistant response without JSON
            setMessages(prev => [...prev, { role: 'assistant', content: cleanText }]);
            
            // Close chatbot to show the popup clearly
            onClose();
            
            // Show confirmation dialog with selected locations AND AI response
            const isDarkMode = document.documentElement.classList.contains('dark');
            
            // Translate category names
            const translateCategory = (category) => {
              const categoryMap = {
                'Architecture': {
                  ro: 'Arhitectură',
                  hu: 'Építészet',
                  de: 'Architektur',
                  fr: 'Architecture',
                  es: 'Arquitectura',
                  en: 'Architecture'
                },
                'Monument': {
                  ro: 'Monument',
                  hu: 'Emlékmű',
                  de: 'Denkmal',
                  fr: 'Monument',
                  es: 'Monumento',
                  en: 'Monument'
                },
                'Museum': {
                  ro: 'Muzeu',
                  hu: 'Múzeum',
                  de: 'Museum',
                  fr: 'Musée',
                  es: 'Museo',
                  en: 'Museum'
                },
                'Park': {
                  ro: 'Parc',
                  hu: 'Park',
                  de: 'Park',
                  fr: 'Parc',
                  es: 'Parque',
                  en: 'Park'
                },
                'Church': {
                  ro: 'Biserică',
                  hu: 'Templom',
                  de: 'Kirche',
                  fr: 'Église',
                  es: 'Iglesia',
                  en: 'Church'
                },
                'Square': {
                  ro: 'Piață',
                  hu: 'Tér',
                  de: 'Platz',
                  fr: 'Place',
                  es: 'Plaza',
                  en: 'Square'
                }
              };
              return categoryMap[category]?.[currentLanguage] || category;
            };
            
            const locationsList = selectedNodes.map((node, i) => 
              `<div style="text-align: left; padding: 8px; margin: 4px 0; background: ${isDarkMode ? '#374151' : '#f3f4f6'}; border-radius: 6px;">
                <strong>${i + 1}. ${node.title}</strong>
                <div style="font-size: 0.9em; opacity: 0.8; margin-top: 4px;">${translateCategory(node.category)}</div>
              </div>`
            ).join('');
            
            // Translate section headers
            const aiResponseLabel = currentLanguage === 'ro' ? 'Recomandarea Asistentului:' :
                                   currentLanguage === 'hu' ? 'Asszisztens Ajánlása:' :
                                   currentLanguage === 'de' ? 'Assistentenempfehlung:' :
                                   currentLanguage === 'fr' ? 'Recommandation de l\'Assistant:' :
                                   currentLanguage === 'es' ? 'Recomendación del Asistente:' :
                                   'Assistant\'s Recommendation:';
            
            const suggestedLocationsLabel = currentLanguage === 'ro' ? 'Locații Sugerate:' :
                                           currentLanguage === 'hu' ? 'Javasolt Helyszínek:' :
                                           currentLanguage === 'de' ? 'Vorgeschlagene Orte:' :
                                           currentLanguage === 'fr' ? 'Lieux Suggérés:' :
                                           currentLanguage === 'es' ? 'Lugares Sugeridos:' :
                                           'Suggested Locations:';
            
            setTimeout(async () => {
              const result = await Swal.fire({
                title: currentLanguage === 'ro' ? 'Confirmare Traseu' :
                       currentLanguage === 'hu' ? 'Útvonal Megerősítése' :
                       currentLanguage === 'de' ? 'Route Bestätigen' :
                       currentLanguage === 'fr' ? 'Confirmer l\'Itinéraire' :
                       currentLanguage === 'es' ? 'Confirmar Ruta' :
                       'Confirm Trip',
                html: `
                  <div style="text-align: left; margin-bottom: 20px; padding: 12px; background: ${isDarkMode ? '#1f2937' : '#f9fafb'}; border-radius: 8px; border-left: 4px solid #6f4e35;">
                    <h4 style="margin: 0 0 8px 0; color: #6f4e35; font-size: 0.95em; font-weight: 600;">${aiResponseLabel}</h4>
                    <p style="margin: 0; font-size: 0.9em; line-height: 1.5; white-space: pre-wrap;">${cleanText}</p>
                  </div>
                  <div style="margin-bottom: 16px;">
                    <h4 style="margin: 0 0 12px 0; font-size: 1em; font-weight: 600; text-align: left;">${suggestedLocationsLabel}</h4>
                  </div>
                  ${locationsList}
                  <p style="margin-top: 16px; font-size: 0.95em;">
                    ${currentLanguage === 'ro' ? 'Doriți să creez acest traseu pe hartă?' :
                      currentLanguage === 'hu' ? 'Szeretnéd, hogy létrehozzam ezt az útvonalat a térképen?' :
                      currentLanguage === 'de' ? 'Soll ich diese Route auf der Karte erstellen?' :
                      currentLanguage === 'fr' ? 'Voulez-vous que je crée cet itinéraire sur la carte?' :
                      currentLanguage === 'es' ? '¿Quieres que cree esta ruta en el mapa?' :
                      'Would you like me to create this route on the map?'}
                  </p>
                `,
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: currentLanguage === 'ro' ? 'Da, creează traseul' :
                                   currentLanguage === 'hu' ? 'Igen, hozd létre' :
                                   currentLanguage === 'de' ? 'Ja, erstellen' :
                                   currentLanguage === 'fr' ? 'Oui, créer' :
                                   currentLanguage === 'es' ? 'Sí, crear' :
                                   'Yes, create route',
                cancelButtonText: currentLanguage === 'ro' ? 'Nu, mulțumesc' :
                                  currentLanguage === 'hu' ? 'Nem, köszönöm' :
                                  currentLanguage === 'de' ? 'Nein, danke' :
                                  currentLanguage === 'fr' ? 'Non, merci' :
                                  currentLanguage === 'es' ? 'No, gracias' :
                                  'No, thanks',
                confirmButtonColor: '#6f4e35',
                cancelButtonColor: '#9ca3af',
                background: isDarkMode ? '#1f2937' : '#ffffff',
                color: isDarkMode ? '#f3f4f6' : '#000000',
                width: '600px'
              });

              if (result.isConfirmed) {
                // Create the route on the map
                onCreateRoute(userLocation, selectedNodes);
                
                await Swal.fire({
                  title: currentLanguage === 'ro' ? 'Traseu Creat!' :
                         currentLanguage === 'hu' ? 'Útvonal Létrehozva!' :
                         currentLanguage === 'de' ? 'Route Erstellt!' :
                         currentLanguage === 'fr' ? 'Itinéraire Créé!' :
                         currentLanguage === 'es' ? 'Ruta Creada!' :
                         'Route Created!',
                  text: currentLanguage === 'ro' ? 'Traseul tău a fost creat. Bucură-te de vizită!' :
                        currentLanguage === 'hu' ? 'Az útvonalad elkészült. Élvezd a látogatást!' :
                        currentLanguage === 'de' ? 'Ihre Route wurde erstellt. Viel Spaß beim Besuch!' :
                        currentLanguage === 'fr' ? 'Votre itinéraire a été créé. Profitez de votre visite!' :
                        currentLanguage === 'es' ? 'Tu ruta ha sido creada. ¡Disfruta de tu visita!' :
                        'Your route has been created. Enjoy your visit!',
                  icon: 'success',
                  timer: 2000,
                  showConfirmButton: false,
                  background: isDarkMode ? '#1f2937' : '#ffffff',
                  color: isDarkMode ? '#f3f4f6' : '#000000'
                });
              }
            }, 500);
            
            return;
          }
        } catch (parseError) {
          console.error('Failed to parse route data:', parseError);
        }
      }

      // Add assistant response (normal conversation)
      setMessages(prev => [...prev, { role: 'assistant', content: text }]);
    } catch (error) {
      console.error('Chat error:', error);
      
      // Check if it's a rate limit error
      let errorMessage = t('chatbot.errorMessage', currentLanguage);
      
      if (error.message && error.message.includes('quota')) {
        errorMessage = currentLanguage === 'ro' 
          ? 'Limită de solicitări atinsă. Vă rugăm să încercați din nou mai târziu (aproximativ 40 de secunde).'
          : currentLanguage === 'hu'
          ? 'Kéréslimit elérve. Kérjük, próbáld újra később (körülbelül 40 másodperc múlva).'
          : currentLanguage === 'de'
          ? 'Anforderungslimit erreicht. Bitte versuchen Sie es später erneut (etwa 40 Sekunden).'
          : currentLanguage === 'fr'
          ? 'Limite de requêtes atteinte. Veuillez réessayer plus tard (environ 40 secondes).'
          : currentLanguage === 'es'
          ? 'Límite de solicitudes alcanzado. Por favor, inténtalo de nuevo más tarde (aproximadamente 40 segundos).'
          : 'Request limit reached. Please try again later (approximately 40 seconds).';
      }
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: errorMessage
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className={`${
            isDark ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-900'
          } rounded-xl shadow-2xl max-w-2xl w-full h-[600px] overflow-hidden flex flex-col`}
        >
          {/* Header */}
          <div className="bg-heritage-700 text-white p-4 flex items-center justify-between flex-shrink-0">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Bot className="w-6 h-6" />
              {t('chatbot.modalTitle', currentLanguage)}
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-heritage-800 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isDark ? 'bg-heritage-800' : 'bg-heritage-200'
                  }`}>
                    <Bot className={`w-5 h-5 ${
                      isDark ? 'text-heritage-200' : 'text-heritage-800'
                    }`} />
                  </div>
                )}
                
                <div
                  className={`max-w-[75%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-heritage-700 text-white'
                      : isDark
                      ? 'bg-neutral-800 text-neutral-100'
                      : 'bg-neutral-100 text-neutral-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>

                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-heritage-600 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            ))}
            
            {loading && (
              <div className="flex gap-3 justify-start">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isDark ? 'bg-heritage-800' : 'bg-heritage-200'
                }`}>
                  <Bot className={`w-5 h-5 ${
                    isDark ? 'text-heritage-200' : 'text-heritage-800'
                  }`} />
                </div>
                <div className={`rounded-lg p-3 ${
                  isDark ? 'bg-neutral-800' : 'bg-neutral-100'
                }`}>
                  <Loader className="w-5 h-5 animate-spin text-heritage-700" />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className={`p-4 border-t flex gap-2 flex-shrink-0 ${
            isDark ? 'border-neutral-700 bg-neutral-900' : 'border-neutral-200 bg-white'
          }`}>
            <input
              key={currentLanguage}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t('chatbot.inputPlaceholder', currentLanguage)}
              className={`flex-1 px-4 py-2 rounded-lg focus:ring-2 focus:ring-heritage-500 focus:outline-none ${
                isDark
                  ? 'bg-neutral-800 border border-neutral-700 text-white'
                  : 'bg-neutral-50 border border-neutral-300 text-neutral-900'
              }`}
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="bg-heritage-700 hover:bg-heritage-800 text-white p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Send"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default ChatbotModal;
