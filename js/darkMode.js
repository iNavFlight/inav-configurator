'use strict';

const darkMode = {};

function setTheme(theme, override = true) {
    if (override) {
        localStorage.setItem('theme', theme); // auto, dark, light
    }

    let currentTheme = getCurrentTheme();
    setThemeAttr(currentTheme);
    setThemeAppearance(localStorage.getItem('theme-appearance'), false);
}

function setThemeAppearance(theme, override = true) {
    if (override) {
        localStorage.setItem('theme-appearance', theme);
    }

    let currentTheme = getCurrentTheme();
    if (currentTheme === 'dark') {
        theme = 'dark';
    }

    let elementsWithCustomTheme = document.querySelectorAll('[data-theme-override]');
    setThemeAttr(theme, elementsWithCustomTheme);
}

function getCurrentTheme() {
    const storedTheme = localStorage.getItem('theme')
    if (storedTheme === 'auto' || (storedTheme !== 'dark' && storedTheme !== 'light')) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return storedTheme;
}

function setThemeAttr(theme, elements = [document.documentElement]) {
    elements.forEach(el => el.setAttribute('data-bs-theme', theme))
}

function setDefaults() {
    let storedTheme = localStorage.getItem('theme')
    let storedThemeAppearance = localStorage.getItem('theme-appearance')
    if (!['auto', 'dark', 'light'].includes(storedTheme)) {
        localStorage.setItem('theme', 'auto')
    }
    if (!['dark', 'light'].includes(storedThemeAppearance)) {
        localStorage.setItem('theme-appearance', 'dark')
    }
}

darkMode.init = function () {
    setDefaults();
    setTheme(localStorage.getItem('theme'));

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        const storedTheme = localStorage.getItem('theme')
        if (storedTheme !== 'light' && storedTheme !== 'dark') {
            setTheme(getCurrentTheme(), false)
        }
    })
}

darkMode.setTheme = function (theme) {
    return setTheme(theme)
}

darkMode.setThemeAppearance = function (theme) {
    return setThemeAppearance(theme)
}

darkMode.getCurrentTheme = function () {
    return getCurrentTheme()
}

module.exports = darkMode