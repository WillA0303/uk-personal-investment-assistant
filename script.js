/**

UK Personal Investment Assistant

All calculations are for illustration only and use simplified assumptions.
*/

document.addEventListener("DOMContentLoaded", () => {
const appState = {
inputs: {},
assumptions: {
expectedReturns: {
equity: 0.06,
bonds: 0.03,
cash: 0.01,
reits: 0.045,
crypto: 0.12
},
inflation: 0.02,
salaryGrowth: 0.03,
withdrawalRate: 0.04
},
results: {
tax: null,
projections: null,
allocation: null,
scenarioA: null,
scenarioB: null
},
charts: {
allocationRangeChart: null,
allocationExampleChart: null,
netWorthChart: null,
bucketChart: null,
incomePieChart: null,
scenarioComparisonChart: null
}
};

/**

Tax and student loan configs (simplified, not exact current year)
*/

const TAX_CONFIG_ENGLAND = {
personalAllowance: 12570,
basicRateLimit: 50270,
higherRateLimit: 125140,
basicRate: 0.2,
higherRate: 0.4,
additionalRate: 0.45
};

const NI_CONFIG = {
primaryThreshold: 12570, // simplified alignment with PA
upperThreshold: 50270,
mainRate: 0.12,
upperRate: 0.02
};

const STUDENT_LOAN_CONFIG = {
none: { threshold: Infinity, rate: 0 },
plan1: { threshold: 22015, rate: 0.09 },
plan2: { threshold: 27295, rate: 0.09 },
plan4: { threshold: 27295, rate: 0.09 },
plan5: { threshold: 25000, rate: 0.09 },
postgrad: { threshold: 21000, rate: 0.06 }
};

/**

Collect inputs from DOM
*/
function collectInputs() {
const getNumber = (id, fallback = 0) => {
const el = document.getElementById(id);
if (!el) return fallback;
const value = parseFloat(el.value);
if (isNaN(value) || value < 0) return fallback;
return value;
};

const inputs = {

  age: getNumber("age", 22),
  region: document.getElementById("region").value,
  grossIncome: getNumber("grossIncome", 30000),
  studentLoanPlan: document.getElementById("studentLoanPlan").value,
  employmentType: document.getElementById("employmentType").value,

  monthlyInvest: getNumber("monthlyInvest", 500),
  currentSavings: getNumber("currentSavings", 2000),
  emergencyMonths: getNumber("emergencyMonths", 3),

  employeePensionPct: getNumber("employeePensionPct", 5),
  employerPensionPct: getNumber("employerPensionPct", 3),
  salarySacrifice: document.getElementById("salarySacrifice").checked,
  monthlyISA: getNumber("monthlyISA", 200),
  useLISA: document.getElementById("useLISA").checked,
  currentPension: getNumber("currentPension", 0),
  currentISA: getNumber("currentISA", 0),

  yearsToHouse: getNumber("yearsToHouse", 5),
  targetHouseDeposit: getNumber("targetHouseDeposit", 20000),
  retirementAge: getNumber("retirementAge", 65),
  desiredRetIncome: getNumber("desiredRetIncome", 25000),

  riskTolerance: document.getElementById("riskTolerance").value,
  drawdownReaction: document.getElementById("drawdownReaction").value
};

appState.inputs = inputs;
return inputs;


}

/**

Collect assumptions from Settings tab
*/
function collectAssumptions() {
const getNumber = (id, defaultVal) => {
const el = document.getElementById(id);
if (!el) return defaultVal;
const v = parseFloat(el.value);
if (isNaN(v)) return defaultVal;
return v;
};

appState.assumptions.expectedReturns.equity = getNumber("retEquity", 6.0) / 100;

appState.assumptions.expectedReturns.bonds = getNumber("retBonds", 3.0) / 100;
appState.assumptions.expectedReturns.cash = getNumber("retCash", 1.0) / 100;
appState.assumptions.expectedReturns.reits = getNumber("retREITs", 4.5) / 100;
appState.assumptions.expectedReturns.crypto = getNumber("retCrypto", 12.0) / 100;

appState.assumptions.inflation = getNumber("inflationAssumption", 2.0) / 100;
appState.assumptions.salaryGrowth = getNumber("salaryGrowthAssumption", 3.0) / 100;
appState.assumptions.withdrawalRate = getNumber("withdrawalRateAssumption", 4.0) / 100;


}

/**

UK Tax and NI calculations (simplified)
*/
function computeIncomeTaxAndNI(grossIncome, region) {
// For now, use England config for all regions for structure.
const cfg = TAX_CONFIG_ENGLAND;
let taxable = Math.max(0, grossIncome - cfg.personalAllowance);
let tax = 0;

if (grossIncome <= cfg.personalAllowance) {

  tax = 0;
} else {
  const basicBand = Math.max(0, Math.min(cfg.basicRateLimit, grossIncome) - cfg.personalAllowance);
  const higherBand = Math.max(0, Math.min(cfg.higherRateLimit, grossIncome) - cfg.basicRateLimit);
  const additionalBand = Math.max(0, grossIncome - cfg.higherRateLimit);

  tax = basicBand * cfg.basicRate + higherBand * cfg.higherRate + additionalBand * cfg.additionalRate;
}

// National Insurance (simplified)
const niCfg = NI_CONFIG;
let ni = 0;
if (grossIncome > niCfg.primaryThreshold) {
  const mainBand = Math.max(0, Math.min(niCfg.upperThreshold, grossIncome) - niCfg.primaryThreshold);
  const upperBand = Math.max(0, grossIncome - niCfg.upperThreshold);
  ni = mainBand * niCfg.mainRate + upperBand * niCfg.upperRate;
}

return { taxAnnual: tax, niAnnual: ni };


}

/**

Student loan calculation (simplified)
*/
function computeStudentLoan(grossIncome, plan) {
const cfg = STUDENT_LOAN_CONFIG[plan] || STUDENT_LOAN_CONFIG.none;
if (!cfg || !isFinite(cfg.threshold)) {
return { annual: 0 };
}
const incomeAbove = Math.max(0, grossIncome - cfg.threshold);
const repayment = incomeAbove * cfg.rate;
return { annual: repayment };
}

/**

Pension flows
*/
function computePensionFlows(grossIncome, employeePct, employerPct) {
const employeeAnnual = grossIncome * (employeePct / 100);
const employerAnnual = grossIncome * (employerPct / 100);
return {
employeeAnnual,
employerAnnual,
totalAnnual: employeeAnnual + employerAnnual
};
}

/**

Compute recommended allocation ranges based on risk
*/
function computeRecommendedAllocation(inputs) {
const risk = inputs.riskTolerance;
let ranges;

if (risk === "low") {

  ranges = {
    equities: [20, 40],
    bonds: [40, 60],
    cash: [10, 20],
    reits: [0, 10],
    crypto: [0, 0]
  };
} else if (risk === "medium") {
  ranges = {
    equities: [40, 70],
    bonds: [20, 40],
    cash: [5, 15],
    reits: [0, 15],
    crypto: [0, 5]
  };
} else if (risk === "mediumHigh") {
  ranges = {
    equities: [60, 80],
    bonds: [10, 25],
    cash: [5, 10],
    reits: [0, 15],
    crypto: [0, 10]
  };
} else {
  // high
  ranges = {
    equities: [70, 90],
    bonds: [0, 20],
    cash: [5, 10],
    reits: [0, 15],
    crypto: [0, 15]
  };
}

appState.results.allocation = ranges;
return ranges;


}

/**

Compute projections (simple deterministic model)
*/
function computeProjections(inputs, assumptions) {
const currentAge = inputs.age;
const retirementAge = inputs.retirementAge;
const yearsToHouse = inputs.yearsToHouse;
const horizonYears = Math.max(yearsToHouse, retirementAge - currentAge);

const salaryGrowth = assumptions.salaryGrowth;

const expectedReturn = weightedExpectedReturn(inputs, assumptions, appState.results.allocation);

const annualInvest = inputs.monthlyInvest * 12;
const annualISA = inputs.monthlyISA * 12;

let salary = inputs.grossIncome;
let pension = inputs.currentPension || 0;
let isa = inputs.currentISA || 0;
let cash = inputs.currentSavings || 0;

const years = [];
const netWorthSeries = [];
const pensionSeries = [];
const isaSeries = [];
const cashSeries = [];

let houseGoalMetYear = null;

for (let i = 0; i <= horizonYears; i++) {
  const age = currentAge + i;
  years.push(age);

  // Contributions
  const pensionFlows = computePensionFlows(salary, inputs.employeePensionPct, inputs.employerPensionPct);
  const pensionContribution = pensionFlows.totalAnnual;
  const isaContribution = annualISA;
  const extraInvest = Math.max(0, annualInvest - annualISA); // leftover goes to cash or other investments
  const cashContribution = extraInvest;

  pension = (pension + pensionContribution) * (1 + expectedReturn);
  isa = (isa + isaContribution) * (1 + expectedReturn);
  cash = (cash + cashContribution) * (1 + assumptions.expectedReturns.cash);

  const netWorth = pension + isa + cash;

  pensionSeries.push(pension);
  isaSeries.push(isa);
  cashSeries.push(cash);
  netWorthSeries.push(netWorth);

  if (i <= yearsToHouse && houseGoalMetYear === null && cash >= inputs.targetHouseDeposit) {
    houseGoalMetYear = age;
  }

  salary = salary * (1 + salaryGrowth);
}

// Retirement sufficiency (approx)
const finalPension = pensionSeries[pensionSeries.length - 1] || 0;
const impliedRetIncome = finalPension * assumptions.withdrawalRate;
const meetsRetirement = impliedRetIncome >= inputs.desiredRetIncome;

const netWorthAt5 = valueAtYears(netWorthSeries, currentAge, years, currentAge + 5);
const netWorthAt10 = valueAtYears(netWorthSeries, currentAge, years, currentAge + 10);
const netWorthAt20 = valueAtYears(netWorthSeries, currentAge, years, currentAge + 20);

const proj = {
  years,
  netWorthSeries,
  pensionSeries,
  isaSeries,
  cashSeries,
  houseGoalMetYear,
  finalPension,
  impliedRetIncome,
  meetsRetirement,
  netWorthAt5,
  netWorthAt10,
  netWorthAt20
};

appState.results.projections = proj;
return proj;


}

/**

Helper to get value at a target age (approx by nearest)
*/
function valueAtYears(series, startAge, yearsArray, targetAge) {
if (!series || series.length === 0) return 0;
const idx = yearsArray.findIndex((a) => a >= targetAge);
if (idx === -1) return series[series.length - 1];
return series[idx];
}

/**

Weighted expected return based on recommended allocation midpoint
*/
function weightedExpectedReturn(inputs, assumptions, allocRanges) {
if (!allocRanges) {
// default to moderately balanced
return 0.05;
}

const midpoint = (min, max) => (min + max) / 2;

const eq = midpoint(allocRanges.equities[0], allocRanges.equities[1]) / 100;
const b = midpoint(allocRanges.bonds[0], allocRanges.bonds[1]) / 100;
const c = midpoint(allocRanges.cash[0], allocRanges.cash[1]) / 100;
const r = midpoint(allocRanges.reits[0], allocRanges.reits[1]) / 100;
const cr = midpoint(allocRanges.crypto[0], allocRanges.crypto[1]) / 100;

const total = eq + b + c + r + cr || 1;

const wEq = eq / total;
const wB = b / total;
const wC = c / total;
const wR = r / total;
const wCr = cr / total;

const er = assumptions.expectedReturns;
const expected =
  wEq * er.equity +
  wB * er.bonds +
  wC * er.cash +
  wR * er.reits +
  wCr * er.crypto;

return expected;


}

/**

Compute full tax & pension summary
*/
function computeTaxSummary(inputs) {
const taxNI = computeIncomeTaxAndNI(inputs.grossIncome, inputs.region);
const studentLoan = computeStudentLoan(inputs.grossIncome, inputs.studentLoanPlan);
const pensionFlows = computePensionFlows(inputs.grossIncome, inputs.employeePensionPct, inputs.employerPensionPct);

const taxAnnual = taxNI.taxAnnual;

const niAnnual = taxNI.niAnnual;
const slAnnual = studentLoan.annual;
const employeePensionAnnual = pensionFlows.employeeAnnual;
const employerPensionAnnual = pensionFlows.employerAnnual;

const totalDeductions =
  taxAnnual + niAnnual + slAnnual + employeePensionAnnual;
const netAnnual = inputs.grossIncome - (taxAnnual + niAnnual + slAnnual + employeePensionAnnual);
const netMonthly = netAnnual / 12;

const effectiveRate =
  (taxAnnual + niAnnual + slAnnual) / inputs.grossIncome || 0;

const summary = {
  taxAnnual,
  niAnnual,
  slAnnual,
  employeePensionAnnual,
  employerPensionAnnual,
  netAnnual,
  netMonthly,
  effectiveRate
};

appState.results.tax = summary;
return summary;


}

/**

Initialise all charts with empty data
*/
function initCharts() {
const allocationCtx = document.getElementById("allocationChart").getContext("2d");
const allocationExampleCtx = document
.getElementById("allocationExampleChart")
.getContext("2d");
const netWorthCtx = document.getElementById("netWorthChart").getContext("2d");
const bucketCtx = document.getElementById("bucketChart").getContext("2d");
const incomePieCtx = document.getElementById("incomePieChart").getContext("2d");
const scenarioCtx = document
.getElementById("scenarioComparisonChart")
.getContext("2d");

appState.charts.allocationRangeChart = new Chart(allocationCtx, {

  type: "bar",
  data: {
    labels: ["Equities", "Bonds", "Cash", "REITs", "Crypto"],
    datasets: [
      {
        label: "Min %",
        data: [0, 0, 0, 0, 0],
        backgroundColor: "rgba(37, 99, 235, 0.4)"
      },
      {
        label: "Max %",
        data: [0, 0, 0, 0, 0],
        backgroundColor: "rgba(96, 165, 250, 0.7)"
      }
    ]
  },
  options: {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: (v) => v + "%"
        }
      }
    }
  }
});

