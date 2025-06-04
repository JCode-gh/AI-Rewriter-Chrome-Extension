// Content script for text selection popup
(function() {
  // Prevent multiple script injections
  if (window.textSelectionPopupInjected) {
    return;
  }
  window.textSelectionPopupInjected = true;

  let textSelectionPopup = null;
  let popupContext = null; // Store context about where popup was created

// Create the popup HTML structure
function createPopup() {
  // Remove any existing popup first
  const existingPopup = document.getElementById('text-selection-popup');
  if (existingPopup) {
    existingPopup.remove();
  }
  
  const popup = document.createElement('div');
  popup.id = 'text-selection-popup';  popup.innerHTML = `
    <div class="popup-container">
      <button id="copy-btn" class="popup-btn">Copy</button>
      <button id="rephrase-btn" class="popup-btn">Rephrase</button>
      <button id="professional-btn" class="popup-btn">Make it professional</button>
      <button id="summary-btn" class="popup-btn">Summary</button>
    </div>
  `;
    // Add CSS styles
  popup.style.cssText = `
    position: absolute;
    z-index: 10000;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 16px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.1);
    padding: 16px;
    display: none;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    font-size: 14px;
    backdrop-filter: blur(10px);
    transform: translateY(-8px);
    animation: popupSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  `;
  
  // Add popup animation keyframes
  if (!document.querySelector('#popup-keyframes')) {
    const style = document.createElement('style');
    style.id = 'popup-keyframes';
    style.textContent = `
      @keyframes popupSlideIn {
        0% { 
          opacity: 0; 
          transform: translateY(-8px) scale(0.95); 
        }
        100% { 
          opacity: 1; 
          transform: translateY(-8px) scale(1); 
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  // Style the container
  const container = popup.querySelector('.popup-container');
  container.style.cssText = `
    display: flex;
    gap: 12px;
    align-items: center;
    position: relative;
  `;
    // Style the buttons with modern, professional design
  const buttons = popup.querySelectorAll('.popup-btn');
  const buttonColors = [
    { bg: 'rgba(255, 255, 255, 0.9)', hover: 'rgba(255, 255, 255, 1)', text: '#374151' }, // Copy - Clean white
    { bg: 'rgba(255, 255, 255, 0.15)', hover: 'rgba(255, 255, 255, 0.25)', text: '#fff' }, // Rephrase - Subtle glass
    { bg: 'rgba(255, 255, 255, 0.15)', hover: 'rgba(255, 255, 255, 0.25)', text: '#fff' }, // Professional - Subtle glass
    { bg: 'rgba(255, 255, 255, 0.15)', hover: 'rgba(255, 255, 255, 0.25)', text: '#fff' }  // Summary - Subtle glass
  ];
  
  buttons.forEach((btn, index) => {
    const color = buttonColors[index];
    btn.style.cssText = `
      padding: 10px 16px;
      border: none;
      border-radius: 10px;
      background: ${color.bg};
      color: ${color.text};
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      font-size: 12px;
      font-weight: 600;
      white-space: nowrap;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      position: relative;
      overflow: hidden;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    `;
    
    // Add ripple effect on click
    btn.addEventListener('mousedown', (e) => {
      const ripple = document.createElement('span');
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(255,255,255,0.3);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 0.6s linear;
        pointer-events: none;
      `;
      
      btn.appendChild(ripple);
      
      setTimeout(() => {
        if (ripple.parentNode) {
          ripple.remove();
        }
      }, 600);
    });
    
    // Add hover effects
    btn.addEventListener('mouseenter', () => {
      btn.style.background = color.hover;
      btn.style.transform = 'translateY(-2px) scale(1.05)';
      btn.style.boxShadow = '0 8px 20px rgba(0,0,0,0.2)';
    });
    
    btn.addEventListener('mouseleave', () => {
      btn.style.background = color.bg;
      btn.style.transform = 'translateY(0) scale(1)';
      btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    });
  });
  
  // Add ripple animation keyframes
  if (!document.querySelector('#ripple-keyframes')) {
    const style = document.createElement('style');
    style.id = 'ripple-keyframes';
    style.textContent = `
      @keyframes ripple {
        to { transform: scale(4); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(popup);  return popup;
}

// Get currently selected text (helper function)
function getCurrentSelectedText() {
  const selection = window.getSelection();
  let selectedText = selection.toString().trim();
  
  // Also check for text selection in input fields and textareas
  const activeElement = document.activeElement;
  if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
    const start = activeElement.selectionStart;
    const end = activeElement.selectionEnd;
    if (start !== null && end !== null && start !== end) {
      selectedText = activeElement.value.substring(start, end).trim();
    }
  }
  
  return selectedText;
}

// Position the popup above the selected text
function positionPopup(popup, selection) {
  const range = selection.getRangeAt(0);
  let rect = range.getBoundingClientRect();
  
  // Handle input fields and textareas differently
  const activeElement = document.activeElement;
  if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
    // For input fields, use the element's bounding box
    const inputRect = activeElement.getBoundingClientRect();
    rect = {
      top: inputRect.top,
      bottom: inputRect.bottom,
      left: inputRect.left,
      right: inputRect.right,
      width: inputRect.width,
      height: inputRect.height
    };
  }
  
  // Show popup temporarily to get its dimensions
  popup.style.display = 'block';
  popup.style.visibility = 'hidden';
  const popupRect = popup.getBoundingClientRect();
  popup.style.visibility = 'visible';
  
  // Center the popup horizontally above the selection
  let top = rect.top + window.scrollY - popupRect.height - 10;
  let left = rect.left + window.scrollX + (rect.width / 2) - (popupRect.width / 2);
  
  // Ensure popup stays within viewport horizontally
  if (left < 10) {
    left = 10;
  } else if (left + popupRect.width > window.innerWidth - 10) {
    left = window.innerWidth - popupRect.width - 10;
  }
  
  // If no space above, show below the selection
  if (top < window.scrollY + 10) {
    top = rect.bottom + window.scrollY + 10;
  }
  
  popup.style.top = `${top}px`;
  popup.style.left = `${left}px`;
}

// Show the popup
function showPopup(selectedText) {
  // Store context about the current selection
  const activeElement = document.activeElement;
  popupContext = {
    activeElement: activeElement,
    isInputField: activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA'),
    selectionStart: activeElement ? activeElement.selectionStart : null,
    selectionEnd: activeElement ? activeElement.selectionEnd : null,
    windowSelection: window.getSelection().rangeCount > 0 ? window.getSelection().getRangeAt(0).cloneRange() : null
  };
  
  if (!textSelectionPopup) {
    textSelectionPopup = createPopup();
      // Add event listeners for buttons
    document.getElementById('copy-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      const currentSelectedText = getCurrentSelectedText();
      handleButtonClick('copy', currentSelectedText);
    });
    
    document.getElementById('rephrase-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      const currentSelectedText = getCurrentSelectedText();
      handleButtonClick('Rephrase this text: ', currentSelectedText);
    });
    
    document.getElementById('professional-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      const currentSelectedText = getCurrentSelectedText();
      handleButtonClick('Make this text more professional: ', currentSelectedText);
    });
    
    document.getElementById('summary-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      const currentSelectedText = getCurrentSelectedText();
      handleButtonClick('Summarize this text: ', currentSelectedText);
    });
  }
  
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    positionPopup(textSelectionPopup, selection);
    textSelectionPopup.style.display = 'block';
  }
}

// Hide the popup
function hidePopup() {
  if (textSelectionPopup) {
    textSelectionPopup.style.display = 'none';
  }
}

// Handle button clicks - you can implement your methods here
async function handleButtonClick(action, selectedText) {
  console.log(`Action: ${action}, Selected text: "${selectedText}"`);
  
  switch(action) {
    case 'copy':
      copyText(selectedText);
      break;
    default:
        // Show loading state and skeleton animation
        showLoadingState(action);
        showSkeletonAnimation();
          try {
          await runActionByAI(action, selectedText);
          resetButtonState(action);
        } catch (error) {
          console.error('AI action failed:', error);
          hideSkeletonAnimation();
          resetButtonState(action);
        }
        break;  
  }
  
  hidePopup();
}

async function runActionByAI(action, selectedText) {
    const response = await fetch("https://text.pollinations.ai" + "/prompt/" + "DO THIS ACTION AND RETURN ONLY THE RESULT. " + action + encodeURIComponent(selectedText));
    if (!response.ok) {
        console.error('Failed to fetch AI response:', response.statusText);
        return;
    }
    const aiResponseInText = await response.text();
    console.log('AI response:', aiResponseInText);

    // Replace the selected text with the AI response using stored context
    if (popupContext && popupContext.isInputField && popupContext.activeElement) {
        // Handle input fields and textareas using stored context
        const element = popupContext.activeElement;
        const start = popupContext.selectionStart;
        const end = popupContext.selectionEnd;
        
        if (start !== null && end !== null) {
            // Replace selected text in input field/textarea
            const currentValue = element.value;
            const newValue = currentValue.substring(0, start) + aiResponseInText + currentValue.substring(end);
            element.value = newValue;
            
            // Move cursor to end of inserted text
            const newCursorPosition = start + aiResponseInText.length;
            element.setSelectionRange(newCursorPosition, newCursorPosition);
            element.focus();
        }
    } else if (popupContext && popupContext.windowSelection) {
        // Handle regular text selection using stored range
        const range = popupContext.windowSelection;
        range.deleteContents();
        const newNode = document.createTextNode(aiResponseInText);
        range.insertNode(newNode);
        
        // Move the cursor to the end of the inserted text
        range.setStartAfter(newNode);
        range.collapse(true);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }    console.log('Text replaced with AI response:', aiResponseInText);
    
    // Hide skeleton animation and show success feedback
    hideSkeletonAnimation();
    showSuccessAnimation();
}

// Show loading state on the clicked button
function showLoadingState(action) {
  let buttonId;
  switch(action) {
    case 'Rephrase this text: ':
      buttonId = 'rephrase-btn';
      break;
    case 'Make this text more professional: ':
      buttonId = 'professional-btn';
      break;
    case 'Summarize this text: ':
      buttonId = 'summary-btn';
      break;
  }
    if (buttonId && textSelectionPopup) {
    const button = textSelectionPopup.querySelector(`#${buttonId}`);
    if (button) {
      const originalText = button.textContent;
      const originalBg = button.style.background;
      button.dataset.originalText = originalText;
      button.dataset.originalBg = originalBg;
      
      button.innerHTML = `
        <span class="loading-spinner"></span>
        <span>Processing...</span>
      `;
      button.style.pointerEvents = 'none';
      button.style.background = '#6c757d';
      button.style.transform = 'translateY(0) scale(1)';
      
      // Add enhanced spinner styles
      const spinner = button.querySelector('.loading-spinner');
      spinner.style.cssText = `
        display: inline-block;
        width: 14px;
        height: 14px;
        border: 2px solid rgba(255,255,255,0.3);
        border-top: 2px solid #ffffff;
        border-radius: 50%;
        animation: enhancedSpin 0.8s linear infinite;
        margin-right: 8px;
      `;
      
      // Add enhanced spinner animation if not already added
      if (!document.querySelector('#enhanced-spinner-keyframes')) {
        const style = document.createElement('style');
        style.id = 'enhanced-spinner-keyframes';
        style.textContent = `
          @keyframes enhancedSpin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `;
        document.head.appendChild(style);
      }
    }
  }
}

