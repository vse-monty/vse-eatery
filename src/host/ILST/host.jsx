app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;

function OpenWorkingFile (filename) {

    console.log('OpenWorkingFile()');
    var workingFile = new File(filename);

    try { 
        open(workingFile);
    }
    catch (err) {
        console.log('JSX ERROR: ' + err);
        console.log('JSX ERROR: ' + err.name);
        console.log('JSX ERROR: ' + err.message);
    }
}

function GetOpenDocumentVariables (filename) {

    OpenWorkingFile(filename);
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
}

function ReplaceVariablesinOpen (order) {

    console.log('ReplaceVariablesinOpen()');
    //Grab the Variables Array from Illustrator
    var variables = app.activeDocument.variables;
    var appDoc = app.activeDocument.pageItems[0];
    var linkedSrc,newFile;

    //Loop through all the variables objects in the .ai file
    for(var j = 0;j<variables.length; j++){

        //if the variable name in illustrator, matches a 'key' in the Order object
        if(variables[j].name in order){

            if(variables[j].kind == VariableKind.TEXTUAL){ //this is for text-variable objects

                variables[j].pageItems[0].contents = order[variables[j].name];
                // var var1 = variables[j].pageItems[0];
            }
            else if(variables[j].kind == VariableKind.IMAGE){ //linked image objects

                linkedSrc = order[variables[j].name];
                newFile = new File(linkedSrc);

                variables[j].pageItems[0].relink(newFile);
            }  
        }
    }

    redraw();
}

function SaveAsAI (filename) {

    console.log('SaveAsAI()');
    if(app.documents.length > 0){

        try {
            var opts = new IllustratorSaveOptions();
            var aiDoc = new File(filename);
            app.activeDocument.saveAs(aiDoc, opts);

        } catch (err) {
            console.log(err);
            console.log(err.name);
            console.log(err.message);
        }
    }
}

function SaveAsPDF (data) {

    console.log('SaveAsPDF()');
    if(app.documents.length > 0){

        try{
            var opts = new PDFSaveOptions();
                opts.pDFPreset = data.quality;
                opts.viewAfterSaving = data.view;
            
            var pdfDoc = new File(data.filename);

            app.activeDocument.saveAs(pdfDoc, opts);

        } catch (err) {
            console.log(err);
            console.log(err.name);
            console.log(err.message);
        }
    }
}

function Print () {

    console.log('Print()');
    if(app.documents.length > 0){

        var colorManagementOpts = new PrintColorManagementOptions();
        var opts = new PrintOptions();
            ops.colorManagementOptions = colorManagementOpts;
            opts.printPreset = '[Default]'
        
        try {
            app.activeDocument.print(opts);

        } catch(err) {
            console.log(err);
            console.log(err.name);
            console.log(err.message);
        }
    }

}

function mkdir (path) {

    console.log('mkdir()');
    var folder = new Folder(path);  
        
    if (!folder.exists) {  
    var parts = path.split('/');  
    parts.pop();  
    mkdir(parts.join('/'));  
    folder.create();  
    }  
} 

function CloseOpenDocument () {

    console.log('CloseOpenDocument()');
    app.activeDocument.close();
}

console.log('host.jsx loaded...');