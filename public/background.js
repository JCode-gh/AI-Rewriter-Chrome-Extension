chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed successfully.");
});

// Inject content script into all tabs when extension starts
chrome.runtime.onStartup.addListener(injectContentScriptIntoAllTabs);
chrome.runtime.onInstalled.addListener(injectContentScriptIntoAllTabs);

async function injectContentScriptIntoAllTabs() {
  try {
    const tabs = await chrome.tabs.query({});
    
    for (const tab of tabs) {
      // Skip chrome:// and other restricted URLs, also check if tab.url exists
      if (tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
        try {
          // Check if script is already injected
          const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => window.textSelectionPopupInjected || false
          });
          
          // Only inject if not already injected
          if (!results[0]?.result) {
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ['content.js']
            });
          }
        } catch (error) {
          console.log(`Could not inject script into tab ${tab.id}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Error injecting content scripts:', error);
  }
}

// Inject content script into new tabs
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
    try {
      // Check if script is already injected
      const results = await chrome.scripting.executeScript({
        target: { tabId: tabId },
        function: () => window.textSelectionPopupInjected || false
      });
      
      // Only inject if not already injected
      if (!results[0]?.result) {
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['content.js']
        });
      }
    } catch (error) {
      console.log(`Could not inject script into tab ${tabId}:`, error);
    }
  }
});
