/**
 * @typedef {Symbol} NodeType
 */

/**
 * @readonly
 * @enum {NodeType}
 */
const NODE = Object.freeze({
    INPUT: Symbol("INPUT"),
    HIDDEN: Symbol("HIDDEN"),
    OUTPUT: Symbol("OUTPUT")
});

const INDEXES = {
    NODE: 0,
    BRAIN: 0
};

const CONNECTION_STRENGTH_MUTATE_PROBABILITY = 0.01;
const CONNECTION_STRENGTH_MUTATION_SCOPE = 0.001;

const NODE_WEIGHT_MUTATE_PROBABILITY = 0.05;
const NODE_BIAS_MUTATE_PROBABILITY = 0.01;
const NODE_WEIGHT_MUTATION_SCOPE = 0.01;
const NODE_BIAS_MUTATION_SCOPE = 0.01;

const CONNECTION_SPLIT_PROBABILITY = 0.0001;
const MUTATION_PROBABILITY = 0.5;

const NEW_CONNECTION_PROBABILITY = 0.0001;

/**
 * @param {number} x 
 */
function sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
}

/**
 * @param {number} x 
 */
function tanh(x) {
    e = Math.exp(2*x);
    return (e - 1) / (e + 1) ;
};
 

function getNewNodeId() {
    INDEXES.NODE += 1;
    return INDEXES.NODE + 0;
}

function getNewBrainId() {
    INDEXES.BRAIN += 1;
    return INDEXES.BRAIN + 0;
}

// Standard Normal variate using Box-Muller transform.
function gaussianRandom(mean=0, stdev=1) {
    const u = 1 - Math.random(); // Converting [0,1) to (0,1]
    const v = Math.random();
    const z = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    // Transform to the desired mean and standard deviation:
    return z * stdev + mean;
}

class GConnection {
    /**
     * @type {number}
     */
    #strength;
    /**
     * @type {GNode}
     */
    #from;
    /**
     * @type {GNode}
     */
    #to;

    /**
     * 
     * @param {GNode} from 
     * @param {GNode} to 
     */
    constructor(from, to) {
        this.#strength = gaussianRandom();
        this.#from = from;
        this.#to = to;
        this.#from.addOutgoingConnection(this);
        this.#to.addIncomingConnection(this);
    }

    get strength() {
        return this.#strength + 0;
    }

    get from() {
        return this.#from;
    }

    get to() {
        return this.#to;
    }

    get id() {
        return `connection-${this.#from.id}:${this.#to.id}`;
    }

    set strength(strength) {
        this.#strength = 0 + strength;
    }

    get output() {
        let val = this.#from.output * this.#strength;
        if (this.#from.nodeType === NODE.INPUT) return val;
        else return tanh(val);
    }


    /**
     * 
     * @param {GNode} from 
     * @param {GNode} to 
     */
    updateConnection(from, to) {
        this.#from = from;
        this.#to.removeIncomingConnection(this);
        this.#to = to;
    }

    mutate() {
        if (Math.random() < CONNECTION_STRENGTH_MUTATE_PROBABILITY) {
            console.log("Mutating Connection Strength");
            let difference = gaussianRandom() * CONNECTION_STRENGTH_MUTATION_SCOPE;
            // let sign = Math.random() < 0.5 ? 1 : -1;
            this.#strength += difference;
        }
    }

    export() {
        return {
            from: this.#from.id,
            to: this.#to.id,
            strength: this.strength
        };
    }
}

class GNode {
    /**
     * @type {number}
     */
    #weight;
    /**
     * @type {number}
     */
    #bias;
    /**
     * @type {GConnection[]}
     */
    #outgoingConnections = [];
    /**
     * @type {string}
     */
    #id;
    /**
     * @type {GConnection[]}
     */
    #incomingConnections = [];
    /**
     * @type {number}
     */
    #input = 0;
    /**
     * @type {NodeType}
     */
    #nodeType;
    /**
     * 
     * @param {NodeType} isOutputNode
     */
    constructor(nodeType) {
        this.#bias = gaussianRandom() / 4;
        this.#weight = gaussianRandom();
        if (nodeType === NODE.OUTPUT) {
            this.#bias = 0;
            this.#weight = 1;
        }
        this.#nodeType = nodeType;
        this.#id = `node-${getNewNodeId()}`;
    }