appState.charts.allocationExampleChart = new Chart(allocationExampleCtx, {
  type: "doughnut",
  data: {
    labels: ["Equities", "Bonds", "Cash", "REITs", "Crypto"],
    datasets: [
      {
        data: [0, 0, 0, 0, 0]
      }
    ]
  },
  options: {
    responsive: true
  }
});

appState.charts.netWorthChart = new Chart(netWorthCtx, {
  type: "line",
  data: {
    labels: [],
    datasets: [
      {
        label: "Net worth (£)",
        data: [],
        tension: 0.25
      }
    ]
  },
  options: {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }
});

appState.charts.bucketChart = new Chart(bucketCtx, {
  type: "line",
  data: {
    labels: [],
    datasets: [
      {
        label: "Pension",
        data: [],
        tension: 0.25
      },
      {
        label: "ISA",
        data: [],
        tension: 0.25
      },
      {
        label: "Cash",
        data: [],
        tension: 0.25
      }
    ]
  },
  options: {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }
});

appState.charts.incomePieChart = new Chart(incomePieCtx, {
  type: "pie",
  data: {
    labels: [
      "Net take home",
      "Income tax",
      "NI",
      "Student loan",
      "Employee pension"
    ],
    datasets: [
      {
        data: [0, 0, 0, 0, 0]
      }
    ]
  },
  options: {
    responsive: true
  }
});

