class HumanBeing extends Being {
    /**
     * @type {string}
     */
    #logic;

    /**
     * 
     * @param {string} logic 
     */
    constructor(logic) {
        super();
        this.#logic = logic;
    }

    decide(beingId) {
        return maskedEval(this.#logic, {beingHistory: this.history[beingId] || [], Action: ACTION});
    }

    get id() {
        return "Human";
    }

    setLogic(logic) {
        this.#logic = `${logic}`;
    }
}