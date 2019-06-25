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

    CloseOpenDocument();
    return;
}

function OpenWorkingFile(fileName){
    console.log('JSX: inside script method OpenWorkingFile')
    console.log('JSX: ' + fileName);
    var workingFile;

    workingFile = new File(fileName);
    
    try{ 
        open(workingFile)
    }
    catch(err){
        console.log('JSX: Something went wrong.');
    }

    console.log('JSX: end of method')
    console.log(workingFile);
}

function CloseOpenDocument(){

    app.activeDocument.close();
}