// Show skeleton animation where text will be replaced
function showSkeletonAnimation() {
  if (popupContext && popupContext.isInputField && popupContext.activeElement) {    // For input fields and textareas, add a subtle glow effect
    const element = popupContext.activeElement;
    element.style.transition = 'all 0.3s ease';
    element.style.boxShadow = '0 0 20px rgba(102, 126, 234, 0.4), inset 0 0 20px rgba(102, 126, 234, 0.1)';
    element.style.borderColor = '#667eea';
    element.style.borderWidth = '2px';
  } else if (popupContext && popupContext.windowSelection) {
    // For regular text, create a skeleton overlay
    try {
      const range = popupContext.windowSelection;
      const rect = range.getBoundingClientRect();
      
      const skeleton = document.createElement('div');
      skeleton.id = 'text-skeleton-overlay';      skeleton.style.cssText = `
        position: absolute;
        top: ${rect.top + window.scrollY}px;
        left: ${rect.left + window.scrollX}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        background: linear-gradient(90deg, 
          rgba(102, 126, 234, 0.1) 25%, 
          rgba(118, 75, 162, 0.2) 50%, 
          rgba(102, 126, 234, 0.1) 75%);
        background-size: 200% 100%;
        animation: enhanced-skeleton-loading 2s infinite;
        border-radius: 8px;
        z-index: 9999;
        pointer-events: none;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
      `;
        // Add skeleton animation if not already added
      if (!document.querySelector('#enhanced-skeleton-keyframes')) {
        const style = document.createElement('style');
        style.id = 'enhanced-skeleton-keyframes';
        style.textContent = `
          @keyframes enhanced-skeleton-loading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `;
        document.head.appendChild(style);
      }
      
      document.body.appendChild(skeleton);
    } catch (error) {
      console.log('Could not create skeleton overlay:', error);
    }
  }
}