    /**
     * @param {GConnection} connection 
     */
    addOutgoingConnection(connection) {
        this.#outgoingConnections.push(connection);
    }

    get weight() {
        return this.#weight + 0;
    }

    get bias() {
        return this.#bias + 0;
    }

    get outgoingConnections() {
        return this.#outgoingConnections;
    }

    get id() {
        return `${this.#id}`;
    }

    get nodeType() {
        return this.#nodeType;
    }
    
    set weight(weight) {
        this.#weight = 0 + weight;
    }

    set bias(bias) {
        this.#bias = 0 + bias;
    }

    mutate() {
        if (Math.random() < NODE_WEIGHT_MUTATE_PROBABILITY) {
            console.log("Modifying Node Weights");
            let difference = gaussianRandom() * NODE_WEIGHT_MUTATION_SCOPE;
            // let sign = Math.random() < 0.5 ? 1 : -1;
            this.#weight += difference;
        }
        if (Math.random() < NODE_BIAS_MUTATE_PROBABILITY) {
            console.log("Modifying Node Bias");
            let difference = gaussianRandom() * NODE_BIAS_MUTATION_SCOPE;
            // let sign = Math.random() < 0.5 ? 1 : -1;
            this.#bias += difference;
        }
    }

    /**
     * @param {number} value 
     */
    updateInput(value) {
        this.#input = 0 + value;
    }

