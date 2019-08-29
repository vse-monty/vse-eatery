app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;

function OpenWorkingFile (filename) {

    console.log('OpenWorkingFile()');
    if(filename == null) return
    
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

    var arr = []

    if(filename !== null){

        OpenWorkingFile(filename)

        var doc     = app.activeDocument
        var docVars = doc.variables
        var len     = docVars.length

        for(var i = 0; i < len; i++){
            
            arr.push({ name: docVars[i].name, type: docVars[i].kind == VariableKind.TEXTUAL ? 'text' : 'image' })
        }

        CloseOpenDocument();
    }

    var  event      = new CSXSEvent();
         event.type = "document.variables";
         event.data = JSON.stringify(arr);
         event.dispatch();
}

function ReplaceVariablesinOpen (order) {

    console.log('ReplaceVariablesinOpen()');
    if(order == null) return

    //Grab the Variables Array from Illustrator
    var variables = app.activeDocument.variables;
    var appDoc = app.activeDocument.pageItems[0];
    var linkedSrc,newFile;

    //Loop through all the variables objects in the .ai file
    for(var j = 0;j<variables.length; j++){

        //if the variable name in illustrator, matches a 'key' in the Order object
        if(variables[j].name in order){

            if(variables[j].kind == VariableKind.TEXTUAL){ //this is for text-variable objects

                variables[j].pageItems[0].contents = BreakAtAsterisks(order[variables[j].name]);
                TieToArtboardBounds(variables[j].pageItems[0], order.pad);
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
    if(filename == null || filename == '') return

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
    console.log(data.file);

    if(app.documents.length > 0){

        try{
            var opts = new PDFSaveOptions();
                opts.pDFPreset = data.quality;
                opts.viewAfterSaving = data.view;
            
            var pdfDoc = new File(data.file);

            app.activeDocument.saveAs(pdfDoc, opts);

        } catch (err) {
            console.log(err);
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
    if(path == null || path == '') return

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

function SimplifyProof (proofs) {

    console.log('SimplifyProof()');
    
    //adobe makes rectangles funny to work with for their artboards
    function Rect(x, y, w, h){
        return [x, -y, (x+w), -(y+h)];
    }

    //artboard height + width (these numbers are for portrait 8.5x11)
    var AB_H = 792;
    var AB_W = 612;

    //set the coordinate system to make sense while working with it
    app.coordinateSystem = CoordinateSystem.ARTBOARDCOORDINATESYSTEM;

    //create a new document
    var doc = app.documents.add();

    var item;

    for(var i = 0; i < proofs.length; i++){

        item = doc.placedItems.add();
        item.file = File(proofs[i]);
        item.position = [0,0];

        if(i !== proofs.length-1){

            doc.artboards.add(Rect((AB_W + 5), 0, AB_W, AB_H)); //using this method, let's try to stick to 13 pages as a max
        }
    }
    redraw();
}

function TieToArtboardBounds (varr, amount) {

    var rect = app.activeDocument.artboards[0].artboardRect; //artboard size/pos array
    var bounds = rect[2] - rect[0]; //width of the artboard

    bounds -= 72*amount; //72 is an inch

    if(varr.typename == 'TextFrame'){
        var remainder = varr.textRange.characterAttributes.size % 5;
        varr.textRange.characterAttributes.size -= remainder; //josh likes rounds numbers

        while(varr.width >= bounds) {
            varr.textRange.characterAttributes.size -= 5; //decrement by 5 until size rests in the zone of bounds' width
        }
    }

    redraw();
}

function BreakAtAsterisks (content) {
    
    var str  = content;
	var temp = content.split(/\*/);

    	if(temp !== undefined && temp.length > 1){
            var a = temp[0]
            var b = temp[1]
            var fin = a + '\r' + b
            str = (' ' + fin).slice(1)
    	}

    return str;
}

console.log('host.jsx loaded...');