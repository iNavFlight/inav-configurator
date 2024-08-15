'use strict';

const darkMode = {};

function getPreferredTheme() {
    const storedTheme = localStorage.getItem('theme')
    if (storedTheme) {
        return storedTheme
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function setTheme(theme) {
    if (theme === 'auto') {
        document.documentElement.setAttribute('data-bs-theme', (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'))
    } else {
        document.documentElement.setAttribute('data-bs-theme', theme)
    }
}

function showActiveTheme(theme) {
    const themeSwitcher = document.getElementById('configurator-theme-select')
    if (!themeSwitcher) {
        return
    }
    themeSwitcher.value = theme
}

function setConfiguratorTheme(theme) {
    localStorage.setItem('theme', theme)
    setTheme(theme)
    showActiveTheme(theme)
}

darkMode.init = function () {
    setConfiguratorTheme(getPreferredTheme())

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        const storedTheme = localStorage.getItem('theme')
        if (storedTheme !== 'light' && storedTheme !== 'dark') {
            setTheme(getPreferredTheme())
        }
    })

    window.addEventListener('DOMContentLoaded', () => {
        showActiveTheme(getPreferredTheme())
        document.getElementById('configurator-theme-select').addEventListener('change', (event) => {
            setConfiguratorTheme(event.target.value)
        })
    })
}

darkMode.getPreferredTheme = function () {
    return getPreferredTheme();
}

darkMode.setConfiguratorTheme = function (theme) {
    setConfiguratorTheme(theme)
}

module.exports = darkMode