appState.charts.scenarioComparisonChart = new Chart(scenarioCtx, {
  type: "line",
  data: {
    labels: [],
    datasets: [
      {
        label: "Scenario A",
        data: [],
        tension: 0.25
      },
      {
        label: "Scenario B",
        data: [],
        tension: 0.25
      }
    ]
  },
  options: {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }
});


}

/**

Update Overview tab
*/
function updateOverviewTab(inputs, taxSummary, allocationRanges) {
const container = document.getElementById("overviewSummary");
const effectiveRatePct = (taxSummary.effectiveRate * 100).toFixed(1);

const monthlyInvestable = inputs.monthlyInvest.toFixed(0);

const range = allocationRanges;
const equitiesRange = `${range.equities[0]}–${range.equities[1]}%`;
const bondsRange = `${range.bonds[0]}–${range.bonds[1]}%`;
const cashRange = `${range.cash[0]}–${range.cash[1]}%`;
const reitsRange = `${range.reits[0]}–${range.reits[1]}%`;
const cryptoRange = `${range.crypto[0]}–${range.crypto[1]}%`;

container.innerHTML = `
  <p><strong>Profile:</strong> Age ${inputs.age}, gross income £${inputs.grossIncome.toLocaleString("en-GB")}, effective tax + NI + student loan rate about ${effectiveRatePct}%.</p>
  <p><strong>Investable cash:</strong> You indicated you can invest or save around £${monthlyInvestable} per month.</p>
  <p><strong>Suggested allocation ranges:</strong></p>
  <ul>
    <li>Equities: ${equitiesRange}</li>
    <li>Bonds: ${bondsRange}</li>
    <li>Cash: ${cashRange}</li>
    <li>REITs: ${reitsRange}</li>
    <li>Crypto: ${cryptoRange}</li>
  </ul>
  <p>This is indicative only. The ranges are based on your risk tolerance and are not personalised regulated advice.</p>
`;

// Update allocation charts
const labels = ["Equities", "Bonds", "Cash", "REITs", "Crypto"];
const minData = [
  range.equities[0],
  range.bonds[0],
  range.cash[0],
  range.reits[0],
  range.crypto[0]
];
const maxData = [
  range.equities[1],
  range.bonds[1],
  range.cash[1],
  range.reits[1],
  range.crypto[1]
];

const allocChart = appState.charts.allocationRangeChart;
allocChart.data.labels = labels;
allocChart.data.datasets[0].data = minData;
allocChart.data.datasets[1].data = maxData;
allocChart.update();

// Example allocation at midpoint
const midpoint = (min, max) => (min + max) / 2;
const exampleData = [
  midpoint(range.equities[0], range.equities[1]),
  midpoint(range.bonds[0], range.bonds[1]),
  midpoint(range.cash[0], range.cash[1]),
  midpoint(range.reits[0], range.reits[1]),
  midpoint(range.crypto[0], range.crypto[1])
];

const exampleChart = appState.charts.allocationExampleChart;
exampleChart.data.labels = labels;
exampleChart.data.datasets[0].data = exampleData;
exampleChart.update();


}

