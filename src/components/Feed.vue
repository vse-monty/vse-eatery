<template>
  <div class="main-content">
    <v-container grid-list-md text-xs-center>
    <v-layout column wrap>
      <v-flex v-for="order in orders" :key="order">

        <!-- <v-item> -->
          <v-card
            color="primary"
            dark
            class="align-center">
            <v-card-text class="px-0">order: {{order}}</v-card-text>
          </v-card>
        <!-- </v-item> -->

      </v-flex>
    </v-layout>
  </v-container>
  </div>
</template>

<script>
import io from 'socket.io-client'
const BASE_PATH = '/c/users/dmontgomery/documents/test/vse/work order files';
const BASE_PRINT_PATH = '/c/users/dmontgomery/documents/test/vse/WIP';

export default {
  data: ()=> ({
    orders: [   '118104',
                '118105',
                '118106',
                '118115'],

    csi: null,
    socketIO: null,
    workingOrder: null,

  }),
  computed: {
    app() {
      return this.$root.$children[0];
    },
  },
  mounted() {
    this.app.home = this;
    this.csi = this.$root.$children[0].csInterface;

    console.log('demonty starting mounted function');

    var path = './src/host/ILST/host.jsx';
    jsx.file(path);

    this.socketIO = io('http://localhost:9574', {
      autoConnect: true,
    });


    this.csi.addEventListener('document.variables', (event) => {
        console.log('received message from ILST');
        console.log('event type: ' + event.type);
        if(event.data.length == 0){
          console.log('no data received. file either has no variables, or is corrupted.');
          console.log('data: ->');
          console.log(event.data);
          return;
        }
        console.log('data: ->');
        console.log(event.data);

        this.socketIO.emit('give.variables', JSON.stringify({type: event.type, data: event.data}));
      });

    this.socketIO.on('get.variables', (data) => {

            jsx.eval(`GetOpenDocumentVariables('${data}')`, function(result){
              console.log(`result: ${result}`);
            });
      });

    this.socketIO.on('process.order', (data) => {
        console.log('calling ProcessOrder')
        this.workingOrder = JSON.parse(data);
        this.processOrder();
      });

      console.log('demonty ended mounted function');
  },
  methods: {
    connectTo(){
      
      console.log('attempting to connect to server')
      this.socketIO.connect();
    },

    processOrder(){
      let order = this.workingOrder;
      var filename;

      //create the file from template, fill in variables, then save as new file. 
      jsx.eval(`OpenWorkingFile('${encodeURI(order.file_art)}')`); //open the template

      for(var i = 0; i < order.variables.length; i++){ //replace the variables
        jsx.eval('ReplaceVariablesinOpen(' + JSON.stringify(order.variables[i]) + ')');
      }

      //create the folder structure (if it doesn't already exist)
      var filename = `${BASE_PATH}/${order.customer}/${order.subdivision}/${order.type}/${order.orderNumber}`;
      jsx.eval(`mkdir('${filename}')`);
      
      //save the file
      filename = `${BASE_PATH}/${order.customer}/${order.subdivision}/${order.type}/${order.orderNumber}/${order.orderNumber}.ai`;
      jsx.eval(`SaveAsAI('${filename}')`, function(result){
        order.art = order.art_back = filename;
        console.log('order after save: ')
        console.log(order);
        console.log(`result: ${result}`);
        jsx.eval('CloseOpenDocument()');
      });

      

      if(order.same_face == false){ //need to do the same process for the back file
        var filename_back;
        //create the file from template, fill in variables, then save as new file. 
        jsx.eval(`OpenWorkingFile('${encodeURI(order.file_art_back)}')`); //open the template

        for(var i = 0; i < order.variables.length; i++){ //replace the variables
          jsx.eval('ReplaceVariablesinOpen(' + JSON.stringify(order.variables[i]) + ')');
        }
        
        //save the file
        filename_back = `${BASE_PATH}/${order.customer}/${order.subdivision}/${order.type}/${order.orderNumber}/${order.orderNumber}_back.ai`;
        jsx.eval(`SaveAsAI('${filename}')`, function(result){
          order.art_back = filename_back;
          console.log('order after save: ')
          console.log(order);
          console.log(`result: ${result}`);
          jsx.eval('CloseOpenDocument()');
        });

        
      }

      //do proof...

    },
  }
}
</script>

<style>
.main-content {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  width: 100%;
}
</style>
