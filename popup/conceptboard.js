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
        itemNode.textContent = tab.title + ' (' + tab.qid + ')';
        itemNode.classList.add('article-tab');
        tabNodes.items.appendChild(itemNode);
    }

    tabNodes.list.appendChild(tabNodes.items);
}

async function getWikibaseIds(tabs) {
    const titleMap = tabs.map(tab => new URL(tab.url)).reduce((acc, url) => {
        if (acc[url.hostname]) {
            acc[url.hostname].push(url.pathname.split('/')[2]);
        } else {
            acc[url.hostname] = [url.pathname.split('/')[2]];
        };
        return acc;
    }, {});

    const mapRequests = ([hostname, titles]) => fetch(`https://${hostname}/w/api.php?action=query&format=json&prop=pageprops&titles=${titles.join('|')}&redirects=1&ppprop=wikibase_item`)
        .then(res => res.json())
        .then(data => Object.values(data.query.pages).map(({title, pageprops}) => ({
            title,
            qid: pageprops.wikibase_item
        })));
    
    const data = await Promise.all(Object.entries(titleMap).map(mapRequests));
    return data.flat();
}

function listTabs() {
    getCurrentWindowTabs()
        .then(filterNamespaces)
        .then(filterPages)
        .then(getWikibaseIds)
        .then(createTabList);
}

document.addEventListener("DOMContentLoaded", listTabs);