/**

Update Projections tab
*/
function updateProjectionsTab(inputs, projections) {
const container = document.getElementById("projectionsSummary");

const houseMsg = projections.houseGoalMetYear

  ? `You could reach your house deposit target of £${inputs.targetHouseDeposit.toLocaleString(
      "en-GB"
    )} by around age ${projections.houseGoalMetYear}, assuming you earmark cash for it.`
  : `On current settings, you may not reach your house deposit target of £${inputs.targetHouseDeposit.toLocaleString(
      "en-GB"
    )} within ${inputs.yearsToHouse} years.`;

const retireMsg = projections.meetsRetirement
  ? `At your target retirement age of ${inputs.retirementAge}, your pension could support an indicative income of about £${Math.round(
      projections.impliedRetIncome
    ).toLocaleString(
      "en-GB"
    )} per year (today’s money), which broadly matches or exceeds your desired £${inputs.desiredRetIncome.toLocaleString(
      "en-GB"
    )}.`
  : `At your target retirement age of ${inputs.retirementAge}, your pension might support around £${Math.round(
      projections.impliedRetIncome
    ).toLocaleString(
      "en-GB"
    )} per year (today’s money), below your desired £${inputs.desiredRetIncome.toLocaleString(
      "en-GB"
    )}. Higher contributions or a longer horizon could help close the gap.`;

container.innerHTML = `
  <p><strong>Net worth milestones (rough, before inflation):</strong></p>
  <ul>
    <li>~5 years: £${Math.round(projections.netWorthAt5).toLocaleString("en-GB")}</li>
    <li>~10 years: £${Math.round(projections.netWorthAt10).toLocaleString("en-GB")}</li>
    <li>~20 years: £${Math.round(projections.netWorthAt20).toLocaleString("en-GB")}</li>
  </ul>
  <p>${houseMsg}</p>
  <p>${retireMsg}</p>
  <p>All figures are deterministic illustrations based on constant assumptions, not forecasts.</p>
`;

const netWorthChart = appState.charts.netWorthChart;
netWorthChart.data.labels = projections.years;
netWorthChart.data.datasets[0].data = projections.netWorthSeries;
netWorthChart.update();

const bucketChart = appState.charts.bucketChart;
bucketChart.data.labels = projections.years;
bucketChart.data.datasets[0].data = projections.pensionSeries;
bucketChart.data.datasets[1].data = projections.isaSeries;
bucketChart.data.datasets[2].data = projections.cashSeries;
bucketChart.update();


}

