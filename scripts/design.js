codeInput.registerTemplate("syntax-highlighted", codeInput.templates.prism(Prism, [
    new codeInput.plugins.Indent(true, 2),
    new codeInput.plugins.AutoCloseBrackets()
]));