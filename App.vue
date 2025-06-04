<template>
  <div class="app-container">
    <!-- Header -->
    <div class="header">
      <div class="header-icon">✨</div>
      <h1 class="header-title">AI Text Assistant</h1>
      <div class="header-subtitle">Transform your text with AI</div>
    </div>

    <!-- Main Content Area -->
    <div class="content">
      <!-- Text Input Section -->
      <div class="input-section">
        <label for="textInput" class="input-label">Enter your text:</label>
        <textarea
          id="textInput"
          v-model="inputText"
          placeholder="Type or paste your text here..."
          class="text-input"
          :disabled="isProcessing"
        ></textarea>
        
        <!-- Action Buttons -->
        <div class="button-group">
          <button 
            @click="handleAction('copy')"
            class="action-btn copy-btn"
            :disabled="!inputText.trim() || isProcessing"
          >
            <span class="btn-icon">📋</span>
            Copy
          </button>
          
          <button 
            @click="handleAction('Rephrase this text: ')"
            class="action-btn rephrase-btn"
            :disabled="!inputText.trim() || isProcessing"
          >
            <span v-if="!isProcessing || currentAction !== 'Rephrase this text: '" class="btn-icon">🔄</span>
            <span v-else class="loading-spinner"></span>
            {{ isProcessing && currentAction === 'Rephrase this text: ' ? 'Rephrasing...' : 'Rephrase' }}
          </button>
          
          <button 
            @click="handleAction('Make this text more professional: ')"
            class="action-btn professional-btn"
            :disabled="!inputText.trim() || isProcessing"
          >
            <span v-if="!isProcessing || currentAction !== 'Make this text more professional: '" class="btn-icon">💼</span>
            <span v-else class="loading-spinner"></span>
            {{ isProcessing && currentAction === 'Make this text more professional: ' ? 'Processing...' : 'Make Professional' }}
          </button>
          
          <button 
            @click="handleAction('Summarize this text: ')"
            class="action-btn summary-btn"
            :disabled="!inputText.trim() || isProcessing"
          >
            <span v-if="!isProcessing || currentAction !== 'Summarize this text: '" class="btn-icon">📝</span>
            <span v-else class="loading-spinner"></span>
            {{ isProcessing && currentAction === 'Summarize this text: ' ? 'Summarizing...' : 'Summarize' }}
          </button>
        </div>
      </div>

      <!-- History Section -->
      <div class="history-section">
        <div class="history-header">
          <h2 class="history-title">
            <span class="history-icon">📚</span>
            Recent Results
          </h2>
          <button 
            v-if="history.length > 0" 
            @click="clearHistory"
            class="clear-btn"
          >
            Clear All
          </button>
        </div>
        
        <div v-if="history.length === 0" class="empty-history">
          <div class="empty-icon">🔮</div>
          <p>No results yet. Try processing some text!</p>
        </div>
        
        <div v-else class="history-list">
          <div 
            v-for="(item, index) in history" 
            :key="index"
            class="history-item"
            @click="loadHistoryItem(item)"
          >
            <div class="history-item-header">
              <span class="history-action">{{ getActionLabel(item.action) }}</span>
              <span class="history-time">{{ formatTime(item.timestamp) }}</span>
            </div>
            <div class="history-original">{{ truncateText(item.original, 60) }}</div>
            <div class="history-arrow">↓</div>
            <div class="history-result">{{ truncateText(item.result, 60) }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      inputText: '',
      isProcessing: false,
      currentAction: '',
      history: []
    }
  },
  mounted() {
    this.loadHistory();
  },
  methods: {
    async handleAction(action) {
      if (!this.inputText.trim()) return;
      
      if (action === 'copy') {
        this.copyText(this.inputText);
        return;
      }
      
      this.isProcessing = true;
      this.currentAction = action;
      
      try {
        const result = await this.runActionByAI(action, this.inputText);
        if (result) {
          // Store original text before replacing
          const originalText = this.inputText;
          
          // Replace the input text with the result
          this.inputText = result;
          
          // Add to history
          this.addToHistory(action, originalText, result);
        }
      } catch (error) {
        console.error('AI action failed:', error);
        // You could show an error message here
      } finally {
        this.isProcessing = false;
        this.currentAction = '';
      }
    },
    
    async runActionByAI(action, selectedText) {
      const response = await fetch("https://text.pollinations.ai/prompt/" + "DO THIS ACTION AND RETURN ONLY THE RESULT. " + action + encodeURIComponent(selectedText));
      if (!response.ok) {
        throw new Error('Failed to fetch AI response: ' + response.statusText);
      }
      return await response.text();
    },
    
    copyText(text) {
      navigator.clipboard.writeText(text).then(() => {
        console.log('Text copied to clipboard');
        // You could show a success message here
      }).catch(err => {
        console.error('Failed to copy text:', err);
      });
    },
    
    addToHistory(action, original, result) {
      const historyItem = {
        action,
        original,
        result,
        timestamp: new Date()
      };
      
      this.history.unshift(historyItem);
      
      // Keep only last 10 items
      if (this.history.length > 10) {
        this.history = this.history.slice(0, 10);
      }
      
      this.saveHistory();
    },
    
    loadHistoryItem(item) {
      this.inputText = item.result;
    },
    
    clearHistory() {
      this.history = [];
      this.saveHistory();
    },
    
    saveHistory() {
      localStorage.setItem('aiTextAssistantHistory', JSON.stringify(this.history));
    },
    
    loadHistory() {
      const stored = localStorage.getItem('aiTextAssistantHistory');
      if (stored) {
        this.history = JSON.parse(stored).map(item => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
      }
    },
    
    getActionLabel(action) {
      const labels = {
        'Rephrase this text: ': 'Rephrase',
        'Make this text more professional: ': 'Professional',
        'Summarize this text: ': 'Summary'
      };
      return labels[action] || action;
    },
    
    formatTime(timestamp) {
      return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },
    
    truncateText(text, maxLength) {
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength) + '...';
    }
  }
}
</script>

