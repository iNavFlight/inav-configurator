function debugTraceOnLoad()
{
    var output = document.getElementById('debug-trace');
    setInterval(function() {
        output.innerText = getDebugTrace();
    }, 100);
}

window.onload = debugTraceOnLoad;
