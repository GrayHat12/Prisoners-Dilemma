/**
 * @typedef {Symbol} Action
 */

/**
 * @readonly
 * @enum {Action}
 */
const ACTION = Object.freeze({
    COOPERATE: Symbol("COOPERATE"),
    DEFECT: Symbol("DEFECT")
});

/**
 * @param {{p1: Action; p2: Action}[]} game 
 */
function scoreCalulator(game) {
    let score = {
        p1: 0,
        p2: 0
    }
    for (let match of game) {
        if (match.p1 === ACTION.COOPERATE) {
            if (match.p2 === ACTION.COOPERATE) {    // Both Cooperate
                score.p1 += 3;
                score.p2 += 3;
            }
            else {                                  // Only P1 Cooperates
                score.p1 += 1;
                score.p2 += 5; 
            }
        }
        else {
            if (match.p2 === ACTION.COOPERATE) {    // Only P2 Cooperates
                score.p1 += 5;
                score.p2 += 1;
            }
            else {                                  // No Cooperation
                score.p1 += 1;
                score.p2 += 1;
            }
        }
    }
    return score;
}

class Being {
    /**
     * @type {{[beingId: string]: {us: Action; them: Action}[]}}
     */
    #history = {};
    
    /**
     * @type {{[beingId: string]: {us: Action; them: Action}[]}[]}
     */
    warehouse = [];

    extraData = {};

    /**
     * 
     * @param {string} beingId 
     * @returns {Action}
     */
    decide(beingId) {
        throw Error("Not Implemented");
    }

    /**
     * @param {string} beingId 
     * @param {Action} action 
     * @param {Action} myAction
     */
    addExperience(beingId, action, myAction) {
        if (typeof this.#history[beingId]) this.#history[beingId] = [];
        this.#history[beingId].push({
            us: myAction,
            them: action
        });
    }

    get id() {
        throw Error("Not Implemented");
    }

    clearHistory() {
        if (this.#history) this.warehouse.push(JSON.parse(JSON.stringify(this.#history)));
        this.#history = {};
    }

    get morality() {
        let supportCount = Object.values(this.#history).flat().filter(x => x.us === ACTION.COOPERATE).length;
        let total = Object.values(this.#history).flat().length;
        return supportCount / total;
    }

    get history() {
        return {...this.#history};
    }

    set history(history) {
        this.#history = history;
    }
}

class AIBeing extends Being {

    /**
     * @type {Brain}
     */
    #brain;

    constructor() {
        super();
        this.#brain = new Brain(3);
    }

    /**
     * 
     * @param {string} beingId 
     * @returns {Action}
     */
    decide(beingId) {
        let inputs = [
            1,  // Last 5 experiences               0-1 % coop
            1,  // Overall historical experience    0-1 % coop
            0   // score difference                 0-1 % gain on us
        ];
        let beingHistory = this.history[beingId];
        if (typeof beingHistory === "undefined") {
            inputs[0] = 1;
            inputs[1] = 1;
            inputs[2] = 0;
        } else {
            let coopCount = 0;
            for (let historicalMatch of beingHistory) {
                if (historicalMatch.them === ACTION.COOPERATE) {
                    coopCount += 1;
                }
            }

            let last5coopCount = 0;
            for (let i=beingHistory.length - 1; i > Math.max(0, beingHistory.length - 6); i--) {
                if (beingHistory[i].them === ACTION.COOPERATE) {
                    last5coopCount += 1;
                }
            }

            let score = scoreCalulator(beingHistory.map(x => {
                return {p1: x.us, p2: x.them}
            }));
            
            inputs[0] = last5coopCount / (Math.min(5, beingHistory.length));
            inputs[1] = coopCount / beingHistory.length;
            inputs[2] = (score.p2 - score.p1) / score.p1;
        }
        let outcome = this.#brain.feedForward(...inputs);
        if (outcome > 0.5) return ACTION.COOPERATE;
        return ACTION.DEFECT;
    }

    get id() {
        return this.#brain.id;
    }

    export() {
        return {
            history: {},
            warehouse: [],
            brain: this.#brain.export()
        }
    }

    mutate() {
        return this.#brain.mutate();
    }

    get nodeCount() {
        let ex = this.#brain.export();
        return ex.hiddenNodes.length;
    }

    /**
     * @param {ReturnType<AIBeing['export']>} exportedData 
     */
    import(exportedData) {
        this.#brain.import(exportedData.brain);
        this.history = exportedData.history;
        this.warehouse = exportedData.warehouse;
    }
}