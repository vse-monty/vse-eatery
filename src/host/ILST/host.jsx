function getOpenDocumentVariables(){

    var docVars, doc;
    doc = app.activeDocument;
    docVars = doc.variables;

    var len = docVars.length;
    var arr = [];

    for(var i = 0; i < len; i++){
        arr.push( { name: docVars[i].name, type: docVars[i].kind == VariableKind.TEXTUAL ? 'text' : 'image' } );
    }

    var event = new CSXSEvent();
    event.type = "document.variables";
    event.data = JSON.stringify(arr);
    event.dispatch();

    return;
}

function CloseOpenDocument(){

    app.activeDocument.close();
}