/**

Update Tax & Pension tab
*/
function updateTaxTab(inputs, taxSummary) {
const container = document.getElementById("taxSummary");
const tableBody = document.querySelector("#taxTable tbody");

const gross = inputs.grossIncome;

const toMonthly = (a) => a / 12;

const rows = [
  ["Gross income", gross, toMonthly(gross)],
  ["Income tax", taxSummary.taxAnnual, toMonthly(taxSummary.taxAnnual)],
  ["National Insurance", taxSummary.niAnnual, toMonthly(taxSummary.niAnnual)],
  ["Student loan", taxSummary.slAnnual, toMonthly(taxSummary.slAnnual)],
  [
    "Employee pension",
    taxSummary.employeePensionAnnual,
    toMonthly(taxSummary.employeePensionAnnual)
  ],
  [
    "Employer pension (not in take home)",
    taxSummary.employerPensionAnnual,
    toMonthly(taxSummary.employerPensionAnnual)
  ],
  ["Net take home pay", taxSummary.netAnnual, taxSummary.netMonthly]
];

tableBody.innerHTML = rows
  .map(
    (row) => `
  <tr>
    <td>${row[0]}</td>
    <td>£${Math.round(row[1]).toLocaleString("en-GB")}</td>
    <td>£${Math.round(row[2]).toLocaleString("en-GB")}</td>
  </tr>
`
  )
  .join("");

const effectiveRatePct = (taxSummary.effectiveRate * 100).toFixed(1);

container.innerHTML = `
  <p>Your effective tax + NI + student loan rate is around <strong>${effectiveRatePct}%</strong> of gross income.</p>
  <p>Employer pension contributions of about <strong>£${Math.round(
    taxSummary.employerPensionAnnual
  ).toLocaleString(
    "en-GB"
  )}</strong> per year are not part of take home pay but still accumulate as long term wealth.</p>
`;

// Update income pie chart
const net = taxSummary.netAnnual;
const labels = [
  "Net take home",
  "Income tax",
  "NI",
  "Student loan",
  "Employee pension"
];
const data = [
  net,
  taxSummary.taxAnnual,
  taxSummary.niAnnual,
  taxSummary.slAnnual,
  taxSummary.employeePensionAnnual
];

const pie = appState.charts.incomePieChart;
pie.data.labels = labels;
pie.data.datasets[0].data = data;
pie.update();


}

