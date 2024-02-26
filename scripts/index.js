/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 * The value is no lower than min (or the next integer greater than min
 * if min isn't an integer) and no greater than max (or the next integer
 * lower than max if max isn't an integer).
 * Using Math.round() will give you a non-uniform distribution!
 * @param {number} min
 * @param {number} max
 */
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * @param {any} exportObj 
 * @param {string} exportName 
 */
function downloadObjectAsJson(exportObj, exportName) {
    let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
    let downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", exportName + ".json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

Chart.defaults.animation.duration = 600;

const ROUNDS_RANGE = [50, 53];

// const populationTableBody = document.getElementById("population");
const architectureChartElement = document.getElementById('network-line');
const architectureScoreElement = document.getElementById("network-score-line");
const lineChartElement = document.getElementById('morality-line');
const populationScatterElement = document.getElementById("population-scatter");
const personbarElement = document.getElementById("being-morality-score");
const generationElement = document.getElementById("generation");
const nextGenerationButton = document.getElementById("nextGeneration");
const mutateButton = document.getElementById("mutate");
const run10genButton = document.getElementById("run10gen");

/**
 * 
 * @param {string} str 
 */
const stringToColour = (str) => {
    let hash = 0;
    str.split('').forEach(char => {
        hash = char.charCodeAt(0) + ((hash << 5) - hash)
    })
    let colour = '#'
    for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xff
        colour += value.toString(16).padStart(2, '0')
    }
    return colour;
}

/**
 * @param numOfSteps: Total number steps to get color, means total colors
 * @param step: The step number, means the order of the color
 */
function rainbow(numOfSteps, step) {
    // This function generates vibrant, "evenly spaced" colours (i.e. no clustering). This is ideal for creating easily distinguishable vibrant markers in Google Maps and other apps.
    // Adam Cole, 2011-Sept-14
    // HSV to RBG adapted from: http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
    var r, g, b;
    var h = step / numOfSteps;
    var i = ~~(h * 6);
    var f = h * 6 - i;
    var q = 1 - f;
    switch (i % 6) {
        case 0: r = 1; g = f; b = 0; break;
        case 1: r = q; g = 1; b = 0; break;
        case 2: r = 0; g = 1; b = f; break;
        case 3: r = 0; g = q; b = 1; break;
        case 4: r = f; g = 0; b = 1; break;
        case 5: r = 1; g = 0; b = q; break;
    }
    var c = "#" + ("00" + (~ ~(r * 255)).toString(16)).slice(-2) + ("00" + (~ ~(g * 255)).toString(16)).slice(-2) + ("00" + (~ ~(b * 255)).toString(16)).slice(-2);
    return (c);
}

const architectureChart = new Chart(architectureChartElement, {
    type: 'line',
    data: {
        labels: [],
        datasets: []
    },
    options: {
        // animation: false,
        scales: {
            y: {
                // type: 'linear',
                min: 0,
                max: 55
            }
        }
    },
    spanGaps: true,
    datasets: {
        line: {
            pointRadius: 0 // disable for all `'line'` datasets
        }
    },
});

const architectureScoreChart = new Chart(architectureScoreElement, {
    type: 'line',
    data: {
        labels: [],
        datasets: []
    },
    options: {
        // animation: false,
        scales: {
            y: {
                // min: 10000,
                // max: 90000
            }
        },
        spanGaps: true,
        datasets: {
            line: {
                pointRadius: 0 // disable for all `'line'` datasets
            }
        },
    }
});

const lineChart = new Chart(lineChartElement, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'COOPERATIVE COUNT',
            data: [],
            fill: false,
            borderColor: 'rgb(54, 162, 235)',
            tension: 0.1
        }, {
            label: 'DEFECTOR COUNT',
            data: [],
            fill: false,
            borderColor: 'rgb(255, 99, 132)',
            tension: 0.1
        }]
    },
    options: {
        // animation: false,
        scales: {
            y: {
                type: 'linear',
                min: 0,
                max: 50
            }
        },
        spanGaps: true,
        datasets: {
            line: {
                pointRadius: 0 // disable for all `'line'` datasets
            }
        },
    }
});

const populationScatter = new Chart(populationScatterElement, {
    type: 'scatter',
    data: {
        datasets: [{
            label: 'COOPERATIVE',
            data: [],
            backgroundColor: 'rgb(54, 162, 235)'
        }, {
            label: 'DEFECTOR',
            data: [],
            backgroundColor: 'rgb(255, 99, 132)'
        }],
    },
    options: {
        scales: {
            x: {
                type: 'linear',
                min: 0,
                max: 1,
                position: 'bottom'
            },
            y: {
                type: 'linear',
                // min: 50000
            }
        },
        // animation: false
    }
});

