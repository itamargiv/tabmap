const excludedNamespaces = [
    'Media', 'Talk', 'Special',
    'Category', 'Category_talk',
    'Draft', 'Draft_talk',
    'File', 'File_talk',
    'Gadget', 'Gadget_talk',
    'Gadget_definition', 'Gadget_definition_talk',
    'Help', 'Help_talk', 
    'MediaWiki', 'MediaWiki_talk',
    'Module', 'Module_talk',
    'Portal', 'Portal_talk',
    'Template', 'Template_talk',
    'TimedText', 'TimedText_talk',
    'User', 'User_talk',
    'Wikipedia', 'Wikipedia_talk'
];

const excludedPages = [ 
    'Main_Page'
];

function getCurrentWindowTabs() {
    return browser.tabs.query({
        currentWindow: true,
        url: "*://*.wikipedia.org/wiki/*"
    });
}

function filterNamespaces(tabs) {
    return tabs.filter(tab => excludedNamespaces.every(ns => !tab.url.includes(`/wiki/${ns}:`)));
}

function filterPages(tabs) {
    return tabs.filter(tab => excludedPages.every(page => !tab.url.includes(`/wiki/${page}`)));
}

function createTabList(tabs) {
    const tabNodes = {
        list: document.getElementById('tabs-list'),
        items: document.createDocumentFragment()
    }

    for (let tab of tabs) {
        let itemNode = document.createElement('li');
        itemNode.textContent = tab.title || tab.id;
        itemNode.classList.add('article-tab');
        tabNodes.items.appendChild(itemNode);
    }

    tabNodes.list.appendChild(tabNodes.items);
}

function listTabs() {
    getCurrentWindowTabs()
        .then(filterNamespaces)
        .then(filterPages)
        .then(createTabList);
}

document.addEventListener("DOMContentLoaded", listTabs);