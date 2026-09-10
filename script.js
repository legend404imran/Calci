(function () {
  'use strict';

  const els = {
    sarees: document.getElementById('sarees'),
    stonesPerSaree: document.getElementById('stonesPerSaree'),
    myRate: document.getElementById('myRate'),
    workCost: document.getElementById('workCost'),
    totalStones: document.getElementById('totalStones'),
    amountReceived: document.getElementById('amountReceived'),
    workCostTotal: document.getElementById('workCostTotal'),
    profit: document.getElementById('profit'),
    profitPerSaree: document.getElementById('profitPerSaree'),
    profitPerStone: document.getElementById('profitPerStone'),
    profitCard: document.getElementById('profitCard'),
    resetBtn: document.getElementById('resetBtn'),
    calcBtn: document.getElementById('calcBtn'),
  };

  const DEFAULTS = {
    myRate: '0.008',
    workCost: '0.007',
  };

  // ---------- Indian number formatting ----------

  function formatIndianInt(num) {
    if (!isFinite(num)) return '0';
    const isNeg = num < 0;
    num = Math.abs(Math.round(num));
    let str = String(num);
    let lastThree, otherNumbers;
    if (str.length > 3) {
      lastThree = str.slice(-3);
      otherNumbers = str.slice(0, -3);
      otherNumbers = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
      str = otherNumbers + ',' + lastThree;
    }
    return (isNeg ? '-' : '') + str;
  }

  // Formats a rupee amount with Indian grouping.
  // Whole amounts show no decimals; otherwise up to 3 decimal places (trimmed).
  function formatRupee(amount, opts = {}) {
    const { forceDecimals = null } = opts;
    if (!isFinite(amount)) amount = 0;
    const isNeg = amount < 0;
    const abs = Math.abs(amount);

    let decimals;
    if (forceDecimals !== null) {
      decimals = forceDecimals;
    } else {
      // round to 3 decimals, then trim trailing zeros
      const rounded = Math.round(abs * 1000) / 1000;
      const fracStr = (rounded % 1).toFixed(3).slice(2).replace(/0+$/, '');
      decimals = fracStr.length;
    }

    const rounded = Math.round(abs * Math.pow(10, decimals)) / Math.pow(10, decimals);
    const [intPart, fracPart] = rounded.toFixed(decimals).split('.');
    const formattedInt = formatIndianInt(Number(intPart));
    const result = fracPart ? `${formattedInt}.${fracPart}` : formattedInt;
    return (isNeg ? '-₹' : '₹') + result;
  }

  // ---------- Input helpers ----------

  function parseNonNegative(el) {
    const raw = el.value;
    if (raw === '' || raw === null) return 0;
    let val = parseFloat(raw);
    if (isNaN(val)) return 0;
    if (val < 0) {
      val = 0;
      el.value = '0';
    }
    return val;
  }

  function markInvalidIfNeeded(el) {
    const val = el.value;
    if (val !== '' && parseFloat(val) < 0) {
      el.classList.add('invalid');
    } else {
      el.classList.remove('invalid');
    }
  }

  function flash(el) {
    el.classList.remove('flash');
    // force reflow to restart animation
    void el.offsetWidth;
    el.classList.add('flash');
  }

  // ---------- Core calculation ----------

  function calculate() {
    const sarees = parseNonNegative(els.sarees);
    const stonesPerSaree = parseNonNegative(els.stonesPerSaree);
    const myRate = parseNonNegative(els.myRate);
    const workCost = parseNonNegative(els.workCost);

    const totalStones = sarees * stonesPerSaree;
    const amountReceived = totalStones * myRate;
    const workCostTotal = totalStones * workCost;
    const profit = amountReceived - workCostTotal;
    const profitPerStone = myRate - workCost;
    const profitPerSaree = profitPerStone * stonesPerSaree;

    els.totalStones.textContent = formatIndianInt(totalStones);
    els.amountReceived.textContent = formatRupee(amountReceived);
    els.workCostTotal.textContent = formatRupee(workCostTotal);
    els.profit.textContent = formatRupee(profit);
    els.profitPerSaree.textContent = formatRupee(profitPerSaree, { forceDecimals: profitPerSaree % 1 === 0 ? 0 : null });
    els.profitPerStone.textContent = formatRupee(profitPerStone, { forceDecimals: null });

    if (profit < 0) {
      els.profitCard.classList.add('negative');
    } else {
      els.profitCard.classList.remove('negative');
    }

    [els.totalStones, els.amountReceived, els.workCostTotal, els.profit].forEach(flash);
  }

  // ---------- Events ----------

  const inputs = [els.sarees, els.stonesPerSaree, els.myRate, els.workCost];

  inputs.forEach((el) => {
    el.addEventListener('input', () => {
      markInvalidIfNeeded(el);
      calculate();
    });
    el.addEventListener('blur', () => {
      if (el.value !== '' && parseFloat(el.value) < 0) {
        el.value = '0';
        markInvalidIfNeeded(el);
        calculate();
      }
    });
  });

  els.calcBtn.addEventListener('click', () => {
    calculate();
    els.calcBtn.blur();
  });

  els.resetBtn.addEventListener('click', () => {
    els.sarees.value = '';
    els.stonesPerSaree.value = '';
    els.myRate.value = DEFAULTS.myRate;
    els.workCost.value = DEFAULTS.workCost;
    inputs.forEach((el) => el.classList.remove('invalid'));
    calculate();
  });

  // Initial calculation on load
  calculate();

  // ---------- Service worker registration ----------
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {
        /* offline support unavailable; app still works online */
      });
    });
  }
})();