    /**
     * @returns {number}
     */
    get output() {
        let val = 0;
        if (this.#incomingConnections.length > 0) {
            let sumOfInputs = this.#incomingConnections.map(x => x.output).reduce((sum, value) => sum + value, 0);
            val = (sumOfInputs * this.#weight) + this.#bias;
        } else {
            val = (this.#input * this.#weight) + this.#bias;
        }
        if (this.#nodeType === NODE.OUTPUT) return sigmoid(val);
        else return val;
    }

    /**
     * 
     * @param {GConnection} connection 
     */
    addIncomingConnection(connection) {
        this.#incomingConnections.push(connection);
    }

    /**
     * 
     * @param {GConnection} connection 
     */
    removeIncomingConnection(connection) {
        this.#incomingConnections = this.#incomingConnections.filter(x => x.id !== connection.id);
    }

    /**
     * @param {GNode} node 
     */
    isInvalidChildNode(node) {
        if (node.#id === this.#id) return true;
        if (this.#incomingConnections.find(x => x.from.id === node.id || x.from.isInvalidChildNode(node))) return true;
        return false;
    }

    export() {
        return {
            id: this.id,
            weight: this.weight,
            bias: this.bias,
            connections: this.#outgoingConnections.map(x => x.export())
        }
    }
}

class Brain {
    /**
     * @type {GNode[]}
     */
    #inputNodes;
    /**
     * @type {GNode[]}
     */
    #hiddenNodes;
    /**
     * @type {GNode}
     */
    #outputNode;

    /**
     * @type {string}
     */
    #id;

    /**
     * 
     * @param {number} inputCount 
     */
    constructor(inputCount) {
        this.#id = `Person-${getNewBrainId()}`;
        this.#inputNodes = [];
        this.#hiddenNodes = [new GNode(NODE.HIDDEN), new GNode(NODE.HIDDEN)];
        this.#outputNode = new GNode(NODE.OUTPUT);
        for(let i=0; i<inputCount; i++) {
            let node = new GNode(NODE.INPUT);
            // new GConnection(node, this.#outputNode);
            new GConnection(node, this.#hiddenNodes[0]);
            new GConnection(node, this.#hiddenNodes[1]);
            this.#inputNodes.push(node);
        }
        new GConnection(this.#hiddenNodes[0], this.#outputNode);
        new GConnection(this.#hiddenNodes[1], this.#outputNode);
    }

    /**
     * 
     * @param {number[]} inputs 
     */
    feedForward(...inputs) {
        for(let index=0; index<this.#inputNodes.length; index++) {
            if (typeof inputs[index] === "number") this.#inputNodes[index].updateInput(inputs[index]);
            else this.#inputNodes[index].updateInput(0);
        }
        return this.#outputNode.output;
    }

    export() {
        return {
            id: this.id,
            inputNodes: this.#inputNodes.map(x => x.export()),
            hiddenNodes: this.#hiddenNodes.map(x => x.export()),
            outputNode: this.#outputNode.export()
        };
    }

    /**
     * 
     * @param {ReturnType<Brain['export']>} brainExport 
     */
    import(brainExport) {
        this.#inputNodes = [];
        this.#hiddenNodes = [];
        this.#outputNode = new GNode(NODE.OUTPUT);
        /**
         * @type {{[key: string]: GNode}}
         */
        let nodeMapping = {};
        /**
         * @type {{[key: string]: ReturnType<Brain['export']>['inputNodes'][0]['connection']}}
         */
        let pendingConnections = {};
        
        // output node
        nodeMapping[brainExport.outputNode.id] = this.#outputNode;
        this.#outputNode.weight = brainExport.outputNode.weight;
        this.#outputNode.bias = brainExport.outputNode.bias;

        // hidden node
        for(let hiddenNode of brainExport.hiddenNodes) {
            let node = new GNode(NODE.HIDDEN);
            nodeMapping[hiddenNode.id] = node;
            node.weight = hiddenNode.weight;
            node.bias = hiddenNode.bias;
            for (let connection of hiddenNode.connections) {
                pendingConnections[`${connection.from}-${connection.to}`] = connection;
            }
            this.#hiddenNodes.push(node);
        }

        // input node
        for (let inputNode of brainExport.inputNodes) {
            let node = new GNode(NODE.INPUT);
            nodeMapping[inputNode.id] = node;
            node.weight = inputNode.weight;
            node.bias = inputNode.bias;
            for (let connection of inputNode.connections) {
                pendingConnections[`${connection.from}-${connection.to}`] = connection;
            }
            this.#inputNodes.push(node);
        }

        // connections
        for (let connectionId in pendingConnections) {
            new GConnection(nodeMapping[pendingConnections[connectionId].from], nodeMapping[pendingConnections[connectionId].to]);
            // nodeMapping[pendingConnections[connectionId].from].addOutgoingConnection(connection);
        }

        console.log("Successfully Imported");
        console.debug(nodeMapping, pendingConnections);
    }

    mutate() {
        for (let node of [...this.#inputNodes, ...this.#hiddenNodes]) {
            if (Math.random() < MUTATION_PROBABILITY) {
                console.log("Mutating node", node);
                node.mutate()
                node.outgoingConnections.forEach(x => x.mutate());
                if (Math.random() < CONNECTION_SPLIT_PROBABILITY) {
                    let newNode = new GNode(NODE.HIDDEN);
                    newNode.weight = 1;
                    newNode.bias = 0;
                    let connectionToSplit = node.outgoingConnections[Math.floor(Math.random()*node.outgoingConnections.length)];
                    console.log("Splitting connection", node);
                    let connection = new GConnection(newNode, connectionToSplit.to);
                    connection.strength = 1;
                    connectionToSplit.updateConnection(node, newNode);
                    // newNode.addOutgoingConnection(connection);
                    this.#hiddenNodes.push(newNode);
                }
            };
        }

        if (Math.random() < NEW_CONNECTION_PROBABILITY) {
            console.log("Creating Connection");
            let possibleNodes1 = [...this.#inputNodes, ...this.#hiddenNodes];
            let randomPick1 = possibleNodes1[Math.floor(Math.random() * possibleNodes1.length)];
            let possibleNodes2 = this.#hiddenNodes.filter(x => x.id !== randomPick1.id && !randomPick1.isInvalidChildNode(x));
            if (possibleNodes2.length > 0) {
                let randomPick2 = possibleNodes2[Math.floor(Math.random() * possibleNodes2.length)];
                new GConnection(randomPick1, randomPick2);
                // randomPick1.addOutgoingConnection(connection);
            }
        }
    }

    get id() {
        return `${this.#id}`;
    }
}