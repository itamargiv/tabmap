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

function createLinkedNodes({nodes, connections}) {
    const board = document.createElement('pre');

    const nodeMap = nodes.reduce((acc, node) => {
        acc[node.qid] = node;
        return acc;
    }, {});

    for (let connection of connections) {
        const from = nodeMap[connection.from];
        const to = nodeMap[connection.to];

        const line = `${from.title} (${from.qid}) -- ${connection.label} (${connection.property}) --> ${to.title} (${to.qid})\n`;
        board.textContent += line;
    }

    document.body.appendChild(board);

    return {nodes, connections};
}

function createTabList({nodes, connections}) {
    const tabNodes = {
        list: document.getElementById('tabs-list'),
        items: document.createDocumentFragment()
    }

    for (let node of nodes) {
        let itemNode = document.createElement('li');
        itemNode.textContent = node.title + ' (' + node.qid + ')';
        itemNode.classList.add('article-tab');
        tabNodes.items.appendChild(itemNode);
    }

    tabNodes.list.appendChild(tabNodes.items);
    return {nodes, connections};
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

function mapBindings(binding) {

    const [from, to, property] = [binding.object, binding.subject, binding.property].map(({value}) => {
        const uri = new URL(value);

        return uri.pathname.split('/')[2];
    });

    return {
        from,
        to,
        property,
        label: binding.propertyLabel.value
    };
}

async function getNodeConnections(nodes){
    const itemIds = nodes.map(({qid}) => `wd:${qid}`).join(' ');
    const query = `SELECT ?property ?propertyLabel ?subject ?object WHERE { VALUES ?subject { ${itemIds} } VALUES ?object { ${itemIds} } ?subject ?wdt ?object. ?property wikibase:directClaim ?wdt. SERVICE wikibase:label { bd:serviceParam wikibase:language "en,en". } }`;
    
    const res = await fetch(`https://query.wikidata.org/sparql?query=${query}`, {
        headers: {
            'Accept': 'application/sparql-results+json'
        },
    });
    const data = await res.json();
    const connections = data.results.bindings.map(mapBindings);

    return {nodes, connections};
}

function listTabs() {
    getCurrentWindowTabs()
        .then(filterNamespaces)
        .then(filterPages)
        .then(getWikibaseIds)
        .then(getNodeConnections)
        .then(createLinkedNodes)
        .then(createTabList)
        .then(createGoDiagram);
}

function createGoDiagram({nodes, connections}) {
    var $ = go.GraphObject.make;
    myDiagram = $(go.Diagram, "myDiagramDiv");

    myDiagram.nodeTemplate =
    $(go.Node, "Auto",
      new go.Binding("location", "loc", go.Point.parse),
      $(go.Shape, "RoundedRectangle", { fill: "white" }),
      $(go.TextBlock, { margin: 5 },
        new go.Binding("text", "text"))
    );

    myDiagram.linkTemplate =
        $(go.Link, { curve: go.Link.Bezier },
        $(go.Shape),
        $(go.Shape, { toArrow: "Standard" }),
        $(go.TextBlock, { textAlign: "center" },  // centered multi-line text
        new go.Binding("text", "text"))
    );

    const nodeDataArray = [];
    nodes.forEach(node => nodeDataArray.push({ key: node.qid, text: node.title + ' (' + node.qid + ')' }) )

    const linkDataArray = [];
    connections.forEach( connection => linkDataArray.push({
        to : connection.to,
        from: connection.from,
        text: connection.label + ' (' + connection.property + ')'
    }));

    console.log( connections );
    myDiagram.model = new go.GraphLinksModel( nodeDataArray, linkDataArray );
}

document.addEventListener("DOMContentLoaded", listTabs);