/**

Compute scenario B projections based on overrides
*/
function computeScenarioB(inputs, assumptions) {
const inputsB = { ...inputs };
const monthlyInvestB = parseFloat(
document.getElementById("scenarioBMonthlyInvest").value
);
const empPctB = parseFloat(
document.getElementById("scenarioBEmployeePensionPct").value
);
const riskB = document.getElementById("scenarioBRiskTolerance").value;

if (!isNaN(monthlyInvestB) && monthlyInvestB >= 0) {

  inputsB.monthlyInvest = monthlyInvestB;
}
if (!isNaN(empPctB) && empPctB >= 0) {
  inputsB.employeePensionPct = empPctB;
}
inputsB.riskTolerance = riskB;

// Allocation for scenario B
const allocB = computeRecommendedAllocation(inputsB);
const projB = computeProjections(inputsB, assumptions);

return { inputsB, allocB, projB };


}

/**

Update Scenarios tab
*/
function updateScenariosTab(inputs, projA, projB) {
const container = document.getElementById("scenariosSummary");

const aFinal = projA.netWorthSeries[projA.netWorthSeries.length - 1] || 0;

const bFinal = projB.netWorthSeries[projB.netWorthSeries.length - 1] || 0;
const diffFinal = bFinal - aFinal;

const horizonAge =
  projA.years[projA.years.length - 1] || inputs.retirementAge;

container.innerHTML = `
  <p>Both scenarios assume the same tax and macro assumptions, but Scenario B uses your adjusted savings and pension settings.</p>
  <p>By age ${horizonAge}, your projected net worth could be about:</p>
  <ul>
    <li>Scenario A: £${Math.round(aFinal).toLocaleString("en-GB")}</li>
    <li>Scenario B: £${Math.round(bFinal).toLocaleString("en-GB")}</li>
  </ul>
  <p>So Scenario B could lead to roughly <strong>£${Math.round(
    diffFinal
  ).toLocaleString(
    "en-GB"
  )}</strong> more (or less) wealth by that age, based on these simplified assumptions.</p>
  <p>Use this to get an intuition for how changes in contributions and risk level might shape your long term trajectory.</p>
`;

const scenarioChart = appState.charts.scenarioComparisonChart;
scenarioChart.data.labels = projA.years;
scenarioChart.data.datasets[0].data = projA.netWorthSeries;
scenarioChart.data.datasets[1].data = projB.netWorthSeries;
scenarioChart.update();


}

