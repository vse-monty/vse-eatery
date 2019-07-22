var _destination_ = '~Documents/TEST/VSE/';

function printError(e){
    console.log(`JSX ERROR: ${e} : ${e.name} | ${e.message}`);
}

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
    console.log('JSX: OpenWorkingFile => ' + fileName)
    console.log('JSX: ' + fileName);
    var workingFile;

    workingFile = new File(fileName);
    
    try{ 
        open(workingFile)
    }
    catch(err){
        printError(err);
    }

    console.log(workingFile);
}

function CloseOpenDocument(){

    app.activeDocument.close();
}

function ReplaceVariablesinOpen(orderVars){

    console.log('JSX: ReplaceVariablesinOpen => ');

    //Grab the Variables Array from Illustrator
    var variables = app.activeDocument.variables;
    var linkedSrc,newFile;

    //Loop through all the variables objects in the .ai file
    for(var j = 0;j<variables.length; j++){

        console.log('JSX: Replace' + variables[j].name + ' => ' + orderVars[variables[j].name]);

        //if the variable name in illustrator, matches a 'key' in the orderVars array
        if(variables[j].name in orderVars){

            if(variables[j].kind == VariableKind.TEXTUAL){ //this is for text-variable objects

                variables[j].pageItems[0].contents = orderVars[variables[j].name];
            }
            else if(variables[j].kind == VariableKind.IMAGE){ //linked image objects

                linkedSrc = orderVars[variables[j].name];

                try{
                    newFile = new File(linkedSrc);
                    variables[j].pageItems[0].relink(newFile);

                } catch (error){
                    printError(error);
                }
            }  
        }
    }

    redraw();
}

function SaveAsAI(fileName){

    console.log('JSX: SaveAsAI => Attempting to save file: ' + fileName);

    if(app.documents.length > 0){
        var aiDoc = new File(fileName);
        app.activeDocument.saveAs(aiDoc);
    }
}

function ProcessOrder(order){

    console.log('JSX: ProcessOrder =>');
    
    OpenWorkingFile(order.file_art);
    ReplaceVariablesinOpen(order.variables);
    SaveAsAI(`${_destination_}/${order.customer}/${order.subdivision}/${order.type}/${order.orderNumber}/${order.orderNumber}.ai`);

}