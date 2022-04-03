function isCss(a) {
    if (/\w+\s*?\{[\s\S]+?\}/.test(a) && !/<(style).*?>[\s\S]+?<\/\1>/.test(a)) {
        return true
    }
}

function isJs(a) {
    if ((/function\s*?\w+\s*?\(.*?\)\s*?\{[\s\S]+?\}/.test(a) || /var\s*?\w+\s*?\=/.test(a)) && !/<(script).*?>[\s\S]+?<\/\1>/.test(a)) {
        return true
    }
}

function isHtml(a) {
    if (/<(\w+).*?>[\s\S]+?<\/\1>/.test(a)) {
        return true
    }
}

function unminify() {
    var a = document.getElementById('textarea').value;
    if (isCss(a) && !isJs(a)) {
        console.log('Css');
        a = css_beautify(a)
    } else if (isJs(a)) {
        console.log('Js');
        a = js_beautify(a)
    } else if (isHtml(a)) {
        console.log('Html');
        a = html_beautify(a)
    } else {
        a = html_beautify(a)
    }
    document.getElementById('textarea').value = a;
    document.querySelector('#textarea').style.color = "#34495e"
}

function copyUnminify() {
    var a = document.querySelector('#textarea');
    a.select();
    try {
        var b = document.execCommand('copy');
        var c = b ? 'Success' : 'Unsuccess';
        alert(c + '! Copied successfully. Please paste anywhere.')
    } catch (err) {
        alert('Oops, unable to copy !')
    }
}

function eraseText() {
    document.getElementById("textarea").value = ""
}
