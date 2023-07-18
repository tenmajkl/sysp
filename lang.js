const re = /(?<open>\()|(?<close>\))|(?<keyword>[a-zA-Z]+)|(?<number>[0-9]+)|(?<space>\s)|(?<error>.+)/g;

function lex(code) {
    const tokens = [];
    let match;
    while (match = re.exec(code)) {
        const { groups } = match;
        if (groups.open) {
            tokens.push({ type: "open", value: groups.open });
        } else if (groups.close) {
            tokens.push({ type: "close", value: groups.close });
        } else if (groups.keyword) {
            tokens.push({ type: "keyword", value: groups.keyword });
        } else if (groups.number) {
            tokens.push({ type: "number", value: groups.number });
        } else if (groups.space) {
            tokens.push({ type: "space", value: groups.space });
        } else if (groups.error) {
            throw new Error(`Unexpected token: ${groups.error}`);
        }
    }
    return tokens;
}

function parse(tokens, index) {
    let nodes = [];
    let node;
    let result;
    while (result = parseList(tokens, index)) {
        [ node, index ] = result;
        nodes.push(node);
    }

    return nodes;
}

function parseList(tokens, index) {
    if (tokens[index].type !== 'open') {
        return null;
    }
    index++;

    let node = {
        type: 'list',
        children: [],
    }
    
    if (tokens[index].type !== 'keyword') {
        return null;
    }
    node.value = tokens[index].value;
    index++;

    while (tokens[index].type !== 'close') {
        if (tokens[index].type !== 'space') {
            return null;
        }

        index++;
        let expr;
        [expr, index] = parseExpression(tokens, index);
        node.children.push(expr);
    }

    return [node, index];
}   

function parseExpression(tokens, index)
{
    return parseList(tokens, index) ?? parseNumber(tokens, index) ?? parseKeyword(tokens, index);
}

function parseNumber(tokens, index)
{
    if (tokens[index].type !== 'number') {
        return null;
    }
    index++;

    return [{
        type: 'number',
        value: tokens[index - 1].value
    }, index];
}

function parseKeyword(tokens, index)
{
    if (tokens[index].type !== 'keyword') {
        return null;
    }
    index++;

    return [{
        type: 'keyword',
        value: tokens[index - 1].value
    }, index];
}

function evalNodes(nodes)
{
    nodes.forEach(evalNode);
}

function evalNode(node)
{
    return evalOsc(node);
}

function evalNumber(node)
{
    if (node.type !== 'number') {
        throw new Error('Expected number');
    }

    return node;
}

function evalKeyword(node) 
{
    if (node.type !== 'keyword') {
        throw new Error('Expected keyword');
    }

    return node;
}

function evalOsc(node)
{
    if (node.type !== 'list') {
        throw new Error('Expected list');
    }

    if (node.value !== 'osc') {
        throw new Error('Expected osc');
    }

    if (node.children.length !== 2) {
        throw new Error('Expected 2 arguments');
    }

    let freq = evalNumber(node.children[0]);
    let color = evalKeyword(node.children[1]);

    let osc = context.createOscillator();
    osc.type = color.value;
    osc.frequency.value = freq.value;
    osc.connect(context.destination);
    osc.start();

    return { type: 'void', value: null};
}
