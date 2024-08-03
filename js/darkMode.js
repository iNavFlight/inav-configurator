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
        document.documentElement.setAttribute('data-inav-theme', (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'))
    } else {
        document.documentElement.setAttribute('data-inav-theme', theme)
    }
}

function showActiveTheme(theme) {
    console.log(
        'showActiveTheme'
    )
    const themeSwitcher = document.getElementById('configurator-theme-select')
    console.log('configurator-theme-select', theme, themeSwitcher)
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
    // setTheme(getPreferredTheme())
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
