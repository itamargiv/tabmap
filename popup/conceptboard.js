document.addEventListener("DOMContentLoaded", listTabs);

function getCurrentWindowTabs() {
    return browser.tabs.query({
        currentWindow: true,
        url: "*://*.wikipedia.org/*"
    });
  }

  function listTabs() {
    getCurrentWindowTabs().then((tabs) => {
       let tabsList = document.getElementById('tabs-list');
       let currentTabs = document.createDocumentFragment();
       let counter = 0;
   
       tabsList.textContent = '';

       for (let tab of tabs) {
       
        let tabItem = document.createElement('li');
        let tabLink = document.createElement('a');
    
        tabLink.textContent = tab.title || tab.id;
    
        tabLink.setAttribute('href', tab.id);
        tabLink.classList.add('switch-tabs');
        tabItem.appendChild(tabLink);
        currentTabs.appendChild(tabItem);
    
        counter += 1;
      }
      tabsList.appendChild(currentTabs);
    });
  }      