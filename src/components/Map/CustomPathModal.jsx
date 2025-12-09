import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Navigation, MapPin } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import useMapStore from '../../stores/mapStore';
import { t } from '../../utils/uiTranslations';
import { translateLocationContent } from '../../services/geminiService';
import Swal from 'sweetalert2';

function CustomPathModal({ isOpen, onClose, onStartRoute }) {
  const { isDark } = useTheme();
  const culturalNodes = useMapStore((state) => state.culturalNodes);
  const discoveredNodes = useMapStore((state) => state.discoveredNodes);
  const currentLanguage = useMapStore((state) => state.currentLanguage);
  const translatedNodes = useMapStore((state) => state.translatedNodes);
  const setTranslatedNode = useMapStore((state) => state.setTranslatedNode);
  
  const [selectedNodes, setSelectedNodes] = useState(new Set());

  // Translate all nodes when modal opens or language changes
  useEffect(() => {
    async function translateAllNodes() {
      if (!isOpen || currentLanguage === 'en' || culturalNodes.length === 0) {
        return;
      }

      for (const node of culturalNodes) {
        // Skip if already translated
        if (translatedNodes[node.id]?.[currentLanguage]) {
          continue;
        }
        
        try {
          const translated = await translateLocationContent(node, currentLanguage);
          setTranslatedNode(node.id, currentLanguage, translated);
        } catch (error) {
          console.error(`Failed to translate node ${node.id}:`, error);
        }
      }
    }

    translateAllNodes();
  }, [isOpen, currentLanguage, culturalNodes, translatedNodes, setTranslatedNode]);

  const handleToggleNode = (nodeId) => {
    setSelectedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const isNodeSelected = (nodeId) => {
    return selectedNodes.has(nodeId);
  };

  const handleCalculateRoute = async () => {
    if (selectedNodes.size === 0) {
      await Swal.fire({
        title: t('customPath.noNodesSelectedTitle', currentLanguage),
        text: t('customPath.noNodesSelectedText', currentLanguage),
        icon: 'warning',
        confirmButtonColor: '#6f4e35',
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f3f4f6' : '#000000'
      });
      return;
    }

    const selectedNodeObjects = culturalNodes.filter(node => 
      selectedNodes.has(node.id)
    );

    // Close modal and start route directly
    onClose();
    onStartRoute(selectedNodeObjects);
    // Clear selections after route is created
    setSelectedNodes(new Set());
  };

  const handleStartRoute = async () => {
    if (selectedNodes.size === 0) {
      await Swal.fire({
        title: t('customPath.noNodesSelectedTitle', currentLanguage),
        text: t('customPath.noNodesSelectedText', currentLanguage),
        icon: 'warning',
        confirmButtonColor: '#6f4e35',
        background: isDark ? '#1f2937' : '#ffffff',
        color: isDark ? '#f3f4f6' : '#000000'
      });
      return;
    }

    const selectedNodeObjects = culturalNodes.filter(node => 
      selectedNodes.has(node.id)
    );

    onStartRoute(selectedNodeObjects);
    onClose();
    setSelectedNodes(new Set());
  };

  const handleCancel = () => {
    setSelectedNodes(new Set());
    onClose();
  };

  if (!isOpen) return null;

  // Main selection view
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center p-4"
        onClick={handleCancel}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className={`${
            isDark ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-900'
          } rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col`}
        >
          {/* Header */}
          <div className="bg-heritage-700 text-white p-4 flex items-center justify-between flex-shrink-0">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <MapPin className="w-6 h-6" />
              {t('customPath.modalTitle', currentLanguage)}
            </h2>
            <button
              onClick={handleCancel}
              className="p-1 hover:bg-heritage-800 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4">
            {culturalNodes.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className={`w-16 h-16 mx-auto mb-4 ${
                  isDark ? 'text-neutral-600' : 'text-neutral-400'
                }`} />
                <p className={`text-lg ${
                  isDark ? 'text-neutral-400' : 'text-neutral-600'
                }`}>
                  {t('customPath.noLocationsAvailable', currentLanguage)}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {culturalNodes.map((node) => {
                  const isSelected = isNodeSelected(node.id);
                  const isDiscovered = discoveredNodes.has(node.id);
                  
                  // Get translated version of the node if available
                  const displayNode = currentLanguage === 'en' 
                    ? node 
                    : (translatedNodes[node.id]?.[currentLanguage] 
                      ? { ...node, ...translatedNodes[node.id][currentLanguage] }
                      : node);
                  
                  return (
                    <div
                      key={node.id}
                      onClick={() => handleToggleNode(node.id)}
                      className={`flex gap-4 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected
                          ? isDark
                            ? 'border-green-500 bg-green-900/20'
                            : 'border-green-500 bg-green-50'
                          : isDark
                            ? 'border-neutral-700 bg-neutral-800 hover:border-neutral-600'
                            : 'border-neutral-200 bg-neutral-50 hover:border-neutral-300'
                      }`}
                    >
                      {/* Checkbox */}
                      <div className="flex-shrink-0 pt-1">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          isSelected
                            ? 'bg-green-500 border-green-500'
                            : isDark
                              ? 'border-neutral-500 bg-neutral-700'
                              : 'border-neutral-400 bg-white'
                        }`}>
                          {isSelected && <Check className="w-4 h-4 text-white" />}
                        </div>
                      </div>

                      {/* Image */}
                      {displayNode.primaryImageUrl && (
                        <div className="flex-shrink-0">
                          <img
                            src={displayNode.primaryImageUrl}
                            alt={displayNode.title}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className={`font-semibold text-base leading-tight ${
                            isDark ? 'text-neutral-100' : 'text-neutral-900'
                          }`}>
                            {displayNode.title}
                          </h3>
                          {isDiscovered && (
                            <span className="flex-shrink-0 px-2 py-0.5 bg-amber-500 text-white text-xs font-medium rounded">
                              {t('customPath.visited', currentLanguage)}
                            </span>
                          )}
                        </div>
                        <p className={`text-xs mb-2 ${
                          isDark ? 'text-neutral-400' : 'text-neutral-600'
                        }`}>
                          {displayNode.category}
                        </p>
                        <p className={`text-sm line-clamp-2 ${
                          isDark ? 'text-neutral-300' : 'text-neutral-700'
                        }`}>
                          {displayNode.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className={`p-4 border-t flex gap-3 flex-shrink-0 ${
            isDark ? 'border-neutral-700 bg-neutral-900' : 'border-neutral-200 bg-white'
          }`}>
            <button
              onClick={handleCancel}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors ${
                isDark 
                  ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200' 
                  : 'bg-neutral-200 hover:bg-neutral-300 text-neutral-800'
              }`}
            >
              {t('customPath.cancel', currentLanguage)}
            </button>
            <button
              onClick={handleCalculateRoute}
              disabled={selectedNodes.size === 0}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                selectedNodes.size === 0
                  ? 'bg-neutral-400 cursor-not-allowed text-neutral-600'
                  : 'bg-heritage-700 hover:bg-heritage-800 text-white'
              }`}
            >
              <Navigation className="w-4 h-4" />
              {t('customPath.calculateRoute', currentLanguage)} ({selectedNodes.size})
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default CustomPathModal;