const personScoreChart = new Chart(personbarElement, {
    type: 'bar',
    data: {
        labels: [],
        datasets: [{
            label: 'Person',
            data: [],
            backgroundColor: [],
            borderColor: 'rgb(255, 205, 86)',
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            y: {
                beginAtZero: true
            }
        },
        // animation: false
    },
});

/**
 * @param {Being} person 
 * @param {number} score 
 */
function updateScore(person, score) {
    let scoreElement = person.extraData.scoreElement;
    if (scoreElement) scoreElement.innerText = score;
}

class GenerationSimulator {
    /**
     * @type {number}
     */
    generation = 0;
    /**
     * @type {Being[]}
     */
    beings = [];
    /**
     * @type {{[key: string]: number}}
     */
    scoreBoard = {};

    /**
     * @param {number} population 
     */
    constructor(population) {
        this.beings = [];
        this.generation = 0;
        for (let i = 0; i < population; i++) {
            let being = new Being();
            // createPersonEntry(being);
            this.beings.push(being);
        }
    }

    /**
     * @param {number} rounds
     * @param {Being} being1 
     * @param {Being} being2 
     */
    simulateOneMatch(rounds, being1, being2) {
        for (let i = 0; i < rounds; i++) {
            let p1 = being1.decide(being2.id);
            let p2 = being2.decide(being1.id);
            being1.addExperience(being2.id, p2, p1);
            being2.addExperience(being1.id, p1, p2);
            let score = scoreCalulator([{ p1, p2 }]);
            this.scoreBoard[being1.id] += score.p1;
            this.scoreBoard[being2.id] += score.p2;
        }
    }

    simulateGeneration() {
        let rounds = getRandomInt(ROUNDS_RANGE[0], ROUNDS_RANGE[1]);
        console.log("GENERATION ", this.generation++, "Rounds", rounds);
        generationElement.innerText = this.generation;
        this.scoreBoard = {}
        this.beings.forEach(x => {
            x.clearHistory();
            this.scoreBoard[x.id] = 0;
        });
        populationScatter.data.datasets[0].data = [];
        populationScatter.data.datasets[1].data = [];
        personScoreChart.data.labels = [];
        personScoreChart.data.datasets[0].data = [];
        personScoreChart.data.datasets[0].backgroundColor = [];
        let morality = {
            COOPERATE: 0,
            DEFECT: 0
        };
        let architectures = {};

        for (let being of this.beings) {
            for (let otherBeing of this.beings) {
                this.simulateOneMatch(rounds, being, otherBeing);
            }
            let arch = `N${being.nodeCount.toString()}`;
            if (architectures[arch]) {
                architectures[arch].population += 1;
                architectures[arch].score += this.scoreBoard[being.id];
            } else {
                architectures[arch] = {
                    population: 1,
                    score: this.scoreBoard[being.id]
                };
            }
            if (being.morality >= 0.5) {
                morality.COOPERATE += 1;
                populationScatter.data.datasets[0].data.push({ x: being.morality, y: this.scoreBoard[being.id] });
            } else {
                morality.DEFECT += 1;
                populationScatter.data.datasets[1].data.push({ x: being.morality, y: this.scoreBoard[being.id] });
            }
        }

        let scores = [];
        for (let being of this.beings) {
            scores.push({ score: this.scoreBoard[being.id], id: being.id, morality: being.morality });
        }

        scores.sort((a, b) => b.score - a.score);
        for (let score of scores) {
            personScoreChart.data.labels.push(score.id);
            personScoreChart.data.datasets[0].data.push(score.score);
            if (score.morality >= 0.5) {
                personScoreChart.data.datasets[0].backgroundColor.push("rgb(54, 162, 235)");
            } else {
                personScoreChart.data.datasets[0].backgroundColor.push("rgb(255, 99, 132)");
            }
        }

        // console.log('archs', architectures);

        for (let label in architectures) {
            let existingDatasetIndex = architectureChart.data.datasets.findIndex(x => x.label == `Population ${label}`);
            let existingDatasetScoreIndex = architectureScoreChart.data.datasets.findIndex(x => x.label == `Score ${label}`);
            // console.log(existingDatasetIndex);
            if (existingDatasetIndex >= 0) {
                // console.log('pushing inside datasets.data', architectureChart.data.datasets, existingDatasetIndex);
                architectureChart.data.datasets[existingDatasetIndex].data.push(architectures[label].population);
            }
            else {
                let dataset = {
                    label: `Population ${label}`,
                    data: [],
                    borderColor: rainbow(10, parseInt(label.substring(1)) - 2),
                    hoverOffset: 4
                };
                for (let i = 0; i < this.generation - 1; i++) {
                    dataset.data.push(0);
                }
                dataset.data.push(architectures[label].population);
                architectureChart.data.datasets.push(dataset);
            }

            if (existingDatasetScoreIndex >= 0) {
                architectureScoreChart.data.datasets[existingDatasetScoreIndex].data.push(architectures[label].score / architectures[label].population);
            }
            else {
                let dataset = {
                    label: `Score ${label}`,
                    data: [],
                    borderColor: rainbow(10, parseInt(label.substring(1)) - 2),
                    hoverOffset: 4
                };
                for (let i = 0; i < this.generation - 1; i++) {
                    dataset.data.push(0);
                }
                dataset.data.push(architectures[label].score / architectures[label].population);
                architectureScoreChart.data.datasets.push(dataset);
            }
        }

        // moralityChart.data.datasets[0].data[0] = morality.COOPERATE;
        // moralityChart.data.datasets[0].data[1] = morality.DEFECT;
        lineChart.data.labels.push(`Gen ${this.generation - 1}`);
        architectureChart.data.labels.push(`Gen ${this.generation - 1}`);
        architectureScoreChart.data.labels.push(`Gen ${this.generation - 1}`);
        lineChart.data.datasets[0].data.push(morality.COOPERATE);
        lineChart.data.datasets[1].data.push(morality.DEFECT);
        architectureChart.update();
        lineChart.update();
        // moralityChart.update();
        populationScatter.update();
        architectureScoreChart.update();
        personScoreChart.update();
        this.generationalMutation();
        if (this.generation % 20 == 0) {
            localStorage.setItem("existingSim", JSON.stringify(generationSim.exportAll()));
        }
        console.log("Simulated Generation");
    }

    generationalMutation() {
        console.log("Running Generational Mutation");
        let totalScore = Object.values(this.scoreBoard).reduce((sum, score) => score + sum, 0);
        let lowestScorer = Object.entries(this.scoreBoard).sort((a,b) => a[1] - b[1]);
        for (let i = lowestScorer.length - 1; i > (lowestScorer.length - 6); i--) {
            let replicateBeing = this.beings.find(x => x.id === lowestScorer[i][0]);
            let child = new Being();
            let exported = replicateBeing.export()
            exported.history = {};
            exported.warehouse = [];
            child.import(exported);
            this.beings.push(child);
        }
        for (let being of this.beings) {
            let mutationProbability = 1 - (this.scoreBoard[being.id] / totalScore);
            if (Math.random() < mutationProbability) {
                being.mutate();
            }
            if (being.extraData.nodesElement) being.extraData.nodesElement.innerText = being.nodeCount;
        }
        for (let i = 0; i < 5; i++) {
            this.beings = this.beings.filter(x => x.id !== lowestScorer[i][0]);
        }
        console.log("Completed running generational mutation");
    }

    mutate() {
        console.log("Running Mutations");
        this.beings.forEach(being => {
            being.mutate();
            if (being.extraData.nodesElement) being.extraData.nodesElement.innerText = being.nodeCount;
        });
        console.log("Completed running mutations");
    }

    exportAll() {
        return {
            beings: this.beings.map(x => x.export()),
            generation: this.generation
        }
    }

    /**
     * @param {ReturnType<GenerationSimulator['exportAll']>} exportedData 
     */
    importAll(exportedData) {
        this.beings = [];
        // populationTableBody.innerHTML = "";
        for (let being of exportedData.beings) {
            let person = new Being();
            person.import(being);
            // createPersonEntry(person);
            this.beings.push(person);
        }
        this.generation = exportedData.generation;
        this.simulateGeneration();
    }
}

let generationSim = new GenerationSimulator(50);
console.log(generationSim);

let runningAction = false;
let gameLoop = false;

nextGenerationButton.addEventListener("click", () => {
    if (runningAction) return;
    runningAction = true;
    generationSim.simulateGeneration();
    runningAction = false;
});
if (mutateButton) {
    mutateButton.addEventListener("click", () => {
        if (runningAction) return;
        runningAction = true;
        generationSim.mutate();
        runningAction = false;
    });
}
function delay(x) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(x);
        }, x);
    });
}
run10genButton.addEventListener("click", async () => {
    if (gameLoop) {
        gameLoop = false;
        run10genButton.innerText = "Start Simulation";
        document.getElementById("import")?.removeAttribute("disabled");
        return;
    }
    if (runningAction) return;
    gameLoop = true;
    document.getElementById("import")?.setAttribute("disabled", true);
    function generationLoop() {
        generationSim.simulateGeneration();
        // await delay(700);
        if (gameLoop) setTimeout(generationLoop, 500);//await generationLoop();//window.requestIdleCallback(generationLoop, { timeout: 10000 });
    }
    run10genButton.innerText = "Pause Simulation";
    // for (let i = 0; i < 100; i++) {
    //     generationSim.simulateGeneration();
    //     // await delay(700);
    // }
    // runningAction = false;
    setTimeout(generationLoop, 500);
    // window.requestIdleCallback(generationLoop, { timeout: 10000 });
});

document.getElementById("import").addEventListener("click", () => {
    if (runningAction || gameLoop) return;
    runningAction = true
    generationSim.importAll(JSON.parse(localStorage.getItem("existingSim")));
    runningAction = false;
});

document.getElementById("export").addEventListener("click", () => {
    if (runningAction) return;
    runningAction = true
    downloadObjectAsJson(generationSim.exportAll(), "export-sim");
    runningAction = false;
});