<style >
body {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
</style>
<style scoped>
.app-container {
  min-width: 400px;
  min-height: 600px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.header {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 20px;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.header-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.header-title {
  margin: 0 0 4px 0;
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(45deg, #fff, #f0f0ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-subtitle {
  font-size: 14px;
  opacity: 0.8;
  font-weight: 400;
}

.content {
  padding: 20px;
}

.input-section {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.input-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  font-size: 14px;
}

.text-input {
  width: 100%;
  min-height: 120px;
  padding: 12px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.text-input:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.6);
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.2);
}

.text-input:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.button-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.action-btn {
  padding: 12px 16px;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  position: relative;
  overflow: hidden;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

.action-btn:not(:disabled):hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

.copy-btn {
  background: rgba(255, 255, 255, 0.9);
  color: #374151;
  font-weight: 700;
}

.copy-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 1);
  color: #1f2937;
}

.rephrase-btn {
  background: rgba(255, 255, 255, 0.15);
  color: white;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.rephrase-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.25);
}

.professional-btn {
  background: rgba(255, 255, 255, 0.15);
  color: white;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.professional-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.25);
}

.summary-btn {
  background: rgba(255, 255, 255, 0.15);
  color: white;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.summary-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.25);
}

.btn-icon {
  font-size: 16px;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top: 2px solid #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.history-section {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
}

.history-header {
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.history-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.history-icon {
  font-size: 20px;
}

.clear-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.empty-history {
  padding: 40px 20px;
  text-align: center;
  opacity: 0.7;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.history-list {
  max-height: 300px;
  overflow-y: auto;
}

.history-item {
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.2s ease;
}

.history-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.history-item:last-child {
  border-bottom: none;
}

.history-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.history-action {
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.history-time {
  font-size: 11px;
  opacity: 0.7;
}

.history-original,
.history-result {
  font-size: 13px;
  line-height: 1.4;
  padding: 8px 12px;
  border-radius: 8px;
  margin: 4px 0;
}

.history-original {
  background: rgba(255, 255, 255, 0.1);
  opacity: 0.8;
}

.history-result {
  background: rgba(255, 255, 255, 0.2);
}

.history-arrow {
  text-align: center;
  font-size: 16px;
  opacity: 0.6;
  margin: 4px 0;
}

/* Scrollbar styling */
.history-list::-webkit-scrollbar {
  width: 6px;
}

.history-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
}

.history-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.history-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
</style>