/**

Handle recalc for main inputs
*/
function handleRecalculate() {
collectAssumptions();
const inputs = collectInputs();

const alloc = computeRecommendedAllocation(inputs);

const taxSummary = computeTaxSummary(inputs);
const projections = computeProjections(inputs, appState.assumptions);

updateOverviewTab(inputs, taxSummary, alloc);
updateProjectionsTab(inputs, projections);
updateTaxTab(inputs, taxSummary);

// Also refresh scenarios with default B
const scenarioB = computeScenarioB(inputs, appState.assumptions);
updateScenariosTab(inputs, projections, scenarioB.projB);

appState.results.scenarioA = projections;
appState.results.scenarioB = scenarioB.projB;


}

/**

Handle scenarios recalculation explicitly
*/
function handleRecalculateScenarios() {
collectAssumptions();
const inputs = collectInputs();

const projA =

  appState.results.projections || computeProjections(inputs, appState.assumptions);
const scenarioB = computeScenarioB(inputs, appState.assumptions);
updateScenariosTab(inputs, projA, scenarioB.projB);

appState.results.scenarioA = projA;
appState.results.scenarioB = scenarioB.projB;


}

/**

Tab switching
*/
function initTabs() {
const tabButtons = document.querySelectorAll(".tab-btn");
const panels = document.querySelectorAll(".tab-panel");

tabButtons.forEach((btn) => {

  btn.addEventListener("click", () => {
    const targetId = btn.getAttribute("data-tab-target");
    if (!targetId) return;

    tabButtons.forEach((b) => b.classList.remove("active"));
    panels.forEach((p) => p.classList.remove("active"));

    btn.classList.add("active");
    const panel = document.getElementById(targetId);
    if (panel) panel.classList.add("active");
  });
});


}

/**

Initialise app
*/
function init() {
initTabs();
initCharts();

const recalcBtn = document.getElementById("recalculateBtn");

if (recalcBtn) {
  recalcBtn.addEventListener("click", handleRecalculate);
}

const recalcScenariosBtn = document.getElementById("recalculateScenariosBtn");
if (recalcScenariosBtn) {
  recalcScenariosBtn.addEventListener("click", handleRecalculateScenarios);
}

// Initial run
handleRecalculate();


}

// Start
init();
});