// Hide skeleton animation
function hideSkeletonAnimation() {  // Remove input field glow effect
  if (popupContext && popupContext.isInputField && popupContext.activeElement) {
    const element = popupContext.activeElement;
    element.style.boxShadow = '';
    element.style.borderColor = '';
    element.style.borderWidth = '';
    element.style.transition = '';
  }
  
  // Remove skeleton overlay for regular text
  const skeleton = document.getElementById('text-skeleton-overlay');  if (skeleton) {
    skeleton.remove();
  }
}

// Reset button state after action completes
function resetButtonState(action) {
  let buttonId;
  switch(action) {
    case 'Rephrase this text: ':
      buttonId = 'rephrase-btn';
      break;
    case 'Make this text more professional: ':
      buttonId = 'professional-btn';
      break;
    case 'Summarize this text: ':
      buttonId = 'summary-btn';
      break;
  }
    if (buttonId && textSelectionPopup) {
    const button = textSelectionPopup.querySelector(`#${buttonId}`);
    if (button && button.dataset.originalText) {
      button.textContent = button.dataset.originalText;
      button.style.pointerEvents = '';
      button.style.background = button.dataset.originalBg || '';
      delete button.dataset.originalText;
      delete button.dataset.originalBg;
    }
  }
}

// Show success animation after text replacement
function showSuccessAnimation() {
  if (popupContext && popupContext.isInputField && popupContext.activeElement) {    // For input fields, show a brief green glow
    const element = popupContext.activeElement;
    element.style.transition = 'all 0.3s ease';
    element.style.boxShadow = '0 0 20px rgba(40, 167, 69, 0.6), inset 0 0 20px rgba(40, 167, 69, 0.1)';
    element.style.borderColor = '#28a745';
    element.style.borderWidth = '2px';
    
    setTimeout(() => {
      element.style.boxShadow = '';
      element.style.borderColor = '';
      element.style.borderWidth = '';
      element.style.transition = '';
    }, 1500);
  } else if (popupContext && popupContext.windowSelection) {
    // For regular text, show a subtle highlight animation
    try {
      const range = popupContext.windowSelection;
      const rect = range.getBoundingClientRect();
      
      const successOverlay = document.createElement('div');      successOverlay.style.cssText = `
        position: absolute;
        top: ${rect.top + window.scrollY}px;
        left: ${rect.left + window.scrollX}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        background: linear-gradient(135deg, rgba(40, 167, 69, 0.3), rgba(72, 187, 120, 0.2));
        border-radius: 8px;
        z-index: 9999;
        pointer-events: none;
        animation: enhanced-success-fade 1.5s ease-out forwards;
        box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
      `;
        // Add success animation if not already added
      if (!document.querySelector('#enhanced-success-keyframes')) {
        const style = document.createElement('style');
        style.id = 'enhanced-success-keyframes';
        style.textContent = `
          @keyframes enhanced-success-fade {
            0% { opacity: 0.9; transform: scale(1.05); }
            30% { opacity: 0.6; transform: scale(1.02); }
            100% { opacity: 0; transform: scale(1); }
          }
        `;
        document.head.appendChild(style);
      }
      
      document.body.appendChild(successOverlay);
      
      // Remove the overlay after animation
      setTimeout(() => {
        if (successOverlay && successOverlay.parentNode) {
          successOverlay.remove();
        }
      }, 1500);
    } catch (error) {
      console.log('Could not create success overlay:', error);
    }
  }
}

// Placeholder methods - implement your logic here
function copyText(text) {
  navigator.clipboard.writeText(text).then(() => {
    console.log('Text copied to clipboard:', text);
    // Optional: Show a brief confirmation
    showCopyConfirmation();
  }).catch(err => {
    console.error('Failed to copy text:', err);
    // Fallback for older browsers
    fallbackCopyText(text);
  });
}

function fallbackCopyText(text) {
  // Create a temporary textarea element
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  
  try {
    document.execCommand('copy');
    console.log('Text copied to clipboard (fallback):', text);
    showCopyConfirmation();
  } catch (err) {
    console.error('Fallback copy failed:', err);
  }
  
  document.body.removeChild(textArea);
}

function showCopyConfirmation() {
  // Brief visual feedback
  if (textSelectionPopup) {
    const originalText = textSelectionPopup.querySelector('#copy-btn').textContent;
    textSelectionPopup.querySelector('#copy-btn').textContent = 'Copied!';
    setTimeout(() => {
      if (textSelectionPopup && textSelectionPopup.querySelector('#copy-btn')) {
        textSelectionPopup.querySelector('#copy-btn').textContent = originalText;
      }
    }, 1000);
  }
}



// Event listeners
document.addEventListener('mouseup', (e) => {
  // Don't show popup if clicking on the popup itself
  if (textSelectionPopup && textSelectionPopup.contains(e.target)) {
    return;
  }
  
  // Small delay to ensure selection is complete
  setTimeout(() => {
    const selection = window.getSelection();
    let selectedText = selection.toString().trim();
    
    // Also check for text selection in input fields and textareas
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
      const start = activeElement.selectionStart;
      const end = activeElement.selectionEnd;
      if (start !== null && end !== null && start !== end) {
        selectedText = activeElement.value.substring(start, end).trim();
      }
    }
    
    if (selectedText && selectedText.length > 0) {
      showPopup(selectedText);
    } else {
      hidePopup();
    }
  }, 10);
});

// Also listen for selection changes in input fields
document.addEventListener('selectionchange', () => {
  const activeElement = document.activeElement;
  if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
    const start = activeElement.selectionStart;
    const end = activeElement.selectionEnd;
    if (start !== null && end !== null && start !== end) {
      const selectedText = activeElement.value.substring(start, end).trim();
      if (selectedText && selectedText.length > 0) {
        // Small delay to ensure selection is stable
        setTimeout(() => {
          showPopup(selectedText);
        }, 10);
      } else {
        hidePopup();
      }
    } else {
      hidePopup();
    }
  }
});

// Hide popup when clicking elsewhere
document.addEventListener('mousedown', (e) => {
  if (textSelectionPopup && !textSelectionPopup.contains(e.target)) {
    hidePopup();
  }
});

// Hide popup when scrolling
document.addEventListener('scroll', () => {
  hidePopup();
});

})(); // End of IIFE
